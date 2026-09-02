/**
 * StudyMate Sarkari — Step 5: Generic PDF Document Text Parser
 *
 * Extracts structured recruitment fields from official PDF notification text.
 */

import { ParserInput, ParserResult, RawExtractedItem, SourceParser } from '../../../types/parser';
import { normalizeTitle } from '../normalizers/textNormalizer';
import { classifyContent } from '../verification/contentClassifier';
import { extractDateRange } from '../normalizers/dateNormalizer';

export class GenericPdfParser implements SourceParser {
  name = 'Generic PDF Parser';
  parserKey = 'generic_pdf';

  canHandle(input: ParserInput): boolean {
    return (
      input.sourceType === 'pdf' ||
      input.parserKey === 'generic_pdf' ||
      (input.contentType?.includes('pdf') ?? false)
    );
  }

  async parse(input: ParserInput): Promise<ParserResult> {
    try {
      const text = input.content;
      if (!text || text.trim().length < 20) {
        return {
          success: true,
          parserKey: this.parserKey,
          items: [],
          warnings: ['PDF text is empty or contains insufficient text content'],
        };
      }

      const lines = text
        .split(/[\r\n]+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // 1. Identify Title & Organization from first 10 lines
      const headerLines = lines.slice(0, 15).join(' ');
      const classification = classifyContent(headerLines, text.slice(0, 2000));

      let title = lines[0] || 'Official Recruitment Notification';
      for (const line of lines.slice(0, 8)) {
        if (/recruitment|examination|notice|advertisement|combined|admit|result|answer key/i.test(line)) {
          title = line;
          break;
        }
      }

      // 2. Extract Notification Number
      const notifMatch = text.match(
        /(?:advt\.?\s*no\.?|notification\s*no\.?|notice\s*no\.?|cen\s*no\.?)\s*[:=-]?\s*([0-9a-zA-Z/_\-–.]{3,30})/i
      );
      const notificationNumber = notifMatch ? notifMatch[1].trim() : null;

      // 3. Extract Vacancy Count
      const vacancyMatch = text.match(
        /(?:total\s+(?:posts?|vacancies|seats?)|no\.?\s+of\s+posts?)\s*[:=-]?\s*([0-9,]+)/i
      );
      const totalVacancies = vacancyMatch ? vacancyMatch[1] : null;

      // 4. Extract Application Dates
      const dateRange = extractDateRange(text);

      // 5. Extract Age Limit snippet
      const ageMatch = text.match(/(?:age\s+limit|minimum\s+age)[^.\n]{10,120}/i);
      const rawAgeLimit = ageMatch ? ageMatch[0].trim() : null;

      // 6. Extract Application Fee snippet
      const feeMatch = text.match(/(?:application\s+fee|examination\s+fee)[^.\n]{10,120}/i);
      const rawFee = feeMatch ? feeMatch[0].trim() : null;

      // 7. Extract Qualification snippet
      const qualMatch = text.match(/(?:educational\s+qualification|eligibility\s+criteria)[^.\n]{10,180}/i);
      const rawQualification = qualMatch ? qualMatch[0].trim() : null;

      const item: RawExtractedItem = {
        rawTitle: normalizeTitle(title),
        rawOrganization: input.sourceName,
        rawPostName: normalizeTitle(title).slice(0, 100),
        rawNotificationNumber: notificationNumber,
        rawTotalVacancies: totalVacancies,
        rawQualification: rawQualification,
        rawAgeLimit: rawAgeLimit,
        rawDates: {
          applyStartDate: dateRange.startDate,
          applyEndDate: dateRange.endDate,
        },
        rawFee: rawFee,
        rawSummary: text.slice(0, 300),
        rawNotificationUrl: input.finalUrl || input.officialUrl,
        rawSourceUrl: input.finalUrl || input.officialUrl,
        detectedType: classification.detectedType,
        evidence: {
          vacancyTextSnippet: vacancyMatch ? vacancyMatch[0] : null,
          dateTextSnippet: dateRange.evidence || null,
          noticeNumberSnippet: notifMatch ? notifMatch[0] : null,
          feeTextSnippet: rawFee,
          rawMatchedKeywords: classification.matchedKeywords,
        },
      };

      return {
        success: true,
        parserKey: this.parserKey,
        items: [item],
      };
    } catch (err: any) {
      return {
        success: false,
        parserKey: this.parserKey,
        items: [],
        error: err?.message || 'Generic PDF text parsing error',
        errorCode: 'PDF_PARSER_EXCEPTION',
      };
    }
  }
}
