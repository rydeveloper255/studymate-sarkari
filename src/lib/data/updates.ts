import { getSupabase } from '../supabase';
import { GovernmentUpdate, UpdateCategory } from '../../types';
import { DbGovernmentUpdate, PaginatedResult } from '../../types/database';
import { DEMO_UPDATES } from '../../data/demoUpdates';
import { mapDbUpdateToUpdate } from './mappers';

export interface UpdateFetchOptions {
  category?: string;
  searchQuery?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  isHighPriorityOnly?: boolean;
}

export async function fetchUpdates(
  options: UpdateFetchOptions = {}
): Promise<PaginatedResult<GovernmentUpdate>> {
  const page = options.page || 1;
  const pageSize = options.pageSize || options.limit || 20;
  const supabase = getSupabase();

  if (supabase) {
    try {
      let query = supabase.from('government_updates').select('*', { count: 'exact' });

      if (options.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      if (options.isHighPriorityOnly) {
        query = query.eq('is_high_priority', true);
      }

      if (options.searchQuery && options.searchQuery.trim()) {
        const q = `%${options.searchQuery.trim()}%`;
        query = query.or(`title.ilike.${q},organization.ilike.${q},summary.ilike.${q}`);
      }

      query = query.order('update_date', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (!error && data && data.length > 0) {
        const total = count ?? data.length;
        return {
          data: data.map((row: DbGovernmentUpdate) => mapDbUpdateToUpdate(row)),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          isSupabaseSource: true,
        };
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase updates query error:', err);
    }
  }

  // Fallback
  let results = [...DEMO_UPDATES];

  if (options.category && options.category !== 'all') {
    results = results.filter((u) => u.category === options.category);
  }

  if (options.isHighPriorityOnly) {
    results = results.filter((u) => u.isHighPriority);
  }

  if (options.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.toLowerCase().trim();
    results = results.filter(
      (u) =>
        u.title.toLowerCase().includes(q) ||
        u.organization.toLowerCase().includes(q) ||
        u.summary.toLowerCase().includes(q)
    );
  }

  results.sort((a, b) => b.date.localeCompare(a.date));

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

export async function fetchLatestUpdates(limit: number = 6): Promise<GovernmentUpdate[]> {
  const res = await fetchUpdates({ limit, pageSize: limit });
  return res.data;
}

export async function fetchUpdateById(id: string): Promise<GovernmentUpdate | null> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('government_updates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapDbUpdateToUpdate(data as DbGovernmentUpdate);
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase fetchUpdateById error:', err);
    }
  }

  const found = DEMO_UPDATES.find((u) => u.id === id);
  return found || null;
}

