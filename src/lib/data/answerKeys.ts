import { getSupabase } from '../supabase';
import { AnswerKeyItem, JobSector } from '../../types';
import { DbAnswerKey, PaginatedResult } from '../../types/database';
import { mapDbAnswerKeyToItem } from './mappers';

export interface AnswerKeyFetchOptions {
  sector?: 'all' | JobSector;
  searchQuery?: string;
  stateName?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchAnswerKeys(
  options: AnswerKeyFetchOptions = {}
): Promise<PaginatedResult<AnswerKeyItem>> {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const supabase = getSupabase();

  if (supabase) {
    try {
      let query = supabase.from('answer_keys').select('*', { count: 'exact' });

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

      query = query.order('release_date', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (!error && data) {
        const total = count ?? data.length;
        return {
          data: data.map((row: DbAnswerKey) => mapDbAnswerKeyToItem(row)),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 0,
          isSupabaseSource: true,
        };
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase answer keys query error:', err);
    }
  }

  // Node test fallback
  if (typeof window === 'undefined') {
    try {
      const { inMemoryAnswerKeys } = await import('../server/supabaseAdmin') as any;
      if (inMemoryAnswerKeys && inMemoryAnswerKeys.size > 0) {
        const items = Array.from(inMemoryAnswerKeys.values()).map((row: any) =>
          mapDbAnswerKeyToItem(row)
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
