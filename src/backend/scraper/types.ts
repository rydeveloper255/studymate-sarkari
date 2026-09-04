/**
 * StudyMate Sarkari — Core Scraper Engine Types
 *
 * Defines the contracts for:
 * - Supabase `job_sources` records
 * - Modular Content Fetch Adapters
 * - Scraped recruitment vacancies & notifications
 * - Date cutoff validation (August 1, 2026 threshold)
 * - Engine operational metrics & run summaries
 */

export type SourceType = 'html' | 'pdf' | 'rss' | 'api' | 'json';
export type SourcePriority = 'high' | 'medium' | 'low';
export type SourceRegion = string; // e.g. 'ALL', 'UP', 'BR', 'DL', 'MP', etc.

/**
 * Structure of a row from the Supabase `job_sources` table
 */
export interface JobSourceRecord {
  id: string;
  name: string;
  organization?: string | null;
  region: SourceRegion;
  source_type: SourceType | string;
  official_url: string;
  recruitment_url?: string | null;
  category?: string[] | string | null;
  active: boolean;
  priority?: SourcePriority | string;
  parser_key?: string | null;
  check_interval_minutes?: number;
  last_checked_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
  content_hash?: string | null;
  etag?: string | null;
  last_modified?: string | null;
  fetch_status?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Standard output of a content fetch operation
 */
export interface FetchResult {
  success: boolean;
  url: string;
  statusCode: number;
  contentType: string;
  content: string;
  buffer?: Buffer;
  contentHash: string;
  unchanged?: boolean;
  etag?: string | null;
  lastModified?: string | null;
  durationMs: number;
  error?: string | null;
  adapterName: string;
}

/**
 * Options passed to an adapter during fetch
 */
export interface FetchAdapterOptions {
  timeoutMs?: number;
  maxBytes?: number;
  userAgent?: string;
  conditionalEtag?: string | null;
  conditionalLastModified?: string | null;
  headers?: Record<string, string>;
}

/**
 * Interface for modular content fetching adapters
 */
export interface ContentFetchAdapter {
  readonly name: string;
  readonly supportedTypes: string[];
  canHandle(source: JobSourceRecord): boolean;
  fetch(source: JobSourceRecord, options?: FetchAdapterOptions): Promise<FetchResult>;
}

export type ScrapedNoticeType =
  | 'vacancy'
  | 'pre_vacancy_notice'
  | 'recruitment_notification'
  | 'exam_notification'
  | 'exam_schedule'
  | 'admit_card'
  | 'result'
  | 'answer_key'
  | 'important_update'
  | 'exam_update';

/**
 * Candidate item extracted by an adapter or parser
 */
export interface RawScrapedNotice {
  title: string;
  postName?: string;
  notificationNumber?: string;
  organization?: string;
  department?: string;
  officialNotificationUrl?: string;
  officialApplyUrl?: string;
  publicationDate?: string | null;
  applyStartDate?: string | null;
  applyEndDate?: string | null;
  examDate?: string | null;
  releaseDate?: string | null;
  resultDate?: string | null;
  objectionLastDate?: string | null;
  totalVacancies?: number | string | null;
  qualification?: string | string[] | null;
  ageLimit?: {
    min?: number | null;
    max?: number | null;
    relaxationDetails?: string | null;
  };
  applicationFee?: {
    general?: number | string | null;
    reserved?: number | string | null;
    female?: number | string | null;
    exempted?: boolean;
    paymentMode?: string;
  };
  selectionProcess?: string[] | string | null;
  summary?: string;
  rawHtmlOrText?: string;
  detectedType?: ScrapedNoticeType;
  details?: Record<string, any>;
}

/**
 * Validated scraped government item ready for Supabase persistence
 * (Stored in public.government_content unified master table)
 */
export interface ValidatedScrapedItem {
  id?: string;
  contentType: ScrapedNoticeType;
  itemType: ScrapedNoticeType; // Backwards compatible alias
  sourceId: string;
  sourceName: string;
  title: string;
  slug: string;
  organization: string;
  department?: string | null;
  postName?: string;
  sector: 'central' | 'state' | 'banking' | 'defense' | 'railways' | 'teaching';
  stateCode?: string | null;
  region?: string;
  category: string[];
  publicationDate: string; // ISO format (YYYY-MM-DD), must be >= 2026-08-01
  officialNotificationUrl: string;
  officialApplyUrl?: string | null;
  officialWebsiteUrl: string;
  sourceUrl: string;
  contentHash: string;
  scrapedAt: string;
  isLive: boolean;
  status:
    | 'active'
    | 'upcoming'
    | 'expired'
    | 'closed'
    | 'available'
    | 'declared'
    | 'released'
    | 'final'
    | 'provisional'
    | 'archived'
    | 'Available'
    | 'Expected Soon'
    | 'Delayed'
    | 'Declared'
    | 'Final'
    | 'Provisional';

  // Structured fields for public.government_content
  vacancyCount?: string | number | null;
  totalVacancies?: number | string;
  qualification?: string[];
  ageLimit?: Record<string, any>;
  feeDetails?: Record<string, any>;
  selectionProcess?: string[];
  description?: string;
  details?: Record<string, any>;

  // Vacancy specific fields
  notificationNumber?: string | null;
  applyStartDate?: string | null;
  applyEndDate?: string | null;
  examDate?: string | null;

  // Admit Card specific fields
  examName?: string;
  releaseDate?: string;
  downloadUrl?: string;
  instructions?: string | null;

  // Result specific fields
  resultDate?: string;
  viewUrl?: string;
  cutOffAvailable?: boolean;

  // Answer Key specific fields
  objectionLastDate?: string | null;

  // Update specific fields
  updateType?:
    | 'recruitment'
    | 'pre_vacancy_notice'
    | 'exam_notice'
    | 'exam_notification'
    | 'exam_schedule'
    | 'admit_card'
    | 'result'
    | 'answer_key'
    | 'cutoff'
    | 'selection_list'
    | 'important_update'
    | 'other';
  summary?: string;
}

/**
 * Backwards-compatible alias for ValidatedScrapedItem
 */
export type ValidatedScrapedVacancy = ValidatedScrapedItem;

/**
 * Result of checking date cutoff against 1 August 2026
 */
export interface CutoffCheckResult {
  eligible: boolean;
  cutoffDate: string; // '2026-08-01'
  detectedDate: string | null;
  normalizedDate: string | null;
  reason?: string;
}

/**
 * Configuration options for the Core Scraper Engine
 */
export interface ScraperEngineConfig {
  batchSize?: number;
  concurrency?: number;
  requestTimeoutMs?: number;
  maxContentBytes?: number;
  userAgent?: string;
  dryRun?: boolean;
  forceAll?: boolean;
  dateCutoff?: string; // defaults to '2026-08-01'
}

/**
 * Summary of a complete scraping run across sources
 */
export interface ScraperRunSummary {
  runId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  sourcesEvaluated: number;
  sourcesFetched: number;
  sourcesUnchanged: number;
  sourcesFailed: number;
  itemsDiscovered: number;
  itemsAcceptedCutoff: number; // >= 2026-08-01
  itemsRejectedCutoff: number; // < 2026-08-01
  itemsSaved: number;
  vacanciesSaved?: number;
  admitCardsSaved?: number;
  resultsSaved?: number;
  answerKeysSaved?: number;
  updatesSaved?: number;
  duplicatesSkipped?: number;
  errors: Array<{ sourceId: string; sourceName: string; error: string }>;
}
