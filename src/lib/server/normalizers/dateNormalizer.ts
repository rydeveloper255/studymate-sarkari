/**
 * StudyMate Sarkari — Step 5: Indian & International Date Normalizer & Validator
 *
 * Handles various recruitment date patterns:
 * - DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 * - YYYY-MM-DD
 * - "15 September 2026", "05-Aug-2026", "31st Oct, 2026"
 * - Date ranges: "From 01.09.2026 to 25.09.2026"
 */

import { ImportantDates } from '../../../types';

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

export interface NormalizedDateResult {
  isoDate: string | null; // "YYYY-MM-DD"
  rawText: string;
  isValid: boolean;
  isAmbiguous?: boolean;
  errorMessage?: string;
}

/**
 * Parses a single date string into YYYY-MM-DD format.
 */
export function normalizeSingleDate(raw: string | undefined | null): NormalizedDateResult {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return { isoDate: null, rawText: '', isValid: false };
  }

  const cleaned = raw
    .trim()
    .replace(/(st|nd|rd|th)\b/gi, '') // Remove ordinals: "15th" -> "15"
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ');

  // 1. Check ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = cleaned.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return {
        isoDate: formatIso(year, month, day),
        rawText: raw,
        isValid: true,
      };
    }
  }

  // 2. Check Indian numeric format: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
  const indMatch = cleaned.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/);
  if (indMatch) {
    const day = parseInt(indMatch[1], 10);
    const month = parseInt(indMatch[2], 10);
    const year = parseInt(indMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      return {
        isoDate: formatIso(year, month, day),
        rawText: raw,
        isValid: true,
      };
    }
  }

  // 3. Check textual month formats: "15 September 2026", "15-Sep-2026", "September 15, 2026"
  const textMatch = cleaned.match(/\b(0?[1-9]|[12]\d|3[01])\s*[-/ ]\s*([a-zA-Z]{3,9})\s*[-/ ]\s*(20\d{2})\b/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2].toLowerCase();
    const year = parseInt(textMatch[3], 10);
    const month = MONTH_MAP[monthStr];

    if (month && isValidCalendarDate(year, month, day)) {
      return {
        isoDate: formatIso(year, month, day),
        rawText: raw,
        isValid: true,
      };
    }
  }

  // Month-first textual: "September 15 2026"
  const textMonthFirst = cleaned.match(/\b([a-zA-Z]{3,9})\s+(0?[1-9]|[12]\d|3[01])\s*,?\s*(20\d{2})\b/);
  if (textMonthFirst) {
    const monthStr = textMonthFirst[1].toLowerCase();
    const day = parseInt(textMonthFirst[2], 10);
    const year = parseInt(textMonthFirst[3], 10);
    const month = MONTH_MAP[monthStr];

    if (month && isValidCalendarDate(year, month, day)) {
      return {
        isoDate: formatIso(year, month, day),
        rawText: raw,
        isValid: true,
      };
    }
  }

  return {
    isoDate: null,
    rawText: raw,
    isValid: false,
    errorMessage: `Unrecognized or invalid date format: "${raw}"`,
  };
}

/**
 * Extracts date ranges from strings like "01/09/2026 to 25/09/2026" or "From 10-10-2026 upto 31-10-2026".
 */
export function extractDateRange(text: string): {
  startDate: string | null;
  endDate: string | null;
  evidence: string | null;
} {
  if (!text || typeof text !== 'string') {
    return { startDate: null, endDate: null, evidence: null };
  }

  // Look for patterns with range separators: "to", "upto", "till", "-", "until"
  const rangePattern = /(?:from\s+)?([0-9a-zA-Z/.\-\s]+?)\s+(?:to|upto|till|until|[-–—])\s+([0-9a-zA-Z/.\-\s]+)/i;
  const match = text.match(rangePattern);

  if (match) {
    const parsedStart = normalizeSingleDate(match[1]);
    const parsedEnd = normalizeSingleDate(match[2]);

    if (parsedStart.isValid || parsedEnd.isValid) {
      return {
        startDate: parsedStart.isoDate,
        endDate: parsedEnd.isoDate,
        evidence: match[0].trim(),
      };
    }
  }

  return { startDate: null, endDate: null, evidence: null };
}

/**
 * Normalizes all important dates for a recruitment notice and validates chronology.
 */
export function normalizeImportantDates(rawDates?: {
  notificationDate?: string | null;
  applyStartDate?: string | null;
  applyEndDate?: string | null;
  examDate?: string | null;
  admitCardDate?: string | null;
}): {
  dates: ImportantDates;
  isValidChronology: boolean;
  warnings: string[];
  evidenceSnippet?: string | null;
  hasExplicitDate: boolean;
  explicitIsoDate: string | null;
} {
  const warnings: string[] = [];
  const notif = normalizeSingleDate(rawDates?.notificationDate);
  const start = normalizeSingleDate(rawDates?.applyStartDate);
  const end = normalizeSingleDate(rawDates?.applyEndDate);
  const exam = normalizeSingleDate(rawDates?.examDate);
  const admit = normalizeSingleDate(rawDates?.admitCardDate);

  const dates: ImportantDates = {
    notificationDate: notif.isoDate || start.isoDate || new Date().toISOString().split('T')[0],
    applyStartDate: start.isoDate || notif.isoDate || new Date().toISOString().split('T')[0],
    applyEndDate: end.isoDate || 'To be notified',
    examDate: exam.isoDate || undefined,
    admitCardDate: admit.isoDate || undefined,
  };

  const explicitIsoDate = notif.isoDate || start.isoDate || end.isoDate || exam.isoDate || admit.isoDate || null;
  const hasExplicitDate = explicitIsoDate !== null;

  let isValidChronology = true;

  // Chronological check: start <= end
  if (start.isoDate && end.isoDate) {
    if (new Date(start.isoDate).getTime() > new Date(end.isoDate).getTime()) {
      warnings.push(`Apply start date (${start.isoDate}) is after apply end date (${end.isoDate})`);
      isValidChronology = false;
    }
  }

  // Chronological check: notificationDate <= applyStartDate
  if (notif.isoDate && start.isoDate) {
    if (new Date(notif.isoDate).getTime() > new Date(start.isoDate).getTime()) {
      warnings.push(`Notification date (${notif.isoDate}) is after apply start date (${start.isoDate})`);
    }
  }

  const evidenceParts = [];
  if (start.rawText) evidenceParts.push(`Start: ${start.rawText}`);
  if (end.rawText) evidenceParts.push(`End: ${end.rawText}`);
  if (exam.rawText) evidenceParts.push(`Exam: ${exam.rawText}`);

  return {
    dates,
    isValidChronology,
    warnings,
    evidenceSnippet: evidenceParts.length > 0 ? evidenceParts.join(' | ') : null,
    hasExplicitDate,
    explicitIsoDate,
  };
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 2000 || year > 2099) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function formatIso(year: number, month: number, day: number): string {
  const m = month.toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${year}-${m}-${d}`;
}
