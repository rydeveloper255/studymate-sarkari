/**
 * StudyMate Sarkari — Step 8: Operational Monitoring, Health Probes & Alerting Engine
 *
 * Provides safe, leak-proof operational diagnostics, Prometheus/Cloud Monitoring metrics,
 * and rule-based threshold alerting.
 */

import {
  getAllRegisteredSources,
  getSupabaseAdmin,
  getRecentFetchLogs,
} from '../supabaseAdmin';
import { parserRegistry } from '../parsers';
import { getSourcesHealthReport } from './sourceHealthManager';
import { getRecentPipelineRuns } from './pipelineTracker';
import { getDeadLetterCounts, getDeadLetterTasks } from './deadLetterQueue';
import {
  SystemHealthReport,
  OperationalAlert,
  OperationalAlertRule,
} from '../../../types/automation';

const ALERT_RULES: OperationalAlertRule[] = [
  {
    id: 'SCHEDULER_STOPPED',
    name: 'Cloud Scheduler Inactivity',
    severity: 'WARNING',
    condition: 'No pipeline runs executed in over 60 minutes with active sources',
    active: true,
    description: 'The automated source check scheduler may not be firing on schedule.',
    suggestedAction: 'Verify Google Cloud Scheduler job studymate-source-fetch and Cloud Run internal trigger.',
  },
  {
    id: 'SOURCE_PERSISTENT_FAILURE',
    name: 'Government Source Repeated Failure',
    severity: 'WARNING',
    condition: 'A registered content source has reached FAILING status (>= 6 consecutive failures)',
    active: true,
    description: 'An official portal endpoint is consistently failing connection or response checks.',
    suggestedAction: 'Inspect portal status, check robots.txt, or verify if official URL has changed.',
  },
  {
    id: 'DEAD_LETTER_ACCUMULATION',
    name: 'Dead-Letter Queue Backlog',
    severity: 'WARNING',
    condition: 'Dead letter count exceeds 15 items',
    active: true,
    description: 'Multiple automated tasks have exhausted max retries without resolution.',
    suggestedAction: 'Inspect dead-letter queue logs at /api/internal/health/pipeline and trigger retry.',
  },
  {
    id: 'FETCH_ERROR_SPIKE',
    name: 'Fetch Error Rate Spike',
    severity: 'CRITICAL',
    condition: 'Fetch failure rate exceeds 40% across recent source checks',
    active: true,
    description: 'High volume of network or gateway errors encountered during source checks.',
    suggestedAction: 'Check outbound internet egress or Cloud Run network connectivity.',
  },
  {
    id: 'DATABASE_CONNECTIVITY_DEGRADED',
    name: 'Database Connectivity Degraded',
    severity: 'CRITICAL',
    condition: 'Supabase client queries timing out or falling back to memory store',
    active: true,
    description: 'Primary database connection is failing or inaccessible.',
    suggestedAction: 'Check Supabase instance status and database credentials in Google Secret Manager.',
  },
];

/**
 * Generates comprehensive, leak-proof system health report.
 */
export async function getSystemHealthReport(): Promise<SystemHealthReport> {
  const sourcesReport = await getSourcesHealthReport();
  const recentRuns = await getRecentPipelineRuns(10);
  const dlqCounts = await getDeadLetterCounts();

  // Database probe
  let dbStatus: 'ok' | 'degraded' | 'down' = 'ok';
  let dbLatency = 0;
  const client = getSupabaseAdmin();

  if (client) {
    const t0 = Date.now();
    try {
      const { error } = await client.from('content_sources').select('id').limit(1);
      dbLatency = Date.now() - t0;
      if (error) dbStatus = 'degraded';
    } catch {
      dbStatus = 'degraded';
    }
  } else {
    dbStatus = 'degraded'; // in-memory mode
  }

  // Telegram status
  const tgTokenConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const tgEnabled = process.env.TELEGRAM_NOTIFICATIONS_ENABLED === 'true';
  const tgDryRun = process.env.TELEGRAM_DRY_RUN !== 'false';

  let tgStatus: 'configured' | 'dry_run' | 'disabled' = 'disabled';
  if (tgEnabled) {
    tgStatus = tgDryRun ? 'dry_run' : (tgTokenConfigured ? 'configured' : 'disabled');
  }

  const lastRun = recentRuns[0];
  const lastRunAt = lastRun ? lastRun.started_at : null;

  const totalSources = sourcesReport.length;
  const activeSources = sourcesReport.filter((s) => s.active).length;
  const healthySources = sourcesReport.filter((s) => s.healthStatus === 'HEALTHY').length;
  const degradedSources = sourcesReport.filter((s) => s.healthStatus === 'DEGRADED').length;
  const failingSources = sourcesReport.filter((s) => s.healthStatus === 'FAILING').length;

  // Due calculation
  const now = Date.now();
  const dueSources = sourcesReport.filter((s) => {
    if (!s.active) return false;
    if (!s.lastCheckedAt) return true;
    const intervalMs = (s.priority === 'high' ? 30 : s.priority === 'medium' ? 60 : 180) * 60 * 1000;
    return now - new Date(s.lastCheckedAt).getTime() >= intervalMs;
  }).length;

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (failingSources > 2 || dlqCounts.deadLetters > 20) {
    overallStatus = 'unhealthy';
  } else if (degradedSources > 0 || dlqCounts.deadLetters > 5 || dbStatus === 'degraded') {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    components: {
      database: { status: dbStatus, latencyMs: dbLatency },
      scheduler: {
        status: lastRunAt ? 'active' : 'configured',
        lastRunAt,
      },
      fetcher: {
        status: 'ok',
        concurrency: parseInt(process.env.FETCH_CONCURRENCY || '5', 10),
        activeLocks: 0,
      },
      parser: {
        status: 'ok',
        registeredAdapters: parserRegistry.getAvailableKeys().length,
      },
      publisher: {
        status: 'ok',
        autoExpireEnabled: true,
      },
      telegram: {
        status: tgStatus,
        enabled: tgEnabled,
      },
    },
    metrics: {
      totalSources,
      activeSources,
      dueSources,
      healthySources,
      degradedSources,
      failingSources,
      pendingRetries: dlqCounts.pendingRetries,
      deadLetters: dlqCounts.deadLetters,
    },
  };
}

/**
 * Evaluates operational alert rules and returns currently triggered alerts.
 */
export async function evaluateOperationalAlerts(): Promise<OperationalAlert[]> {
  const alerts: OperationalAlert[] = [];
  const healthReport = await getSystemHealthReport();
  const sourcesReport = await getSourcesHealthReport();
  const dlqCounts = await getDeadLetterCounts();
  const recentRuns = await getRecentPipelineRuns(10);
  const recentFetchLogs = await getRecentFetchLogs(30);

  const now = Date.now();

  // 1. Scheduler inactivity alert
  if (recentRuns.length > 0) {
    const lastRunTime = new Date(recentRuns[0].started_at).getTime();
    if (now - lastRunTime > 60 * 60 * 1000 && healthReport.metrics.activeSources > 0) {
      alerts.push({
        ruleId: 'SCHEDULER_STOPPED',
        title: 'Cloud Scheduler Inactivity Detected',
        severity: 'WARNING',
        description: `No automated source monitoring has executed in the past ${Math.round((now - lastRunTime) / 60000)} minutes.`,
        triggeredAt: new Date().toISOString(),
        details: { lastRunAt: recentRuns[0].started_at },
        suggestedAction: 'Check Cloud Scheduler studymate-source-fetch execution history in GCP console.',
      });
    }
  }

  // 2. Failing source alert
  for (const src of sourcesReport) {
    if (src.healthStatus === 'FAILING') {
      alerts.push({
        ruleId: 'SOURCE_PERSISTENT_FAILURE',
        title: `Persistent Source Failure: ${src.sourceName}`,
        severity: 'WARNING',
        sourceId: src.sourceId,
        description: `Official portal "${src.sourceName}" has failed ${src.consecutiveFailures} consecutive checks. Error: ${src.lastError || 'Unknown'}`,
        triggeredAt: new Date().toISOString(),
        details: {
          officialUrl: src.officialUrl,
          consecutiveFailures: src.consecutiveFailures,
          lastError: src.lastError,
        },
        suggestedAction: 'Review official URL validity and check if government domain format changed.',
      });
    }
  }

  // 3. Dead letter backlog alert
  if (dlqCounts.deadLetters >= 15) {
    alerts.push({
      ruleId: 'DEAD_LETTER_ACCUMULATION',
      title: 'Dead-Letter Task Backlog High',
      severity: 'WARNING',
      description: `There are ${dlqCounts.deadLetters} tasks that have exhausted maximum retries.`,
      triggeredAt: new Date().toISOString(),
      details: { deadLetters: dlqCounts.deadLetters, pendingRetries: dlqCounts.pendingRetries },
      suggestedAction: 'Query /api/internal/dead-letter to review failed tasks.',
    });
  }

  // 4. Fetch error spike alert
  if (recentFetchLogs.length >= 10) {
    const failedFetches = recentFetchLogs.filter((l) => !l.success).length;
    const errorRate = failedFetches / recentFetchLogs.length;
    if (errorRate >= 0.4) {
      alerts.push({
        ruleId: 'FETCH_ERROR_SPIKE',
        title: 'Elevated Source Fetch Error Rate',
        severity: 'CRITICAL',
        description: `${Math.round(errorRate * 100)}% of recent source fetch attempts failed (${failedFetches}/${recentFetchLogs.length}).`,
        triggeredAt: new Date().toISOString(),
        details: { failedCount: failedFetches, totalCount: recentFetchLogs.length, errorRate },
        suggestedAction: 'Check outbound internet routing and government portal availability.',
      });
    }
  }

  return alerts;
}
