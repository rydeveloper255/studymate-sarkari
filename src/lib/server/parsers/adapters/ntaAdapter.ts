/**
 * StudyMate Sarkari — Step 5: NTA (National Testing Agency) Official Adapter
 */

import { ParserInput, ParserResult, RawExtractedItem, SourceParser } from '../../../../types/parser';
import { parseHtmlDocument } from '../htmlTokenizer';
import { normalizeTitle } from '../../normalizers/textNormalizer';
import { verifyAndSanitizeUrl } from '../../verification/urlSecurityVerifier';
import { classifyContent } from '../../verification/contentClassifier';

export class NtaAdapter implements SourceParser {
  name = 'National Testing Agency (NTA) Public Notices Adapter';
  parserKey = 'nta_exams';

  canHandle(input: ParserInput): boolean {
    return (
      input.parserKey === 'nta_exams' ||
      input.officialUrl.includes('nta.ac.in') ||
      input.officialUrl.includes('exams.nta.ac.in')
    );
  }

  async parse(input: ParserInput): Promise<ParserResult> {
    try {
      const doc = parseHtmlDocument(input.content);
      const items: RawExtractedItem[] = [];

      for (const table of doc.tables) {
        for (const row of table.rows) {
          if (row.cells.length < 2) continue;

          let titleText = '';
          let notifUrl = '';
          let notifDate = '';

          for (const cell of row.cells) {
            for (const link of cell.links) {
              const urlCheck = verifyAndSanitizeUrl(link.href, input.finalUrl || input.officialUrl);
              if (urlCheck.isValid && urlCheck.canonicalUrl) {
                notifUrl = urlCheck.canonicalUrl;
              }
            }

            const dateMatch = cell.text.match(/\b\d{1,2}[-/.](?:\d{1,2}|[a-zA-Z]{3,9})[-/.]\d{2,4}\b/);
            if (dateMatch) {
              notifDate = dateMatch[0];
            }

            if (cell.text.length > 8 && !dateMatch && !/^\d+$/.test(cell.text)) {
              titleText = cell.text;
            }
          }

          if (titleText && titleText.length > 5) {
            const cleanTitle = normalizeTitle(titleText);
            const classification = classifyContent(cleanTitle);

            items.push({
              rawTitle: cleanTitle,
              rawOrganization: 'National Testing Agency (NTA)',
              rawPostName: cleanTitle.slice(0, 100),
              rawDates: {
                notificationDate: notifDate || null,
              },
              rawNotificationUrl: notifUrl || (input.finalUrl || input.officialUrl),
              rawApplyUrl: input.finalUrl || input.officialUrl,
              rawSourceUrl: input.finalUrl || input.officialUrl,
              detectedType: classification.detectedType,
              evidence: {
                dateTextSnippet: notifDate || null,
                rawMatchedKeywords: classification.matchedKeywords,
              },
            });
          }
        }
      }

      if (items.length === 0) {
        for (const link of doc.links) {
          if (link.text.length > 10 && /public notice|ugc net|csir net|cuet|jee|neet|admit card|city intimation|answer key/i.test(link.text)) {
            const classification = classifyContent(link.text);
            const urlCheck = verifyAndSanitizeUrl(link.href, input.finalUrl || input.officialUrl);

            if (urlCheck.isValid && urlCheck.canonicalUrl) {
              items.push({
                rawTitle: normalizeTitle(link.text),
                rawOrganization: 'National Testing Agency (NTA)',
                rawPostName: link.text.slice(0, 100),
                rawNotificationUrl: urlCheck.canonicalUrl,
                rawApplyUrl: input.finalUrl || input.officialUrl,
                rawSourceUrl: input.finalUrl || input.officialUrl,
                detectedType: classification.detectedType,
                evidence: {
                  rawMatchedKeywords: classification.matchedKeywords,
                },
              });
            }
          }
        }
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
        error: err?.message || 'NTA Adapter parsing error',
        errorCode: 'NTA_ADAPTER_EXCEPTION',
      };
    }
  }
}
