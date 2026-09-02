/**
 * StudyMate Sarkari — Step 5: UPSC Recruitment & Examination Portal Adapter
 */

import { ParserInput, ParserResult, RawExtractedItem, SourceParser } from '../../../../types/parser';
import { parseHtmlDocument } from '../htmlTokenizer';
import { normalizeTitle } from '../../normalizers/textNormalizer';
import { verifyAndSanitizeUrl } from '../../verification/urlSecurityVerifier';
import { classifyContent } from '../../verification/contentClassifier';

export class UpscAdapter implements SourceParser {
  name = 'UPSC Recruitment & Examination Adapter';
  parserKey = 'upsc_recruitment';

  canHandle(input: ParserInput): boolean {
    return (
      input.parserKey === 'upsc_recruitment' ||
      input.parserKey === 'upsc_online' ||
      input.officialUrl.includes('upsc.gov.in') ||
      input.officialUrl.includes('upsconline.nic.in')
    );
  }

  async parse(input: ParserInput): Promise<ParserResult> {
    try {
      const doc = parseHtmlDocument(input.content);
      const items: RawExtractedItem[] = [];

      // 1. Process structured UPSC announcement / recruitment tables
      for (const table of doc.tables) {
        for (const row of table.rows) {
          if (row.cells.length < 2) continue;

          let titleText = '';
          let notifUrl = '';
          let applyUrl = '';
          let notifDate = '';
          let closingDate = '';

          for (const cell of row.cells) {
            // Find PDF links (Notification / Advt)
            for (const link of cell.links) {
              const urlCheck = verifyAndSanitizeUrl(link.href, input.finalUrl || input.officialUrl);
              if (urlCheck.isValid && urlCheck.canonicalUrl) {
                if (/\.pdf$/i.test(urlCheck.canonicalUrl) || /document|notice|advertisement/i.test(link.text)) {
                  notifUrl = urlCheck.canonicalUrl;
                } else if (/apply|ora|registration/i.test(link.text)) {
                  applyUrl = urlCheck.canonicalUrl;
                }
              }
            }

            // Detect Date strings
            const dateMatch = cell.text.match(/\b\d{1,2}[-/.](?:\d{1,2}|[a-zA-Z]{3,9})[-/.]\d{2,4}\b/);
            if (dateMatch) {
              if (!notifDate) notifDate = dateMatch[0];
              else closingDate = dateMatch[0];
            }

            // Detect meaningful title
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
              rawOrganization: 'Union Public Service Commission (UPSC)',
              rawPostName: cleanTitle.slice(0, 100),
              rawNotificationNumber: advtMatch ? advtMatch[1] : null,
              rawDates: {
                notificationDate: notifDate || null,
                applyEndDate: closingDate || null,
              },
              rawNotificationUrl: notifUrl || (input.finalUrl || input.officialUrl),
              rawApplyUrl: applyUrl || 'https://upsconline.nic.in',
              rawSourceUrl: input.finalUrl || input.officialUrl,
              detectedType: classification.detectedType,
              evidence: {
                dateTextSnippet: notifDate ? `Published: ${notifDate} ${closingDate ? `| Last Date: ${closingDate}` : ''}` : null,
                noticeNumberSnippet: advtMatch ? advtMatch[0] : null,
                rawMatchedKeywords: classification.matchedKeywords,
              },
            });
          }
        }
      }

      // If no tables matched, fallback to link scan
      if (items.length === 0) {
        for (const link of doc.links) {
          if (link.text.length > 10 && /examination|recruitment|civil services|nda|cds|admit|result/i.test(link.text)) {
            const classification = classifyContent(link.text);
            const urlCheck = verifyAndSanitizeUrl(link.href, input.finalUrl || input.officialUrl);

            if (urlCheck.isValid && urlCheck.canonicalUrl) {
              items.push({
                rawTitle: normalizeTitle(link.text),
                rawOrganization: 'Union Public Service Commission (UPSC)',
                rawPostName: link.text.slice(0, 100),
                rawNotificationUrl: urlCheck.canonicalUrl,
                rawApplyUrl: 'https://upsconline.nic.in',
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
        error: err?.message || 'UPSC Adapter parsing error',
        errorCode: 'UPSC_ADAPTER_EXCEPTION',
      };
    }
  }
}
