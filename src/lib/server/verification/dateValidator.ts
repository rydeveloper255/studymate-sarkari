/**
 * StudyMate Sarkari — Production Date & Live Application Validator
 *
 * HARD MANDATE:
 * 1. DATE CUTOFF: ONLY PROCESS NEWLY PUBLISHED SOURCE CONTENT DATED 1 AUGUST 2026 OR LATER.
 *    Any notice dated before 2026-08-01 MUST NOT be imported.
 * 2. LIVE APPLICATION RULE:
 *    A vacancy is LIVE only when:
 *    application_start <= CURRENT_TIME AND application_end >= CURRENT_TIME
 *    (or officially verified currently open).
 *    If application_end < CURRENT_TIME, it MUST NOT appear in the LIVE VACANCIES section.
 * 3. TIMEZONE: Asia/Kolkata (Indian Standard Time, UTC+05:30).
 */

import { ImportantDates, JobStatus } from '../../../types';
import { normalizeSingleDate } from '../normalizers/dateNormalizer';

export const MINIMUM_ALLOWED_PUBLICATION_DATE = '2026-08-01';

/**
 * Returns current date in Indian Standard Time (Asia/Kolkata) as YYYY-MM-DD.
 */
export function getCurrentDateIST(): string {
  const now = new Date();
  // Format in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // "YYYY-MM-DD"
}

/**
 * Validates that content was published on or after the hard cutoff of 1 August 2026.
 * Content published prior to 2026-08-01 is strictly rejected.
 */
export function validatePublicationDateCutoff(
  dateCandidate?: string | null,
  context?: { title?: string; itemType?: string }
): {
  eligible: boolean;
  isoDate: string | null;
  reason?: string;
} {
  if (!dateCandidate || typeof dateCandidate !== 'string' || !dateCandidate.trim()) {
    return {
      eligible: false,
      isoDate: null,
      reason: 'Publication or notification date is missing; historical archive backfill is strictly forbidden.',
    };
  }

  const parsed = normalizeSingleDate(dateCandidate);
  if (!parsed.isValid || !parsed.isoDate) {
    return {
      eligible: false,
      isoDate: null,
      reason: `Unrecognized or invalid date format: "${dateCandidate}". Date must be verified >= 2026-08-01.`,
    };
  }

  if (parsed.isoDate < MINIMUM_ALLOWED_PUBLICATION_DATE) {
    return {
      eligible: false,
      isoDate: parsed.isoDate,
      reason: `Content date (${parsed.isoDate}) is before the hard cutoff date of ${MINIMUM_ALLOWED_PUBLICATION_DATE}.`,
    };
  }

  return {
    eligible: true,
    isoDate: parsed.isoDate,
  };
}

export interface LiveApplicationStatusCheck {
  isLive: boolean;
  status: JobStatus;
  reason: string;
  applyStartDate: string | null;
  applyEndDate: string | null;
}

/**
 * Evaluates whether a government vacancy application form is currently LIVE.
 * Live rule: application_start <= CURRENT_TIME AND application_end >= CURRENT_TIME
 * If application_end < CURRENT_TIME -> Closed (NOT live)
 */
export function evaluateLiveVacancyStatus(
  dates?: ImportantDates | null,
  options: { fallbackStatus?: JobStatus } = {}
): LiveApplicationStatusCheck {
  const todayIST = getCurrentDateIST();

  if (!dates) {
    return {
      isLive: options.fallbackStatus === 'Active',
      status: options.fallbackStatus || 'Active',
      reason: 'No dates provided; defaulting to fallback status.',
      applyStartDate: null,
      applyEndDate: null,
    };
  }

  const startParsed = normalizeSingleDate(dates.applyStartDate);
  const endParsed = normalizeSingleDate(dates.applyEndDate);

  const startDateIso = startParsed.isValid ? startParsed.isoDate : null;
  const endDateIso = endParsed.isValid ? endParsed.isoDate : null;

  // 1. Check if application has already expired/closed
  if (endDateIso) {
    if (endDateIso < todayIST) {
      return {
        isLive: false,
        status: 'Closed',
        reason: `Application end date (${endDateIso}) is in the past (today IST is ${todayIST}).`,
        applyStartDate: startDateIso,
        applyEndDate: endDateIso,
      };
    }
  }

  // 2. Check if application hasn't started yet (Upcoming)
  if (startDateIso) {
    if (startDateIso > todayIST) {
      return {
        isLive: false,
        status: 'Upcoming',
        reason: `Application start date (${startDateIso}) is in the future (today IST is ${todayIST}).`,
        applyStartDate: startDateIso,
        applyEndDate: endDateIso,
      };
    }
  }

  // 3. Check if closing soon (within 3 days inclusive)
  if (endDateIso) {
    const todayMs = new Date(todayIST).getTime();
    const endMs = new Date(endDateIso).getTime();
    const diffDays = Math.ceil((endMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 3) {
      return {
        isLive: true,
        status: 'Closing Soon',
        reason: `Application form is open and closing soon (${diffDays} day(s) remaining).`,
        applyStartDate: startDateIso,
        applyEndDate: endDateIso,
      };
    }
  }

  // 4. Currently active & open
  return {
    isLive: true,
    status: 'Active',
    reason: 'Application is currently open and active.',
    applyStartDate: startDateIso,
    applyEndDate: endDateIso,
  };
}
