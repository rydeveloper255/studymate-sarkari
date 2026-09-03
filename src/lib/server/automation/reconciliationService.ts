/**
 * StudyMate Sarkari — Production Vacancy Reconciliation & Lifecycle Engine
 *
 * RULES:
 * 1. Automatically finds active government_jobs where application_end < CURRENT_TIME (in Asia/Kolkata).
 * 2. Changes status to 'Closed' and is_active to false.
 * 3. Never deletes the record (preserves historical data integrity).
 * 4. Invalidates server-side public caches so the live vacancies section immediately excludes closed forms.
 * 5. Runs periodically (every 15–30 minutes) and on system boot.
 */

import { getSupabaseAdmin, getAllJobsForAdmin, updateJobStatus, savePublishLog } from '../supabaseAdmin';
import { getCurrentDateIST } from '../verification/dateValidator';
import { normalizeSingleDate } from '../normalizers/dateNormalizer';
import { serverCache } from '../cache/publicCache';

export interface ReconciliationReport {
  timestamp: string;
  totalActiveChecked: number;
  expiredClosedCount: number;
  upcomingCount: number;
  errors: string[];
}

/**
 * Reconciles all active vacancies against their application closing dates in Asia/Kolkata timezone.
 */
export async function reconcileExpiredVacancies(): Promise<ReconciliationReport> {
  const timestamp = new Date().toISOString();
  const todayIST = getCurrentDateIST();
  const errors: string[] = [];
  let expiredClosedCount = 0;
  let upcomingCount = 0;

  try {
    const activeJobs = await getAllJobsForAdmin({ onlyActive: true });

    for (const job of activeJobs) {
      try {
        const dates = job.important_dates;
        if (!dates) continue;

        const endParsed = normalizeSingleDate(dates.applyEndDate);
        const startParsed = normalizeSingleDate(dates.applyStartDate);

        // 1. Check if application has expired
        if (endParsed.isValid && endParsed.isoDate) {
          if (endParsed.isoDate < todayIST) {
            // Expired: Mark Closed
            await updateJobStatus(job.id, 'Closed', false);
            expiredClosedCount++;

            await savePublishLog({
              target_type: 'government_jobs',
              target_id: job.id,
              action: 'STATUS_EXPIRED',
              previous_status: job.status,
              new_status: 'Closed',
              success: true,
            });

            continue;
          }
        }

        // 2. Check if application hasn't started yet
        if (startParsed.isValid && startParsed.isoDate) {
          if (startParsed.isoDate > todayIST && job.status !== 'Upcoming') {
            await updateJobStatus(job.id, 'Upcoming', true);
            upcomingCount++;
            continue;
          }
        }
      } catch (err: any) {
        errors.push(`Error reconciling job "${job.title}" (${job.id}): ${err?.message}`);
      }
    }

    // Invalidate caches if any statuses changed
    if (expiredClosedCount > 0 || upcomingCount > 0) {
      serverCache.invalidateTag('jobs');
      serverCache.invalidateTag('sitemap');
    }

    return {
      timestamp,
      totalActiveChecked: activeJobs.length,
      expiredClosedCount,
      upcomingCount,
      errors,
    };
  } catch (err: any) {
    errors.push(`Reconciliation error: ${err?.message}`);
    return {
      timestamp,
      totalActiveChecked: 0,
      expiredClosedCount: 0,
      upcomingCount: 0,
      errors,
    };
  }
}
