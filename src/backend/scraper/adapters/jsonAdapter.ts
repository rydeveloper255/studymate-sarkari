/**
 * StudyMate Sarkari — JSON / REST API Content Fetch Adapter
 *
 * Handles government portals providing structured JSON recruitment endpoints:
 * - Parses JSON arrays and objects
 * - Maps diverse schema fields (title, postName, advtNumber, startDate, endDate, url)
 */

import { BaseFetchAdapter } from './baseAdapter';
import { JobSourceRecord, RawScrapedNotice } from '../types';

export class JsonFetchAdapter extends BaseFetchAdapter {
  readonly name = 'JsonFetchAdapter';
  readonly supportedTypes = ['json', 'api', 'rest'];

  canHandle(source: JobSourceRecord): boolean {
    const type = (source.source_type || '').toLowerCase();
    const url = (source.recruitment_url || source.official_url || '').toLowerCase();
    return this.supportedTypes.includes(type) || url.endsWith('.json') || url.includes('/api/');
  }

  extractNotices(jsonText: string, baseUrl: string, source: JobSourceRecord): RawScrapedNotice[] {
    const notices: RawScrapedNotice[] = [];
    if (!jsonText) return notices;

    try {
      const data = JSON.parse(jsonText);
      const list: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.notices)
        ? data.notices
        : Array.isArray(data.results)
        ? data.results
        : [];

      for (const item of list) {
        if (!item || typeof item !== 'object') continue;

        const title = item.title || item.name || item.post_name || item.advertisement_title || item.notice_title;
        if (!title || typeof title !== 'string' || title.length < 5) continue;

        const pubDate = item.published_date || item.publication_date || item.created_at || item.date || item.start_date;
        const applyEndDate = item.last_date || item.end_date || item.closing_date;
        const link = item.url || item.link || item.pdf_url || item.notification_url;
        const totalVacancies = item.total_vacancies || item.vacancies || item.posts_count;

        notices.push({
          title,
          organization: item.organization || source.organization || source.name,
          notificationNumber: item.advt_no || item.notification_number,
          publicationDate: pubDate ? String(pubDate).split('T')[0] : null,
          applyEndDate: applyEndDate ? String(applyEndDate).split('T')[0] : null,
          totalVacancies: totalVacancies ? Number(totalVacancies) : undefined,
          officialNotificationUrl: link ? this.resolveUrl(link, baseUrl) : baseUrl,
          summary: item.summary || item.description || title,
          rawHtmlOrText: JSON.stringify(item),
          detectedType: 'vacancy',
        });
      }
    } catch {
      // JSON parse error
    }

    return notices;
  }

  private resolveUrl(relativeUrl: string, baseUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).toString();
    } catch {
      return relativeUrl;
    }
  }
}
