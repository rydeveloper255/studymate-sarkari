/**
 * StudyMate Sarkari — Step 4: Monitoring Coordinator & Concurrency Engine
 *
 * ORCHESTRATION FEATURES:
 * - Bounded concurrency queue (controlled parallel workers)
 * - Per-host rate limiting (ensures friendly spacing per domain)
 * - Atomic lock management (prevents overlapping duplicate fetches)
 * - Complete audit trail logging to content_fetch_log
 * - Error isolation (one failing government portal does NOT halt the batch)
 * - Sanitized reporting (no secrets or sensitive tokens exposed)
 */

import {
  DbContentSource,
  FetchBatchResult,
  SourceFetchSummary,
  SourceScope,
  SourcePriority,
} from '../../types';
import {
  getSourceById,
  getDueSources,
  acquireSourceLock,
  releaseSourceLock,
  updateSourceMonitoring,
  insertFetchLog,
} from './supabaseAdmin';
import { fetchSourceContent, FetchOptions } from './sourceFetcher';

export interface BatchFetchOptions extends FetchOptions {
  sourceId?: string;
  limit?: number;
  scope?: SourceScope;
  stateCode?: string;
  priority?: SourcePriority;
  forceAll?: boolean;
  concurrency?: number;
}

const DEFAULT_CONCURRENCY = parseInt(process.env.SOURCE_FETCH_CONCURRENCY || '5', 10);
const PER_HOST_DELAY_MS = parseInt(process.env.SOURCE_FETCH_HOST_DELAY_MS || '500', 10);

// Host timestamp tracker for per-domain rate limiting
const lastHostRequestTimes = new Map<string, number>();

/**
 * Ensures minimal polite delay between requests to the exact same host.
 */
async function enforceHostRateLimit(url: string): Promise<void> {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const now = Date.now();
    const lastTime = lastHostRequestTimes.get(host) || 0;
    const elapsed = now - lastTime;

    if (elapsed < PER_HOST_DELAY_MS) {
      const waitTime = PER_HOST_DELAY_MS - elapsed;
      await new Promise((res) => setTimeout(res, waitTime));
    }

    lastHostRequestTimes.set(host, Date.now());
  } catch {
    // URL parsing fallback
  }
}

/**
 * Fetches a single source, records the audit log, and updates source monitoring metadata.
 */
export async function executeSingleSourceFetch(
  source: DbContentSource,
  options: FetchOptions = {}
): Promise<SourceFetchSummary> {
  // 1. Acquire Lock
  const lockAcquired = await acquireSourceLock(source.id);
  if (!lockAcquired) {
    return {
      sourceId: source.id,
      sourceName: source.source_name,
      officialUrl: source.official_url,
      state: 'RATE_LIMITED',
      success: false,
      changed: false,
      httpStatus: null,
      responseTimeMs: 0,
      attempts: 0,
      error: 'Fetch skipped: Source is currently locked by another in-flight runner',
    };
  }

  const fetchedAt = new Date().toISOString();

  try {
    // 2. Enforce Host Rate Limit
    await enforceHostRateLimit(source.official_url);

    // 3. Perform Fetch
    const result = await fetchSourceContent(source, options);

    // 4. Record Audit Log in Database
    await insertFetchLog({
      source_id: source.id,
      requested_url: source.official_url,
      final_url: result.finalUrl,
      fetched_at: fetchedAt,
      http_status: result.httpStatus,
      success: result.success,
      changed: result.changed,
      content_hash: result.contentHash,
      content_type: result.contentType,
      content_length: result.contentLength,
      etag: result.etag,
      last_modified: result.lastModified,
      response_time_ms: result.responseTimeMs,
      attempt_number: result.attempts,
      fetch_state: result.state,
      error_code: result.errorCode,
      error_message: result.errorMessage,
    });

    // 5. Update Source Monitoring Record
    const updatePayload: Partial<DbContentSource> = {
      last_checked_at: fetchedAt,
      fetch_status: result.state,
    };

    if (result.success) {
      updatePayload.last_success_at = fetchedAt;
      updatePayload.last_error = null;
      if (result.contentHash) {
        updatePayload.content_hash = result.contentHash;
      }
      if (result.etag) {
        updatePayload.etag = result.etag;
      }
      if (result.lastModified) {
        updatePayload.last_modified = result.lastModified;
      }
    } else {
      updatePayload.last_error = `[${result.errorCode || result.state}] ${result.errorMessage || 'Fetch failed'}`;
    }

    await updateSourceMonitoring(source.id, updatePayload);

    return {
      sourceId: source.id,
      sourceName: source.source_name,
      officialUrl: source.official_url,
      finalUrl: result.finalUrl,
      state: result.state,
      success: result.success,
      changed: result.changed,
      httpStatus: result.httpStatus,
      responseTimeMs: result.responseTimeMs,
      attempts: result.attempts,
      contentHash: result.contentHash,
      contentType: result.contentType,
      contentLength: result.contentLength,
      error: result.errorMessage,
    };
  } finally {
    // 6. Release Lock
    await releaseSourceLock(source.id);
  }
}

/**
 * Runs a monitored batch of source checks with controlled concurrency.
 */
export async function runSourceMonitoringBatch(
  options: BatchFetchOptions = {}
): Promise<FetchBatchResult> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();

  let targetSources: DbContentSource[] = [];

  // Target single source by ID or retrieve due sources
  if (options.sourceId) {
    const single = await getSourceById(options.sourceId);
    if (single) {
      targetSources = [single];
    }
  } else {
    targetSources = await getDueSources({
      limit: options.limit,
      scope: options.scope,
      stateCode: options.stateCode,
      priority: options.priority,
      forceAllActive: options.forceAll,
    });
  }

  const concurrency = Math.max(1, Math.min(20, options.concurrency || DEFAULT_CONCURRENCY));
  const results: SourceFetchSummary[] = [];

  // Concurrency Worker Pool
  let index = 0;
  async function worker() {
    while (index < targetSources.length) {
      const currentIndex = index++;
      const src = targetSources[currentIndex];
      try {
        const summary = await executeSingleSourceFetch(src, options);
        results.push(summary);
      } catch (err: any) {
        // Guarantee failure isolation: one bad source does not abort the batch
        results.push({
          sourceId: src.id,
          sourceName: src.source_name,
          officialUrl: src.official_url,
          state: 'NETWORK_ERROR',
          success: false,
          changed: false,
          httpStatus: null,
          responseTimeMs: 0,
          attempts: 1,
          error: err?.message || 'Unhandled worker exception during source execution',
        });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, targetSources.length) }, () => worker());
  await Promise.all(workers);

  const endMs = Date.now();
  const endTime = new Date().toISOString();

  const successCount = results.filter((r) => r.success).length;
  const changedCount = results.filter((r) => r.changed).length;
  const unchangedCount = results.filter((r) => r.success && !r.changed).length;
  const errorCount = results.filter((r) => !r.success).length;

  return {
    totalRequested: targetSources.length,
    totalFetched: results.length,
    successCount,
    changedCount,
    unchangedCount,
    errorCount,
    startTime,
    endTime,
    durationMs: endMs - startMs,
    results,
  };
}
