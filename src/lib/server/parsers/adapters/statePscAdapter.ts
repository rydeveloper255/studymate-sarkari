/**
 * StudyMate Sarkari — Step 5: State Public Service Commissions Generic Adapter
 */

import { ParserInput, ParserResult, RawExtractedItem, SourceParser } from '../../../../types/parser';
import { parseHtmlDocument } from '../htmlTokenizer';
import { normalizeTitle } from '../../normalizers/textNormalizer';
import { verifyAndSanitizeUrl } from '../../verification/urlSecurityVerifier';
import { classifyContent } from '../../verification/contentClassifier';

export class StatePscAdapter implements SourceParser {
  name = 'State Public Service Commissions (PSC) Adapter';
  parserKey = 'state_psc';

  canHandle(input: ParserInput): boolean {
    return (
      input.parserKey === 'state_psc' ||
      input.scope === 'state' ||
      /psc\.|\.psc\b/i.test(input.officialUrl)
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

            const advtMatch = cleanTitle.match(/(?:advt\.?\s*no\.?|notice\s*no\.?)\s*[:=-]?\s*([0-9a-zA-Z/_-]+)/i);

            items.push({
              rawTitle: cleanTitle,
              rawOrganization: input.sourceName,
              rawPostName: cleanTitle.slice(0, 100),
              rawNotificationNumber: advtMatch ? advtMatch[1] : null,
              rawDates: {
                notificationDate: notifDate || null,
              },
              rawNotificationUrl: notifUrl || (input.finalUrl || input.officialUrl),
              rawApplyUrl: input.finalUrl || input.officialUrl,
              rawSourceUrl: input.finalUrl || input.officialUrl,
              detectedType: classification.detectedType,
              evidence: {
                dateTextSnippet: notifDate || null,
                noticeNumberSnippet: advtMatch ? advtMatch[0] : null,
                rawMatchedKeywords: classification.matchedKeywords,
              },
            });
          }
        }
      }

      // Link-based fallback
      if (items.length === 0) {
        for (const link of doc.links) {
          if (link.text.length > 10 && /advt|recruitment|examination|notice|admit|result|answer key/i.test(link.text)) {
            const classification = classifyContent(link.text);
            const urlCheck = verifyAndSanitizeUrl(link.href, input.finalUrl || input.officialUrl);

            if (urlCheck.isValid && urlCheck.canonicalUrl) {
              items.push({
                rawTitle: normalizeTitle(link.text),
                rawOrganization: input.sourceName,
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
        error: err?.message || 'State PSC Adapter parsing error',
        errorCode: 'STATE_PSC_EXCEPTION',
      };
    }
  }
}
