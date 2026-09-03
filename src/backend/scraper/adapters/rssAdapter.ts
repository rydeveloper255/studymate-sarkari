/**
 * StudyMate Sarkari — RSS / XML Feed Content Fetch Adapter
 *
 * Handles XML / RSS / Atom news and circular feeds provided by government portals:
 * - Parses <item> and <entry> tags
 * - Extracts title, canonical link, pubDate, and summary
 */

import { BaseFetchAdapter } from './baseAdapter';
import { JobSourceRecord, RawScrapedNotice } from '../types';

export class RssFetchAdapter extends BaseFetchAdapter {
  readonly name = 'RssFetchAdapter';
  readonly supportedTypes = ['rss', 'xml', 'atom', 'feed'];

  canHandle(source: JobSourceRecord): boolean {
    const type = (source.source_type || '').toLowerCase();
    const url = (source.recruitment_url || source.official_url || '').toLowerCase();
    return this.supportedTypes.includes(type) || url.endsWith('.xml') || url.endsWith('.rss') || url.includes('/feed') || url.includes('/rss');
  }

  extractNotices(xmlText: string, baseUrl: string, source: JobSourceRecord): RawScrapedNotice[] {
    const notices: RawScrapedNotice[] = [];
    if (!xmlText) return notices;

    // Match RSS <item> tags
    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
      const itemContent = itemMatch[1];
      const title = this.extractXmlTag(itemContent, 'title');
      const link = this.extractXmlTag(itemContent, 'link');
      const pubDate = this.extractXmlTag(itemContent, 'pubDate') || this.extractXmlTag(itemContent, 'dc:date');
      const description = this.extractXmlTag(itemContent, 'description');

      if (title && title.length > 5) {
        notices.push({
          title,
          organization: source.organization || source.name,
          publicationDate: pubDate ? this.parseDate(pubDate) : null,
          officialNotificationUrl: link || baseUrl,
          summary: description ? this.stripHtml(description).slice(0, 300) : title,
          rawHtmlOrText: itemContent,
          detectedType: 'vacancy',
        });
      }
    }

    // Match Atom <entry> tags if no RSS items found
    if (notices.length === 0) {
      const entryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
      let entryMatch: RegExpExecArray | null;

      while ((entryMatch = entryRegex.exec(xmlText)) !== null) {
        const entryContent = entryMatch[1];
        const title = this.extractXmlTag(entryContent, 'title');
        const linkMatch = entryContent.match(/<link\b[^>]*href=["']([^"']+)["']/i);
        const link = linkMatch ? linkMatch[1] : undefined;
        const updated = this.extractXmlTag(entryContent, 'updated') || this.extractXmlTag(entryContent, 'published');
        const summary = this.extractXmlTag(entryContent, 'summary') || this.extractXmlTag(entryContent, 'content');

        if (title && title.length > 5) {
          notices.push({
            title,
            organization: source.organization || source.name,
            publicationDate: updated ? this.parseDate(updated) : null,
            officialNotificationUrl: link || baseUrl,
            summary: summary ? this.stripHtml(summary).slice(0, 300) : title,
            rawHtmlOrText: entryContent,
            detectedType: 'vacancy',
          });
        }
      }
    }

    return notices;
  }

  private extractXmlTag(xml: string, tag: string): string | null {
    const match = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (match) {
      return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
    }
    return null;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private parseDate(dateStr: string): string | null {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch {
      // Fall through
    }
    return null;
  }
}
