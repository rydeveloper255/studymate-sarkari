import { getSupabase } from '../supabase';
import { AnswerKeyItem, JobSector } from '../../types';
import { DbAnswerKey, PaginatedResult } from '../../types/database';
import { DEMO_ANSWER_KEYS } from '../../data/demoAnswerKeys';
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

      if (!error && data && data.length > 0) {
        const total = count ?? data.length;
        return {
          data: data.map((row: DbAnswerKey) => mapDbAnswerKeyToItem(row)),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          isSupabaseSource: true,
        };
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase answer keys query error:', err);
    }
  }

  // Fallback
  let results = [...DEMO_ANSWER_KEYS];

  if (options.sector && options.sector !== 'all') {
    results = results.filter((item) => item.sector === options.sector);
  }

  if (options.stateName) {
    results = results.filter(
      (item) => item.stateName?.toLowerCase() === options.stateName?.toLowerCase()
    );
  }

  if (options.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.toLowerCase().trim();
    results = results.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.organization.toLowerCase().includes(q) ||
        item.examName.toLowerCase().includes(q)
    );
  }

  results.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  const total = results.length;
  const from = (page - 1) * pageSize;
  const paginatedData = results.slice(from, from + pageSize);

  return {
    data: paginatedData,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    isSupabaseSource: false,
  };
}
