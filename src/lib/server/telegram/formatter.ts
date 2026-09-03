/**
 * StudyMate Sarkari — Step 7: Telegram Message Formatter
 *
 * CRITICAL FORMATTING & SAFETY RULES:
 * - Strict HTML entity escaping to prevent markup injection
 * - Handles Unicode, Hindi text, numbers, emojis, and special characters cleanly
 * - Only includes fields that actually exist (never invent missing data)
 * - Length cap ensures compliance with Telegram's 4096-char ceiling
 * - Inline keyboard buttons contain ONLY verified official government URLs
 */

import {
  TelegramNotificationType,
  TelegramInlineButton,
  TelegramMessagePayload,
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
import { createHash } from 'crypto';

/**
 * Escapes characters for Telegram HTML parse_mode: &, <, >, "
 */
export function escapeTelegramHtml(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates an MD5 / SHA256 content hash for deduplication.
 */
export function calculateMessageHash(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex');
}

/**
 * Formats a NEW_VACANCY notification message for Telegram.
 */
export function formatVacancyMessage(
  job: DbGovernmentJob | NormalizedExtractedItem,
  options: { destinationChatId?: string } = {}
): TelegramMessagePayload {
  const isDbJob = 'total_vacancies' in job;

  const title = isDbJob ? (job.post_name || job.title) : (job.postName || job.title);
  const org = isDbJob ? job.organization_name : job.organizationName;
  const sector = isDbJob ? job.sector : job.sector;
  const stateName = isDbJob ? job.state_name : job.stateName;
  const totalVacancies = isDbJob ? job.total_vacancies : job.totalVacancies;
  const qualification = isDbJob ? job.qualification : job.qualification;
  const importantDates = isDbJob ? job.important_dates : job.importantDates;
  const notifUrl = isDbJob ? job.official_notification_url : job.officialNotificationUrl;
  const applyUrl = isDbJob ? job.official_apply_url : job.officialApplyUrl;
  const id = isDbJob ? job.id : (job.slug || job.deduplicationKey);
  const slug = isDbJob ? (job.slug || job.id) : (job.slug || job.deduplicationKey);
  const category = isDbJob ? (job.central_category || (job.sector === 'central' ? 'Central Government' : 'State Government')) : (job.centralCategory || (job.sector === 'central' ? 'Central Government' : 'State Government'));

  // Website base URL resolution
  const websiteBaseUrl = process.env.PUBLIC_WEBSITE_URL || process.env.RENDER_EXTERNAL_URL || 'https://studymatesarkari.onrender.com';
  const websiteJobUrl = `${websiteBaseUrl.replace(/\/$/, '')}/jobs/${slug}`;

  // Region derivation
  let region: string | undefined;
  if (sector === 'central') {
    region = 'All India';
  } else if (stateName && stateName.trim()) {
    region = stateName.trim();
  }

  // End Date resolution
  const lastDate = importantDates?.applyEndDate || (isDbJob && 'application_end' in (job as any) ? (job as any).application_end : undefined);

  // Qualification resolution
  let qualStr: string | undefined;
  const rawQual: unknown = qualification;
  if (Array.isArray(rawQual) && rawQual.length > 0) {
    qualStr = rawQual.filter(Boolean).slice(0, 3).join(', ');
  } else if (typeof rawQual === 'string' && rawQual.trim()) {
    qualStr = rawQual.trim();
  }

  const lines: string[] = [];

  lines.push(`<b>StudyMate Sarkari</b>\n`);
  lines.push(`<b>New Government Recruitment</b>\n`);

  if (org && org.trim()) {
    lines.push(`<b>Organization:</b>\n${escapeTelegramHtml(org.trim())}\n`);
  }

  if (title && title.trim()) {
    lines.push(`<b>Post:</b>\n${escapeTelegramHtml(title.trim())}\n`);
  }

  if (totalVacancies && String(totalVacancies).trim() && String(totalVacancies) !== 'N/A' && String(totalVacancies) !== '0') {
    lines.push(`<b>Vacancies:</b>\n${escapeTelegramHtml(String(totalVacancies).trim())}\n`);
  }

  if (qualStr && qualStr !== 'Refer to official notification for eligibility details.') {
    lines.push(`<b>Qualification:</b>\n${escapeTelegramHtml(qualStr)}\n`);
  }

  if (lastDate && lastDate.trim() && lastDate !== 'Refer Notification') {
    lines.push(`<b>Last Date:</b>\n${escapeTelegramHtml(lastDate.trim())}\n`);
  }

  if (category && category.trim()) {
    lines.push(`<b>Category:</b>\n${escapeTelegramHtml(category.trim())}\n`);
  }

  if (region && region.trim()) {
    lines.push(`<b>Region:</b>\n${escapeTelegramHtml(region.trim())}\n`);
  }

  if (isValidOfficialUrl(applyUrl)) {
    lines.push(`<b>Apply:</b>\n${escapeTelegramHtml(applyUrl!)}\n`);
  }

  if (isValidOfficialUrl(notifUrl)) {
    lines.push(`<b>Official Notification:</b>\n${escapeTelegramHtml(notifUrl!)}\n`);
  }

  lines.push(`<b>StudyMate Sarkari:</b>\n${escapeTelegramHtml(websiteJobUrl)}`);

  const formattedText = lines.join('\n').trim();

  // Inline keyboard buttons for immediate one-click mobile actions
  const buttonRow: TelegramInlineButton[] = [];
  if (isValidOfficialUrl(applyUrl)) {
    buttonRow.push({ text: '🌐 Apply Online', url: applyUrl! });
  }
  if (isValidOfficialUrl(notifUrl)) {
    buttonRow.push({ text: '📄 Notification', url: notifUrl! });
  }
  buttonRow.push({ text: '⚡ StudyMate Page', url: websiteJobUrl });

  const buttons: TelegramInlineButton[][] = [buttonRow];
  const destinationChatId = options.destinationChatId || process.env.TELEGRAM_DEFAULT_CHAT_ID || 'default';
  const idempotencyKey = `government_jobs:${id}:NEW_VACANCY:${destinationChatId}`;

  return {
    notificationType: 'NEW_VACANCY',
    targetType: 'government_jobs',
    targetId: id,
    title: title || org || 'New Recruitment',
    organization: org || 'Government Recruitment Board',
    formattedText,
    buttons,
    destinationChatId,
    officialNotificationUrl: notifUrl,
    officialApplyUrl: applyUrl,
    idempotencyKey,
    messageHash: calculateMessageHash(formattedText),
  };
}

/**
 * Formats an ADMIT_CARD notification message.
 */
export function formatAdmitCardMessage(
  card: DbAdmitCard | NormalizedExtractedItem,
  options: { destinationChatId?: string } = {}
): TelegramMessagePayload {
  const isDb = 'download_url' in card;
  const title = card.title;
  const org = isDb ? card.organization : card.organizationName;
  const examName = isDb ? card.exam_name : (card.postName || card.title);
  const examDate = isDb ? card.exam_date : card.importantDates?.examDate;
  const downloadUrl = isDb ? card.download_url : (card.officialApplyUrl || card.officialNotificationUrl);
  const id = isDb ? card.id : card.deduplicationKey;

  const lines: string[] = [];
  lines.push(`🎫 <b>ADMIT CARD AVAILABLE</b>\n`);
  lines.push(`📌 <b>${escapeTelegramHtml(examName || title)}</b>\n`);
  lines.push(`🏢 <b>Organization:</b> ${escapeTelegramHtml(org)}`);

  if (examDate && examDate !== 'Refer to Admit Card') {
    lines.push(`📅 <b>Exam Date:</b> ${escapeTelegramHtml(examDate)}`);
  }

  if (isValidOfficialUrl(downloadUrl)) {
    lines.push(`\n🔗 <b>Official Admit Card Download:</b>\n${escapeTelegramHtml(downloadUrl)}`);
  }

  lines.push(`\n━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`⚡ <b>StudyMate Sarkari</b> — Verified Official Updates`);

  const formattedText = lines.join('\n');
  const buttons: TelegramInlineButton[][] = isValidOfficialUrl(downloadUrl)
    ? [[{ text: '🎫 Download Admit Card', url: downloadUrl! }]]
    : [];

  const destinationChatId = options.destinationChatId || process.env.TELEGRAM_DEFAULT_CHAT_ID || 'default';
  const idempotencyKey = `admit_cards:${id}:ADMIT_CARD:${destinationChatId}`;

  return {
    notificationType: 'ADMIT_CARD',
    targetType: 'admit_cards',
    targetId: id,
    title,
    organization: org,
    formattedText,
    buttons,
    destinationChatId,
    officialNotificationUrl: downloadUrl,
    idempotencyKey,
    messageHash: calculateMessageHash(formattedText),
  };
}

/**
 * Formats an EXAM RESULT notification message.
 */
export function formatResultMessage(
  result: DbExamResult | NormalizedExtractedItem,
  options: { destinationChatId?: string } = {}
): TelegramMessagePayload {
  const isDb = 'view_url' in result;
  const title = result.title;
  const org = isDb ? result.organization : result.organizationName;
  const examName = isDb ? result.exam_name : (result.postName || result.title);
  const resultDate = isDb ? result.result_date : (result.importantDates?.notificationDate || result.importantDates?.examDate);
  const viewUrl = isDb ? result.view_url : (result.officialNotificationUrl || result.officialWebsiteUrl);
  const id = isDb ? result.id : result.deduplicationKey;

  const lines: string[] = [];
  lines.push(`📢 <b>RESULT DECLARED</b>\n`);
  lines.push(`📌 <b>${escapeTelegramHtml(examName || title)}</b>\n`);
  lines.push(`🏢 <b>Organization:</b> ${escapeTelegramHtml(org)}`);

  if (resultDate) {
    lines.push(`📅 <b>Result Declared Date:</b> ${escapeTelegramHtml(resultDate)}`);
  }

  if (isValidOfficialUrl(viewUrl)) {
    lines.push(`\n🔗 <b>Official Result / Scorecard Link:</b>\n${escapeTelegramHtml(viewUrl)}`);
  }

  lines.push(`\n━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`⚡ <b>StudyMate Sarkari</b> — Verified Official Updates`);

  const formattedText = lines.join('\n');
  const buttons: TelegramInlineButton[][] = isValidOfficialUrl(viewUrl)
    ? [[{ text: '📢 View Official Result', url: viewUrl! }]]
    : [];

  const destinationChatId = options.destinationChatId || process.env.TELEGRAM_DEFAULT_CHAT_ID || 'default';
  const idempotencyKey = `exam_results:${id}:RESULT:${destinationChatId}`;

  return {
    notificationType: 'RESULT',
    targetType: 'exam_results',
    targetId: id,
    title,
    organization: org,
    formattedText,
    buttons,
    destinationChatId,
    officialNotificationUrl: viewUrl,
    idempotencyKey,
    messageHash: calculateMessageHash(formattedText),
  };
}

/**
 * Formats an ANSWER KEY notification message.
 */
export function formatAnswerKeyMessage(
  key: DbAnswerKey | NormalizedExtractedItem,
  options: { destinationChatId?: string } = {}
): TelegramMessagePayload {
  const isDb = 'view_url' in key;
  const title = key.title;
  const org = isDb ? key.organization : key.organizationName;
  const examName = isDb ? key.exam_name : (key.postName || key.title);
  const status = isDb ? key.status : 'Provisional / Official';
  const viewUrl = isDb ? key.view_url : (key.officialNotificationUrl || key.officialWebsiteUrl);
  const id = isDb ? key.id : key.deduplicationKey;

  const lines: string[] = [];
  lines.push(`🔑 <b>ANSWER KEY RELEASED</b>\n`);
  lines.push(`📌 <b>${escapeTelegramHtml(examName || title)}</b>\n`);
  lines.push(`🏢 <b>Organization:</b> ${escapeTelegramHtml(org)}`);

  if (status) {
    lines.push(`📄 <b>Key Type:</b> ${escapeTelegramHtml(status)}`);
  }

  if (isValidOfficialUrl(viewUrl)) {
    lines.push(`\n🔗 <b>Official Answer Key & Objection Window:</b>\n${escapeTelegramHtml(viewUrl)}`);
  }

  lines.push(`\n━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`⚡ <b>StudyMate Sarkari</b> — Verified Official Updates`);

  const formattedText = lines.join('\n');
  const buttons: TelegramInlineButton[][] = isValidOfficialUrl(viewUrl)
    ? [[{ text: '🔑 View Official Answer Key', url: viewUrl! }]]
    : [];

  const destinationChatId = options.destinationChatId || process.env.TELEGRAM_DEFAULT_CHAT_ID || 'default';
  const idempotencyKey = `answer_keys:${id}:ANSWER_KEY:${destinationChatId}`;

  return {
    notificationType: 'ANSWER_KEY',
    targetType: 'answer_keys',
    targetId: id,
    title,
    organization: org,
    formattedText,
    buttons,
    destinationChatId,
    officialNotificationUrl: viewUrl,
    idempotencyKey,
    messageHash: calculateMessageHash(formattedText),
  };
}

/**
 * Formats an EXAM UPDATE or general recruitment notice message.
 */
export function formatUpdateMessage(
  update: DbGovernmentUpdate | NormalizedExtractedItem,
  options: { destinationChatId?: string } = {}
): TelegramMessagePayload {
  const isDb = 'update_date' in update;
  const title = update.title;
  const org = isDb ? update.organization : update.organizationName;
  const date = isDb ? update.update_date : (update.importantDates?.notificationDate || new Date().toISOString().split('T')[0]);
  const summary = isDb ? update.summary : (update.summary || '');
  const linkUrl = isDb ? update.link_url : (update.officialNotificationUrl || update.officialWebsiteUrl);
  const id = isDb ? update.id : update.deduplicationKey;

  const lines: string[] = [];
  lines.push(`📢 <b>OFFICIAL EXAM UPDATE</b>\n`);
  lines.push(`📌 <b>${escapeTelegramHtml(title)}</b>\n`);
  lines.push(`🏢 <b>Organization:</b> ${escapeTelegramHtml(org)}`);

  if (date) {
    lines.push(`📅 <b>Notice Date:</b> ${escapeTelegramHtml(date)}`);
  }

  if (summary) {
    const cleanSummary = summary.length > 250 ? `${summary.slice(0, 247)}...` : summary;
    lines.push(`\n📝 <b>Details:</b> ${escapeTelegramHtml(cleanSummary)}`);
  }

  if (isValidOfficialUrl(linkUrl)) {
    lines.push(`\n🔗 <b>Official Notice:</b>\n${escapeTelegramHtml(linkUrl)}`);
  }

  lines.push(`\n━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`⚡ <b>StudyMate Sarkari</b> — Verified Official Updates`);

  const formattedText = lines.join('\n');
  const buttons: TelegramInlineButton[][] = isValidOfficialUrl(linkUrl)
    ? [[{ text: '🔗 View Official Notice', url: linkUrl! }]]
    : [];

  const destinationChatId = options.destinationChatId || process.env.TELEGRAM_DEFAULT_CHAT_ID || 'default';
  const idempotencyKey = `government_updates:${id}:EXAM_UPDATE:${destinationChatId}`;

  return {
    notificationType: 'EXAM_UPDATE',
    targetType: 'government_updates',
    targetId: id,
    title,
    organization: org,
    formattedText,
    buttons,
    destinationChatId,
    officialNotificationUrl: linkUrl,
    idempotencyKey,
    messageHash: calculateMessageHash(formattedText),
  };
}
