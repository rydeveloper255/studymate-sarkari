import { getSupabase } from '../supabase';
import { ResultItem, JobSector } from '../../types';
import { DbExamResult, PaginatedResult } from '../../types/database';
import { mapDbResultToItem } from './mappers';

export interface ResultsFetchOptions {
  sector?: 'all' | JobSector;
  searchQuery?: string;
  stateName?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchResults(
  options: ResultsFetchOptions = {}
): Promise<PaginatedResult<ResultItem>> {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const supabase = getSupabase();

  if (supabase) {
    try {
      let query = supabase.from('exam_results').select('*', { count: 'exact' });

      if (options.sector && options.sector !== 'all') {
        query = query.eq('sector', options.sector);
      }

      if (options.stateName) {
        query = query.ilike('state_name', options.stateName);
      }

      if (options.searchQuery && options.searchQuery.trim()) {
        const q = `%${options.searchQuery.trim()}%`;
        query = query.or(`title.ilike.${q},organization.ilike.${q},exam_name.ilike.${q}`);
      }

      query = query.order('result_date', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (!error && data) {
        const total = count ?? data.length;
        return {
          data: data.map((row: DbExamResult) => mapDbResultToItem(row)),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 0,
          isSupabaseSource: true,
        };
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase exam results query error:', err);
    }
  }

  // Node test fallback
  if (typeof window === 'undefined') {
    try {
      const { inMemoryResults } = await import('../server/supabaseAdmin') as any;
      if (inMemoryResults && inMemoryResults.size > 0) {
        const items = Array.from(inMemoryResults.values()).map((row: any) =>
          mapDbResultToItem(row)
        );
        return {
          data: items,
          total: items.length,
          page,
          pageSize,
          totalPages: Math.ceil(items.length / pageSize) || 1,
          isSupabaseSource: false,
        };
      }
    } catch {
      // ignore
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
