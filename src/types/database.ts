/**
 * Supabase Database Schemas & Row Definitions for StudyMate Sarkari
 * Step 2: Supabase Data Architecture & Website Data Layer
 */

import {
  JobSector,
  CentralCategory,
  JobStatus,
  UpdateCategory,
  ImportantDates,
  ApplicationFee,
  AgeLimit,
} from './index';

export interface DbGovernmentJob {
  id: string;
  slug: string;
  title: string;
  organization_id?: string | null;
  organization_name: string;
  department_or_ministry?: string | null;
  post_name: string;
  sector: JobSector;
  central_category?: CentralCategory | null;
  state_code?: string | null;
  state_name?: string | null;
  total_vacancies: number | string;
  qualification: string[];
  age_limit: AgeLimit;
  application_fee: ApplicationFee;
  important_dates: ImportantDates;
  selection_process: string[];
  salary_or_pay_scale?: string | null;
  status: JobStatus;
  is_active: boolean;
  is_featured?: boolean;
  published_date: string;
  summary: string;
  important_instructions?: string[];
  official_notification_url: string;
  official_apply_url: string;
  official_website_url: string;
  source_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbGovernmentUpdate {
  id: string;
  title: string;
  category: UpdateCategory;
  organization: string;
  update_date: string;
  summary: string;
  link_url?: string | null;
  badge_tag?: string | null;
  is_high_priority?: boolean;
  job_id?: string | null;
  created_at?: string;
}

export interface DbOrganization {
  id: string;
  code: string;
  name: string;
  full_name?: string | null;
  sector: JobSector;
  state_code?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  created_at?: string;
}

export interface DbState {
  code: string;
  name: string;
  slug: string;
  type: 'state' | 'ut';
  capital: string;
  zone: 'Northern' | 'Southern' | 'Eastern' | 'Western' | 'Central' | 'North-Eastern' | 'UT';
  total_active_vacancies_count: number;
  highlight_organizations: string[];
  created_at?: string;
}

export type SourceScope = 'central' | 'state' | 'union_territory' | 'institution';
export type SourceCategory = 'vacancy' | 'admit_card' | 'result' | 'answer_key' | 'exam_update';
export type SourceType = 'html' | 'pdf' | 'rss' | 'api' | 'sitemap';
export type SourcePriority = 'high' | 'medium' | 'low';

export type FetchState =
  | 'SUCCESS_CHANGED'
  | 'SUCCESS_UNCHANGED'
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_URL'
  | 'REDIRECT_REJECTED'
  | 'CONTENT_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'UNSUPPORTED_CONTENT_TYPE';

export interface DbContentSource {
  id: string;
  source_name: string;
  official_url: string;
  recruitment_url?: string | null;
  region?: string | null;
  scope: SourceScope;
  state_code?: string | null;
  category: SourceCategory[];
  source_type: SourceType;
  priority: SourcePriority;
  check_interval_minutes: number;
  active: boolean;
  is_active?: boolean;
  parser_key?: string | null;
  last_checked_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
  content_hash?: string | null;
  etag?: string | null;
  last_modified?: string | null;
  fetch_status?: FetchState | string | null;
  is_fetching?: boolean;
  organization_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbContentFetchLog {
  id: string;
  source_id: string;
  requested_url: string;
  final_url: string;
  fetched_at: string;
  http_status?: number | null;
  success: boolean;
  changed: boolean;
  content_hash?: string | null;
  content_type?: string | null;
  content_length?: number | null;
  etag?: string | null;
  last_modified?: string | null;
  response_time_ms?: number | null;
  attempt_number?: number | null;
  fetch_state: FetchState;
  error_code?: string | null;
  error_message?: string | null;
  created_at?: string;
}

export interface SourceFetchSummary {
  sourceId: string;
  sourceName: string;
  officialUrl: string;
  finalUrl?: string;
  state: FetchState;
  success: boolean;
  changed: boolean;
  httpStatus?: number | null;
  responseTimeMs: number;
  attempts: number;
  contentHash?: string | null;
  contentType?: string | null;
  contentLength?: number | null;
  error?: string | null;
}

export interface FetchBatchResult {
  totalRequested: number;
  totalFetched: number;
  successCount: number;
  changedCount: number;
  unchangedCount: number;
  errorCount: number;
  startTime: string;
  endTime: string;
  durationMs: number;
  results: SourceFetchSummary[];
}

export interface FetchHealthStats {
  status: 'healthy' | 'degraded' | 'error';
  uptimeSeconds: number;
  activeSourcesCount: number;
  dueSourcesCount: number;
  totalFetchLogsCount: number;
  recentSuccessRate: number;
  lastRunAt?: string | null;
  timestamp: string;
}

export interface DbAdmitCard {
  id: string;
  title: string;
  organization: string;
  exam_name: string;
  sector: JobSector;
  state_name?: string | null;
  release_date: string;
  exam_date: string;
  status: 'Available' | 'Expected Soon' | 'Delayed';
  download_url: string;
  instructions?: string | null;
  job_id?: string | null;
  created_at?: string;
}

export interface DbExamResult {
  id: string;
  title: string;
  organization: string;
  exam_name: string;
  sector: JobSector;
  state_name?: string | null;
  result_date: string;
  status: 'Declared' | 'Merit List Out' | 'Cutoff Available';
  view_url: string;
  cut_off_available?: boolean;
  job_id?: string | null;
  created_at?: string;
}

export interface DbAnswerKey {
  id: string;
  title: string;
  organization: string;
  exam_name: string;
  sector: JobSector;
  state_name?: string | null;
  release_date: string;
  objection_last_date?: string | null;
  view_url: string;
  status: 'Final' | 'Provisional';
  job_id?: string | null;
  created_at?: string;
}

export type PublishAction =
  | 'PUBLISHED_NEW'
  | 'UPDATED_EXISTING'
  | 'SKIPPED_UNMODIFIED'
  | 'REJECTED_INELIGIBLE'
  | 'STATUS_EXPIRED';

export type PublishTargetType =
  | 'government_jobs'
  | 'government_updates'
  | 'admit_cards'
  | 'exam_results'
  | 'answer_keys';

export interface DbPublishLog {
  id: string;
  source_id?: string | null;
  parsed_item_id?: string | null;
  target_type: PublishTargetType;
  target_id: string;
  action: PublishAction;
  previous_status?: string | null;
  new_status?: string | null;
  success: boolean;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface PublishItemResult {
  success: boolean;
  action: PublishAction;
  targetType: PublishTargetType;
  targetId: string;
  item?: any;
  error?: string | null;
  reason?: string | null;
}

export interface PublishBatchSummary {
  totalRequested: number;
  totalProcessed: number;
  publishedNewCount: number;
  updatedExistingCount: number;
  skippedCount: number;
  rejectedCount: number;
  errorCount: number;
  startTime: string;
  endTime: string;
  durationMs: number;
  results: PublishItemResult[];
}

export interface DataQualityIssue {
  recordId: string;
  table: string;
  title: string;
  issueType: 'MISSING_TITLE' | 'INVALID_URL' | 'EXPIRED_STATUS_MISMATCH' | 'DUPLICATE_SLUG' | 'INVALID_DATE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  details: string;
  autoFixed?: boolean;
}

export interface DataQualityReport {
  timestamp: string;
  totalRecordsChecked: {
    jobs: number;
    updates: number;
    admitCards: number;
    results: number;
    answerKeys: number;
  };
  totalIssuesFound: number;
  autoFixedCount: number;
  healthScore: number; // 0 to 100
  issues: DataQualityIssue[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isSupabaseSource: boolean;
}

export interface DataFetchOptions {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  sector?: 'all' | 'central' | 'state';
  state?: string;
  centralCategory?: string;
  qualification?: string;
  status?: string;
  sortBy?: 'latest' | 'last_date' | 'vacancies';
}

// ==============================================================================
// NORMALIZED CENTRAL GOVERNMENT JOB PIPELINE SCHEMAS
// ==============================================================================

export interface DbJobRegion {
  id: string;
  code: string;
  name: string;
  slug: string;
  type: 'all_india' | 'state' | 'ut';
  capital?: string | null;
  zone?: string | null;
  total_active_vacancies_count?: number;
  created_at?: string;
}

export interface DbJobCategory {
  id: string;
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at?: string;
}

export interface DbJobCategoryMap {
  job_id: string;
  category_id: string;
}

export interface DbJobSource {
  id: string;
  name: string;
  organization: string;
  region?: string | null;
  source_type: string;
  official_url: string;
  recruitment_url?: string | null;
  category: string[];
  active: boolean;
  last_checked_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ExamUpdateType =
  | 'recruitment'
  | 'exam_notice'
  | 'admit_card'
  | 'result'
  | 'answer_key'
  | 'cutoff'
  | 'selection_list'
  | 'other';

export interface DbExamUpdate {
  id: string;
  title: string;
  update_type: ExamUpdateType;
  organization: string;
  update_date: string;
  summary: string;
  official_url?: string | null;
  link_url?: string | null;
  badge_tag?: string | null;
  is_high_priority?: boolean;
  is_verified?: boolean;
  status?: string;
  job_id?: string | null;
  created_at?: string;
}

export interface DbSourceFetchLog {
  id: string;
  source_id?: string | null;
  requested_url: string;
  final_url: string;
  fetched_at: string;
  http_status?: number | null;
  success: boolean;
  changed: boolean;
  content_hash?: string | null;
  content_type?: string | null;
  content_length?: number | null;
  response_time_ms?: number | null;
  error_code?: string | null;
  error_message?: string | null;
  created_at?: string;
}

export interface DbTelegramNotification {
  id: string;
  job_id?: string | null;
  update_id?: string | null;
  telegram_chat_id: string;
  message_type: string;
  sent_at?: string | null;
  telegram_message_id?: number | null;
  idempotency_key: string;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'SKIPPED_DUPLICATE' | 'SKIPPED_INELIGIBLE' | 'DRY_RUN_SUCCESS' | 'DISABLED';
  created_at?: string;
}
