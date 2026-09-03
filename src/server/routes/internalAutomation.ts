/**
 * StudyMate Sarkari — Step 8: Protected Internal Automation, Scheduler & Monitoring Routes
 *
 * SECURE ENDPOINTS FOR:
 * - Google Cloud Scheduler → Cloud Run triggers
 * - Queue worker execution
 * - System health probes & Cloud Monitoring
 * - Dead-letter queue inspection & retries
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  PipelineOrchestrator,
  getSystemHealthReport,
  getSourcesHealthReport,
  evaluateOperationalAlerts,
  getRecentPipelineRuns,
  getDeadLetterTasks,
  getDeadLetterCounts,
} from '../../lib/server/automation';
import { getSourceById } from '../../lib/server/supabaseAdmin';
import { fetchSourceContent } from '../../lib/server/sourceFetcher';
import { ContentParsePipeline } from '../../lib/server/pipeline/parsePipeline';
import { publishParsedItem, runDataQualityCheck } from '../../lib/server/publishing/publishService';
import { getTelegramService } from '../../lib/server/telegram/service';

const router = Router();
const DEFAULT_DEV_SECRET = 'studymate-internal-dev-secret';

/**
 * Authentication middleware for internal endpoints.
 */
function authenticateInternal(req: Request, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredSecret = process.env.SOURCE_FETCH_SECRET || (isProduction ? undefined : DEFAULT_DEV_SECRET);

  if (!configuredSecret) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'SOURCE_FETCH_SECRET must be configured in production environment.',
    });
    return;
  }

  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-source-fetch-secret'];

  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (typeof customHeader === 'string') {
    token = customHeader.trim();
  }

  if (!token || token !== configuredSecret) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid SOURCE_FETCH_SECRET authorization token.',
    });
    return;
  }

  next();
}

/**
 * GET /api/internal/health
 * Public/lightweight healthcheck endpoint for Cloud Run container probes.
 * Never leaks API keys, database passwords, or Telegram tokens.
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const report = await getSystemHealthReport();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: err?.message || 'Health probe failed',
    });
  }
});

/**
 * GET /api/internal/health/sources
 * Protected breakdown of official government source health statuses.
 */
router.get('/health/sources', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const report = await getSourcesHealthReport();
    res.json({
      total: report.length,
      sources: report,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'SOURCES_HEALTH_FAILED',
      message: err?.message,
    });
  }
});

/**
 * GET /api/internal/health/pipeline
 * Protected operational metrics for pipeline runs, queue depth, and dead letters.
 */
router.get('/health/pipeline', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const recentRuns = await getRecentPipelineRuns(15);
    const dlqCounts = await getDeadLetterCounts();
    const systemReport = await getSystemHealthReport();

    res.json({
      timestamp: new Date().toISOString(),
      summary: systemReport.metrics,
      components: systemReport.components,
      deadLetterQueue: dlqCounts,
      recentRuns,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'PIPELINE_HEALTH_FAILED',
      message: err?.message,
    });
  }
});

/**
 * GET /api/internal/health/alerts
 * Protected operational alerts query based on Cloud Monitoring rules.
 */
router.get('/health/alerts', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const alerts = await evaluateOperationalAlerts();
    res.json({
      alertCount: alerts.length,
      alerts,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'ALERTS_EVALUATION_FAILED',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/scheduler/fetch-due
 * Primary Cloud Scheduler entrypoint (runs every 5–15 minutes).
 * Evaluates due sources based on priority intervals and executes the end-to-end pipeline.
 */
router.post('/scheduler/fetch-due', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const summary = await PipelineOrchestrator.runFullPipeline({
      correlationId: body.correlationId,
      sourceIds: body.sourceIds,
      limit: body.limit ? parseInt(body.limit, 10) : undefined,
      scope: body.scope,
      stateCode: body.stateCode,
      priority: body.priority,
      forceAll: Boolean(body.forceAll),
      concurrency: body.concurrency ? parseInt(body.concurrency, 10) : undefined,
      skipTelegram: Boolean(body.skipTelegram),
      dryRunTelegram: body.dryRunTelegram !== undefined ? Boolean(body.dryRunTelegram) : undefined,
    });

    res.json({
      success: summary.status !== 'FAILED',
      summary,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'SCHEDULER_PIPELINE_FAILED',
      message: err?.message || 'Pipeline execution failed',
    });
  }
});

/**
 * POST /api/internal/scheduler/retry-failed
 * Cloud Scheduler entrypoint for retrying failed tasks in the dead-letter queue.
 */
router.post('/scheduler/retry-failed', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const limit = req.body?.limit ? parseInt(req.body.limit, 10) : 20;
    const result = await PipelineOrchestrator.runDeadLetterRetries(limit);

    res.json({
      success: true,
      message: `Retried ${result.processed} tasks: ${result.resolved} resolved, ${result.reEnqueued} re-enqueued`,
      result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'RETRY_SCHEDULER_FAILED',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/scheduler/health-check
 * Cloud Scheduler entrypoint for periodic data quality & lifecycle expiration checks.
 */
router.post('/scheduler/health-check', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const qualityReport = await runDataQualityCheck();
    const systemReport = await getSystemHealthReport();
    const alerts = await evaluateOperationalAlerts();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      qualityReport,
      systemHealth: systemReport.status,
      activeAlertsCount: alerts.length,
      alerts,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'HEALTH_CHECK_SCHEDULER_FAILED',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/scheduler/reconcile
 * Render Cron or external trigger for expired vacancy reconciliation.
 * Automatically transitions expired live vacancies (application_end < CURRENT_TIME) to 'Closed'.
 */
router.post('/scheduler/reconcile', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const { reconcileExpiredVacancies } = await import('../../lib/server/automation/reconciliationService');
    const report = await reconcileExpiredVacancies();
    res.json({
      success: true,
      report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'RECONCILIATION_FAILED',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/workers/fetch
 * Worker endpoint for fetching an official source.
 */
router.post('/workers/fetch', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.body || {};
    if (!sourceId) {
      res.status(400).json({ error: 'MISSING_SOURCE_ID', message: 'sourceId is required' });
      return;
    }

    const source = await getSourceById(sourceId);
    if (!source) {
      res.status(404).json({ error: 'SOURCE_NOT_FOUND', message: `Source "${sourceId}" not found` });
      return;
    }

    const fetchResult = await fetchSourceContent(source);
    res.json({
      success: fetchResult.success,
      fetchResult,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'FETCH_WORKER_FAILED',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/workers/parse
 * Worker endpoint for parsing raw content.
 */
router.post('/workers/parse', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const { sourceId, content, contentHash } = req.body || {};
    if (!sourceId) {
      res.status(400).json({ error: 'MISSING_SOURCE_ID', message: 'sourceId is required' });
      return;
    }

    const source = await getSourceById(sourceId);
    if (!source) {
      res.status(404).json({ error: 'SOURCE_NOT_FOUND', message: `Source "${sourceId}" not found` });
      return;
    }

    const parseResult = await ContentParsePipeline.execute(
      source,
      content || '',
      contentHash || 'hash_' + Date.now()
    );

    res.json({
      success: parseResult.success,
      summary: parseResult,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'PARSE_WORKER_FAILED',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/workers/publish
 * Worker endpoint for publishing a verified parsed item.
 */
router.post('/workers/publish', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const { item, force } = req.body || {};
    if (!item) {
      res.status(400).json({ error: 'MISSING_ITEM', message: 'Item payload is required' });
      return;
    }

    const pubResult = await publishParsedItem(item, { force: Boolean(force) });
    res.json(pubResult);
  } catch (err: any) {
    res.status(500).json({
      error: 'PUBLISH_WORKER_FAILED',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/workers/telegram
 * Worker endpoint for dispatching Telegram notification.
 */
router.post('/workers/telegram', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const { targetType, record, dryRun, isNewPublish } = req.body || {};
    if (!targetType || !record) {
      res.status(400).json({
        error: 'MISSING_PAYLOAD',
        message: 'targetType and record payload are required',
      });
      return;
    }

    const tgService = getTelegramService();
    const result = await tgService.handlePublishedItem(record, {
      dryRun: dryRun !== undefined ? Boolean(dryRun) : undefined,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'TELEGRAM_WORKER_FAILED',
      message: err?.message,
    });
  }
});

/**
 * GET /api/internal/runs
 * Protected list of recent pipeline runs.
 */
router.get('/runs', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const runs = await getRecentPipelineRuns(limit);
    res.json({
      total: runs.length,
      runs,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'RUNS_QUERY_FAILED',
      message: err?.message,
    });
  }
});

/**
 * GET /api/internal/dead-letter
 * Protected list of dead-letter / failed tasks.
 */
router.get('/dead-letter', authenticateInternal, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const tasks = await getDeadLetterTasks(limit);
    const counts = await getDeadLetterCounts();

    res.json({
      summary: counts,
      tasks,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'DEAD_LETTER_QUERY_FAILED',
      message: err?.message,
    });
  }
});

export default router;
