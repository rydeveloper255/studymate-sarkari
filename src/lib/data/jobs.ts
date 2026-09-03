import { getSupabase } from '../supabase';
import { JobVacancy, JobFilterState } from '../../types';
import { DbGovernmentJob, PaginatedResult, DataFetchOptions } from '../../types/database';
import { mapDbJobToVacancy } from './mappers';

/**
 * Fetch a paginated list of government vacancies with optional filters
 */
export async function fetchJobs(
  options: DataFetchOptions = {}
): Promise<PaginatedResult<JobVacancy>> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : 12;
  const supabase = getSupabase();

  if (supabase) {
    try {
      let query = supabase
        .from('government_jobs')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Sector filter
      if (options.sector && options.sector !== 'all') {
        query = query.eq('sector', options.sector);
      }

      // State filter
      if (options.state) {
        query = query.ilike('state_code', options.state);
      }

      // Central category filter
      if (options.centralCategory && options.centralCategory !== 'All') {
        query = query.eq('central_category', options.centralCategory);
      }

      // Status filter
      if (options.status) {
        query = query.eq('status', options.status);
      }

      // Search query (ilike on title, organization_name, post_name)
      if (options.searchQuery && options.searchQuery.trim()) {
        const q = `%${options.searchQuery.trim()}%`;
        query = query.or(
          `title.ilike.${q},organization_name.ilike.${q},post_name.ilike.${q},state_name.ilike.${q}`
        );
      }

      // Sorting
      if (options.sortBy === 'last_date') {
        query = query.order('important_dates->applyEndDate', { ascending: true });
      } else if (options.sortBy === 'vacancies') {
        query = query.order('total_vacancies', { ascending: false });
      } else {
        query = query.order('published_date', { ascending: false });
      }

      // Pagination range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (!error && data && data.length > 0) {
        const total = count ?? data.length;
        return {
          data: data.map((row: DbGovernmentJob) => mapDbJobToVacancy(row)),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 0,
          isSupabaseSource: true,
        };
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase job query error:', err);
    }
  }

  // In test / offline server pipeline environment, read verified records from admin publisher store
  if (typeof window === 'undefined') {
    try {
      const { getAllActiveJobs } = await import('../server/supabaseAdmin');
      const activeJobs = await getAllActiveJobs();
      if (activeJobs && activeJobs.length > 0) {
        let results = activeJobs.map((j) => mapDbJobToVacancy(j));

        if (options.sector && options.sector !== 'all') {
          results = results.filter((j) => j.sector === options.sector);
        }
        if (options.state) {
          results = results.filter(
            (j) => j.stateCode?.toLowerCase() === options.state?.toLowerCase()
          );
        }
        if (options.centralCategory && options.centralCategory !== 'All') {
          results = results.filter((j) => j.centralCategory === options.centralCategory);
        }
        if (options.status) {
          results = results.filter((j) => j.status === options.status);
        }
        if (options.searchQuery && options.searchQuery.trim()) {
          const q = options.searchQuery.toLowerCase().trim();
          results = results.filter(
            (j) =>
              j.title.toLowerCase().includes(q) ||
              j.organization.toLowerCase().includes(q) ||
              j.postName.toLowerCase().includes(q)
          );
        }

        const total = results.length;
        const from = (page - 1) * pageSize;
        return {
          data: results.slice(from, from + pageSize),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          isSupabaseSource: false,
        };
      }
    } catch {
      // In browser or admin store unavailable
    }
  }

  return {
    data: [],
    total: 0,
    page,
    pageSize,
    totalPages: 0,
    isSupabaseSource: false,
  };
}

/**
 * Fetch a single vacancy by its slug or ID
 */
export async function fetchJobBySlugOrId(slugOrId: string): Promise<JobVacancy | null> {
  if (!slugOrId) return null;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('government_jobs')
        .select('*')
        .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return mapDbJobToVacancy(data as DbGovernmentJob);
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase job lookup error:', err);
    }
  }

  // Server test fallback
  if (typeof window === 'undefined') {
    try {
      const { getJobBySlugOrId } = await import('../server/supabaseAdmin');
      const job = await getJobBySlugOrId(slugOrId);
      if (job) {
        return mapDbJobToVacancy(job);
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Fetch featured/highlighted jobs (e.g. for homepage)
 */
export async function fetchFeaturedJobs(limit: number = 6): Promise<JobVacancy[]> {
  const result = await fetchJobs({ pageSize: limit, sortBy: 'latest' });
  return result.data;
}

/**
 * Fetch Central Government jobs
 */
export async function fetchCentralJobs(
  category?: string,
  page: number = 1,
  pageSize: number = 12
): Promise<PaginatedResult<JobVacancy>> {
  return fetchJobs({
    sector: 'central',
    centralCategory: category === 'All' ? undefined : category,
    page,
    pageSize,
  });
}

/**
 * Fetch State Government jobs for a specific state
 */
export async function fetchStateJobs(
  stateCode: string,
  page: number = 1,
  pageSize: number = 12
): Promise<PaginatedResult<JobVacancy>> {
  return fetchJobs({
    sector: 'state',
    state: stateCode,
    page,
    pageSize,
  });
}

/**
 * Fetch aggregate job statistics
 */
export async function fetchJobStats(): Promise<{
  totalActive: number;
  centralCount: number;
  stateCount: number;
  closingSoonCount: number;
}> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { count: totalActive } = await supabase
        .from('government_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: centralCount } = await supabase
        .from('government_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('sector', 'central')
        .eq('is_active', true);

      const { count: stateCount } = await supabase
        .from('government_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('sector', 'state')
        .eq('is_active', true);

      const { count: closingSoonCount } = await supabase
        .from('government_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Closing Soon')
        .eq('is_active', true);

      return {
        totalActive: totalActive || 0,
        centralCount: centralCount || 0,
        stateCount: stateCount || 0,
        closingSoonCount: closingSoonCount || 0,
      };
    } catch (err) {
      console.warn('[Data Layer] Supabase job stats error:', err);
    }
  }

  // Server test fallback
  if (typeof window === 'undefined') {
    try {
      const { getAllActiveJobs } = await import('../server/supabaseAdmin');
      const activeJobs = await getAllActiveJobs();
      return {
        totalActive: activeJobs.length,
        centralCount: activeJobs.filter((j) => j.sector === 'central').length,
        stateCount: activeJobs.filter((j) => j.sector === 'state').length,
        closingSoonCount: activeJobs.filter((j) => j.status === 'Closing Soon').length,
      };
    } catch {
      // ignore
    }
  }

  return {
    totalActive: 0,
    centralCount: 0,
    stateCount: 0,
    closingSoonCount: 0,
  };
}
