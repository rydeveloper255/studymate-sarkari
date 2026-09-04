import { getSupabase } from '../supabase';
import { AdmitCardItem, JobSector } from '../../types';
import { DbAdmitCard, DbGovernmentContent, PaginatedResult } from '../../types/database';
import { mapDbAdmitCardToItem, mapDbGovernmentContentToAdmitCard } from './mappers';

export interface AdmitCardFetchOptions {
  sector?: 'all' | JobSector;
  searchQuery?: string;
  stateName?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchAdmitCards(
  options: AdmitCardFetchOptions = {}
): Promise<PaginatedResult<AdmitCardItem>> {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const supabase = getSupabase();

  if (supabase) {
    // 1. Check Master Table: government_content
    try {
      let query = supabase
        .from('government_content')
        .select('*', { count: 'exact' })
        .eq('content_type', 'admit_card');

      if (options.sector && options.sector !== 'all') {
        if (options.sector === 'central') {
          query = query.eq('region', 'ALL');
        } else {
          query = query.neq('region', 'ALL');
        }
      }

      if (options.stateName) {
        query = query.or(`region.ilike.${options.stateName},region.eq.ALL`);
      }

      if (options.searchQuery && options.searchQuery.trim()) {
        const q = `%${options.searchQuery.trim()}%`;
        query = query.or(`title.ilike.${q},organization.ilike.${q},post_name.ilike.${q}`);
      }

      query = query.order('published_at', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (!error && data && data.length > 0) {
        const total = count ?? data.length;
        return {
          data: data.map((row: DbGovernmentContent) => mapDbGovernmentContentToAdmitCard(row)),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 0,
          isSupabaseSource: true,
        };
      }
    } catch (govErr) {
      console.warn('[Data Layer] Supabase government_content admit card fallback:', govErr);
    }

    // 2. Legacy admit_cards table fallback
    try {
      let query = supabase.from('admit_cards').select('*', { count: 'exact' });

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
          data: data.map((row: DbAdmitCard) => mapDbAdmitCardToItem(row)),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 0,
          isSupabaseSource: true,
        };
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase admit cards query error:', err);
    }
  }

  // Node test fallback
  if (typeof window === 'undefined') {
    try {
      const { inMemoryGovernmentContent, inMemoryAdmitCards } = await import('../server/supabaseAdmin') as any;
      if (inMemoryGovernmentContent && inMemoryGovernmentContent.size > 0) {
        const items = Array.from(inMemoryGovernmentContent.values())
          .filter((row: any) => row.content_type === 'admit_card')
          .map((row: any) => mapDbGovernmentContentToAdmitCard(row));
        if (items.length > 0) {
          return {
            data: items,
            total: items.length,
            page,
            pageSize,
            totalPages: Math.ceil(items.length / pageSize) || 1,
            isSupabaseSource: false,
          };
        }
      }
      if (inMemoryAdmitCards && inMemoryAdmitCards.size > 0) {
        const items = Array.from(inMemoryAdmitCards.values()).map((row: any) =>
          mapDbAdmitCardToItem(row)
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
