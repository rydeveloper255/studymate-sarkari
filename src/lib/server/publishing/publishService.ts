/**
 * StudyMate Sarkari — Step 6: Verified Data Publishing & Website Synchronization Pipeline
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - Moves verified items from parsed_content_items into live government_jobs / government_updates tables
 * - Bounded batch execution (10-50 records)
 * - Safe idempotency & deduplication
 * - Deterministic application status calculation (Active, Closing Soon, Upcoming, Closed)
 * - Comprehensive publishing audit logging
 * - Live data quality check & expiration transitions
 */

import {
  NormalizedExtractedItem,
  DbParsedContentItem,
  DbGovernmentJob,
  DbGovernmentUpdate,
  DbAdmitCard,
  DbExamResult,
  DbAnswerKey,
  PublishItemResult,
  PublishBatchSummary,
  DataQualityReport,
  DataQualityIssue,
  ParsedItemType,
} from '../../../types';
import { isPublishableJob, isPublishableUpdate } from './publishEligibility';
import { deriveDeterministicJobStatus } from '../../utils/jobStatus';
import {
  findExistingJob,
  upsertPublishedJob,
  upsertPublishedUpdate,
  upsertPublishedAdmitCard,
  upsertPublishedResult,
  upsertPublishedAnswerKey,
  savePublishLog,
  updateParsedItemStatus,
  getParsedItems,
  getAllJobsForAdmin,
  updateJobStatus,
} from '../supabaseAdmin';
import { getTelegramService } from '../telegram';
import { serverCache } from '../cache/publicCache';

/**
 * Publishes a single verified parsed item into the public live tables.
 */
export async function publishParsedItem(
  item: NormalizedExtractedItem | DbParsedContentItem,
  options: { force?: boolean } = {}
): Promise<PublishItemResult> {
  const payload: NormalizedExtractedItem =
    'normalized_payload' in item ? item.normalized_payload : item;
  const parsedItemId = 'id' in item && typeof item.id === 'string' ? item.id : undefined;

  // 1. Eligibility Check
  if (payload.itemType === 'vacancy') {
    const check = isPublishableJob(item);
    if (!check.eligible && !options.force) {
      await savePublishLog({
        source_id: payload.sourceId,
        parsed_item_id: parsedItemId,
        target_type: 'government_jobs',
        target_id: payload.slug || payload.deduplicationKey,
        action: 'REJECTED_INELIGIBLE',
        previous_status: payload.verificationStatus,
        new_status: payload.verificationStatus,
        success: false,
        error_code: 'INELIGIBLE_FOR_PUBLISHING',
        error_message: check.reason,
      });

      return {
        success: false,
        action: 'REJECTED_INELIGIBLE',
        targetType: 'government_jobs',
        targetId: payload.slug || payload.deduplicationKey,
        error: check.reason,
        reason: check.reason,
      };
    }

    return publishVacancyItem(payload, parsedItemId);
  }

  // Handle admit cards, results, answer keys, and updates
  const updateCheck = isPublishableUpdate(item);
  if (!updateCheck.eligible && !options.force) {
    await savePublishLog({
      source_id: payload.sourceId,
      parsed_item_id: parsedItemId,
      target_type: 'government_updates',
      target_id: payload.slug || payload.deduplicationKey,
      action: 'REJECTED_INELIGIBLE',
      previous_status: payload.verificationStatus,
      new_status: payload.verificationStatus,
      success: false,
      error_code: 'INELIGIBLE_FOR_PUBLISHING',
      error_message: updateCheck.reason,
    });

    return {
      success: false,
      action: 'REJECTED_INELIGIBLE',
      targetType: 'government_updates',
      targetId: payload.slug || payload.deduplicationKey,
      error: updateCheck.reason,
      reason: updateCheck.reason,
    };
  }

  switch (payload.itemType) {
    case 'admit_card':
      return publishAdmitCardItem(payload, parsedItemId);
    case 'result':
      return publishResultItem(payload, parsedItemId);
    case 'answer_key':
      return publishAnswerKeyItem(payload, parsedItemId);
    case 'exam_update':
    case 'other':
    default:
      return publishGeneralUpdateItem(payload, parsedItemId);
  }
}

/**
 * Publishes or updates a vacancy item in government_jobs.
 */
async function publishVacancyItem(
  payload: NormalizedExtractedItem,
  parsedItemId?: string
): Promise<PublishItemResult> {
  const existing = await findExistingJob(
    payload.slug,
    payload.title,
    payload.organizationName
  );

  const status = deriveDeterministicJobStatus(payload.importantDates, 'Active');

  const dbJob: DbGovernmentJob = {
    id: existing?.id || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    slug: payload.slug || `job-${Date.now()}`,
    title: payload.title,
    organization_id: payload.organizationId || null,
    organization_name: payload.organizationName,
    department_or_ministry: payload.departmentOrMinistry || null,
    post_name: payload.postName || payload.title,
    sector: payload.sector,
    central_category: payload.centralCategory || null,
    state_code: payload.stateCode || null,
    state_name: payload.stateName || null,
    total_vacancies: payload.totalVacancies || 'Refer Notification',
    qualification: Array.isArray(payload.qualification) && payload.qualification.length > 0
      ? payload.qualification
      : ['Refer to official notification for eligibility details.'],
    age_limit: payload.ageLimit || { minAge: 18, maxAge: 35 },
    application_fee: payload.applicationFee || {
      general: 'As per notification',
      scStPh: 'Exempted / As per rules',
      paymentMode: 'Online',
    },
    important_dates: payload.importantDates || {
      notificationDate: new Date().toISOString().split('T')[0],
      applyStartDate: new Date().toISOString().split('T')[0],
      applyEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    },
    selection_process: Array.isArray(payload.selectionProcess) && payload.selectionProcess.length > 0
      ? payload.selectionProcess
      : ['Written / CBT Examination', 'Document Verification & Medical Check'],
    salary_or_pay_scale: payload.salaryOrPayScale || null,
    status,
    is_active: status !== 'Closed',
    is_featured: false,
    published_date: payload.parsedAt ? payload.parsedAt.split('T')[0] : new Date().toISOString().split('T')[0],
    summary: payload.summary || `${payload.organizationName} invites online applications for ${payload.postName}.`,
    important_instructions: payload.importantInstructions || [
      'Read official notification carefully before applying online.',
      'Ensure all required certificates and photos are uploaded in prescribed format.',
    ],
    official_notification_url: payload.officialNotificationUrl || payload.officialWebsiteUrl,
    official_apply_url: payload.officialApplyUrl || payload.officialNotificationUrl || payload.officialWebsiteUrl,
    official_website_url: payload.officialWebsiteUrl || payload.officialNotificationUrl,
    source_url: payload.sourceUrl || null,
  };

  const action = existing ? 'UPDATED_EXISTING' : 'PUBLISHED_NEW';
  const saved = await upsertPublishedJob(dbJob);

  // Synchronize a brief update notice in government_updates as well
  await upsertPublishedUpdate({
    id: `upd_${saved.id}`,
    title: `New Recruitment: ${saved.title}`,
    category: 'recruitment',
    organization: saved.organization_name,
    update_date: saved.published_date,
    summary: saved.summary || `Recruitment announced for ${saved.post_name} (${saved.total_vacancies} posts).`,
    link_url: `/jobs/${saved.slug}`,
    badge_tag: 'Recruitment',
    is_high_priority: saved.sector === 'central',
    job_id: saved.id,
  });

  // Mark parsed item status as PUBLISHED if DB item ID is known
  if (parsedItemId) {
    await updateParsedItemStatus(parsedItemId, 'PUBLISHED');
  }

  // Audit log
  await savePublishLog({
    source_id: payload.sourceId,
    parsed_item_id: parsedItemId,
    target_type: 'government_jobs',
    target_id: saved.id,
    action,
    previous_status: existing?.status || 'VERIFIED',
    new_status: saved.status,
    success: true,
  });

  // Step 7: Non-blocking Telegram alert for new publication
  if (action === 'PUBLISHED_NEW') {
    getTelegramService()
      .handlePublishedItem(saved)
      .catch((err) => console.warn('[Telegram Service] Background notification dispatch error:', err));
  }

  // Invalidate public caches and sitemap
  serverCache.invalidateTag('jobs');
  serverCache.invalidateTag('sitemap');

  return {
    success: true,
    action,
    targetType: 'government_jobs',
    targetId: saved.id,
    item: saved,
  };
}

/**
 * Publishes an admit card item.
 */
async function publishAdmitCardItem(
  payload: NormalizedExtractedItem,
  parsedItemId?: string
): Promise<PublishItemResult> {
  const cardId = `ac_${payload.deduplicationKey.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_')}`;
  const dbCard: DbAdmitCard = {
    id: cardId,
    title: payload.title,
    organization: payload.organizationName,
    exam_name: payload.postName || payload.title,
    sector: payload.sector,
    state_name: payload.stateName || null,
    release_date: payload.importantDates?.admitCardDate || new Date().toISOString().split('T')[0],
    exam_date: payload.importantDates?.examDate || 'Refer to Admit Card',
    status: 'Available',
    download_url: payload.officialApplyUrl || payload.officialNotificationUrl || payload.officialWebsiteUrl,
    instructions: payload.summary || 'Download and print admit card. Carry original ID proof to examination hall.',
    job_id: null,
  };

  const saved = await upsertPublishedAdmitCard(dbCard);

  // Sync alert
  await upsertPublishedUpdate({
    id: `upd_${saved.id}`,
    title: `Admit Card Released: ${saved.title}`,
    category: 'admit_card',
    organization: saved.organization,
    update_date: saved.release_date,
    summary: `Admit card available for ${saved.exam_name}. Download from official portal.`,
    link_url: `/admit-cards`,
    badge_tag: 'Admit Card Out',
    is_high_priority: true,
    job_id: null,
  });

  if (parsedItemId) {
    await updateParsedItemStatus(parsedItemId, 'PUBLISHED');
  }

  await savePublishLog({
    source_id: payload.sourceId,
    parsed_item_id: parsedItemId,
    target_type: 'admit_cards',
    target_id: saved.id,
    action: 'PUBLISHED_NEW',
    previous_status: 'VERIFIED',
    new_status: 'Available',
    success: true,
  });

  // Step 7: Non-blocking Telegram alert
  getTelegramService()
    .handlePublishedItem(saved)
    .catch((err) => console.warn('[Telegram Service] Admit card alert error:', err));

  return {
    success: true,
    action: 'PUBLISHED_NEW',
    targetType: 'admit_cards',
    targetId: saved.id,
    item: saved,
  };
}

/**
 * Publishes an exam result item.
 */
async function publishResultItem(
  payload: NormalizedExtractedItem,
  parsedItemId?: string
): Promise<PublishItemResult> {
  const resultId = `res_${payload.deduplicationKey.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_')}`;
  const dbResult: DbExamResult = {
    id: resultId,
    title: payload.title,
    organization: payload.organizationName,
    exam_name: payload.postName || payload.title,
    sector: payload.sector,
    state_name: payload.stateName || null,
    result_date: payload.importantDates?.examDate || payload.importantDates?.notificationDate || new Date().toISOString().split('T')[0],
    status: 'Declared',
    view_url: payload.officialNotificationUrl || payload.officialWebsiteUrl,
    cut_off_available: true,
    job_id: null,
  };

  const saved = await upsertPublishedResult(dbResult);

  // Sync alert
  await upsertPublishedUpdate({
    id: `upd_${saved.id}`,
    title: `Result Declared: ${saved.title}`,
    category: 'result',
    organization: saved.organization,
    update_date: saved.result_date,
    summary: `Results declared for ${saved.exam_name}. Merit list and cutoffs available on official portal.`,
    link_url: `/results`,
    badge_tag: 'Result Out',
    is_high_priority: true,
    job_id: null,
  });

  if (parsedItemId) {
    await updateParsedItemStatus(parsedItemId, 'PUBLISHED');
  }

  await savePublishLog({
    source_id: payload.sourceId,
    parsed_item_id: parsedItemId,
    target_type: 'exam_results',
    target_id: saved.id,
    action: 'PUBLISHED_NEW',
    previous_status: 'VERIFIED',
    new_status: 'Declared',
    success: true,
  });

  // Step 7: Non-blocking Telegram alert
  getTelegramService()
    .handlePublishedItem(saved)
    .catch((err) => console.warn('[Telegram Service] Exam result alert error:', err));

  return {
    success: true,
    action: 'PUBLISHED_NEW',
    targetType: 'exam_results',
    targetId: saved.id,
    item: saved,
  };
}

/**
 * Publishes an answer key item.
 */
async function publishAnswerKeyItem(
  payload: NormalizedExtractedItem,
  parsedItemId?: string
): Promise<PublishItemResult> {
  const keyId = `ak_${payload.deduplicationKey.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_')}`;
  const dbKey: DbAnswerKey = {
    id: keyId,
    title: payload.title,
    organization: payload.organizationName,
    exam_name: payload.postName || payload.title,
    sector: payload.sector,
    state_name: payload.stateName || null,
    release_date: new Date().toISOString().split('T')[0],
    objection_last_date: null,
    view_url: payload.officialNotificationUrl || payload.officialWebsiteUrl,
    status: 'Final',
    job_id: null,
  };

  const saved = await upsertPublishedAnswerKey(dbKey);

  // Sync alert
  await upsertPublishedUpdate({
    id: `upd_${saved.id}`,
    title: `Answer Key Out: ${saved.title}`,
    category: 'answer_key',
    organization: saved.organization,
    update_date: saved.release_date,
    summary: `Answer key released for ${saved.exam_name}. Check official answers.`,
    link_url: `/answer-keys`,
    badge_tag: 'Answer Key',
    is_high_priority: false,
    job_id: null,
  });

  if (parsedItemId) {
    await updateParsedItemStatus(parsedItemId, 'PUBLISHED');
  }

  await savePublishLog({
    source_id: payload.sourceId,
    parsed_item_id: parsedItemId,
    target_type: 'answer_keys',
    target_id: saved.id,
    action: 'PUBLISHED_NEW',
    previous_status: 'VERIFIED',
    new_status: 'Final',
    success: true,
  });

  // Step 7: Non-blocking Telegram alert
  getTelegramService()
    .handlePublishedItem(saved)
    .catch((err) => console.warn('[Telegram Service] Answer key alert error:', err));

  return {
    success: true,
    action: 'PUBLISHED_NEW',
    targetType: 'answer_keys',
    targetId: saved.id,
    item: saved,
  };
}

/**
 * Publishes a general update or exam update.
 */
async function publishGeneralUpdateItem(
  payload: NormalizedExtractedItem,
  parsedItemId?: string
): Promise<PublishItemResult> {
  const updId = `upd_${payload.deduplicationKey.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_')}`;
  const dbUpdate: DbGovernmentUpdate = {
    id: updId,
    title: payload.title,
    category: payload.itemType === 'exam_update' ? 'exam_update' : 'recruitment',
    organization: payload.organizationName,
    update_date: new Date().toISOString().split('T')[0],
    summary: payload.summary || `${payload.organizationName} has issued official notice: ${payload.title}`,
    link_url: payload.officialNotificationUrl || payload.officialWebsiteUrl || payload.sourceUrl,
    badge_tag: 'Official Notice',
    is_high_priority: payload.sector === 'central',
    job_id: null,
  };

  const saved = await upsertPublishedUpdate(dbUpdate);

  if (parsedItemId) {
    await updateParsedItemStatus(parsedItemId, 'PUBLISHED');
  }

  await savePublishLog({
    source_id: payload.sourceId,
    parsed_item_id: parsedItemId,
    target_type: 'government_updates',
    target_id: saved.id,
    action: 'PUBLISHED_NEW',
    previous_status: 'VERIFIED',
    new_status: 'Published',
    success: true,
  });

  // Step 7: Non-blocking Telegram alert
  getTelegramService()
    .handlePublishedItem(saved)
    .catch((err) => console.warn('[Telegram Service] General update alert error:', err));

  return {
    success: true,
    action: 'PUBLISHED_NEW',
    targetType: 'government_updates',
    targetId: saved.id,
    item: saved,
  };
}

/**
 * Bounded Batch Publishing of verified parsed items (10 to 50 records max).
 */
export async function batchPublishVerifiedItems(options: {
  batchSize?: number;
  sourceId?: string;
  itemType?: ParsedItemType;
  force?: boolean;
} = {}): Promise<PublishBatchSummary> {
  const startTime = new Date().toISOString();
  const startMs = Date.now();
  const batchSize = Math.max(1, Math.min(options.batchSize || 25, 50));

  // Retrieve VERIFIED items
  let candidates = await getParsedItems({
    status: 'VERIFIED',
    itemType: options.itemType,
    limit: batchSize,
  });

  if (options.sourceId) {
    candidates = candidates.filter((c) => c.source_id === options.sourceId);
  }

  const results: PublishItemResult[] = [];
  let publishedNewCount = 0;
  let updatedExistingCount = 0;
  let skippedCount = 0;
  let rejectedCount = 0;
  let errorCount = 0;

  for (const candidate of candidates) {
    try {
      const res = await publishParsedItem(candidate, { force: options.force });
      results.push(res);

      if (res.action === 'PUBLISHED_NEW') publishedNewCount++;
      else if (res.action === 'UPDATED_EXISTING') updatedExistingCount++;
      else if (res.action === 'SKIPPED_UNMODIFIED') skippedCount++;
      else if (res.action === 'REJECTED_INELIGIBLE') rejectedCount++;
      else if (!res.success) errorCount++;
    } catch (err: any) {
      errorCount++;
      results.push({
        success: false,
        action: 'REJECTED_INELIGIBLE',
        targetType: candidate.item_type === 'vacancy' ? 'government_jobs' : 'government_updates',
        targetId: candidate.id,
        error: err?.message || 'Publishing error occurred',
      });
    }
  }

  const endTime = new Date().toISOString();
  return {
    totalRequested: batchSize,
    totalProcessed: results.length,
    publishedNewCount,
    updatedExistingCount,
    skippedCount,
    rejectedCount,
    errorCount,
    startTime,
    endTime,
    durationMs: Date.now() - startMs,
    results,
  };
}

/**
 * Live Data Quality Monitoring & Lifecycle Engine.
 * Checks for missing required fields, unverified URLs, expired job deadlines, and duplicate slugs.
 */
export async function runDataQualityCheck(): Promise<DataQualityReport> {
  const issues: DataQualityIssue[] = [];
  let autoFixedCount = 0;

  const allJobs = await getAllJobsForAdmin({ onlyActive: false });
  const seenSlugs = new Set<string>();

  for (const job of allJobs) {
    // 1. Slug uniqueness
    if (seenSlugs.has(job.slug)) {
      issues.push({
        recordId: job.id,
        table: 'government_jobs',
        title: job.title,
        issueType: 'DUPLICATE_SLUG',
        severity: 'HIGH',
        details: `Duplicate slug detected: '${job.slug}'`,
      });
    } else {
      seenSlugs.add(job.slug);
    }

    // 2. Title validation
    if (!job.title || job.title.trim().length < 5) {
      issues.push({
        recordId: job.id,
        table: 'government_jobs',
        title: job.title || 'Untitled',
        issueType: 'MISSING_TITLE',
        severity: 'HIGH',
        details: 'Title is empty or shorter than 5 characters.',
      });
    }

    // 3. URL security validation
    const urls = [job.official_notification_url, job.official_apply_url, job.official_website_url].filter(Boolean);
    for (const u of urls) {
      if (!u.startsWith('http://') && !u.startsWith('https://')) {
        issues.push({
          recordId: job.id,
          table: 'government_jobs',
          title: job.title,
          issueType: 'INVALID_URL',
          severity: 'HIGH',
          details: `Insecure or invalid URL format: ${u}`,
        });
      }
    }

    // 4. Expiration check & lifecycle auto-fix
    if (job.important_dates?.applyEndDate) {
      const computedStatus = deriveDeterministicJobStatus(job.important_dates, job.status);
      if (computedStatus !== job.status) {
        issues.push({
          recordId: job.id,
          table: 'government_jobs',
          title: job.title,
          issueType: 'EXPIRED_STATUS_MISMATCH',
          severity: 'MEDIUM',
          details: `Job status was '${job.status}', expected '${computedStatus}' based on deadline (${job.important_dates.applyEndDate}).`,
          autoFixed: true,
        });

        // Auto-fix status in DB
        await updateJobStatus(job.id, computedStatus, computedStatus !== 'Closed');
        await savePublishLog({
          target_type: 'government_jobs',
          target_id: job.id,
          action: 'STATUS_EXPIRED',
          previous_status: job.status,
          new_status: computedStatus,
          success: true,
        });
        autoFixedCount++;
      }
    }
  }

  // Calculate overall Health Score (0 - 100)
  const penalty = issues.reduce((acc, issue) => {
    if (issue.autoFixed) return acc + 1;
    if (issue.severity === 'HIGH') return acc + 10;
    if (issue.severity === 'MEDIUM') return acc + 5;
    return acc + 2;
  }, 0);

  const healthScore = Math.max(0, Math.min(100, 100 - penalty));

  return {
    timestamp: new Date().toISOString(),
    totalRecordsChecked: {
      jobs: allJobs.length,
      updates: 0,
      admitCards: 0,
      results: 0,
      answerKeys: 0,
    },
    totalIssuesFound: issues.length,
    autoFixedCount,
    healthScore,
    issues,
  };
}
