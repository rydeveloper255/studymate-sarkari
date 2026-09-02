/**
 * StudyMate Sarkari — Step 8: Automation, Scheduling, Queue & Monitoring Types
 */

import { SourceScope, SourcePriority, DbContentSource } from './database';
import { NormalizedExtractedItem, VerificationStatus } from './parser';

export type PipelineStage =
  | 'FETCH_SOURCES'
  | 'PARSE_CONTENT'
  | 'PUBLISH_VERIFIED'
  | 'TELEGRAM_DISPATCH'
  | 'FULL_PIPELINE'
  | 'RETRY_DEAD_LETTER'
  | 'DATA_QUALITY_CHECK';

export type PipelineRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED';

export type TaskStage = 'FETCH' | 'PARSE' | 'PUBLISH' | 'TELEGRAM';

export type DeadLetterStatus = 'PENDING_RETRY' | 'DEAD_LETTER' | 'RESOLVED' | 'ABANDONED';

export type SourceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'FAILING' | 'DISABLED';

export interface DbPipelineRun {
  id: string;
  pipeline_name: string;
  stage: PipelineStage;
  status: PipelineRunStatus;
  correlation_id: string;
  started_at: string;
  completed_at?: string | null;
  duration_ms?: number | null;
  items_found: number;
  items_processed: number;
  items_published: number;
  items_failed: number;
  error_count: number;
  run_metadata: Record<string, any>;
  created_at: string;
}

export interface DbDeadLetterTask {
  id: string;
  source_id?: string | null;
  pipeline_stage: TaskStage;
  run_id: string;
  task_payload: Record<string, any>;
  attempt_count: number;
  max_retries: number;
  error_code: string;
  safe_error_message: string;
  is_permanent: boolean;
  first_failed_at: string;
  last_failed_at: string;
  next_retry_at?: string | null;
  resolved_at?: string | null;
  status: DeadLetterStatus;
  created_at: string;
}

export interface DbDistributedLock {
  lock_key: string;
  lock_token: string;
  locked_at: string;
  expires_at: string;
  metadata?: Record<string, any>;
}

export interface LockAcquireOptions {
  ttlMs?: number;
  token?: string;
  owner?: string;
}

export interface RetryPolicyOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
}

export interface SourceHealthReport {
  sourceId: string;
  sourceName: string;
  officialUrl: string;
  scope: SourceScope;
  priority: SourcePriority;
  active: boolean;
  healthStatus: SourceHealthStatus;
  consecutiveFailures: number;
  lastCheckedAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  successRate24h?: number;
}

export interface OrchestrationRunOptions {
  correlationId?: string;
  sourceIds?: string[];
  limit?: number;
  scope?: SourceScope;
  stateCode?: string;
  priority?: SourcePriority;
  forceAll?: boolean;
  concurrency?: number;
  timeoutMs?: number;
  maxRetries?: number;
  skipTelegram?: boolean;
  dryRunTelegram?: boolean;
}

export interface PipelineStageResult {
  stage: TaskStage;
  success: boolean;
  itemsIn: number;
  itemsOut: number;
  errors: string[];
  durationMs: number;
}

export interface OrchestratorRunSummary {
  runId: string;
  correlationId: string;
  pipelineName: string;
  status: PipelineRunStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  sourcesEvaluated: number;
  sourcesFetched: number;
  sourcesChanged: number;
  itemsParsed: number;
  itemsVerified: number;
  itemsPublished: number;
  telegramSent: number;
  telegramSkipped: number;
  telegramFailed: number;
  deadLetterCount: number;
  stageResults: Record<string, PipelineStageResult>;
  errors: Array<{ stage: string; sourceId?: string; message: string }>;
}

export interface SystemHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  components: {
    database: { status: 'ok' | 'degraded' | 'down'; latencyMs?: number };
    scheduler: { status: 'configured' | 'active' | 'inactive'; lastRunAt?: string | null };
    fetcher: { status: 'ok' | 'degraded'; concurrency: number; activeLocks: number };
    parser: { status: 'ok'; registeredAdapters: number };
    publisher: { status: 'ok'; autoExpireEnabled: boolean };
    telegram: { status: 'configured' | 'dry_run' | 'disabled'; enabled: boolean };
  };
  metrics: {
    totalSources: number;
    activeSources: number;
    dueSources: number;
    healthySources: number;
    degradedSources: number;
    failingSources: number;
    pendingRetries: number;
    deadLetters: number;
  };
}

export interface OperationalAlertRule {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  condition: string;
  active: boolean;
  description: string;
  suggestedAction: string;
}

export interface OperationalAlert {
  ruleId: string;
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  sourceId?: string;
  triggeredAt: string;
  details: Record<string, any>;
  suggestedAction: string;
}
