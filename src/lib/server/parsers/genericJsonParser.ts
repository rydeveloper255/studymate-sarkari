/**
 * StudyMate Sarkari — Step 5: Generic JSON API Endpoint Parser
 */

import { ParserInput, ParserResult, RawExtractedItem, SourceParser } from '../../../types/parser';
import { normalizeTitle } from '../normalizers/textNormalizer';
import { verifyAndSanitizeUrl } from '../verification/urlSecurityVerifier';
import { classifyContent } from '../verification/contentClassifier';

export class GenericJsonParser implements SourceParser {
  name = 'Generic JSON API Parser';
  parserKey = 'generic_json';

  canHandle(input: ParserInput): boolean {
    return (
      input.sourceType === 'api' ||
      input.parserKey === 'generic_json' ||
      (input.contentType?.includes('json') ?? false)
    );
  }

  async parse(input: ParserInput): Promise<ParserResult> {
    try {
      const data = JSON.parse(input.content);
      const items: RawExtractedItem[] = [];

      // Look for list/array in payload
      let list: any[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === 'object') {
        const candidateKeys = ['data', 'items', 'notices', 'vacancies', 'results', 'updates', 'records', 'notifications'];
        for (const key of candidateKeys) {
          if (Array.isArray(data[key])) {
            list = data[key];
            break;
          }
        }
      }

      for (const entry of list) {
        if (!entry || typeof entry !== 'object') continue;

        const title = entry.title || entry.name || entry.subject || entry.notice_title || entry.advertisement_title || '';
        if (!title || typeof title !== 'string' || title.length < 5) continue;

        const url = entry.url || entry.link || entry.pdf_url || entry.notification_url || entry.file_path || '';
        const applyUrl = entry.apply_url || entry.registration_url || '';
        const dateStr = entry.date || entry.published_date || entry.created_at || entry.last_date || '';
        const notifNo = entry.notice_no || entry.advt_no || entry.notification_number || '';
        const vacancies = entry.total_vacancies || entry.vacancies || entry.posts || '';

        const classification = classifyContent(title, entry.description || entry.summary || '');
        const urlCheck = verifyAndSanitizeUrl(url, input.finalUrl || input.officialUrl);
        const applyCheck = verifyAndSanitizeUrl(applyUrl, input.finalUrl || input.officialUrl);

        items.push({
          rawTitle: normalizeTitle(title),
          rawOrganization: entry.organization || input.sourceName,
          rawPostName: normalizeTitle(title).slice(0, 100),
          rawNotificationNumber: notifNo ? String(notifNo) : null,
          rawTotalVacancies: vacancies ? String(vacancies) : null,
          rawDates: {
            notificationDate: dateStr ? String(dateStr) : null,
            applyEndDate: entry.last_date ? String(entry.last_date) : null,
          },
          rawNotificationUrl: urlCheck.isValid && urlCheck.canonicalUrl ? urlCheck.canonicalUrl : (input.finalUrl || input.officialUrl),
          rawApplyUrl: applyCheck.isValid && applyCheck.canonicalUrl ? applyCheck.canonicalUrl : null,
          rawSourceUrl: input.finalUrl || input.officialUrl,
          detectedType: classification.detectedType,
          evidence: {
            dateTextSnippet: dateStr ? String(dateStr) : null,
            noticeNumberSnippet: notifNo ? String(notifNo) : null,
            rawMatchedKeywords: classification.matchedKeywords,
          },
        });
      }

      return {
        success: true,
        parserKey: this.parserKey,
        items,
      };
    } catch (err: any) {
      return {
        success: false,
        parserKey: this.parserKey,
        items: [],
        error: err?.message || 'JSON Parsing error',
        errorCode: 'JSON_PARSER_EXCEPTION',
      };
    }
  }
}
