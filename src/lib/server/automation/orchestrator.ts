/**
 * StudyMate Sarkari — Step 8: Master Automation & Pipeline Orchestrator
 *
 * Orchestrates the complete end-to-end autonomous flow:
 * Google Cloud Scheduler
 *       ↓
 * Fetch Worker (Due calculation + Priority + Distributed Lock + Polite host delay + Bounded Retries)
 *       ↓
 * Parse Worker (Change detection + Raw extraction + Entity resolution + Deduplication)
 *       ↓
 * Verification Engine (Confidence scoring + Official URL security checks)
 *       ↓
 * Publish Worker (Idempotent upsert to public government tables)
 *       ↓
 * Telegram Notification Worker (Eligibility gating + Non-blocking failure isolation)
 *       ↓
 * Monitoring, Audit Logs & Dead-Letter Queue
 */

import {
  OrchestrationRunOptions,
  OrchestratorRunSummary,
  PipelineStageResult,
} from '../../../types/automation';
import { DbContentSource } from '../../../types';
import {
  getDueSources,
  getSourceById,
  getParsedItems,
} from '../supabaseAdmin';
import { fetchSourceContent, calculateContentHash } from '../sourceFetcher';
import { ContentParsePipeline } from '../pipeline/parsePipeline';
import { publishParsedItem } from '../publishing/publishService';
import { getTelegramService } from '../telegram/service';
import { acquireDistributedLock, releaseDistributedLock } from './distributedLock';
import { executeWithRetry, classifyError } from './retryPolicy';
import { enqueueFailedTask, getDueRetryTasks, updateDeadLetterStatus } from './deadLetterQueue';
import { recordSourceSuccess, recordSourceFailure } from './sourceHealthManager';
import { startPipelineRun, completePipelineRun, generateCorrelationId } from './pipelineTracker';

const DEFAULT_CONCURRENCY = parseInt(process.env.FETCH_CONCURRENCY || '5', 10);
const HOST_DELAY_MS = parseInt(process.env.SOURCE_FETCH_HOST_DELAY_MS || '500', 10);

const hostRateLimitMap = new Map<string, number>();

/**
 * Enforces polite delay between requests to the exact same host.
 */
async function enforceHostRateLimit(url: string): Promise<void> {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const now = Date.now();
    const last = hostRateLimitMap.get(host) || 0;
    const elapsed = now - last;
    if (elapsed < HOST_DELAY_MS) {
      await new Promise((res) => setTimeout(res, HOST_DELAY_MS - elapsed));
    }
    hostRateLimitMap.set(host, Date.now());
  } catch {
    // Fallback
  }
}

export class PipelineOrchestrator {
  /**
   * Executes the full automated pipeline end-to-end.
   */
  public static async runFullPipeline(
    options: OrchestrationRunOptions = {}
  ): Promise<OrchestratorRunSummary> {
    const correlationId = options.correlationId || generateCorrelationId('pipeline');
    const startedAt = new Date().toISOString();
    const startMs = Date.now();

    // 1. Start tracking in pipeline tracker
    const pipelineRun = await startPipelineRun({
      pipelineName: 'STUDYMATE_MASTER_AUTOMATION',
      stage: 'FULL_PIPELINE',
      correlationId,
      metadata: { options },
    });

    const runId = pipelineRun.id;
    const errors: Array<{ stage: string; sourceId?: string; message: string }> = [];

    // Global scheduler lock to prevent overlapping runs on distributed instances
    const lockToken = await acquireDistributedLock('scheduler:master_pipeline', { ttlMs: 10 * 60 * 1000 });
    if (!lockToken) {
      await completePipelineRun({
        runId,
        status: 'SKIPPED_DUPLICATE' as any,
        metadata: { reason: 'Another master pipeline instance is currently in progress' },
      });

      return {
        runId,
        correlationId,
        pipelineName: 'STUDYMATE_MASTER_AUTOMATION',
        status: 'PARTIAL',
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startMs,
        sourcesEvaluated: 0,
        sourcesFetched: 0,
        sourcesChanged: 0,
        itemsParsed: 0,
        itemsVerified: 0,
        itemsPublished: 0,
        telegramSent: 0,
        telegramSkipped: 0,
        telegramFailed: 0,
        deadLetterCount: 0,
        stageResults: {},
        errors: [{ stage: 'ORCHESTRATOR', message: 'Skipped: Lock already held by active runner' }],
      };
    }

    // Results tracking
    const stageResults: Record<string, PipelineStageResult> = {};
    let sourcesEvaluated = 0;
    let sourcesFetched = 0;
    let sourcesChanged = 0;
    let itemsParsed = 0;
    let itemsVerified = 0;
    let itemsPublished = 0;
    let telegramSent = 0;
    let telegramSkipped = 0;
    let telegramFailed = 0;
    let deadLetterCount = 0;

    try {
      // =========================================================================
      // STAGE 1: FETCH WORKER (Due Source Selection & Concurrency Pool)
      // =========================================================================
      const fetchStart = Date.now();
      let targetSources: DbContentSource[] = [];

      if (options.sourceIds && options.sourceIds.length > 0) {
        for (const sid of options.sourceIds) {
          const s = await getSourceById(sid);
          if (s) targetSources.push(s);
        }
      } else {
        targetSources = await getDueSources({
          limit: options.limit || 20,
          scope: options.scope,
          stateCode: options.stateCode,
          priority: options.priority,
          forceAllActive: options.forceAll,
        });
      }

      sourcesEvaluated = targetSources.length;
      const fetchedContentList: Array<{ source: DbContentSource; content: string; hash: string }> = [];

      // Concurrency Worker
      const concurrency = Math.max(1, Math.min(10, options.concurrency || DEFAULT_CONCURRENCY));
      let sourceIndex = 0;

      const fetchWorker = async () => {
        while (sourceIndex < targetSources.length) {
          const src = targetSources[sourceIndex++];
          const sourceLockToken = await acquireDistributedLock(`source:${src.id}`, { ttlMs: 3 * 60 * 1000 });
          if (!sourceLockToken) {
            continue; // Skip source locked by another worker
          }

          try {
            await enforceHostRateLimit(src.official_url);

            // Execute fetch with retry policy
            const retryRes = await executeWithRetry(
              async (attempt) => {
                const res = await fetchSourceContent(src, {
                  timeoutMs: options.timeoutMs,
                  maxRetries: 1, // handled by orchestrator loop
                });
                if (!res.success) {
                  const err: any = new Error(res.errorMessage || 'Fetch failed');
                  err.httpStatus = res.httpStatus;
                  err.errorCode = res.errorCode || res.state;
                  throw err;
                }
                return res;
              },
              { maxRetries: options.maxRetries || 3 }
            );

            if (retryRes.success && retryRes.result) {
              const fetchRes = retryRes.result;
              sourcesFetched++;
              await recordSourceSuccess(src.id);

              if (fetchRes.changed || options.forceAll) {
                sourcesChanged++;
                fetchedContentList.push({
                  source: src,
                  content: fetchRes.content || '',
                  hash: fetchRes.contentHash || calculateContentHash(src.official_url + Date.now()),
                });
              }
            } else {
              // Fetch failure handling
              const classified = retryRes.lastError || classifyError(new Error('Fetch failed'));
              await recordSourceFailure(src, classified.errorCode, classified.safeMessage);

              await enqueueFailedTask({
                sourceId: src.id,
                stage: 'FETCH',
                runId: correlationId,
                taskPayload: { sourceId: src.id, officialUrl: src.official_url },
                attemptCount: retryRes.attempts,
                errorCode: classified.errorCode,
                errorMessage: classified.safeMessage,
                isPermanent: classified.isPermanent,
              });

              deadLetterCount++;
              errors.push({
                stage: 'FETCH',
                sourceId: src.id,
                message: classified.safeMessage,
              });
            }
          } finally {
            await releaseDistributedLock(`source:${src.id}`, sourceLockToken);
          }
        }
      };

      const fetchWorkers = Array.from(
        { length: Math.min(concurrency, targetSources.length) },
        () => fetchWorker()
      );
      await Promise.all(fetchWorkers);

      stageResults['FETCH'] = {
        stage: 'FETCH',
        success: errors.filter((e) => e.stage === 'FETCH').length === 0,
        itemsIn: sourcesEvaluated,
        itemsOut: sourcesFetched,
        errors: errors.filter((e) => e.stage === 'FETCH').map((e) => e.message),
        durationMs: Date.now() - fetchStart,
      };

      // =========================================================================
      // STAGE 2: PARSE WORKER (Normalization, Verification & Deduplication)
      // =========================================================================
      const parseStart = Date.now();
      const parsedItemsToPublish: any[] = [];

      for (const item of fetchedContentList) {
        try {
          const parseSummary = await ContentParsePipeline.execute(
            item.source,
            item.content,
            item.hash
          );

          itemsParsed += parseSummary.normalizedItemCount;

          if (parseSummary.success && parseSummary.items) {
            for (const normalized of parseSummary.items) {
              if (normalized.verificationStatus === 'VERIFIED') {
                itemsVerified++;
                parsedItemsToPublish.push(normalized);
              }
            }
          } else if (!parseSummary.success) {
            errors.push({
              stage: 'PARSE',
              sourceId: item.source.id,
              message: parseSummary.errors.join('; ') || 'Parse execution failed',
            });
          }
        } catch (err: any) {
          errors.push({
            stage: 'PARSE',
            sourceId: item.source.id,
            message: err?.message || 'Unexpected exception during parsing stage',
          });
        }
      }

      stageResults['PARSE'] = {
        stage: 'PARSE',
        success: errors.filter((e) => e.stage === 'PARSE').length === 0,
        itemsIn: fetchedContentList.length,
        itemsOut: itemsParsed,
        errors: errors.filter((e) => e.stage === 'PARSE').map((e) => e.message),
        durationMs: Date.now() - parseStart,
      };

      // =========================================================================
      // STAGE 3: PUBLISH WORKER (Idempotent Government Portal Publishing)
      // =========================================================================
      const publishStart = Date.now();
      const publishedRecords: Array<{ targetType: string; record: any; isNew: boolean }> = [];

      for (const parsedItem of parsedItemsToPublish) {
        try {
          const pubResult = await publishParsedItem(parsedItem, { force: false });
          if (pubResult.success && pubResult.item) {
            itemsPublished++;
            publishedRecords.push({
              targetType: pubResult.targetType,
              record: pubResult.item,
              isNew: pubResult.action === 'PUBLISHED_NEW',
            });
          } else if (!pubResult.success) {
            errors.push({
              stage: 'PUBLISH',
              sourceId: parsedItem.sourceId,
              message: pubResult.error || 'Publishing failed',
            });
          }
        } catch (err: any) {
          errors.push({
            stage: 'PUBLISH',
            sourceId: parsedItem.sourceId,
            message: err?.message || 'Publish exception',
          });
        }
      }

      stageResults['PUBLISH'] = {
        stage: 'PUBLISH',
        success: errors.filter((e) => e.stage === 'PUBLISH').length === 0,
        itemsIn: parsedItemsToPublish.length,
        itemsOut: itemsPublished,
        errors: errors.filter((e) => e.stage === 'PUBLISH').map((e) => e.message),
        durationMs: Date.now() - publishStart,
      };

      // =========================================================================
      // STAGE 4: TELEGRAM NOTIFICATION WORKER (Non-Blocking Failure Isolation)
      // =========================================================================
      if (!options.skipTelegram) {
        const tgStart = Date.now();
        const tgService = getTelegramService();

        for (const pub of publishedRecords) {
          try {
            const tgRes = await tgService.handlePublishedItem(
              pub.record,
              {
                dryRun: options.dryRunTelegram,
              }
            );

            if (tgRes.status === 'SENT' || tgRes.status === 'DRY_RUN_SUCCESS') {
              telegramSent++;
            } else if (tgRes.status === 'SKIPPED_DUPLICATE' || tgRes.status === 'SKIPPED_INELIGIBLE' || tgRes.status === 'DISABLED') {
              telegramSkipped++;
            } else {
              telegramFailed++;
              // Record dead letter for Telegram notification without failing publish
              await enqueueFailedTask({
                stage: 'TELEGRAM',
                runId: correlationId,
                taskPayload: { targetType: pub.targetType, targetId: pub.record.id },
                attemptCount: 1,
                errorCode: 'TELEGRAM_DELIVERY_FAILED',
                errorMessage: tgRes.errorMessage || 'Telegram delivery failed',
                isPermanent: false,
              });
            }
          } catch (tgErr: any) {
            telegramFailed++;
            // Non-blocking catch
            console.warn('[Orchestrator] Non-blocking Telegram error:', tgErr?.message);
          }
        }

        stageResults['TELEGRAM'] = {
          stage: 'TELEGRAM',
          success: telegramFailed === 0,
          itemsIn: publishedRecords.length,
          itemsOut: telegramSent,
          errors: [],
          durationMs: Date.now() - tgStart,
        };
      }
    } finally {
      await releaseDistributedLock('scheduler:master_pipeline', lockToken);
    }

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startMs;
    const finalStatus = errors.length === 0 ? 'COMPLETED' : (itemsPublished > 0 || sourcesFetched > 0 ? 'PARTIAL' : 'FAILED');

    // Complete tracking in database
    await completePipelineRun({
      runId,
      status: finalStatus,
      itemsFound: sourcesEvaluated,
      itemsProcessed: sourcesFetched,
      itemsPublished,
      itemsFailed: errors.length,
      errorCount: errors.length,
      metadata: {
        sourcesEvaluated,
        sourcesFetched,
        sourcesChanged,
        itemsParsed,
        itemsVerified,
        itemsPublished,
        telegramSent,
        telegramSkipped,
        telegramFailed,
        deadLetterCount,
        durationMs,
      },
    });

    return {
      runId,
      correlationId,
      pipelineName: 'STUDYMATE_MASTER_AUTOMATION',
      status: finalStatus,
      startedAt,
      completedAt,
      durationMs,
      sourcesEvaluated,
      sourcesFetched,
      sourcesChanged,
      itemsParsed,
      itemsVerified,
      itemsPublished,
      telegramSent,
      telegramSkipped,
      telegramFailed,
      deadLetterCount,
      stageResults,
      errors,
    };
  }

  /**
   * Retries due dead-letter tasks.
   */
  public static async runDeadLetterRetries(limit: number = 20): Promise<{
    processed: number;
    resolved: number;
    reEnqueued: number;
  }> {
    const dueTasks = await getDueRetryTasks(limit);
    let resolved = 0;
    let reEnqueued = 0;

    for (const task of dueTasks) {
      if (task.pipeline_stage === 'FETCH' && task.source_id) {
        const source = await getSourceById(task.source_id);
        if (source) {
          try {
            const fetchRes = await fetchSourceContent(source);
            if (fetchRes.success) {
              await updateDeadLetterStatus(task.id, 'RESOLVED');
              await recordSourceSuccess(source.id);
              resolved++;
              continue;
            }
          } catch {
            // will increment attempt
          }
        }
      }

      // If still failing
      const nextAttempt = task.attempt_count + 1;
      const isExhausted = nextAttempt >= task.max_retries;

      if (isExhausted) {
        await updateDeadLetterStatus(task.id, 'DEAD_LETTER');
        reEnqueued++;
      } else {
        await enqueueFailedTask({
          sourceId: task.source_id,
          stage: task.pipeline_stage,
          runId: task.run_id,
          taskPayload: task.task_payload,
          attemptCount: nextAttempt,
          maxRetries: task.max_retries,
          errorCode: task.error_code,
          errorMessage: task.safe_error_message,
          isPermanent: false,
        });
        await updateDeadLetterStatus(task.id, 'ABANDONED');
        reEnqueued++;
      }
    }

    return {
      processed: dueTasks.length,
      resolved,
      reEnqueued,
    };
  }
}
