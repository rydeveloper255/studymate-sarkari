/**
 * StudyMate Sarkari — Step 5: Generic RSS / Atom Feed Parser
 */

import { ParserInput, ParserResult, RawExtractedItem, SourceParser } from '../../../types/parser';
import { normalizeTitle, stripHtmlAndSanitize } from '../normalizers/textNormalizer';
import { verifyAndSanitizeUrl } from '../verification/urlSecurityVerifier';
import { classifyContent } from '../verification/contentClassifier';

export class GenericRssParser implements SourceParser {
  name = 'Generic RSS/Atom Feed Parser';
  parserKey = 'generic_rss';

  canHandle(input: ParserInput): boolean {
    return (
      input.sourceType === 'rss' ||
      input.parserKey === 'generic_rss' ||
      (input.contentType?.includes('xml') ?? false) ||
      (input.contentType?.includes('rss') ?? false)
    );
  }

  async parse(input: ParserInput): Promise<ParserResult> {
    try {
      const xml = input.content;
      const items: RawExtractedItem[] = [];

      // Extract RSS 2.0 <item> or Atom <entry>
      const itemRegex = /<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
      let match;

      while ((match = itemRegex.exec(xml)) !== null) {
        const itemBlock = match[1];

        // Extract Title
        const titleMatch = itemBlock.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const rawTitle = titleMatch ? stripHtmlAndSanitize(titleMatch[1]) : '';

        // Extract Link
        let link = '';
        const linkMatch = itemBlock.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
        if (linkMatch) {
          link = stripHtmlAndSanitize(linkMatch[1]);
        } else {
          // Atom href attribute: <link href="..." />
          const atomLink = itemBlock.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/i);
          if (atomLink) {
            link = atomLink[1].trim();
          }
        }

        // Extract Description
        const descMatch = itemBlock.match(/<(?:description|summary|content)[^>]*>([\s\S]*?)<\/(?:description|summary|content)>/i);
        const description = descMatch ? stripHtmlAndSanitize(descMatch[1]) : '';

        // Extract PubDate
        const dateMatch = itemBlock.match(/<(?:pubDate|published|updated|dc:date)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated|dc:date)>/i);
        const pubDate = dateMatch ? stripHtmlAndSanitize(dateMatch[1]) : '';

        if (rawTitle && rawTitle.length > 5) {
          const classification = classifyContent(rawTitle, description);
          const urlCheck = verifyAndSanitizeUrl(link, input.finalUrl || input.officialUrl);

          items.push({
            rawTitle: normalizeTitle(rawTitle),
            rawOrganization: input.sourceName,
            rawPostName: normalizeTitle(rawTitle).slice(0, 100),
            rawDates: {
              notificationDate: pubDate || null,
            },
            rawSummary: description.slice(0, 300),
            rawNotificationUrl: urlCheck.isValid && urlCheck.canonicalUrl ? urlCheck.canonicalUrl : (input.finalUrl || input.officialUrl),
            rawSourceUrl: input.finalUrl || input.officialUrl,
            detectedType: classification.detectedType,
            evidence: {
              dateTextSnippet: pubDate || null,
              rawMatchedKeywords: classification.matchedKeywords,
            },
          });
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
        error: err?.message || 'RSS Feed parsing error',
        errorCode: 'RSS_PARSER_EXCEPTION',
      };
    }
  }
}
