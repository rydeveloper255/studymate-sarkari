/**
 * StudyMate Sarkari — Step 5: Generic HTML Source Parser
 */

import { ParserInput, ParserResult, RawExtractedItem, SourceParser } from '../../../types/parser';
import { parseHtmlDocument } from './htmlTokenizer';
import { normalizeTitle } from '../normalizers/textNormalizer';
import { verifyAndSanitizeUrl } from '../verification/urlSecurityVerifier';
import { classifyContent } from '../verification/contentClassifier';

export class GenericHtmlParser implements SourceParser {
  name = 'Generic HTML Parser';
  parserKey = 'generic_html';

  canHandle(input: ParserInput): boolean {
    return (
      input.sourceType === 'html' ||
      input.parserKey === 'generic_html' ||
      !input.parserKey ||
      input.parserKey === 'html'
    );
  }

  async parse(input: ParserInput): Promise<ParserResult> {
    try {
      const doc = parseHtmlDocument(input.content);
      const items: RawExtractedItem[] = [];
      const warnings: string[] = [];

      // Strategy 1: Extract from HTML Tables (Standard Government Recruitment List Format)
      for (const table of doc.tables) {
        for (const row of table.rows) {
          if (row.cells.length < 2) continue;

          // Look for row with notice title and link
          let titleCell = '';
          let dateCell = '';
          let notificationUrl = '';
          let applyUrl = '';

          for (const cell of row.cells) {
            // Check if cell contains PDF/Notification link
            for (const link of cell.links) {
              const urlCheck = verifyAndSanitizeUrl(link.href, input.finalUrl || input.officialUrl);
              if (urlCheck.isValid && urlCheck.canonicalUrl) {
                if (/\.pdf$/i.test(urlCheck.canonicalUrl) || /download|notice|advt|view/i.test(link.text)) {
                  notificationUrl = urlCheck.canonicalUrl;
                } else if (/apply|registration|online/i.test(link.text)) {
                  applyUrl = urlCheck.canonicalUrl;
                }
              }
            }

            // Detect date cell
            if (/\b\d{1,2}[-/.](?:\d{1,2}|[a-zA-Z]{3,9})[-/.]\d{2,4}\b/.test(cell.text)) {
              dateCell = cell.text;
            }

            // Detect title cell
            if (cell.text.length > 8 && !/^\d+$/.test(cell.text) && !dateCell) {
              titleCell = cell.text;
            }
          }

          if (titleCell && titleCell.length > 5) {
            const cleanTitle = normalizeTitle(titleCell);
            const classification = classifyContent(cleanTitle);

            // Extract notice number if present
            const notifNoMatch = cleanTitle.match(/(?:advt|adv|notification|notice|cen|no)\.?\s*[:=\-–]?\s*([0-9a-zA-Z/_-]+)/i);

            items.push({
              rawTitle: cleanTitle,
              rawOrganization: input.sourceName,
              rawPostName: cleanTitle.slice(0, 100),
              rawNotificationNumber: notifNoMatch ? notifNoMatch[1] : null,
              rawDates: {
                notificationDate: dateCell || null,
                applyEndDate: null,
              },
              rawNotificationUrl: notificationUrl || (input.finalUrl || input.officialUrl),
              rawApplyUrl: applyUrl || null,
              rawSourceUrl: input.finalUrl || input.officialUrl,
              detectedType: classification.detectedType,
              evidence: {
                dateTextSnippet: dateCell || null,
                rawMatchedKeywords: classification.matchedKeywords,
              },
            });
          }
        }
      }

      // Strategy 2: If no table rows matched, inspect links with recruitment/notice keywords
      if (items.length === 0) {
        for (const link of doc.links) {
          if (link.text.length > 10) {
            const classification = classifyContent(link.text);
            if (classification.confidence !== 'LOW') {
              const urlCheck = verifyAndSanitizeUrl(link.href, input.finalUrl || input.officialUrl);
              if (urlCheck.isValid && urlCheck.canonicalUrl) {
                items.push({
                  rawTitle: normalizeTitle(link.text),
                  rawOrganization: input.sourceName,
                  rawPostName: link.text.slice(0, 100),
                  rawNotificationUrl: urlCheck.canonicalUrl,
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
      }

      // Fallback: If still 0 items, but page has meaningful recruitment title
      if (items.length === 0 && doc.pageTitle) {
        const classification = classifyContent(doc.pageTitle, doc.metaDescription);
        if (classification.confidence !== 'LOW') {
          items.push({
            rawTitle: normalizeTitle(doc.pageTitle),
            rawOrganization: input.sourceName,
            rawPostName: doc.pageTitle,
            rawSummary: doc.metaDescription || undefined,
            rawNotificationUrl: input.finalUrl || input.officialUrl,
            rawSourceUrl: input.finalUrl || input.officialUrl,
            detectedType: classification.detectedType,
            evidence: {
              rawMatchedKeywords: classification.matchedKeywords,
            },
          });
        }
      }

      return {
        success: true,
        parserKey: this.parserKey,
        items,
        warnings,
      };
    } catch (err: any) {
      return {
        success: false,
        parserKey: this.parserKey,
        items: [],
        error: err?.message || 'Generic HTML parsing error',
        errorCode: 'HTML_PARSER_EXCEPTION',
      };
    }
  }
}
