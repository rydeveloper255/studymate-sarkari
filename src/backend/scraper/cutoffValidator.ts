/**
 * StudyMate Sarkari — Date Cutoff Validator for Scraper Engine
 *
 * MANDATE:
 * - Only notices published or dated 1 August 2026 (2026-08-01) or later are admitted.
 * - Any notice, circular, or vacancy dated prior to 2026-08-01 MUST be strictly rejected.
 * - Historical backfills or archives from 2025 or earlier in 2026 are completely blocked.
 */

import { CutoffCheckResult, RawScrapedNotice } from './types';

export const DEFAULT_CUTOFF_DATE = '2026-08-01';

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/**
 * Normalizes various Indian date representations into ISO string 'YYYY-MM-DD'.
 */
export function normalizeDateStringToIso(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim();
  if (!clean) return null;

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    return formatIso(year, month, day);
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const slashDashMatch = clean.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (slashDashMatch) {
    const day = parseInt(slashDashMatch[1], 10);
    const month = parseInt(slashDashMatch[2], 10);
    const year = parseInt(slashDashMatch[3], 10);
    return formatIso(year, month, day);
  }

  // 3. DD Month YYYY (e.g., 15 August 2026 or 15-Aug-2026)
  const textMonthMatch = clean.match(/(\d{1,2})\s*[- ]\s*([A-Za-z]{3,9})\s*[- ]\s*(\d{4})/);
  if (textMonthMatch) {
    const day = parseInt(textMonthMatch[1], 10);
    const monthStr = textMonthMatch[2].toLowerCase();
    const year = parseInt(textMonthMatch[3], 10);
    const month = MONTH_MAP[monthStr];
    if (month) {
      return formatIso(year, month, day);
    }
  }

  // 4. Month DD, YYYY (e.g., August 15, 2026)
  const monthFirstMatch = clean.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthFirstMatch) {
    const monthStr = monthFirstMatch[1].toLowerCase();
    const day = parseInt(monthFirstMatch[2], 10);
    const year = parseInt(monthFirstMatch[3], 10);
    const month = MONTH_MAP[monthStr];
    if (month) {
      return formatIso(year, month, day);
    }
  }

  // 5. Native Date fallback
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return formatIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  return null;
}

function formatIso(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2050 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Validates whether a given date candidate satisfies the August 1, 2026 cutoff.
 */
export function validateDateCutoff(
  dateCandidate?: string | null,
  cutoffDate: string = DEFAULT_CUTOFF_DATE
): CutoffCheckResult {
  if (!dateCandidate || typeof dateCandidate !== 'string' || !dateCandidate.trim()) {
    return {
      eligible: false,
      cutoffDate,
      detectedDate: null,
      normalizedDate: null,
      reason: 'No publication or notification date specified. Historical archive backfill is disallowed.',
    };
  }

  const normalized = normalizeDateStringToIso(dateCandidate);
  if (!normalized) {
    return {
      eligible: false,
      cutoffDate,
      detectedDate: dateCandidate,
      normalizedDate: null,
      reason: `Could not parse valid calendar date from candidate: "${dateCandidate}"`,
    };
  }

  // Lexicographical comparison works reliably on 'YYYY-MM-DD'
  if (normalized < cutoffDate) {
    return {
      eligible: false,
      cutoffDate,
      detectedDate: dateCandidate,
      normalizedDate: normalized,
      reason: `Notice date (${normalized}) is prior to the strict cutoff of ${cutoffDate}. Discarded.`,
    };
  }

  return {
    eligible: true,
    cutoffDate,
    detectedDate: dateCandidate,
    normalizedDate: normalized,
    reason: `Notice date (${normalized}) satisfies the cutoff of ${cutoffDate} or later.`,
  };
}

/**
 * Searches text snippet or notice fields to extract potential dates and check against cutoff.
 */
export function extractAndValidateNoticeCutoff(
  notice: RawScrapedNotice,
  cutoffDate: string = DEFAULT_CUTOFF_DATE
): CutoffCheckResult {
  // Check explicit date fields in order of priority:
  // 1. publicationDate
  // 2. applyStartDate
  // 3. notificationNumber or title with year/date
  // 4. examDate or applyEndDate

  const candidates: Array<{ label: string; value?: string | null }> = [
    { label: 'publicationDate', value: notice.publicationDate },
    { label: 'applyStartDate', value: notice.applyStartDate },
    { label: 'applyEndDate', value: notice.applyEndDate },
    { label: 'examDate', value: notice.examDate },
  ];

  for (const candidate of candidates) {
    if (candidate.value) {
      const result = validateDateCutoff(candidate.value, cutoffDate);
      if (result.normalizedDate) {
        return result;
      }
    }
  }

  // Scan raw title or summary for dates (e.g. "Advt. No. 08/2026 dated 15/08/2026")
  const combinedText = `${notice.title || ''} ${notice.summary || ''} ${notice.notificationNumber || ''}`;
  const extractedDate = scanTextForDate(combinedText);

  if (extractedDate) {
    return validateDateCutoff(extractedDate, cutoffDate);
  }

  // Check if title mentions a future or current year (2026+) without explicit day
  if (combinedText.includes('2026')) {
    // If it mentions 2026, check if month is mentioned
    const lower = combinedText.toLowerCase();
    const monthsMentioned = Object.keys(MONTH_MAP).filter((m) => lower.includes(m));
    if (monthsMentioned.length > 0) {
      // Find latest month mentioned
      const monthNums = monthsMentioned.map((m) => MONTH_MAP[m]);
      const maxMonth = Math.max(...monthNums);
      if (maxMonth < 8) {
        return {
          eligible: false,
          cutoffDate,
          detectedDate: `2026-${String(maxMonth).padStart(2, '0')}`,
          normalizedDate: `2026-${String(maxMonth).padStart(2, '0')}-01`,
          reason: `Notice pertains to month prior to August 2026 (Month ${maxMonth}). Discarded.`,
        };
      }
      return {
        eligible: true,
        cutoffDate,
        detectedDate: `2026-${String(maxMonth).padStart(2, '0')}`,
        normalizedDate: `2026-${String(maxMonth).padStart(2, '0')}-01`,
        reason: `Notice mentions 2026 with month >= August.`,
      };
    }
  }

  // Historical years (2025, 2024, 2023, etc.) are strictly rejected
  if (/\b(202[0-5]|201\d)\b/.test(combinedText)) {
    const historicalMatch = combinedText.match(/\b(202[0-5]|201\d)\b/);
    return {
      eligible: false,
      cutoffDate,
      detectedDate: historicalMatch ? historicalMatch[0] : null,
      normalizedDate: null,
      reason: `Notice explicitly references historical year (${historicalMatch ? historicalMatch[0] : 'prior'}). Discarded.`,
    };
  }

  return {
    eligible: false,
    cutoffDate,
    detectedDate: null,
    normalizedDate: null,
    reason: 'Could not determine verified publication date on or after 1 August 2026.',
  };
}

/**
 * Helper to scan free-form text for calendar dates.
 */
function scanTextForDate(text: string): string | null {
  // DD/MM/YYYY or DD-MM-YYYY
  const m1 = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
  if (m1) return m1[0];

  // DD Month YYYY (e.g. 15 August 2026)
  const m2 = text.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
  if (m2) return m2[0];

  // Month DD, YYYY
  const m3 = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (m3) return m3[0];

  return null;
}
