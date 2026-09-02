/**
 * StudyMate Sarkari — Step 5: SSC (Staff Selection Commission) Official Adapter
 */

import { ParserInput, ParserResult, RawExtractedItem, SourceParser } from '../../../../types/parser';
import { parseHtmlDocument } from '../htmlTokenizer';
import { normalizeTitle } from '../../normalizers/textNormalizer';
import { verifyAndSanitizeUrl } from '../../verification/urlSecurityVerifier';
import { classifyContent } from '../../verification/contentClassifier';

export class SscAdapter implements SourceParser {
  name = 'Staff Selection Commission (SSC) Adapter';
  parserKey = 'ssc_notices';

  canHandle(input: ParserInput): boolean {
    return (
      input.parserKey === 'ssc_notices' ||
      input.officialUrl.includes('ssc.gov.in') ||
      input.officialUrl.includes('ssc.nic.in')
    );
  }

  async parse(input: ParserInput): Promise<ParserResult> {
    try {
      const doc = parseHtmlDocument(input.content);
      const items: RawExtractedItem[] = [];

      // Parse SSC latest notices list & tables
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
              rawOrganization: 'Staff Selection Commission (SSC)',
              rawPostName: cleanTitle.slice(0, 100),
              rawDates: {
                notificationDate: notifDate || null,
              },
              rawNotificationUrl: notifUrl || (input.finalUrl || input.officialUrl),
              rawApplyUrl: 'https://ssc.gov.in',
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

      // Link-based extraction
      if (items.length === 0) {
        for (const link of doc.links) {
          if (link.text.length > 10 && /notice|cgl|chsl|mts|gd|cpo|je|stenographer|admit|result/i.test(link.text)) {
            const classification = classifyContent(link.text);
            const urlCheck = verifyAndSanitizeUrl(link.href, input.finalUrl || input.officialUrl);

            if (urlCheck.isValid && urlCheck.canonicalUrl) {
              items.push({
                rawTitle: normalizeTitle(link.text),
                rawOrganization: 'Staff Selection Commission (SSC)',
                rawPostName: link.text.slice(0, 100),
                rawNotificationUrl: urlCheck.canonicalUrl,
                rawApplyUrl: 'https://ssc.gov.in',
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
        error: err?.message || 'SSC Adapter parsing error',
        errorCode: 'SSC_ADAPTER_EXCEPTION',
      };
    }
  }
}
