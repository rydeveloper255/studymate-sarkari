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
  totalVacancies?: number | string | null;
  qualification?: string | string[] | null;
  ageLimit?: {
    min?: number | null;
    max?: number | null;
    relaxationDetails?: string | null;
  };
  applicationFee?: {
    general?: number | null;
    reserved?: number | null;
    female?: number | null;
    exempted?: boolean;
  };
  summary?: string;
  rawHtmlOrText?: string;
  detectedType?: 'vacancy' | 'admit_card' | 'result' | 'answer_key' | 'exam_update';
}

/**
 * Validated scraped vacancy record ready for Supabase persistence
 */
export interface ValidatedScrapedVacancy {
  id?: string;
  sourceId: string;
  sourceName: string;
  title: string;
  slug: string;
  postName: string;
  organization: string;
  sector: 'central' | 'state' | 'banking' | 'defense' | 'railways' | 'teaching';
  stateCode?: string | null;
  category: string[];
  notificationNumber?: string | null;
  publicationDate: string; // ISO format (YYYY-MM-DD), must be >= 2026-08-01
  applyStartDate?: string | null;
  applyEndDate?: string | null;
  examDate?: string | null;
  totalVacancies: number | string;
  qualification: string[];
  officialNotificationUrl: string;
  officialApplyUrl?: string | null;
  officialWebsiteUrl: string;
  contentHash: string;
  isLive: boolean; // true if applyStartDate <= NOW <= applyEndDate
  status: 'active' | 'upcoming' | 'closed' | 'archived';
  scrapedAt: string;
}

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
  errors: Array<{ sourceId: string; sourceName: string; error: string }>;
}
