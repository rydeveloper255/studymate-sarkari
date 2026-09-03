/**
 * StudyMate Sarkari — PDF Content Fetch Adapter
 *
 * Handles direct PDF government circulars, gazettes, and recruitment notifications:
 * - Fetches raw PDF binary buffer
 * - Extracts plain text streams using pdf-parse with fallback
 * - Extracts vacancy title, advertisement numbers, important dates, and eligibility criteria
 */

import { BaseFetchAdapter } from './baseAdapter';
import { JobSourceRecord, RawScrapedNotice } from '../types';
import { extractTextFromPdfBuffer } from '../../../lib/server/parsers/pdfTextExtractor';

export class PdfFetchAdapter extends BaseFetchAdapter {
  readonly name = 'PdfFetchAdapter';
  readonly supportedTypes = ['pdf', 'circular', 'gazette'];

  protected override maxBytesLimit = 15 * 1024 * 1024; // 15 MB for large gazette PDFs

  canHandle(source: JobSourceRecord): boolean {
    const type = (source.source_type || '').toLowerCase();
    const url = (source.recruitment_url || source.official_url || '').toLowerCase();
    return this.supportedTypes.includes(type) || url.endsWith('.pdf') || url.includes('.pdf?');
  }

  /**
   * Overrides processPayload to convert PDF binary into readable text
   */
  protected override async processPayload(buffer: Buffer, _contentType: string, _url: string): Promise<string> {
    const extracted = await extractTextFromPdfBuffer(buffer);
    if (extracted.success && extracted.text) {
      return extracted.text;
    }
    // Return empty string if extraction fails
    return '';
  }

  /**
   * Extracts notice item from parsed PDF text
   */
  extractNotices(text: string, pdfUrl: string, source: JobSourceRecord): RawScrapedNotice[] {
    const notices: RawScrapedNotice[] = [];
    if (!text || text.length < 30) return notices;

    // Detect advertisement number (e.g. Advt No. 05/2026 or Notification No. 12/2026)
    const advtMatch = text.match(/(?:advt\.?\s*no\.?|notification\s*no\.?|advertisement\s*no\.?|employment\s*notice\s*no\.?)\s*[:\-]?\s*([A-Za-z0-9\/\-_]+)/i);
    const notificationNumber = advtMatch ? advtMatch[1].trim() : undefined;

    // Detect date
    const dateMatch = text.match(/(?:dated|date of notification|published on|opening date)\s*[:\-]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{4})/i) ||
      text.match(/\b(\d{1,2}[./\-]\d{1,2}[./\-]\d{4})\b/);
    const publicationDate = dateMatch ? this.formatDate(dateMatch[1]) : null;

    // Detect apply deadline
    const endMatch = text.match(/(?:closing date|last date for submission|last date of application|apply before)\s*[:\-]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{4})/i);
    const applyEndDate = endMatch ? this.formatDate(endMatch[1]) : null;

    // Extract title from top lines of PDF
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 5);
    const topLines = lines.slice(0, 10);
    const potentialTitle = topLines.find((l) =>
      /recruitment|examination|notification|advertisement|post|vacancy|selection/i.test(l)
    ) || topLines[0] || `${source.name} Official Recruitment Notification`;

    // Detect total vacancies
    const vacancyMatch = text.match(/(?:total\s*vacanc(?:ies|y)|number\s*of\s*posts?)\s*[:\-]?\s*(\d{1,6})/i);
    const totalVacancies = vacancyMatch ? parseInt(vacancyMatch[1], 10) : undefined;

    notices.push({
      title: potentialTitle.slice(0, 200),
      organization: source.organization || source.name,
      notificationNumber,
      publicationDate,
      applyEndDate,
      totalVacancies,
      officialNotificationUrl: pdfUrl,
      rawHtmlOrText: text.slice(0, 2000),
      summary: text.slice(0, 400),
      detectedType: 'vacancy',
    });

    return notices;
  }

  private formatDate(raw: string): string | null {
    const parts = raw.split(/[./-]/);
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
    return null;
  }
}
