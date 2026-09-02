/**
 * StudyMate Sarkari — Step 4: Protected Internal Source Fetch & Monitoring Routes
 *
 * SECURITY & ACCESS CONTROL:
 * - Requires SOURCE_FETCH_SECRET in Bearer or x-source-fetch-secret header
 * - Protects against arbitrary user scraping (only checks official registered sources)
 * - Safe internal health monitoring for Google Cloud Scheduler / Cloud Run triggers
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  runSourceMonitoringBatch,
  BatchFetchOptions,
} from '../../lib/server/sourceMonitor';
import {
  getAllRegisteredSources,
  getSourceById,
  getRecentFetchLogs,
  getMonitoringStats,
  getParsedItems,
  updateParsedItemStatus,
  getRecentParseLogs,
  getPublishLogs,
} from '../../lib/server/supabaseAdmin';
import { ContentParsePipeline } from '../../lib/server/pipeline/parsePipeline';
import { fetchSourceContent, calculateContentHash } from '../../lib/server/sourceFetcher';
import { VerificationStatus, ParsedItemType } from '../../types/parser';
import {
  publishParsedItem,
  batchPublishVerifiedItems,
  runDataQualityCheck,
} from '../../lib/server/publishing/publishService';

const router = Router();

const DEFAULT_DEV_SECRET = 'studymate-internal-dev-secret';

/**
 * Authentication middleware for internal endpoints.
 */
function authenticateInternalRequest(req: Request, res: Response, next: NextFunction) {
  const configuredSecret = process.env.SOURCE_FETCH_SECRET || DEFAULT_DEV_SECRET;
  
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-source-fetch-secret'];

  let providedToken: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.slice(7).trim();
  } else if (typeof customHeader === 'string') {
    providedToken = customHeader.trim();
  }

  if (!providedToken || providedToken !== configuredSecret) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid SOURCE_FETCH_SECRET authentication token.',
    });
    return;
  }

  next();
}

/**
 * GET /api/internal/health
 * Public or lightweight healthcheck for monitoring systems (e.g. Cloud Run health probe)
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = await getMonitoringStats();
    res.json({
      status: 'healthy',
      service: 'StudyMate Sarkari Source Monitoring & Fetcher Engine (Step 4)',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      error: err?.message || 'Healthcheck probe failed',
    });
  }
});

/**
 * POST /api/internal/source-fetch
 * Triggers a source check for a single source, a batch of due sources, or filtered scope.
 */
router.post('/source-fetch', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};

    const options: BatchFetchOptions = {
      sourceId: body.sourceId,
      limit: body.batchSize || body.limit ? parseInt(body.batchSize || body.limit, 10) : undefined,
      scope: body.scope,
      stateCode: body.stateCode,
      priority: body.priority,
      forceAll: Boolean(body.force || body.forceAll),
      concurrency: body.concurrency ? parseInt(body.concurrency, 10) : undefined,
      timeoutMs: body.timeoutMs ? parseInt(body.timeoutMs, 10) : undefined,
      maxRetries: body.maxRetries !== undefined ? parseInt(body.maxRetries, 10) : undefined,
    };

    const batchResult = await runSourceMonitoringBatch(options);

    res.json({
      success: true,
      message: `Completed fetch cycle for ${batchResult.totalFetched} source(s)`,
      batch: batchResult,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'FETCH_BATCH_EXECUTION_FAILED',
      message: err?.message || 'Unknown server error during source fetch execution',
    });
  }
});

/**
 * GET /api/internal/sources
 * Protected list of all registered sources and their monitoring status.
 */
router.get('/sources', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const sources = await getAllRegisteredSources();
    res.json({
      total: sources.length,
      sources,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'FAILED_TO_LOAD_SOURCES',
      message: err?.message,
    });
  }
});

/**
 * GET /api/internal/fetch-logs
 * Protected audit logs query.
 */
router.get('/fetch-logs', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await getRecentFetchLogs(limit);
    res.json({
      total: logs.length,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'FAILED_TO_LOAD_FETCH_LOGS',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/parse-source
 * Fetches and executes the Step 5 parsing, normalization, verification and deduplication pipeline.
 */
router.post('/parse-source', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const { sourceId, rawContent } = req.body || {};

    if (!sourceId) {
      res.status(400).json({
        error: 'MISSING_SOURCE_ID',
        message: 'A valid sourceId is required to execute parsing.',
      });
      return;
    }

    const source = await getSourceById(sourceId);
    if (!source) {
      res.status(404).json({
        error: 'SOURCE_NOT_FOUND',
        message: `Registered content source with id "${sourceId}" was not found.`,
      });
      return;
    }

    let contentToParse = rawContent;
    let contentHash = '';
    let fetchLogId: string | undefined;

    if (!contentToParse) {
      const fetchResult = await fetchSourceContent(source);
      if (!fetchResult.success || !fetchResult.contentHash) {
        res.status(502).json({
          error: 'SOURCE_FETCH_FAILED',
          message: fetchResult.errorMessage || 'Failed to fetch source content for parsing.',
          fetchResult,
        });
        return;
      }
      contentHash = fetchResult.contentHash;
      contentToParse = ''; // Handled by pipeline or fallback
    } else {
      contentHash = calculateContentHash(contentToParse);
    }

    const pipelineResult = await ContentParsePipeline.execute(
      source,
      contentToParse,
      contentHash,
      fetchLogId
    );

    res.json({
      success: pipelineResult.success,
      summary: pipelineResult,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'PARSE_PIPELINE_ERROR',
      message: err?.message || 'Error executing parsing pipeline',
    });
  }
});

/**
 * GET /api/internal/parsed-items
 * Retrieves parsed records from review queue.
 */
router.get('/parsed-items', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as VerificationStatus | undefined;
    const itemType = req.query.itemType as ParsedItemType | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const items = await getParsedItems({ status, itemType, limit });
    res.json({
      total: items.length,
      items,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'FAILED_TO_LOAD_PARSED_ITEMS',
      message: err?.message,
    });
  }
});

/**
 * PATCH /api/internal/parsed-items/:id/status
 * Updates review / verification status of a parsed record.
 */
router.patch('/parsed-items/:id/status', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body || {};

    if (!status) {
      res.status(400).json({
        error: 'MISSING_STATUS',
        message: 'New verification status is required.',
      });
      return;
    }

    const success = await updateParsedItemStatus(id, status as VerificationStatus, notes);
    if (!success) {
      res.status(404).json({
        error: 'ITEM_NOT_FOUND',
        message: `Parsed item "${id}" not found.`,
      });
      return;
    }

    res.json({
      success: true,
      message: `Parsed item "${id}" status updated to ${status}`,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'UPDATE_STATUS_FAILED',
      message: err?.message,
    });
  }
});

/**
 * GET /api/internal/parse-logs
 * Retrieves recent parse audit logs.
 */
router.get('/parse-logs', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await getRecentParseLogs(limit);
    res.json({
      total: logs.length,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'FAILED_TO_LOAD_PARSE_LOGS',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/publish-item
 * Publishes a single parsed item to public tables.
 */
router.post('/publish-item', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const { item, parsedItemId, force } = req.body || {};

    let targetItem = item;
    if (!targetItem && parsedItemId) {
      const items = await getParsedItems({ limit: 100 });
      targetItem = items.find((i) => i.id === parsedItemId);
    }

    if (!targetItem) {
      res.status(400).json({
        error: 'MISSING_ITEM',
        message: 'A valid item payload or parsedItemId is required.',
      });
      return;
    }

    const result = await publishParsedItem(targetItem, { force: Boolean(force) });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'PUBLISH_ITEM_FAILED',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/publish-batch
 * Bounded batch publish of verified items (10-50).
 */
router.post('/publish-batch', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const { batchSize, sourceId, itemType, force } = req.body || {};
    const summary = await batchPublishVerifiedItems({
      batchSize: batchSize ? parseInt(batchSize, 10) : 25,
      sourceId,
      itemType,
      force: Boolean(force),
    });

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({
      error: 'BATCH_PUBLISH_FAILED',
      message: err?.message,
    });
  }
});

/**
 * GET /api/internal/publish-logs
 * Retrieves publishing audit logs.
 */
router.get('/publish-logs', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await getPublishLogs(limit);
    res.json({
      total: logs.length,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'FAILED_TO_LOAD_PUBLISH_LOGS',
      message: err?.message,
    });
  }
});

/**
 * POST /api/internal/data-quality-check
 * Runs automated data quality check and lifecycle expiration auto-fix.
 */
router.post('/data-quality-check', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const report = await runDataQualityCheck();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({
      error: 'DATA_QUALITY_CHECK_FAILED',
      message: err?.message,
    });
  }
});

export default router;

