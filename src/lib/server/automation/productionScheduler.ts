/**
 * StudyMate Sarkari — Continuous Production Source Monitoring Scheduler
 *
 * Runs autonomously in the backend without requiring user website traffic.
 * - Monitors all active sources in public.job_sources
 * - Enforces priority-based check intervals:
 *   * HIGH PRIORITY: Every 15 minutes
 *   * NORMAL PRIORITY: Every 30 minutes
 *   * LOW PRIORITY: Every 60 minutes
 * - Respects distributed locks to prevent duplicate simultaneous fetches
 * - Executes automated reconciliation every 15 minutes
 */

import { getDueSources } from '../supabaseAdmin';
import { PipelineOrchestrator } from './orchestrator';
import { reconcileExpiredVacancies } from './reconciliationService';
import { acquireDistributedLock, releaseDistributedLock } from './distributedLock';

let schedulerInterval: NodeJS.Timeout | null = null;
let reconciliationInterval: NodeJS.Timeout | null = null;
let isSchedulerRunning = false;
let lastCheckTime: string | null = null;
let lastReconciliationTime: string | null = null;

export interface SchedulerStatus {
  isRunning: boolean;
  lastCheckTime: string | null;
  lastReconciliationTime: string | null;
  checkIntervalSeconds: number;
}

export function getSchedulerStatus(): SchedulerStatus {
  return {
    isRunning: isSchedulerRunning,
    lastCheckTime,
    lastReconciliationTime,
    checkIntervalSeconds: 60,
  };
}

/**
 * Runs a single cycle of the monitoring scheduler.
 */
export async function executeSchedulerCycle(): Promise<{
  sourcesChecked: number;
  runSummary?: any;
  skippedLock?: boolean;
}> {
  lastCheckTime = new Date().toISOString();

  // Try acquiring the scheduler tick lock (prevents concurrent scheduler runs)
  const lockToken = await acquireDistributedLock('scheduler:tick', { ttlMs: 120 * 1000 });
  if (!lockToken) {
    return { sourcesChecked: 0, skippedLock: true };
  }

  try {
    const dueSources = await getDueSources({ limit: 10 });
    if (dueSources.length === 0) {
      return { sourcesChecked: 0 };
    }

    const summary = await PipelineOrchestrator.runFullPipeline({
      sourceIds: dueSources.map((s) => s.id),
      concurrency: 3,
    });

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
  console.log('[Production Scheduler] Started autonomous government source monitoring.');

  // Initial reconciliation & check after 5 seconds
  setTimeout(async () => {
    try {
      lastReconciliationTime = new Date().toISOString();
      await reconcileExpiredVacancies();
      await executeSchedulerCycle();
    } catch (err) {
      console.warn('[Production Scheduler] Initial startup cycle error:', err);
    }
  }, 5000);

  // Poll for due sources every 60 seconds
  schedulerInterval = setInterval(async () => {
    try {
      await executeSchedulerCycle();
    } catch (err) {
      console.error('[Production Scheduler] Tick error:', err);
    }
  }, 60 * 1000);

  // Run reconciliation every 15 minutes
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
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  if (reconciliationInterval) {
    clearInterval(reconciliationInterval);
    reconciliationInterval = null;
  }
  isSchedulerRunning = false;
  console.log('[Production Scheduler] Stopped autonomous monitoring.');
}
