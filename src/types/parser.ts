/**
 * StudyMate Sarkari — Step 5: Parsing, Normalization, Verification & Deduplication Types
 */

import {
  JobSector,
  CentralCategory,
  SourceScope,
  SourceType,
  AgeLimit,
  ApplicationFee,
  ImportantDates,
} from './index';

export type ParsedItemType =
  | 'vacancy'
  | 'admit_card'
  | 'result'
  | 'answer_key'
  | 'exam_update'
  | 'other';

export type ExtractionConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type VerificationStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'PUBLISHED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'CONFLICT_REVIEW_REQUIRED'
  | 'ORGANIZATION_REVIEW_REQUIRED'
  | 'PARSER_REQUIRED';

export interface ExtractionEvidence {
  vacancyTextSnippet?: string | null;
  dateTextSnippet?: string | null;
  feeTextSnippet?: string | null;
  qualificationSnippet?: string | null;
  ageSnippet?: string | null;
  noticeNumberSnippet?: string | null;
  rawMatchedKeywords?: string[];
}

export interface RawExtractedItem {
  rawTitle: string;
  rawOrganization?: string | null;
  rawPostName?: string | null;
  rawNotificationNumber?: string | null;
  rawTotalVacancies?: string | null;
  rawQualification?: string | string[] | null;
  rawAgeLimit?: string | null;
  rawDates?: {
    notificationDate?: string | null;
    applyStartDate?: string | null;
    applyEndDate?: string | null;
    examDate?: string | null;
    admitCardDate?: string | null;
    resultDate?: string | null;
  };
  rawFee?: string | null;
  rawSelectionProcess?: string | string[] | null;
  rawSummary?: string | null;
  rawNotificationUrl?: string | null;
  rawApplyUrl?: string | null;
  rawSourceUrl?: string | null;
  detectedType?: ParsedItemType;
  evidence?: ExtractionEvidence;
}

export interface NormalizedExtractedItem {
  id?: string;
  itemType: ParsedItemType;
  title: string;
  slug: string;
  postName: string;
  organizationId?: string | null;
  organizationCode?: string | null;
  organizationName: string;
  departmentOrMinistry?: string | null;
  sector: JobSector;
  centralCategory?: CentralCategory | null;
  stateCode?: string | null;
  stateName?: string | null;
  scope: SourceScope;
  notificationNumber?: string | null;
  totalVacancies: number | string;
  qualification: string[];
  ageLimit: AgeLimit;
  applicationFee: ApplicationFee;
  importantDates: ImportantDates;
  selectionProcess: string[];
  salaryOrPayScale?: string | null;
  summary: string;
  importantInstructions?: string[];
  officialNotificationUrl: string;
  officialApplyUrl: string;
  officialWebsiteUrl: string;
  sourceUrl: string;
  sourceId: string;
  contentHash: string;
  deduplicationKey: string;
  confidence: ExtractionConfidence;
  verificationStatus: VerificationStatus;
  evidence: ExtractionEvidence;
  parserKey: string;
  parsedAt: string;
}

export interface ParserInput {
  sourceId: string;
  sourceName: string;
  officialUrl: string;
  finalUrl?: string;
  sourceType: SourceType;
  scope: SourceScope;
  stateCode?: string | null;
  parserKey?: string | null;
  content: string;
  contentType?: string;
  contentHash: string;
  fetchLogId?: string;
}

export interface ParserResult {
  success: boolean;
  parserKey: string;
  items: RawExtractedItem[];
  warnings?: string[];
  error?: string | null;
  errorCode?: string | null;
}

export interface SourceParser {
  name: string;
  parserKey: string;
  canHandle(input: ParserInput): boolean;
  parse(input: ParserInput): Promise<ParserResult>;
}

export interface DbParsedContentItem {
  id: string;
  source_id: string;
  fetch_log_id?: string | null;
  content_hash: string;
  item_type: ParsedItemType;
  title: string;
  normalized_payload: NormalizedExtractedItem;
  confidence: ExtractionConfidence;
  verification_status: VerificationStatus;
  deduplication_key: string;
  parser_key: string;
  official_url: string;
  official_notification_url?: string | null;
  official_apply_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbContentParseLog {
  id: string;
  source_id: string;
  fetch_log_id?: string | null;
  content_hash: string;
  parser_key: string;
  started_at: string;
  completed_at: string;
  success: boolean;
  item_count: number;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface PipelineExecutionSummary {
  sourceId: string;
  sourceName: string;
  success: boolean;
  parserKey: string;
  rawItemCount: number;
  normalizedItemCount: number;
  storedItemCount: number;
  duplicateCount: number;
  confidenceBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  statusBreakdown: Record<string, number>;
  items: NormalizedExtractedItem[];
  errors?: string[];
  durationMs: number;
}
