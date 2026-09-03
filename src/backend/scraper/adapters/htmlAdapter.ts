/**
 * StudyMate Sarkari — HTML Content Fetch Adapter
 *
 * Specializes in government recruitment web pages:
 * - Decodes HTML with proper encoding
 * - Detects and cleans boilerplate/navigation
 * - Extracts table rows, list items, anchor tags, and PDF links
 * - Resolves relative URLs to canonical official government URLs
 */

import { BaseFetchAdapter } from './baseAdapter';
import { JobSourceRecord, RawScrapedNotice } from '../types';

export class HtmlFetchAdapter extends BaseFetchAdapter {
  readonly name = 'HtmlFetchAdapter';
  readonly supportedTypes = ['html', 'web', 'portal'];

  canHandle(source: JobSourceRecord): boolean {
    const type = (source.source_type || 'html').toLowerCase();
    if (['pdf', 'rss', 'xml', 'atom', 'json', 'api', 'rest'].includes(type)) {
      return false;
    }
    const url = (source.recruitment_url || source.official_url || '').toLowerCase();
    return (
      this.supportedTypes.includes(type) ||
      (!url.endsWith('.pdf') && !url.endsWith('.xml') && !url.endsWith('.rss') && !url.endsWith('.json'))
    );
  }

  /**
   * Processes buffer with charset detection if available
   */
  protected override async processPayload(buffer: Buffer, contentType: string, _url: string): Promise<string> {
    let charset = 'utf-8';
    const match = contentType.match(/charset=([^;]+)/i);
    if (match && match[1]) {
      charset = match[1].trim().toLowerCase();
    }

    try {
      if (charset === 'windows-1252' || charset === 'iso-8859-1') {
        return buffer.toString('latin1');
      }
      return buffer.toString('utf-8');
    } catch {
      return buffer.toString('utf-8');
    }
  }

  /**
   * Extracts raw notice candidates from fetched HTML content.
   */
  extractNotices(html: string, baseUrl: string, source: JobSourceRecord): RawScrapedNotice[] {
    const notices: RawScrapedNotice[] = [];
    if (!html) return notices;

    // Remove script and style tags
    const cleanedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // 1. Match Table Rows (common in UPSC, SSC, PSC recruitment tables)
    const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(cleanedHtml)) !== null) {
      const rowContent = rowMatch[1];
      const cells: string[] = [];
      const cellRegex = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        cells.push(this.stripHtmlTags(cellMatch[1]));
      }

      // Check if row has meaningful vacancy or notice data
      if (cells.length >= 2) {
        const rowText = cells.join(' ');
        if (this.isRecruitmentRow(rowText)) {
          // Extract link if any in this row
          const linkMatch = rowContent.match(/href=["']([^"']+)["']/i);
          const rawLink = linkMatch ? linkMatch[1] : undefined;
          const officialNotificationUrl = rawLink ? this.resolveUrl(rawLink, baseUrl) : undefined;

          // Find date candidates in row
          const dateStr = this.extractDateFromText(rowText);

          notices.push({
            title: cells[0].length > 10 ? cells[0] : cells[1],
            organization: source.organization || source.name,
            publicationDate: dateStr,
            officialNotificationUrl,
            summary: rowText.slice(0, 300),
            rawHtmlOrText: rowContent,
            detectedType: this.classifyNoticeType(rowText),
          });
        }
      }
    }

    // 2. Match Anchor elements with recruitment keywords (bulletins, circulars, notifications)
    const linkRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch: RegExpExecArray | null;

    while ((linkMatch = linkRegex.exec(cleanedHtml)) !== null) {
      const href = linkMatch[1];
      const linkText = this.stripHtmlTags(linkMatch[2]).trim();

      if (linkText.length > 15 && this.isRecruitmentRow(linkText)) {
        const fullUrl = this.resolveUrl(href, baseUrl);
        const dateCandidate = this.extractDateFromText(linkText);

        notices.push({
          title: linkText,
          organization: source.organization || source.name,
          publicationDate: dateCandidate,
          officialNotificationUrl: fullUrl,
          detectedType: this.classifyNoticeType(linkText),
          summary: linkText,
        });
      }
    }

    // Deduplicate notices by title and notification URL
    const seen = new Set<string>();
    return notices.filter((item) => {
      const key = `${(item.title || '').trim().toLowerCase()}_${item.officialNotificationUrl || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private isRecruitmentRow(text: string): boolean {
    const lower = text.toLowerCase();
    const keywords = [
      'recruitment',
      'advertisement',
      'vacancy',
      'notification',
      'advt',
      'post of',
      'examination',
      'admit card',
      'result',
      'answer key',
      'exam notice',
      'online application',
    ];
    return keywords.some((kw) => lower.includes(kw));
  }

  private classifyNoticeType(text: string): 'vacancy' | 'admit_card' | 'result' | 'answer_key' | 'exam_update' {
    const lower = text.toLowerCase();
    if (lower.includes('admit card') || lower.includes('hall ticket') || lower.includes('call letter')) {
      return 'admit_card';
    }
    if (lower.includes('result') || lower.includes('selection list') || lower.includes('merit list')) {
      return 'result';
    }
    if (lower.includes('answer key') || lower.includes('objection tracker')) {
      return 'answer_key';
    }
    return 'vacancy';
  }

  private extractDateFromText(text: string): string | null {
    const dMatch = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
    if (dMatch) {
      return `${dMatch[3]}-${dMatch[2].padStart(2, '0')}-${dMatch[1].padStart(2, '0')}`;
    }
    return null;
  }

  private stripHtmlTags(str: string): string {
    return str
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private resolveUrl(relativeUrl: string, baseUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).toString();
    } catch {
      return relativeUrl;
    }
  }
}
