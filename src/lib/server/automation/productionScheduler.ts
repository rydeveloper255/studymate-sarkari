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
import { CoreScraperEngine, loadJobSourcesFromSupabase } from '../../../backend/scraper';

let hourlyInterval: NodeJS.Timeout | null = null;
let tickerInterval: NodeJS.Timeout | null = null;
let reconciliationInterval: NodeJS.Timeout | null = null;
let isSchedulerRunning = false;
let isSweepInProgress = false;

// Singleton CoreScraperEngine instance
const scraperEngine = new CoreScraperEngine({
  concurrency: 4,
  dateCutoff: '2026-08-01',
});

// Safe Operational Metrics (Leak-Proof)
let lastRun: string | null = null;
let lastSuccessfulRun: string | null = null;
let lastRunDurationMs = 0;
let activeSourcesCount = 0;
let sourcesChecked = 0;
let successfulSources = 0;
let failedSources = 0;
let recordsDiscovered = 0;
let recordsInserted = 0;
let duplicatesSkipped = 0;
let itemsAcceptedCutoff = 0;
let itemsRejectedCutoff = 0;
let totalVacanciesSaved = 0;
let totalAdmitCardsSaved = 0;
let totalResultsSaved = 0;
let totalAnswerKeysSaved = 0;
let totalUpdatesSaved = 0;
let lastTelegramStatus = 'idle';
const schedulerStartTime = Date.now();
let lastReconciliationTime: string | null = null;

export interface ScraperHealthStatus {
  status: 'ok' | 'degraded' | 'stopped';
  scraper_status: 'running' | 'idle' | 'stopped';
  last_run: string | null;
  last_successful_run: string | null;
  last_run_duration_ms: number;
  active_sources_count: number;
  sources_checked: number;
  successful_sources: number;
  failed_sources: number;
  records_discovered: number;
  records_inserted: number;
  duplicates_skipped: number;
  items_accepted_cutoff: number;
  items_rejected_cutoff: number;
  last_telegram_status: string;
  scheduler_uptime_seconds: number;
  check_interval: string;
  last_reconciliation_time: string | null;
  engine_metrics?: {
    total_runs: number;
    vacancies_saved: number;
    admit_cards_saved: number;
    results_saved: number;
    answer_keys_saved: number;
    updates_saved: number;
  };
}

/**
 * Returns the singleton CoreScraperEngine instance.
 */
export function getCoreScraperEngine(): CoreScraperEngine {
  return scraperEngine;
}

/**
 * Returns safe health and monitoring metrics for the scraper.
 * NEVER exposes API keys, bot tokens, or database credentials.
 */
export function getScraperHealthStatus(): ScraperHealthStatus {
  const isRunning = isSchedulerRunning;
  const currentStatus = !isRunning ? 'stopped' : isSweepInProgress ? 'running' : 'idle';

  return {
    status: isRunning ? (failedSources > 10 ? 'degraded' : 'ok') : 'stopped',
    scraper_status: currentStatus,
    last_run: lastRun,
    last_successful_run: lastSuccessfulRun,
    last_run_duration_ms: lastRunDurationMs,
    active_sources_count: activeSourcesCount,
    sources_checked: sourcesChecked,
    successful_sources: successfulSources,
    failed_sources: failedSources,
    records_discovered: recordsDiscovered,
    records_inserted: recordsInserted,
    duplicates_skipped: duplicatesSkipped,
    items_accepted_cutoff: itemsAcceptedCutoff,
    items_rejected_cutoff: itemsRejectedCutoff,
    last_telegram_status: lastTelegramStatus,
    scheduler_uptime_seconds: Math.floor((Date.now() - schedulerStartTime) / 1000),
    check_interval: '1 hour',
    last_reconciliation_time: lastReconciliationTime,
    engine_metrics: {
      total_runs: scraperEngine.getTotalRuns(),
      vacancies_saved: totalVacanciesSaved,
      admit_cards_saved: totalAdmitCardsSaved,
      results_saved: totalResultsSaved,
      answer_keys_saved: totalAnswerKeysSaved,
      updates_saved: totalUpdatesSaved,
    },
  };
}

/**
 * Executes a full hourly comprehensive sweep of all active government sources using CoreScraperEngine.
 */
export async function executeHourlyMonitoringSweep(options: {
  forceAll?: boolean;
  limit?: number;
  dryRun?: boolean;
} = {}): Promise<{
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
  lastRun = new Date().toISOString();

  try {
    const sources = await loadJobSourcesFromSupabase();
    activeSourcesCount = sources.length;
    const effectiveLimit = options.limit ? Math.min(options.limit, sources.length) : sources.length;

    console.log(`[Production Scheduler] Executing hourly sweep via CoreScraperEngine for ${effectiveLimit}/${sources.length} active government sources...`);

    // Run CoreScraperEngine across active government sources
    const engineSummary = await scraperEngine.run({
      forceAll: options.forceAll ?? false,
      limit: effectiveLimit,
      dryRun: options.dryRun,
    });

    sourcesChecked += engineSummary.sourcesEvaluated;
    successfulSources += engineSummary.sourcesFetched;
    failedSources += engineSummary.sourcesFailed;
    recordsDiscovered += engineSummary.itemsDiscovered;
    recordsInserted += engineSummary.itemsSaved;
    duplicatesSkipped += (engineSummary.duplicatesSkipped || 0) + engineSummary.sourcesUnchanged;
    itemsAcceptedCutoff += engineSummary.itemsAcceptedCutoff;
    itemsRejectedCutoff += engineSummary.itemsRejectedCutoff;

    if (engineSummary.vacanciesSaved) totalVacanciesSaved += engineSummary.vacanciesSaved;
    if (engineSummary.admitCardsSaved) totalAdmitCardsSaved += engineSummary.admitCardsSaved;
    if (engineSummary.resultsSaved) totalResultsSaved += engineSummary.resultsSaved;
    if (engineSummary.answerKeysSaved) totalAnswerKeysSaved += engineSummary.answerKeysSaved;
    if (engineSummary.updatesSaved) totalUpdatesSaved += engineSummary.updatesSaved;

    lastRunDurationMs = engineSummary.durationMs;

    if (engineSummary.sourcesFetched > 0) {
      lastSuccessfulRun = new Date().toISOString();
    }

    // Determine Telegram status safely
    const tgService = getTelegramService();
    if (tgService.isEnabled()) {
      lastTelegramStatus = engineSummary.itemsSaved > 0
        ? `active (${engineSummary.itemsSaved} new updates notified)`
        : 'idle_no_new_items';
    } else {
      lastTelegramStatus = 'dry_run_or_unconfigured';
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
      sourcesEvaluated: engineSummary.sourcesEvaluated,
      itemsDiscovered: engineSummary.itemsDiscovered,
      itemsPublished: engineSummary.itemsSaved,
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
