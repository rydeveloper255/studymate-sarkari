/**
 * StudyMate Sarkari — Step 5: Master Parsing, Normalization, Verification & Deduplication Pipeline
 */

import {
  NormalizedExtractedItem,
  ParserInput,
  PipelineExecutionSummary,
  RawExtractedItem,
} from '../../../types/parser';
import { DbContentSource } from '../../../types';
import { parserRegistry } from '../parsers';
import { normalizeTitle, generateSlug } from '../normalizers/textNormalizer';
import { normalizeImportantDates } from '../normalizers/dateNormalizer';
import { normalizeVacancyCount } from '../normalizers/vacancyNormalizer';
import { normalizeApplicationFee, normalizeAgeLimit } from '../normalizers/feeNormalizer';
import { resolveOrganization } from '../entityResolvers/organizationResolver';
import { resolveState } from '../entityResolvers/stateResolver';
import { verifyAndSanitizeUrl } from '../verification/urlSecurityVerifier';
import { classifyContent } from '../verification/contentClassifier';
import { generateDeduplicationKey, compareWithExistingRecords } from '../verification/deduplicator';
import { evaluateExtractionConfidence } from '../verification/confidenceScorer';
import { validatePublicationDateCutoff } from '../verification/dateValidator';
import {
  insertParseLog,
  insertParsedItems,
  getParsedItemsForSource,
} from '../supabaseAdmin';

export class ContentParsePipeline {
  /**
   * Processes fetched source content through the complete end-to-end pipeline.
   */
  public static async execute(
    source: DbContentSource,
    content: string,
    contentHash: string,
    fetchLogId?: string
  ): Promise<PipelineExecutionSummary> {
    const startTime = Date.now();
    const errors: string[] = [];

    const parserInput: ParserInput = {
      sourceId: source.id,
      sourceName: source.source_name,
      officialUrl: source.official_url,
      finalUrl: source.official_url,
      sourceType: source.source_type,
      scope: source.scope,
      stateCode: source.state_code,
      parserKey: source.parser_key,
      content,
      contentHash,
      fetchLogId,
    };

    // 1. Parser Dispatch & Raw Extraction
    const parseResult = await parserRegistry.parseContent(parserInput);
    if (!parseResult.success) {
      errors.push(parseResult.error || 'Parsing failed');

      // Log parse failure
      await insertParseLog({
        source_id: source.id,
        fetch_log_id: fetchLogId,
        content_hash: contentHash,
        parser_key: parseResult.parserKey || source.parser_key || 'unknown',
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        success: false,
        item_count: 0,
        error_code: parseResult.errorCode || 'PARSING_FAILED',
        error_message: parseResult.error || 'Failed to extract raw items',
      });

      return {
        sourceId: source.id,
        sourceName: source.source_name,
        success: false,
        parserKey: parseResult.parserKey || 'unknown',
        rawItemCount: 0,
        normalizedItemCount: 0,
        storedItemCount: 0,
        duplicateCount: 0,
        confidenceBreakdown: { high: 0, medium: 0, low: 0 },
        statusBreakdown: {},
        items: [],
        errors,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Fetch existing items for deduplication
    const existingItems = await getParsedItemsForSource(source.id);

    const normalizedItems: NormalizedExtractedItem[] = [];
    let duplicateCount = 0;
    const confidenceBreakdown = { high: 0, medium: 0, low: 0 };
    const statusBreakdown: Record<string, number> = {};

    // 3. Normalization, Entity Resolution, Verification & Deduplication Loop
    for (const raw of parseResult.items) {
      try {
        const normalized = normalizeItem({
          raw,
          source,
          contentHash,
          parserKey: parseResult.parserKey,
        });

        // Deduplication & Conflict Check
        const dedupResult = compareWithExistingRecords(normalized, existingItems);

        if (dedupResult.relation === 'IDENTICAL_DUPLICATE') {
          duplicateCount++;
          continue; // Skip exact duplicate
        }

        // Hard Cutoff: ONLY PROCESS NEWLY PUBLISHED SOURCE CONTENT DATED 1 AUGUST 2026 OR LATER
        const candidateDate =
          raw.rawDates?.notificationDate ||
          normalized.importantDates?.notificationDate ||
          normalized.importantDates?.applyStartDate;
        const dateCheck = validatePublicationDateCutoff(candidateDate, {
          title: normalized.title,
          itemType: normalized.itemType,
        });

        if (!dateCheck.eligible) {
          // Reject historical archives or items published before 2026-08-01
          continue;
        }

        if (dedupResult.recommendedStatus) {
          normalized.verificationStatus = dedupResult.recommendedStatus;
        }

        // Tally confidence & status
        if (normalized.confidence === 'HIGH') confidenceBreakdown.high++;
        else if (normalized.confidence === 'MEDIUM') confidenceBreakdown.medium++;
        else confidenceBreakdown.low++;

        statusBreakdown[normalized.verificationStatus] =
          (statusBreakdown[normalized.verificationStatus] || 0) + 1;

        normalizedItems.push(normalized);
      } catch (err: any) {
        errors.push(`Error normalizing item "${raw.rawTitle}": ${err?.message}`);
      }
    }

    // 4. Persistence into Database
    if (normalizedItems.length > 0) {
      await insertParsedItems(normalizedItems, fetchLogId);
    }

    // 5. Insert Content Parse Log
    await insertParseLog({
      source_id: source.id,
      fetch_log_id: fetchLogId,
      content_hash: contentHash,
      parser_key: parseResult.parserKey,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      success: true,
      item_count: normalizedItems.length,
      error_message: errors.length > 0 ? errors.join('; ') : undefined,
    });

    return {
      sourceId: source.id,
      sourceName: source.source_name,
      success: true,
      parserKey: parseResult.parserKey,
      rawItemCount: parseResult.items.length,
      normalizedItemCount: normalizedItems.length,
      storedItemCount: normalizedItems.length,
      duplicateCount,
      confidenceBreakdown,
      statusBreakdown,
      items: normalizedItems,
      errors: errors.length > 0 ? errors : undefined,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Normalizes a single raw extracted item.
 */
function normalizeItem(params: {
  raw: RawExtractedItem;
  source: DbContentSource;
  contentHash: string;
  parserKey: string;
}): NormalizedExtractedItem {
  const { raw, source, contentHash, parserKey } = params;

  // 1. Text & Titles
  const cleanTitle = normalizeTitle(raw.rawTitle);
  const postName = raw.rawPostName ? normalizeTitle(raw.rawPostName) : cleanTitle;
  const slug = generateSlug(cleanTitle);

  // 2. Organization & State Entity Resolution
  const resolvedOrg = resolveOrganization(raw.rawOrganization, {
    sourceName: source.source_name,
    scope: source.scope,
    stateCode: source.state_code,
  });

  const resolvedState = resolveState(source.state_code || resolvedOrg.stateCode);

  // 3. Dates Normalization
  const dateResult = normalizeImportantDates(raw.rawDates);

  // 4. Vacancies Normalization
  const vacancyResult = normalizeVacancyCount(raw.rawTotalVacancies);

  // 5. Fees & Age Limits
  const feeResult = normalizeApplicationFee(raw.rawFee);
  const ageResult = normalizeAgeLimit(raw.rawAgeLimit);

  // 6. URLs Verification
  const notifUrlResult = verifyAndSanitizeUrl(
    raw.rawNotificationUrl || source.official_url,
    source.official_url
  );
  const applyUrlResult = verifyAndSanitizeUrl(
    raw.rawApplyUrl || source.official_url,
    source.official_url
  );

  // 7. Content Classification
  const classification = raw.detectedType
    ? { detectedType: raw.detectedType, confidence: 'HIGH' as const, matchedKeywords: [] }
    : classifyContent(cleanTitle, raw.rawSummary || '');

  // 8. Deduplication Key
  const dedupKey = generateDeduplicationKey({
    orgCode: resolvedOrg.code,
    itemType: classification.detectedType,
    notificationNumber: raw.rawNotificationNumber,
    slug,
    officialNotificationUrl: notifUrlResult.canonicalUrl,
  });

  // 9. Confidence Evaluation
  const confidenceEval = evaluateExtractionConfidence({
    item: {
      title: cleanTitle,
      importantDates: dateResult.dates,
      officialNotificationUrl: notifUrlResult.canonicalUrl || undefined,
    },
    isOfficialDomain: notifUrlResult.isOfficialDomain,
    isConfidentOrgMatch: resolvedOrg.isConfidentMatch,
    isValidChronology: dateResult.isValidChronology,
  });

  // 10. Qualification & Selection Process formatting
  const qualifications: string[] = Array.isArray(raw.rawQualification)
    ? raw.rawQualification
    : raw.rawQualification
    ? [String(raw.rawQualification)]
    : ['As per official notification eligibility criteria'];

  const selectionProcess: string[] = Array.isArray(raw.rawSelectionProcess)
    ? raw.rawSelectionProcess
    : [
        'Written Examination (CBT / OMR)',
        'Skill / Typing / Physical Test (where applicable)',
        'Document Verification & Medical Examination',
      ];

  return {
    itemType: classification.detectedType,
    title: cleanTitle,
    slug,
    postName,
    organizationId: resolvedOrg.organizationId || null,
    organizationCode: resolvedOrg.code,
    organizationName: resolvedOrg.fullName,
    departmentOrMinistry: source.scope === 'central' ? 'Government of India' : undefined,
    sector: resolvedOrg.sector,
    centralCategory: resolvedOrg.centralCategory,
    stateCode: resolvedState ? resolvedState.code : source.state_code || null,
    stateName: resolvedState ? resolvedState.name : undefined,
    scope: source.scope,
    notificationNumber: raw.rawNotificationNumber || null,
    totalVacancies: vacancyResult.totalVacancies,
    qualification: qualifications,
    ageLimit: ageResult.ageLimit,
    applicationFee: feeResult.fee,
    importantDates: dateResult.dates,
    selectionProcess,
    summary:
      raw.rawSummary ||
      `${resolvedOrg.fullName} has issued official notification for ${cleanTitle}. Eligible candidates can review details and apply before ${dateResult.dates.applyEndDate}.`,
    officialNotificationUrl: notifUrlResult.canonicalUrl || source.official_url,
    officialApplyUrl: applyUrlResult.canonicalUrl || source.official_url,
    officialWebsiteUrl: source.official_url,
    sourceUrl: raw.rawSourceUrl || source.official_url,
    sourceId: source.id,
    contentHash,
    deduplicationKey: dedupKey,
    confidence: confidenceEval.confidence,
    verificationStatus: confidenceEval.verificationStatus,
    evidence: {
      vacancyTextSnippet: vacancyResult.rawSnippet,
      dateTextSnippet: dateResult.evidenceSnippet,
      feeTextSnippet: feeResult.evidence,
      ageSnippet: ageResult.evidence,
      noticeNumberSnippet: raw.rawNotificationNumber,
      rawMatchedKeywords: classification.matchedKeywords,
    },
    parserKey,
    parsedAt: new Date().toISOString(),
  };
}
