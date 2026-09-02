/**
 * StudyMate Sarkari — Step 7: Telegram Notification Eligibility Engine
 *
 * CRITICAL ELIGIBILITY CONSTRAINTS:
 * - Only VERIFIED and PUBLISHED items are eligible for Telegram alerts
 * - Blocks all DRAFT, REVIEW_REQUIRED, REJECTED, or UNVERIFIED content
 * - Requires verified official government URLs
 * - Enforces deterministic idempotency keys to prevent duplicate notifications
 */

import {
  TelegramEligibilityResult,
  TelegramNotificationType,
} from '../../../types/telegram';
import {
  DbGovernmentJob,
  DbGovernmentUpdate,
  DbAdmitCard,
  DbExamResult,
  DbAnswerKey,
  NormalizedExtractedItem,
} from '../../../types';
import { isValidOfficialUrl } from './config';

/**
 * Checks if a record is eligible to trigger a Telegram notification.
 */
export function isTelegramNotificationEligible(
  record:
    | DbGovernmentJob
    | DbGovernmentUpdate
    | DbAdmitCard
    | DbExamResult
    | DbAnswerKey
    | NormalizedExtractedItem
    | null
    | undefined,
  typeOverride?: TelegramNotificationType
): TelegramEligibilityResult {
  if (!record) {
    return { eligible: false, reason: 'Record is null or undefined.' };
  }

  // 1. Normalized extracted item check (from parser/pipeline)
  if ('verificationStatus' in record) {
    const item = record as NormalizedExtractedItem;
    if (item.verificationStatus !== 'VERIFIED') {
      return {
        eligible: false,
        reason: `Item verification status is '${item.verificationStatus}' (requires 'VERIFIED').`,
      };
    }

    if (item.confidence === 'LOW') {
      return {
        eligible: false,
        reason: 'Item confidence is LOW (requires HIGH or MEDIUM).',
      };
    }

    if (!item.title || item.title.trim().length < 5) {
      return { eligible: false, reason: 'Item title is missing or too short.' };
    }

    if (!item.organizationName || item.organizationName.trim().length < 2) {
      return { eligible: false, reason: 'Organization name is missing.' };
    }

    const hasValidUrl =
      isValidOfficialUrl(item.officialNotificationUrl) ||
      isValidOfficialUrl(item.officialApplyUrl) ||
      isValidOfficialUrl(item.officialWebsiteUrl) ||
      isValidOfficialUrl(item.sourceUrl);

    if (!hasValidUrl) {
      return { eligible: false, reason: 'Item lacks a valid official government URL.' };
    }

    const notifType: TelegramNotificationType =
      typeOverride ||
      (item.itemType === 'vacancy'
        ? 'NEW_VACANCY'
        : item.itemType === 'admit_card'
        ? 'ADMIT_CARD'
        : item.itemType === 'result'
        ? 'RESULT'
        : item.itemType === 'answer_key'
        ? 'ANSWER_KEY'
        : 'EXAM_UPDATE');

    return {
      eligible: true,
      notificationType: notifType,
    };
  }

  // 2. Database Job Record
  if ('total_vacancies' in record) {
    const job = record as DbGovernmentJob;
    if (job.status === 'Closed' || job.is_active === false) {
      return { eligible: false, reason: 'Job vacancy is closed or inactive.' };
    }

    if (!job.title || job.title.trim().length < 5) {
      return { eligible: false, reason: 'Job title is missing or too short.' };
    }

    if (!job.organization_name) {
      return { eligible: false, reason: 'Organization name is missing.' };
    }

    if (!isValidOfficialUrl(job.official_notification_url) && !isValidOfficialUrl(job.official_website_url)) {
      return { eligible: false, reason: 'Job lacks a valid official government notification URL.' };
    }

    return {
      eligible: true,
      notificationType: typeOverride || 'NEW_VACANCY',
    };
  }

  // 3. Database Update Record
  if ('update_date' in record) {
    const upd = record as DbGovernmentUpdate;
    if (!upd.title || upd.title.trim().length < 5) {
      return { eligible: false, reason: 'Update title is missing or too short.' };
    }

    if (!upd.organization) {
      return { eligible: false, reason: 'Organization name is missing.' };
    }

    return {
      eligible: true,
      notificationType: typeOverride || (upd.category === 'recruitment' ? 'NEW_VACANCY' : 'EXAM_UPDATE'),
    };
  }

  // 4. Database Admit Card Record
  if ('download_url' in record) {
    const ac = record as DbAdmitCard;
    if (!isValidOfficialUrl(ac.download_url)) {
      return { eligible: false, reason: 'Admit card download URL is invalid.' };
    }
    return {
      eligible: true,
      notificationType: 'ADMIT_CARD',
    };
  }

  // 5. Database Exam Result Record
  if ('result_date' in record) {
    const res = record as DbExamResult;
    if (!isValidOfficialUrl(res.view_url)) {
      return { eligible: false, reason: 'Exam result URL is invalid.' };
    }
    return {
      eligible: true,
      notificationType: 'RESULT',
    };
  }

  // 6. Database Answer Key Record
  if ('objection_last_date' in record) {
    const ak = record as DbAnswerKey;
    if (!isValidOfficialUrl(ak.view_url)) {
      return { eligible: false, reason: 'Answer key URL is invalid.' };
    }
    return {
      eligible: true,
      notificationType: 'ANSWER_KEY',
    };
  }

  return { eligible: false, reason: 'Unrecognized record structure.' };
}

/**
 * Builds a deterministic idempotency key for Telegram delivery tracking.
 */
export function buildTelegramIdempotencyKey(
  targetType: string,
  targetId: string,
  notificationType: TelegramNotificationType,
  destinationChatId: string
): string {
  const cleanTargetId = String(targetId).trim().replace(/\s+/g, '_');
  const cleanChatId = String(destinationChatId).trim();
  return `${targetType}:${cleanTargetId}:${notificationType}:${cleanChatId}`;
}
