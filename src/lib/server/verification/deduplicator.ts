/**
 * StudyMate Sarkari — Step 5: Deterministic Deduplication & Versioning Engine
 */

import { NormalizedExtractedItem, VerificationStatus } from '../../../types/parser';
import crypto from 'crypto';

export type DeduplicationRelation =
  | 'NEW_ITEM'
  | 'IDENTICAL_DUPLICATE'
  | 'UPDATED_VERSION'
  | 'CONFLICT_REVIEW_REQUIRED';

export interface DeduplicationComparisonResult {
  relation: DeduplicationRelation;
  existingItemId?: string;
  differences?: string[];
  recommendedStatus: VerificationStatus;
  notes?: string;
}

/**
 * Generates a deterministic deduplication key for a recruitment notice or update.
 */
export function generateDeduplicationKey(params: {
  orgCode: string;
  itemType: string;
  notificationNumber?: string | null;
  slug: string;
  year?: string | number;
  officialNotificationUrl?: string | null;
}): string {
  const org = (params.orgCode || 'GOV').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const type = (params.itemType || 'vacancy').toLowerCase();

  // 1. Highest priority: official notification number if available (e.g., "05/2026-ENGG")
  if (params.notificationNumber && params.notificationNumber.trim().length >= 3) {
    const cleanNotif = params.notificationNumber
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .slice(0, 30);
    return `${org}:${type}:notif:${cleanNotif}`;
  }

  // 2. Secondary: Organization + Slug + Year (e.g., "UPSC:civil-services-examination:2026")
  const currentYear = params.year || new Date().getFullYear();
  const cleanSlug = params.slug.replace(/[^a-z0-9-]/g, '').slice(0, 50);

  if (cleanSlug) {
    return `${org}:${type}:${cleanSlug}:${currentYear}`;
  }

  // 3. Fallback: Hash of canonical URL
  const hash = crypto
    .createHash('sha256')
    .update(params.officialNotificationUrl || `${org}-${type}-${Date.now()}`)
    .digest('hex')
    .slice(0, 16);

  return `${org}:${type}:url:${hash}`;
}

/**
 * Compares an incoming normalized item against existing stored records.
 */
export function compareWithExistingRecords(
  incomingItem: NormalizedExtractedItem,
  existingItems: NormalizedExtractedItem[]
): DeduplicationComparisonResult {
  const matched = existingItems.find(
    (item) => item.deduplicationKey === incomingItem.deduplicationKey
  );

  if (!matched) {
    return {
      relation: 'NEW_ITEM',
      recommendedStatus: incomingItem.verificationStatus,
      notes: 'No previous record found with matching deduplication key',
    };
  }

  const diffs: string[] = [];

  // Check identical content hash
  if (matched.contentHash === incomingItem.contentHash) {
    return {
      relation: 'IDENTICAL_DUPLICATE',
      existingItemId: matched.id,
      recommendedStatus: matched.verificationStatus,
      notes: 'Exact match on deduplication key and content hash. Skipped redundant processing.',
    };
  }

  // Check field level changes (e.g. extension of application dates, updated vacancy count)
  if (matched.importantDates.applyEndDate !== incomingItem.importantDates.applyEndDate) {
    diffs.push(
      `Apply End Date changed: "${matched.importantDates.applyEndDate}" -> "${incomingItem.importantDates.applyEndDate}"`
    );
  }

  if (String(matched.totalVacancies) !== String(incomingItem.totalVacancies)) {
    diffs.push(
      `Total Vacancies changed: "${matched.totalVacancies}" -> "${incomingItem.totalVacancies}"`
    );
  }

  if (matched.officialNotificationUrl !== incomingItem.officialNotificationUrl) {
    diffs.push(`Notification URL updated`);
  }

  // Detect conflict vs benign update
  if (
    matched.organizationName !== incomingItem.organizationName &&
    matched.organizationCode !== incomingItem.organizationCode
  ) {
    return {
      relation: 'CONFLICT_REVIEW_REQUIRED',
      existingItemId: matched.id,
      differences: diffs,
      recommendedStatus: 'CONFLICT_REVIEW_REQUIRED',
      notes: 'Organization mismatch between records sharing deduplication key',
    };
  }

  return {
    relation: 'UPDATED_VERSION',
    existingItemId: matched.id,
    differences: diffs,
    recommendedStatus: 'PENDING_REVIEW',
    notes: `Recruitment notice updated with ${diffs.length} field change(s)`,
  };
}
