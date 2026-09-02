/**
 * StudyMate Sarkari — Step 8: Source Health Management & Failure Policies
 *
 * Evaluates official source reliability without destructive drops or premature deactivations.
 */

import {
  getAllRegisteredSources,
  getSupabaseAdmin,
  updateSourceMonitoring,
} from '../supabaseAdmin';
import { DbContentSource } from '../../../types';
import { SourceHealthReport, SourceHealthStatus } from '../../../types/automation';

// Health status transition thresholds
const DEGRADED_CONSECUTIVE_THRESHOLD = 3;
const FAILING_CONSECUTIVE_THRESHOLD = 6;

// In-memory health status cache for fast queries
const inMemoryHealthTracking = new Map<
  string,
  {
    consecutiveFailures: number;
    healthStatus: SourceHealthStatus;
    lastCheckedAt?: string;
    lastSuccessAt?: string;
    lastError?: string;
  }
>();

/**
 * Calculates health status based on consecutive failure count and active flag.
 */
export function determineHealthStatus(
  active: boolean,
  consecutiveFailures: number
): SourceHealthStatus {
  if (!active) {
    return 'DISABLED';
  }
  if (consecutiveFailures >= FAILING_CONSECUTIVE_THRESHOLD) {
    return 'FAILING';
  }
  if (consecutiveFailures >= DEGRADED_CONSECUTIVE_THRESHOLD) {
    return 'DEGRADED';
  }
  return 'HEALTHY';
}

/**
 * Records a successful source operation and restores healthy status.
 */
export async function recordSourceSuccess(sourceId: string): Promise<void> {
  const now = new Date().toISOString();
  const current = inMemoryHealthTracking.get(sourceId) || {
    consecutiveFailures: 0,
    healthStatus: 'HEALTHY',
  };

  current.consecutiveFailures = 0;
  current.healthStatus = 'HEALTHY';
  current.lastCheckedAt = now;
  current.lastSuccessAt = now;
  current.lastError = undefined;

  inMemoryHealthTracking.set(sourceId, current);

  // Sync to database
  const client = getSupabaseAdmin();
  if (client) {
    try {
      await client
        .from('content_sources')
        .update({
          last_checked_at: now,
          last_success_at: now,
          last_error: null,
          fetch_status: 'SUCCESS',
        })
        .eq('id', sourceId);
    } catch {
      // Best-effort
    }
  }
}

/**
 * Records a failed source operation and updates health degradation.
 */
export async function recordSourceFailure(
  source: DbContentSource,
  errorCode: string,
  errorMessage: string
): Promise<SourceHealthStatus> {
  const now = new Date().toISOString();
  const current = inMemoryHealthTracking.get(source.id) || {
    consecutiveFailures: 0,
    healthStatus: 'HEALTHY',
  };

  current.consecutiveFailures += 1;
  current.healthStatus = determineHealthStatus(source.active, current.consecutiveFailures);
  current.lastCheckedAt = now;
  current.lastError = `[${errorCode}] ${errorMessage}`;

  inMemoryHealthTracking.set(source.id, current);

  // Sync to database
  await updateSourceMonitoring(source.id, {
    last_checked_at: now,
    last_error: current.lastError,
    fetch_status: errorCode,
  });

  return current.healthStatus;
}

/**
 * Generates an operational health report for all registered content sources.
 */
export async function getSourcesHealthReport(): Promise<SourceHealthReport[]> {
  const sources = await getAllRegisteredSources();

  return sources.map((source) => {
    const mem = inMemoryHealthTracking.get(source.id);
    const consecutiveFailures = mem?.consecutiveFailures ?? 0;
    const healthStatus = mem?.healthStatus ?? determineHealthStatus(source.active, consecutiveFailures);

    return {
      sourceId: source.id,
      sourceName: source.source_name,
      officialUrl: source.official_url,
      scope: source.scope,
      priority: source.priority,
      active: source.active,
      healthStatus,
      consecutiveFailures,
      lastCheckedAt: mem?.lastCheckedAt || source.last_checked_at,
      lastSuccessAt: mem?.lastSuccessAt || source.last_success_at,
      lastError: mem?.lastError || source.last_error,
    };
  });
}
