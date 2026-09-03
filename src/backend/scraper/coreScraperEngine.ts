/**
 * StudyMate Sarkari — Core Scraper Engine
 *
 * Implements the primary autonomous scraper engine:
 * 1. Connects to Supabase and queries `job_sources`
 * 2. Employs a modular adapter pattern (HTML, PDF, RSS, JSON) to fetch content
 * 3. Tracks SHA-256 hashes to detect changed/unchanged state
 * 4. STRICTLY ENFORCES the 1 August 2026 date cutoff:
 *    - Rejects any historical notice/circular dated prior to 2026-08-01
 *    - Only processes and persists verified notices dated 1 August 2026 or later
 * 5. Persists validated, fresh vacancies into Supabase
 * 6. Emits structured operational summaries and telemetry
 */

import {
  JobSourceRecord,
  ScraperEngineConfig,
  ScraperRunSummary,
  ValidatedScrapedVacancy,
  RawScrapedNotice,
  FetchResult,
} from './types';
import { AdapterRegistry } from './adapters/adapterRegistry';
import { HtmlFetchAdapter } from './adapters/htmlAdapter';
import { PdfFetchAdapter } from './adapters/pdfAdapter';
import { RssFetchAdapter } from './adapters/rssAdapter';
import { JsonFetchAdapter } from './adapters/jsonAdapter';
import {
  loadJobSourcesFromSupabase,
  updateJobSourceState,
  persistValidatedVacancies,
  recordSourceFetchLog,
} from './supabaseClient';
import { extractAndValidateNoticeCutoff, DEFAULT_CUTOFF_DATE } from './cutoffValidator';

export class CoreScraperEngine {
  private config: Required<ScraperEngineConfig>;
  private adapterRegistry: AdapterRegistry;
  private totalRuns = 0;
  private lastRunSummary: ScraperRunSummary | null = null;

  constructor(config: ScraperEngineConfig = {}) {
    this.config = {
      batchSize: config.batchSize ?? 50,
      concurrency: config.concurrency ?? 3,
      requestTimeoutMs: config.requestTimeoutMs ?? 20000,
      maxContentBytes: config.maxContentBytes ?? 10 * 1024 * 1024,
      userAgent:
        config.userAgent ??
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 StudyMateSarkariBot/1.0 (+https://studymatesarkari.in)',
      dryRun: config.dryRun ?? false,
      forceAll: config.forceAll ?? false,
      dateCutoff: config.dateCutoff ?? DEFAULT_CUTOFF_DATE,
    };

    this.adapterRegistry = AdapterRegistry.getInstance();
  }

  /**
   * Executes a full scraping run across all or filtered sources from Supabase `job_sources`.
   */
  public async run(options: {
    region?: string;
    priority?: string;
    limit?: number;
    forceAll?: boolean;
  } = {}): Promise<ScraperRunSummary> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startedAt = new Date().toISOString();
    const startMs = Date.now();

    console.log(`[CoreScraperEngine] Starting scraping run ${runId} (Date Cutoff: ${this.config.dateCutoff})...`);

    // 1. Connect to Supabase and read active sources
    const sources = await loadJobSourcesFromSupabase({
      region: options.region,
      priority: options.priority,
      limit: options.limit || this.config.batchSize,
    });

    console.log(`[CoreScraperEngine] Retrieved ${sources.length} active government sources from Supabase.`);

    const summary: ScraperRunSummary = {
      runId,
      startedAt,
      completedAt: '',
      durationMs: 0,
      sourcesEvaluated: sources.length,
      sourcesFetched: 0,
      sourcesUnchanged: 0,
      sourcesFailed: 0,
      itemsDiscovered: 0,
      itemsAcceptedCutoff: 0,
      itemsRejectedCutoff: 0,
      itemsSaved: 0,
      errors: [],
    };

    // 2. Process sources in concurrent batches
    const chunks = this.chunkArray(sources, this.config.concurrency);
    const validatedVacanciesToSave: ValidatedScrapedVacancy[] = [];

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map((source) => this.scrapeSource(source, options.forceAll ?? this.config.forceAll))
      );

      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        const source = chunk[i];

        if (res.status === 'fulfilled') {
          const outcome = res.value;
          if (outcome.success) {
            summary.sourcesFetched++;
            if (outcome.unchanged) {
              summary.sourcesUnchanged++;
            }
            summary.itemsDiscovered += outcome.discoveredItems;
            summary.itemsAcceptedCutoff += outcome.acceptedItems.length;
            summary.itemsRejectedCutoff += outcome.rejectedDueToCutoff;
            validatedVacanciesToSave.push(...outcome.acceptedItems);
          } else {
            summary.sourcesFailed++;
            summary.errors.push({
              sourceId: source.id,
              sourceName: source.name,
              error: outcome.error || 'Fetch or parse failed',
            });
          }
        } else {
          summary.sourcesFailed++;
          summary.errors.push({
            sourceId: source.id,
            sourceName: source.name,
            error: res.reason?.message || 'Unknown source execution error',
          });
        }
      }
    }

    // 3. Persist cutoff-accepted vacancies to Supabase
    if (!this.config.dryRun && validatedVacanciesToSave.length > 0) {
      console.log(`[CoreScraperEngine] Persisting ${validatedVacanciesToSave.length} cutoff-validated vacancies to Supabase...`);
      const saveRes = await persistValidatedVacancies(validatedVacanciesToSave);
      summary.itemsSaved = saveRes.inserted + saveRes.updated;
    } else {
      summary.itemsSaved = validatedVacanciesToSave.length;
    }

    summary.completedAt = new Date().toISOString();
    summary.durationMs = Date.now() - startMs;

    this.totalRuns++;
    this.lastRunSummary = summary;

    console.log(
      `[CoreScraperEngine] Run completed in ${summary.durationMs}ms: ` +
        `${summary.sourcesFetched} fetched, ${summary.itemsDiscovered} discovered, ` +
        `${summary.itemsAcceptedCutoff} accepted (>= ${this.config.dateCutoff}), ` +
        `${summary.itemsRejectedCutoff} rejected (< ${this.config.dateCutoff}).`
    );

    return summary;
  }

  /**
   * Scrapes a single government source using the appropriate adapter.
   */
  public async scrapeSource(
    source: JobSourceRecord,
    forceAll = false
  ): Promise<{
    success: boolean;
    unchanged: boolean;
    discoveredItems: number;
    acceptedItems: ValidatedScrapedVacancy[];
    rejectedDueToCutoff: number;
    error?: string;
  }> {
    // 1. Select adapter from registry
    const adapter = this.adapterRegistry.getAdapterForSource(source);

    // 2. Fetch source content
    const fetchResult = await adapter.fetch(source, {
      timeoutMs: this.config.requestTimeoutMs,
      maxBytes: this.config.maxContentBytes,
      userAgent: this.config.userAgent,
    });

    // 3. Log fetch to Supabase audit
    await recordSourceFetchLog(source, fetchResult);

    if (!fetchResult.success) {
      await updateJobSourceState(source.id, {
        last_checked_at: new Date().toISOString(),
        last_error: fetchResult.error,
        fetch_status: 'HTTP_ERROR',
      });
      return {
        success: false,
        unchanged: false,
        discoveredItems: 0,
        acceptedItems: [],
        rejectedDueToCutoff: 0,
        error: fetchResult.error || 'Fetch failed',
      };
    }

    // 4. Update source state in Supabase
    await updateJobSourceState(source.id, {
      last_checked_at: new Date().toISOString(),
      last_success_at: new Date().toISOString(),
      content_hash: fetchResult.contentHash,
      etag: fetchResult.etag,
      last_modified: fetchResult.lastModified,
      fetch_status: fetchResult.unchanged ? 'SUCCESS_UNCHANGED' : 'SUCCESS_CHANGED',
      last_error: null,
    });

    // If unchanged and not forceAll, return early
    if (fetchResult.unchanged && !forceAll) {
      return {
        success: true,
        unchanged: true,
        discoveredItems: 0,
        acceptedItems: [],
        rejectedDueToCutoff: 0,
      };
    }

    // 5. Extract raw notices from adapter content
    const rawNotices = this.extractNoticesFromAdapter(adapter, fetchResult, source);

    // 6. ENFORCE AUGUST 1, 2026 CUTOFF
    const acceptedVacancies: ValidatedScrapedVacancy[] = [];
    let rejectedCount = 0;

    for (const raw of rawNotices) {
      const cutoffCheck = extractAndValidateNoticeCutoff(raw, this.config.dateCutoff);

      if (!cutoffCheck.eligible || !cutoffCheck.normalizedDate) {
        // Discard item prior to 1 August 2026
        rejectedCount++;
        continue;
      }

      // 7. Normalize into validated vacancy
      const validated = this.normalizeRawNoticeToVacancy(raw, source, cutoffCheck.normalizedDate, fetchResult.contentHash);
      acceptedVacancies.push(validated);
    }

    return {
      success: true,
      unchanged: false,
      discoveredItems: rawNotices.length,
      acceptedItems: acceptedVacancies,
      rejectedDueToCutoff: rejectedCount,
    };
  }

  /**
   * Delegates extraction to the specific adapter's specialized parsing logic.
   */
  private extractNoticesFromAdapter(
    adapter: any,
    fetchResult: FetchResult,
    source: JobSourceRecord
  ): RawScrapedNotice[] {
    const baseUrl = source.recruitment_url || source.official_url;

    if (adapter instanceof HtmlFetchAdapter) {
      return adapter.extractNotices(fetchResult.content, baseUrl, source);
    } else if (adapter instanceof PdfFetchAdapter) {
      return adapter.extractNotices(fetchResult.content, baseUrl, source);
    } else if (adapter instanceof RssFetchAdapter) {
      return adapter.extractNotices(fetchResult.content, baseUrl, source);
    } else if (adapter instanceof JsonFetchAdapter) {
      return adapter.extractNotices(fetchResult.content, baseUrl, source);
    }

    // Default fallback: HTML extraction
    const fallback = new HtmlFetchAdapter();
    return fallback.extractNotices(fetchResult.content, baseUrl, source);
  }

  /**
   * Converts raw notice candidate into a strictly validated vacancy.
   */
  private normalizeRawNoticeToVacancy(
    raw: RawScrapedNotice,
    source: JobSourceRecord,
    verifiedDate: string,
    contentHash: string
  ): ValidatedScrapedVacancy {
    const postName = raw.postName || raw.title;
    const org = raw.organization || source.organization || source.name;
    const slug = this.generateSlug(org, postName, raw.notificationNumber, verifiedDate);

    // Sector determination
    const region = (source.region || '').toUpperCase();
    const isCentral = region === 'ALL' || !region;
    const sector = isCentral ? 'central' : 'state';

    // Live status rule: application_start <= NOW <= application_end
    const now = new Date().toISOString().split('T')[0];
    const startDate = raw.applyStartDate || verifiedDate;
    const endDate = raw.applyEndDate;

    let status: 'active' | 'upcoming' | 'closed' | 'archived' = 'active';
    let isLive = true;

    if (startDate > now) {
      status = 'upcoming';
      isLive = false;
    } else if (endDate && endDate < now) {
      status = 'closed';
      isLive = false;
    }

    const categories: string[] = Array.isArray(source.category)
      ? source.category
      : [source.category || 'vacancy'];

    return {
      sourceId: source.id,
      sourceName: source.name,
      title: raw.title,
      slug,
      postName,
      organization: org,
      sector,
      stateCode: isCentral ? null : region,
      category: categories,
      notificationNumber: raw.notificationNumber || null,
      publicationDate: verifiedDate, // Guaranteed >= 2026-08-01
      applyStartDate: raw.applyStartDate || verifiedDate,
      applyEndDate: raw.applyEndDate || null,
      examDate: raw.examDate || null,
      totalVacancies: raw.totalVacancies || 'Various',
      qualification: Array.isArray(raw.qualification)
        ? raw.qualification
        : [raw.qualification || 'As per official notification'],
      officialNotificationUrl: raw.officialNotificationUrl || source.recruitment_url || source.official_url,
      officialApplyUrl: raw.officialApplyUrl || source.recruitment_url || source.official_url,
      officialWebsiteUrl: source.official_url,
      contentHash,
      isLive,
      status,
      scrapedAt: new Date().toISOString(),
    };
  }

  private generateSlug(org: string, post: string, notifNo?: string | null, date?: string): string {
    const base = `${org}-${post}-${notifNo || date || ''}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90);
    return base || `job-${Date.now()}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  public getSummary(): ScraperRunSummary | null {
    return this.lastRunSummary;
  }

  public getTotalRuns(): number {
    return this.totalRuns;
  }
}
