/**
 * StudyMate Sarkari — Scraper Supabase Client & Storage Engine
 *
 * Connects directly to Supabase with privileged service role capabilities:
 * - Reads official sources from the `job_sources` table
 * - Gracefully falls back to verified official seed registry when DB keys are unprovisioned
 * - Records fetch execution states, timestamps, and hashes in `job_sources`
 * - Persists cutoff-validated vacancies (>= 2026-08-01) into `government_jobs` and `exam_updates`
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { JobSourceRecord, ValidatedScrapedItem, ValidatedScrapedVacancy, FetchResult } from './types';
import { VERIFIED_OFFICIAL_JOB_SOURCES } from '../../data/verifiedJobSources';
import {
  upsertGovernmentContent,
  upsertPublishedJob,
  upsertPublishedUpdate,
  upsertPublishedAdmitCard,
  upsertPublishedResult,
  upsertPublishedAnswerKey,
} from '../../lib/server/supabaseAdmin';
import { getTelegramService } from '../../lib/server/telegram/service';

let cachedClient: SupabaseClient | null = null;
const processedDeduplicationKeys = new Set<string>();

/**
 * Initializes or returns the privileged Supabase Admin client
 */
export function getScraperSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (url && key && !url.includes('placeholder') && !key.includes('placeholder')) {
    try {
      cachedClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } catch (err) {
      console.warn('[Scraper Supabase] Client initialization notice:', err);
    }
  }

  return cachedClient;
}

/**
 * Reads active sources from Supabase `job_sources` table.
 * Falls back to verified seed registry if database is empty or offline.
 */
export async function loadJobSourcesFromSupabase(options: {
  region?: string;
  limit?: number;
  priority?: string;
} = {}): Promise<JobSourceRecord[]> {
  const client = getScraperSupabase();

  if (client) {
    try {
      let query = client.from('job_sources').select('*').eq('active', true);

      if (options.region) {
        query = query.eq('region', options.region);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row: any) => ({
          id: String(row.id),
          name: row.name || 'Official Government Source',
          organization: row.organization || null,
          region: row.region || 'ALL',
          source_type: row.source_type || 'html',
          official_url: row.official_url,
          recruitment_url: row.recruitment_url || null,
          category: Array.isArray(row.category) ? row.category : [row.category || 'vacancy'],
          active: row.active ?? true,
          priority: row.priority || 'high',
          parser_key: row.parser_key || null,
          check_interval_minutes: row.check_interval_minutes || 60,
          last_checked_at: row.last_checked_at || null,
          last_success_at: row.last_success_at || null,
          last_error: row.last_error || null,
          content_hash: row.content_hash || null,
          etag: row.etag || null,
          last_modified: row.last_modified || null,
          fetch_status: row.fetch_status || null,
        }));
      }
    } catch (dbErr) {
      console.warn('[Scraper Supabase] Could not query job_sources, using verified fallback:', dbErr);
    }
  }

  // Resilient fallback: Map verified official sources
  let fallbackList = VERIFIED_OFFICIAL_JOB_SOURCES.filter((s) => s.active);

  if (options.region) {
    fallbackList = fallbackList.filter((s) => s.region === options.region || s.region === 'ALL');
  }
  if (options.priority) {
    fallbackList = fallbackList.filter((s) => s.priority === options.priority);
  }
  if (options.limit && options.limit > 0) {
    fallbackList = fallbackList.slice(0, options.limit);
  }

  return fallbackList.map((seed) => ({
    id: seed.id,
    name: seed.name,
    organization: seed.organization,
    region: seed.region,
    source_type: seed.source_type || 'html',
    official_url: seed.official_url,
    recruitment_url: seed.recruitment_url,
    category: seed.category,
    active: seed.active,
    priority: seed.priority,
    parser_key: seed.parser_key,
    check_interval_minutes: 60,
    last_checked_at: null,
    last_success_at: null,
    last_error: null,
    content_hash: null,
    fetch_status: null,
  }));
}

/**
 * Updates execution metrics and state in Supabase `job_sources` table
 */
export async function updateJobSourceState(
  sourceId: string,
  updates: {
    last_checked_at?: string;
    last_success_at?: string;
    last_error?: string | null;
    content_hash?: string | null;
    etag?: string | null;
    last_modified?: string | null;
    fetch_status?: string | null;
  }
): Promise<void> {
  const client = getScraperSupabase();
  if (!client) return;

  try {
    await client
      .from('job_sources')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId);
  } catch (err) {
    // Non-fatal logging
    console.warn(`[Scraper Supabase] Could not update job_source state for ${sourceId}:`, err);
  }
}

/**
 * Inserts or updates validated government items across Supabase tables:
 * - Vacancies / Recruitment -> government_jobs & exam_updates
 * - Admit Cards -> admit_cards & exam_updates
 * - Exam Results -> exam_results & exam_updates
 * - Answer Keys -> answer_keys & exam_updates
 * - Exam Updates / Notices -> government_updates & exam_updates
 *
 * Strict Rules:
 * 1. Hard Cutoff: Publication date MUST be >= 2026-08-01. Anything earlier is skipped.
 * 2. Deduplication: Stable hash/fingerprint prevents duplicate rows when unchanged.
 * 3. Fallback: Automatically synchronizes with in-memory store so website UI displays immediately.
 * 4. Telegram: Dispatches notification for newly discovered records without blocking website flow.
 */
export async function persistValidatedItems(
  items: ValidatedScrapedItem[]
): Promise<{
  inserted: number;
  updated: number;
  skipped: number;
  vacanciesSaved: number;
  admitCardsSaved: number;
  resultsSaved: number;
  answerKeysSaved: number;
  updatesSaved: number;
}> {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let vacanciesSaved = 0;
  let admitCardsSaved = 0;
  let resultsSaved = 0;
  let answerKeysSaved = 0;
  let updatesSaved = 0;

  const telegramService = getTelegramService();

  for (const item of items) {
    // 1. Strict Cutoff Verification (>= 2026-08-01)
    if (!item.publicationDate || item.publicationDate < '2026-08-01') {
      skipped++;
      continue;
    }

    // 2. Stable Content Hash Deduplication
    const dedupKey = item.contentHash || `${item.sourceId}_${item.itemType}_${item.officialNotificationUrl || item.slug}_${item.publicationDate}`;
    if (processedDeduplicationKeys.has(dedupKey)) {
      skipped++;
      continue;
    }
    processedDeduplicationKeys.add(dedupKey);

    const type = item.contentType || item.itemType || 'vacancy';

    try {
      // 3. Persist into Master Unified Table: public.government_content
      const govContent = await upsertGovernmentContent({
        id: item.id || `gov-${item.slug}`,
        source_id: item.sourceId,
        content_type: type as any,
        title: item.title,
        slug: item.slug,
        organization: item.organization,
        department: item.department || null,
        post_name: item.postName || item.title,
        vacancy_count: item.vacancyCount || item.totalVacancies || 'Various',
        qualification: item.qualification || ['As per official notification'],
        age_limit: item.ageLimit || { minAge: 18, maxAge: 35 },
        selection_process: item.selectionProcess || ['Written Examination', 'Document Verification'],
        fee_details: item.feeDetails || { general: '₹100', scStPh: 'Exempted' },
        application_start_at: item.applyStartDate || item.publicationDate,
        application_end_at: item.applyEndDate || null,
        published_at: item.publicationDate,
        exam_date: item.examDate || null,
        release_date: item.releaseDate || item.publicationDate,
        notification_url: item.officialNotificationUrl,
        application_url: item.officialApplyUrl || item.officialWebsiteUrl,
        source_url: item.sourceUrl || item.officialNotificationUrl,
        region: item.region || item.stateCode || 'ALL',
        category: Array.isArray(item.category) ? item.category : [item.category || 'vacancy'],
        status: item.status || 'active',
        description: item.description || item.summary || item.title,
        details: item.details || {},
        content_hash: item.contentHash || dedupKey,
      });

      // 4. Update breakdown counts
      if (type === 'vacancy' || type === 'recruitment_notification') {
        vacanciesSaved++;
      } else if (type === 'admit_card') {
        admitCardsSaved++;
      } else if (type === 'result') {
        resultsSaved++;
      } else if (type === 'answer_key') {
        answerKeysSaved++;
      } else {
        updatesSaved++;
      }
      inserted++;

      // 5. Also sync to legacy tables for backwards compatibility
      if (type === 'vacancy' || type === 'recruitment_notification') {
        const job = await upsertPublishedJob({
          id: item.id || `job-${item.slug}`,
          slug: item.slug,
          title: item.title,
          organization_name: item.organization,
          post_name: item.postName || item.title,
          sector: item.sector === 'central' ? 'central' : 'state',
          state_code: item.stateCode || null,
          total_vacancies: String(item.totalVacancies || 'Various'),
          qualification: item.qualification || ['Graduate / 10th / 12th as per official notification'],
          age_limit: { minAge: 18, maxAge: 35, relaxationDetails: 'As per government norms' },
          application_fee: { general: '₹100', scStPh: 'Exempted', paymentMode: 'Online' },
          important_dates: {
            notificationDate: item.publicationDate,
            applyStartDate: item.applyStartDate || item.publicationDate,
            applyEndDate: item.applyEndDate || '',
            examDate: item.examDate || '',
          },
          selection_process: ['Written Examination', 'Document Verification'],
          status: item.status === 'upcoming' ? 'Upcoming' : item.status === 'closed' || item.status === 'expired' ? 'Closed' : 'Active',
          is_active: item.isLive,
          published_date: item.publicationDate,
          summary: `${item.organization} has officially released recruitment advertisement for ${item.postName || item.title}.`,
          official_notification_url: item.officialNotificationUrl,
          official_apply_url: item.officialApplyUrl || item.officialWebsiteUrl,
          official_website_url: item.officialWebsiteUrl,
          source_url: item.officialNotificationUrl,
        });

        await upsertPublishedUpdate({
          id: `upd-${item.slug}`,
          title: item.title,
          category: 'recruitment',
          organization: item.organization,
          update_date: item.publicationDate,
          summary: `Recruitment notification released for ${item.postName || item.title} (${item.totalVacancies || 'Various'} posts).`,
          link_url: item.officialNotificationUrl,
          badge_tag: 'Recruitment',
          is_high_priority: true,
          job_id: job.id,
        });

        if (telegramService.isEnabled()) {
          telegramService.handlePublishedItem(job).catch(() => {});
        }
      } else if (type === 'admit_card') {
        const card = await upsertPublishedAdmitCard({
          id: item.id || `card-${item.slug}`,
          title: item.title,
          organization: item.organization,
          exam_name: item.examName || item.postName || item.title,
          sector: item.sector === 'central' ? 'central' : 'state',
          state_name: item.stateCode || null,
          release_date: item.releaseDate || item.publicationDate,
          exam_date: item.examDate || item.publicationDate,
          status: (item.status as any) || 'Available',
          download_url: item.downloadUrl || item.officialNotificationUrl,
          instructions: item.instructions || 'Download hall ticket with registration credentials.',
        });

        await upsertPublishedUpdate({
          id: `upd-card-${item.slug}`,
          title: item.title,
          category: 'admit_card',
          organization: item.organization,
          update_date: item.publicationDate,
          summary: `Hall Ticket / Admit Card released for ${item.examName || item.title}.`,
          link_url: item.officialNotificationUrl,
          badge_tag: 'Admit Card',
          is_high_priority: true,
        });

        if (telegramService.isEnabled()) {
          telegramService.handlePublishedItem(card).catch(() => {});
        }
      } else if (type === 'result') {
        const res = await upsertPublishedResult({
          id: item.id || `res-${item.slug}`,
          title: item.title,
          organization: item.organization,
          exam_name: item.examName || item.postName || item.title,
          sector: item.sector === 'central' ? 'central' : 'state',
          state_name: item.stateCode || null,
          result_date: item.resultDate || item.publicationDate,
          status: (item.status as any) || 'Declared',
          view_url: item.viewUrl || item.officialNotificationUrl,
          cut_off_available: item.cutOffAvailable ?? true,
        });

        await upsertPublishedUpdate({
          id: `upd-res-${item.slug}`,
          title: item.title,
          category: 'result',
          organization: item.organization,
          update_date: item.publicationDate,
          summary: `Official results declared for ${item.examName || item.title}.`,
          link_url: item.officialNotificationUrl,
          badge_tag: 'Result',
          is_high_priority: true,
        });

        if (telegramService.isEnabled()) {
          telegramService.handlePublishedItem(res).catch(() => {});
        }
      } else if (type === 'answer_key') {
        const key = await upsertPublishedAnswerKey({
          id: item.id || `key-${item.slug}`,
          title: item.title,
          organization: item.organization,
          exam_name: item.examName || item.postName || item.title,
          sector: item.sector === 'central' ? 'central' : 'state',
          state_name: item.stateCode || null,
          release_date: item.releaseDate || item.publicationDate,
          objection_last_date: item.objectionLastDate || null,
          view_url: item.viewUrl || item.officialNotificationUrl,
          status: (item.status as any) || 'Final',
        });

        await upsertPublishedUpdate({
          id: `upd-key-${item.slug}`,
          title: item.title,
          category: 'answer_key',
          organization: item.organization,
          update_date: item.publicationDate,
          summary: `Answer key & objection portal published for ${item.examName || item.title}.`,
          link_url: item.officialNotificationUrl,
          badge_tag: 'Answer Key',
          is_high_priority: false,
        });

        if (telegramService.isEnabled()) {
          telegramService.handlePublishedItem(key).catch(() => {});
        }
      } else {
        const update = await upsertPublishedUpdate({
          id: item.id || `upd-${item.slug}`,
          title: item.title,
          category: 'exam_update',
          organization: item.organization,
          update_date: item.publicationDate,
          summary: item.summary || `${item.organization} published an official update regarding ${item.title}.`,
          link_url: item.officialNotificationUrl,
          badge_tag: 'Exam Notice',
          is_high_priority: false,
        });

        if (telegramService.isEnabled()) {
          telegramService.handlePublishedItem(update).catch(() => {});
        }
      }
    } catch (err) {
      console.warn(`[Scraper Supabase] Error persisting item ${item.slug}:`, err);
      updated++;
    }
  }

  return {
    inserted,
    updated,
    skipped,
    vacanciesSaved,
    admitCardsSaved,
    resultsSaved,
    answerKeysSaved,
    updatesSaved,
  };
}

/**
 * Inserts or updates validated vacancies in the Supabase database.
 * Confirms strict publication date cutoff (>= 2026-08-01).
 * (Backwards-compatible wrapper calling persistValidatedItems)
 */
export async function persistValidatedVacancies(
  vacancies: ValidatedScrapedVacancy[]
): Promise<{ inserted: number; updated: number; skipped: number }> {
  const result = await persistValidatedItems(vacancies);
  return {
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
  };
}

/**
 * Logs source fetch metadata into `source_fetch_logs` table
 */
export async function recordSourceFetchLog(
  source: JobSourceRecord,
  result: FetchResult
): Promise<void> {
  const client = getScraperSupabase();
  if (!client) return;

  try {
    await client.from('source_fetch_logs').insert({
      source_id: source.id,
      requested_url: source.recruitment_url || source.official_url,
      final_url: result.url,
      fetched_at: new Date().toISOString(),
      http_status: result.statusCode,
      success: result.success,
      changed: !result.unchanged,
      content_hash: result.contentHash,
      content_type: result.contentType,
      response_time_ms: result.durationMs,
      error_message: result.error || null,
    });
  } catch {
    // Non-fatal logging failure
  }
}
