/**
 * StudyMate Sarkari — Continuous Production Source Monitoring Scheduler
 *
 * Runs autonomously in the backend without requiring user website traffic.
 * - Runs comprehensive monitoring sweep of all active government sources every 1 hour (3600s)
 * - Also checks priority-based intervals on a 60-second ticker
 * - Enforces distributed locks to prevent duplicate simultaneous fetches
 * - Executes automated live status reconciliation every 15 minutes
 * - Tracks comprehensive safe operational metrics for health probes
 */

import { PipelineOrchestrator } from './orchestrator';
import { reconcileExpiredVacancies } from './reconciliationService';
import { acquireDistributedLock, releaseDistributedLock } from './distributedLock';
import { loadAllActiveSourcesFromDatabase, getDueSourcesFromRegistry } from '../sources/sourceLoader';
import { getTelegramService } from '../telegram/service';

let hourlyInterval: NodeJS.Timeout | null = null;
let tickerInterval: NodeJS.Timeout | null = null;
let reconciliationInterval: NodeJS.Timeout | null = null;
let isSchedulerRunning = false;
let isSweepInProgress = false;

// Safe Operational Metrics (Leak-Proof)
let lastSuccessfulRun: string | null = null;
let lastRunDurationMs = 0;
let activeSourcesCount = 0;
let sourcesChecked = 0;
let successfulSources = 0;
let failedSources = 0;
let recordsDiscovered = 0;
let recordsInserted = 0;
let lastTelegramStatus = 'idle';
const schedulerStartTime = Date.now();
let lastReconciliationTime: string | null = null;

export interface ScraperHealthStatus {
  status: 'ok' | 'degraded' | 'stopped';
  scraper_status: 'running' | 'idle' | 'stopped';
  last_successful_run: string | null;
  last_run_duration_ms: number;
  active_sources_count: number;
  sources_checked: number;
  successful_sources: number;
  failed_sources: number;
  records_discovered: number;
  records_inserted: number;
  last_telegram_status: string;
  scheduler_uptime_seconds: number;
  check_interval: string;
  last_reconciliation_time: string | null;
}

/**
 * Returns safe health and monitoring metrics for the scraper.
 * NEVER exposes API keys, bot tokens, or database credentials.
 */
export function getScraperHealthStatus(): ScraperHealthStatus {
  const isRunning = isSchedulerRunning;
  const currentStatus = !isRunning ? 'stopped' : isSweepInProgress ? 'running' : 'idle';

  return {
    status: isRunning ? (failedSources > 5 ? 'degraded' : 'ok') : 'stopped',
    scraper_status: currentStatus,
    last_successful_run: lastSuccessfulRun,
    last_run_duration_ms: lastRunDurationMs,
    active_sources_count: activeSourcesCount,
    sources_checked: sourcesChecked,
    successful_sources: successfulSources,
    failed_sources: failedSources,
    records_discovered: recordsDiscovered,
    records_inserted: recordsInserted,
    last_telegram_status: lastTelegramStatus,
    scheduler_uptime_seconds: Math.floor((Date.now() - schedulerStartTime) / 1000),
    check_interval: '1 hour',
    last_reconciliation_time: lastReconciliationTime,
  };
}

/**
 * Executes a full hourly comprehensive sweep of all active government sources.
 */
export async function executeHourlyMonitoringSweep(options: { forceAll?: boolean } = {}): Promise<{
  success: boolean;
  sourcesEvaluated: number;
  itemsDiscovered: number;
  itemsPublished: number;
  durationMs: number;
  skippedLock?: boolean;
}> {
  const startMs = Date.now();
  const lockToken = await acquireDistributedLock('scheduler:hourly_sweep', { ttlMs: 25 * 60 * 1000 });
  if (!lockToken) {
    return {
      success: false,
      sourcesEvaluated: 0,
      itemsDiscovered: 0,
      itemsPublished: 0,
      durationMs: 0,
      skippedLock: true,
    };
  }

  isSweepInProgress = true;

  try {
    const allActive = await loadAllActiveSourcesFromDatabase({ forceRefresh: true });
    activeSourcesCount = allActive.length;

    console.log(`[Production Scheduler] Executing hourly sweep for ${allActive.length} active government sources...`);

    const summary = await PipelineOrchestrator.runFullPipeline({
      forceAll: options.forceAll ?? true,
      concurrency: 4,
    });

    sourcesChecked = summary.sourcesEvaluated;
    successfulSources = summary.sourcesFetched;
    failedSources = Math.max(0, summary.sourcesEvaluated - summary.sourcesFetched);
    recordsDiscovered = summary.itemsParsed;
    recordsInserted = summary.itemsPublished;
    lastRunDurationMs = summary.durationMs;

    if (summary.status === 'COMPLETED' || summary.status === 'PARTIAL') {
      lastSuccessfulRun = new Date().toISOString();
    }

    // Determine safe Telegram status summary
    if (summary.telegramSent > 0) {
      lastTelegramStatus = `sent (${summary.telegramSent} notifications)`;
    } else if (summary.telegramSkipped > 0) {
      lastTelegramStatus = `skipped (${summary.telegramSkipped} duplicates/gated)`;
    } else if (summary.telegramFailed > 0) {
      lastTelegramStatus = `failed (${summary.telegramFailed} errors)`;
    } else {
      const tgService = getTelegramService();
      lastTelegramStatus = tgService.isEnabled() ? 'idle_no_new_items' : 'dry_run_or_disabled';
    }

    // Reconcile live application statuses (mark expired vacancies as Closed)
    try {
      await reconcileExpiredVacancies();
      lastReconciliationTime = new Date().toISOString();
    } catch (recErr) {
      console.warn('[Production Scheduler] Live status reconciliation notice:', recErr);
    }

    return {
      success: true,
      sourcesEvaluated: summary.sourcesEvaluated,
      itemsDiscovered: summary.itemsParsed,
      itemsPublished: summary.itemsPublished,
      durationMs: Date.now() - startMs,
    };
  } catch (err: any) {
    console.error('[Production Scheduler] Hourly sweep error:', err);
    return {
      success: false,
      sourcesEvaluated: 0,
      itemsDiscovered: 0,
      itemsPublished: 0,
      durationMs: Date.now() - startMs,
    };
  } finally {
    isSweepInProgress = false;
    await releaseDistributedLock('scheduler:hourly_sweep', lockToken);
  }
}

/**
 * Runs a single lightweight cycle checking due sources (inter-sweep priority checks).
 */
export async function executeSchedulerCycle(): Promise<{
  sourcesChecked: number;
  runSummary?: any;
  skippedLock?: boolean;
}> {
  // If an hourly full sweep is already running, skip the incremental tick
  if (isSweepInProgress) {
    return { sourcesChecked: 0, skippedLock: true };
  }

  const lockToken = await acquireDistributedLock('scheduler:tick', { ttlMs: 120 * 1000 });
  if (!lockToken) {
    return { sourcesChecked: 0, skippedLock: true };
  }

  try {
    const dueSources = await getDueSourcesFromRegistry({ limit: 10 });
    if (dueSources.length === 0) {
      return { sourcesChecked: 0 };
    }

    const summary = await PipelineOrchestrator.runFullPipeline({
      sourceIds: dueSources.map((s) => s.id),
      concurrency: 3,
    });

    sourcesChecked += summary.sourcesEvaluated;
    successfulSources += summary.sourcesFetched;
    recordsDiscovered += summary.itemsParsed;
    recordsInserted += summary.itemsPublished;

    if (summary.status === 'COMPLETED') {
      lastSuccessfulRun = new Date().toISOString();
    }

    return {
      sourcesChecked: dueSources.length,
      runSummary: summary,
    };
  } catch (err: any) {
    console.error('[Production Scheduler] Cycle error:', err);
    return { sourcesChecked: 0 };
  } finally {
    await releaseDistributedLock('scheduler:tick', lockToken);
  }
}

/**
 * Starts the continuous background scheduler.
 */
export function startProductionScheduler(): void {
  if (isSchedulerRunning) {
    return;
  }

  isSchedulerRunning = true;
  console.log('[Production Scheduler] Started autonomous government source monitoring (1-hour cycle).');

  // Initial run after 5 seconds
  setTimeout(async () => {
    try {
      await executeHourlyMonitoringSweep();
    } catch (err) {
      console.warn('[Production Scheduler] Initial startup sweep error:', err);
    }
  }, 5000);

  // Hourly comprehensive sweep: runs every 60 minutes
  hourlyInterval = setInterval(async () => {
    try {
      await executeHourlyMonitoringSweep();
    } catch (err) {
      console.error('[Production Scheduler] Hourly sweep interval error:', err);
    }
  }, 60 * 60 * 1000);

  // Inter-sweep ticker for due sources: runs every 60 seconds
  tickerInterval = setInterval(async () => {
    try {
      await executeSchedulerCycle();
    } catch (err) {
      console.error('[Production Scheduler] Tick error:', err);
    }
  }, 60 * 1000);

  // Live application status reconciliation: runs every 15 minutes
  reconciliationInterval = setInterval(async () => {
    try {
      lastReconciliationTime = new Date().toISOString();
      await reconcileExpiredVacancies();
    } catch (err) {
      console.error('[Production Scheduler] Reconciliation error:', err);
    }
  }, 15 * 60 * 1000);
}

/**
 * Stops the continuous background scheduler.
 */
export function stopProductionScheduler(): void {
  if (hourlyInterval) {
    clearInterval(hourlyInterval);
    hourlyInterval = null;
  }
  if (tickerInterval) {
    clearInterval(tickerInterval);
    tickerInterval = null;
  }
  if (reconciliationInterval) {
    clearInterval(reconciliationInterval);
    reconciliationInterval = null;
  }
  isSchedulerRunning = false;
  console.log('[Production Scheduler] Stopped autonomous monitoring.');
}
