import { getSupabase } from '../supabase';
import { GovernmentUpdate, UpdateCategory } from '../../types';
import { DbGovernmentUpdate, PaginatedResult } from '../../types/database';
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
          totalPages: Math.ceil(total / pageSize) || 0,
          isSupabaseSource: true,
        };
      }

      // Check exam_updates table
      const { data: examData, error: examErr, count: examCount } = await supabase
        .from('exam_updates')
        .select('*', { count: 'exact' })
        .order('update_date', { ascending: false })
        .range(from, to);

      if (!examErr && examData && examData.length > 0) {
        const total = examCount ?? examData.length;
        return {
          data: examData.map((row: any) => ({
            id: row.id,
            title: row.title,
            category: row.update_type === 'exam_notice' ? 'exam_update' : (row.update_type || 'exam_update'),
            organization: row.organization,
            date: row.update_date || new Date().toISOString(),
            updateDate: row.update_date,
            summary: row.summary,
            linkUrl: row.link_url || row.official_url,
            badgeTag: row.badge_tag,
            isHighPriority: row.is_high_priority ?? false,
            isDemo: false,
          })),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 0,
          isSupabaseSource: true,
        };
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase updates query error:', err);
    }
  }

  // Browser client fallback to Express server API
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams();
      if (options.category && options.category !== 'all') params.set('category', options.category);
      if (pageSize) params.set('limit', String(pageSize));

      const res = await fetch(`/api/public/updates?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          let items = json.data.map((row: DbGovernmentUpdate) => mapDbUpdateToUpdate(row));
          if (options.searchQuery && options.searchQuery.trim()) {
            const q = options.searchQuery.toLowerCase().trim();
            items = items.filter(
              (u: GovernmentUpdate) =>
                u.title.toLowerCase().includes(q) ||
                u.organization.toLowerCase().includes(q) ||
                u.summary.toLowerCase().includes(q)
            );
          }
          return {
            data: items,
            total: json.total || items.length,
            page,
            pageSize,
            totalPages: Math.ceil((json.total || items.length) / pageSize) || 1,
            isSupabaseSource: true,
          };
        }
      }
    } catch (err) {
      // Browser fetch fallback
    }
  }

  // Node test environment fallback
  if (typeof window === 'undefined') {
    try {
      const { getAllActiveUpdates } = await import('../server/supabaseAdmin');
      const activeUpdates = await getAllActiveUpdates();
      if (activeUpdates && activeUpdates.length > 0) {
        let results = activeUpdates.map((u) => mapDbUpdateToUpdate(u));

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

  // Node test environment fallback
  if (typeof window === 'undefined') {
    try {
      const { getAllActiveUpdates } = await import('../server/supabaseAdmin');
      const updates = await getAllActiveUpdates();
      const found = updates.find((u) => u.id === id);
      if (found) {
        return mapDbUpdateToUpdate(found);
      }
    } catch {
      // ignore
    }
  }

  return null;
}

