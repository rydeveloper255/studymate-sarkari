/**
 * StudyMate Sarkari — Step 8: Dead-Letter Queue & Failed Task Persistence
 *
 * Tracks non-recoverable or retry-pending failures across all pipeline stages
 * without silently dropping events.
 */

import { getSupabaseAdmin } from '../supabaseAdmin';
import { DbDeadLetterTask, TaskStage, DeadLetterStatus } from '../../../types/automation';
import { calculateBackoffMs } from './retryPolicy';

const inMemoryDeadLetterStore = new Map<string, DbDeadLetterTask>();

export interface EnqueueFailureParams {
  sourceId?: string | null;
  stage: TaskStage;
  runId: string;
  taskPayload: Record<string, any>;
  attemptCount: number;
  maxRetries?: number;
  errorCode: string;
  errorMessage: string;
  isPermanent: boolean;
}

/**
 * Enqueues a failed task to the dead-letter queue or schedules next retry.
 */
export async function enqueueFailedTask(params: EnqueueFailureParams): Promise<DbDeadLetterTask> {
  const now = new Date().toISOString();
  const maxRetries = params.maxRetries || 3;
  const isExhausted = params.attemptCount >= maxRetries || params.isPermanent;
  const status: DeadLetterStatus = isExhausted ? 'DEAD_LETTER' : 'PENDING_RETRY';

  let nextRetryAt: string | null = null;
  if (!isExhausted) {
    const delayMs = calculateBackoffMs(params.attemptCount, 2000, 60000, true);
    nextRetryAt = new Date(Date.now() + delayMs).toISOString();
  }

  const id = 'dlq_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();

  const record: DbDeadLetterTask = {
    id,
    source_id: params.sourceId || null,
    pipeline_stage: params.stage,
    run_id: params.runId,
    task_payload: params.taskPayload,
    attempt_count: params.attemptCount,
    max_retries: maxRetries,
    error_code: params.errorCode,
    safe_error_message: params.errorMessage.slice(0, 1000),
    is_permanent: params.isPermanent,
    first_failed_at: now,
    last_failed_at: now,
    next_retry_at: nextRetryAt,
    status,
    created_at: now,
  };

  // 1. Database Storage
  const client = getSupabaseAdmin();
  if (client) {
    try {
      await client.from('pipeline_dead_letter_queue').insert({
        source_id: record.source_id,
        pipeline_stage: record.pipeline_stage,
        run_id: record.run_id,
        task_payload: record.task_payload,
        attempt_count: record.attempt_count,
        max_retries: record.max_retries,
        error_code: record.error_code,
        safe_error_message: record.safe_error_message,
        is_permanent: record.is_permanent,
        first_failed_at: record.first_failed_at,
        last_failed_at: record.last_failed_at,
        next_retry_at: record.next_retry_at,
        status: record.status,
      });
    } catch (err) {
      console.warn('[DeadLetterQueue] Failed to persist to Supabase:', err);
    }
  }

  // 2. In-Memory Fallback
  inMemoryDeadLetterStore.set(id, record);
  return record;
}

/**
 * Retrieves tasks that are due for retry.
 */
export async function getDueRetryTasks(limit: number = 20): Promise<DbDeadLetterTask[]> {
  const now = Date.now();
  const client = getSupabaseAdmin();

  if (client) {
    try {
      const { data, error } = await client
        .from('pipeline_dead_letter_queue')
        .select('*')
        .eq('status', 'PENDING_RETRY')
        .lte('next_retry_at', new Date(now).toISOString())
        .order('next_retry_at', { ascending: true })
        .limit(limit);

      if (!error && data) {
        return data as DbDeadLetterTask[];
      }
    } catch {
      // Fallback to memory
    }
  }

  // In-Memory search
  const due: DbDeadLetterTask[] = [];
  for (const task of inMemoryDeadLetterStore.values()) {
    if (task.status === 'PENDING_RETRY' && task.next_retry_at) {
      if (new Date(task.next_retry_at).getTime() <= now) {
        due.push(task);
        if (due.length >= limit) break;
      }
    }
  }
  return due;
}

/**
 * Updates status of a task in the dead-letter queue (e.g. marked RESOLVED or ABANDONED).
 */
export async function updateDeadLetterStatus(
  taskId: string,
  status: DeadLetterStatus
): Promise<boolean> {
  const now = new Date().toISOString();

  // In-Memory
  const mem = inMemoryDeadLetterStore.get(taskId);
  if (mem) {
    mem.status = status;
    if (status === 'RESOLVED') {
      mem.resolved_at = now;
    }
  }

  // Supabase
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const updateData: any = { status };
      if (status === 'RESOLVED') {
        updateData.resolved_at = now;
      }
      const { error } = await client
        .from('pipeline_dead_letter_queue')
        .update(updateData)
        .eq('id', taskId);

      return !error;
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Retrieves recent dead-letter tasks for monitoring inspection.
 */
export async function getDeadLetterTasks(limit: number = 50): Promise<DbDeadLetterTask[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('pipeline_dead_letter_queue')
        .select('*')
        .order('last_failed_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as DbDeadLetterTask[];
      }
    } catch {
      // Fallback
    }
  }

  return Array.from(inMemoryDeadLetterStore.values())
    .sort((a, b) => new Date(b.last_failed_at).getTime() - new Date(a.last_failed_at).getTime())
    .slice(0, limit);
}

/**
 * Gets count of dead-letter / retry-pending tasks.
 */
export async function getDeadLetterCounts(): Promise<{ pendingRetries: number; deadLetters: number }> {
  const all = await getDeadLetterTasks(200);
  return {
    pendingRetries: all.filter((t) => t.status === 'PENDING_RETRY').length,
    deadLetters: all.filter((t) => t.status === 'DEAD_LETTER').length,
  };
}
