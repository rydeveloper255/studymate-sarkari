/**
 * StudyMate Sarkari — Step 6: Verified Data Publishing Eligibility Engine
 *
 * CRITICAL QUALITY CONSTRAINTS:
 * - Only VERIFIED and confident items can be published
 * - Never publish DRAFT, PENDING_REVIEW, REJECTED, CONFLICT_REVIEW_REQUIRED, or LOW-confidence content
 * - Missing optional fields (e.g. fee, exact age limit, vacancy count) do NOT block publishing if not provided by source
 * - Never invent or hallucinate missing data
 */

import {
  NormalizedExtractedItem,
  DbParsedContentItem,
  VerificationStatus,
  ExtractionConfidence,
} from '../../../types';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

/**
 * Checks whether a parsed item is strictly eligible for publishing as a live government job.
 */
export function isPublishableJob(
  item: NormalizedExtractedItem | DbParsedContentItem
): EligibilityResult {
  // Support both direct NormalizedExtractedItem and DbParsedContentItem
  const payload: NormalizedExtractedItem =
    'normalized_payload' in item ? item.normalized_payload : item;

  const status: VerificationStatus =
    'verification_status' in item ? item.verification_status : payload.verificationStatus;

  const confidence: ExtractionConfidence =
    'confidence' in item ? item.confidence : payload.confidence;

  // 1. Verification status check
  if (status !== 'VERIFIED' && status !== 'PUBLISHED') {
    return {
      eligible: false,
      reason: `Item verification status is '${status}'. Only 'VERIFIED' items can be published.`,
    };
  }

  // 2. Confidence threshold check
  if (confidence === 'LOW') {
    return {
      eligible: false,
      reason: 'Confidence is LOW. Items with LOW confidence require manual review before publishing.',
    };
  }

  // 3. Item type check
  if (payload.itemType !== 'vacancy') {
    return {
      eligible: false,
      reason: `Expected itemType 'vacancy', received '${payload.itemType}'.`,
    };
  }

  // 4. Mandatory fields validation
  if (!payload.title || payload.title.trim().length < 5) {
    return {
      eligible: false,
      reason: 'Job title is missing or less than 5 characters.',
    };
  }

  if (!payload.organizationName || payload.organizationName.trim().length < 2) {
    return {
      eligible: false,
      reason: 'Organization name is missing or invalid.',
    };
  }

  if (!payload.officialWebsiteUrl && !payload.officialNotificationUrl) {
    return {
      eligible: false,
      reason: 'Official URL (notification or website) is missing.',
    };
  }

  const primaryUrl = payload.officialNotificationUrl || payload.officialWebsiteUrl;
  if (!primaryUrl.startsWith('http://') && !primaryUrl.startsWith('https://')) {
    return {
      eligible: false,
      reason: `Invalid URL protocol: ${primaryUrl}`,
    };
  }

  if (!payload.deduplicationKey || payload.deduplicationKey.trim().length < 5) {
    return {
      eligible: false,
      reason: 'Deduplication key is missing.',
    };
  }

  return { eligible: true };
}

/**
 * Checks whether a parsed item is eligible for publishing as a live government recruitment update, admit card, result, or answer key.
 */
export function isPublishableUpdate(
  item: NormalizedExtractedItem | DbParsedContentItem
): EligibilityResult {
  const payload: NormalizedExtractedItem =
    'normalized_payload' in item ? item.normalized_payload : item;

  const status: VerificationStatus =
    'verification_status' in item ? item.verification_status : payload.verificationStatus;

  const confidence: ExtractionConfidence =
    'confidence' in item ? item.confidence : payload.confidence;

  // 1. Verification status check
  if (status !== 'VERIFIED' && status !== 'PUBLISHED') {
    return {
      eligible: false,
      reason: `Item verification status is '${status}'. Only 'VERIFIED' items can be published.`,
    };
  }

  // 2. Confidence threshold check
  if (confidence === 'LOW') {
    return {
      eligible: false,
      reason: 'Confidence is LOW. Items with LOW confidence require manual review before publishing.',
    };
  }

  // 3. Valid update types
  const validTypes = ['admit_card', 'result', 'answer_key', 'exam_update', 'vacancy', 'other'];
  if (!validTypes.includes(payload.itemType)) {
    return {
      eligible: false,
      reason: `Invalid itemType '${payload.itemType}' for update publishing.`,
    };
  }

  // 4. Mandatory fields validation
  if (!payload.title || payload.title.trim().length < 5) {
    return {
      eligible: false,
      reason: 'Update title is missing or too short.',
    };
  }

  if (!payload.organizationName || payload.organizationName.trim().length < 2) {
    return {
      eligible: false,
      reason: 'Organization name is missing or invalid.',
    };
  }

  if (!payload.officialNotificationUrl && !payload.officialWebsiteUrl && !payload.sourceUrl) {
    return {
      eligible: false,
      reason: 'No official or source URL provided.',
    };
  }

  return { eligible: true };
}
