/**
 * StudyMate Sarkari — Step 8: Pipeline Execution Tracker & Correlation Logger
 *
 * Tracks every automated pipeline execution with correlation IDs, throughput metrics,
 * execution duration, and audit logs.
 */

import { getSupabaseAdmin } from '../supabaseAdmin';
import {
  DbPipelineRun,
  PipelineStage,
  PipelineRunStatus,
} from '../../../types/automation';

const inMemoryRunsStore = new Map<string, DbPipelineRun>();

export interface StartRunParams {
  pipelineName: string;
  stage: PipelineStage;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface CompleteRunParams {
  runId: string;
  status: PipelineRunStatus;
  itemsFound?: number;
  itemsProcessed?: number;
  itemsPublished?: number;
  itemsFailed?: number;
  errorCount?: number;
  metadata?: Record<string, any>;
}

export function generateCorrelationId(prefix: string = 'run'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Initiates tracking for a new pipeline execution run.
 */
export async function startPipelineRun(params: StartRunParams): Promise<DbPipelineRun> {
  const runId = 'run_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
  const correlationId = params.correlationId || generateCorrelationId(params.stage.toLowerCase());
  const now = new Date().toISOString();

  const record: DbPipelineRun = {
    id: runId,
    pipeline_name: params.pipelineName,
    stage: params.stage,
    status: 'RUNNING',
    correlation_id: correlationId,
    started_at: now,
    completed_at: null,
    duration_ms: null,
    items_found: 0,
    items_processed: 0,
    items_published: 0,
    items_failed: 0,
    error_count: 0,
    run_metadata: params.metadata || {},
    created_at: now,
  };

  // 1. Supabase Persistence
  const client = getSupabaseAdmin();
  if (client) {
    try {
      await client.from('pipeline_runs').insert({
        pipeline_name: record.pipeline_name,
        stage: record.stage,
        status: record.status,
        correlation_id: record.correlation_id,
        started_at: record.started_at,
        run_metadata: record.run_metadata,
      });
    } catch (err) {
      console.warn('[PipelineTracker] Failed to insert run in Supabase:', err);
    }
  }

  // 2. In-Memory Store
  inMemoryRunsStore.set(runId, record);
  return record;
}

/**
 * Completes tracking for an in-flight pipeline run.
 */
export async function completePipelineRun(params: CompleteRunParams): Promise<DbPipelineRun | null> {
  const record = inMemoryRunsStore.get(params.runId);
  const now = new Date().toISOString();

  const startedAtMs = record ? new Date(record.started_at).getTime() : Date.now();
  const durationMs = Date.now() - startedAtMs;

  const updateData = {
    status: params.status,
    completed_at: now,
    duration_ms: durationMs,
    items_found: params.itemsFound ?? record?.items_found ?? 0,
    items_processed: params.itemsProcessed ?? record?.items_processed ?? 0,
    items_published: params.itemsPublished ?? record?.items_published ?? 0,
    items_failed: params.itemsFailed ?? record?.items_failed ?? 0,
    error_count: params.errorCount ?? record?.error_count ?? 0,
    run_metadata: { ...(record?.run_metadata || {}), ...(params.metadata || {}) },
  };

  if (record) {
    Object.assign(record, updateData);
  }

  // Supabase update
  const client = getSupabaseAdmin();
  if (client) {
    try {
      await client
        .from('pipeline_runs')
        .update(updateData)
        .eq('correlation_id', record?.correlation_id || params.runId);
    } catch (err) {
      console.warn('[PipelineTracker] Failed to update run in Supabase:', err);
    }
  }

  return record || null;
}

/**
 * Retrieves recent pipeline runs for audit and dashboard monitoring.
 */
export async function getRecentPipelineRuns(limit: number = 30): Promise<DbPipelineRun[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('pipeline_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as DbPipelineRun[];
      }
    } catch {
      // Fallback
    }
  }

  return Array.from(inMemoryRunsStore.values())
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, limit);
}
