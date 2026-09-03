/**
 * StudyMate Sarkari — Deterministic Application Status Engine
 *
 * Rules:
 * - If applyStartDate is strictly in the future -> UPCOMING
 * - If applyEndDate is strictly in the past -> CLOSED
 * - If applyEndDate is within 3 days from current date -> CLOSING_SOON
 * - Otherwise, when open -> ACTIVE
 * - If dates are missing or "Refer notification" -> preserves existing status or defaults to ACTIVE
 */

import { ImportantDates, JobStatus } from '../../types';

/**
 * Returns today's date in Asia/Kolkata timezone (Indian Standard Time, UTC+05:30) as YYYY-MM-DD.
 */
export function getTodayIST(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function deriveDeterministicJobStatus(
  dates: ImportantDates,
  fallbackStatus: JobStatus = 'Active'
): JobStatus {
  if (!dates) return fallbackStatus;

  const todayStr = getTodayIST();

  // Helper to parse YYYY-MM-DD
  const parseDate = (dStr?: string): Date | null => {
    if (!dStr) return null;
    const match = dStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const startDate = parseDate(dates.applyStartDate);
  const endDate = parseDate(dates.applyEndDate);

  // Today in IST
  const today = new Date(todayStr);

  // 1. Check if application start date is strictly in the future
  if (startDate && startDate > today) {
    return 'Upcoming';
  }

  // 2. Check if application end date is in the past
  if (endDate) {
    const endDay = new Date(endDate.toISOString().split('T')[0]);
    if (endDay < today) {
      return 'Closed';
    }

    // 3. Check if closing within 3 days (inclusive)
    const diffMs = endDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 3) {
      return 'Closing Soon';
    }

    return 'Active';
  }

  return fallbackStatus;
}

/**
 * Checks whether a job vacancy form is currently LIVE.
 * Live rule: application_start <= CURRENT_TIME AND application_end >= CURRENT_TIME
 * If application_end < CURRENT_TIME -> false (Closed/Expired, never shown in live vacancies)
 */
export function isJobApplicationLive(dates?: ImportantDates, status?: JobStatus): boolean {
  if (status === 'Closed') return false;
  if (!dates) return status === 'Active' || status === 'Closing Soon';

  const derived = deriveDeterministicJobStatus(dates, status);
  return derived === 'Active' || derived === 'Closing Soon';
}
