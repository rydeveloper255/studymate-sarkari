import { getSupabase } from '../supabase';
import { ContentSourceInfo, SourceScope, SourcePriority, SourceCategory } from '../../types';
import { DbContentSource } from '../../types/database';
import { mapDbSourceToItem } from './mappers';
import { OFFICIAL_GOVERNMENT_SOURCES } from '../../data/officialSources';

export const DEFAULT_CONTENT_SOURCES: ContentSourceInfo[] = OFFICIAL_GOVERNMENT_SOURCES;

export async function fetchContentSources(filter?: {
  scope?: SourceScope;
  stateCode?: string;
  priority?: SourcePriority;
  category?: SourceCategory;
}): Promise<ContentSourceInfo[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      let query = supabase
        .from('content_sources')
        .select('*')
        .eq('active', true);

      if (filter?.scope) {
        query = query.eq('scope', filter.scope);
      }
      if (filter?.stateCode) {
        query = query.eq('state_code', filter.stateCode.toUpperCase());
      }
      if (filter?.priority) {
        query = query.eq('priority', filter.priority);
      }

      const { data, error } = await query.order('source_name', { ascending: true });

      if (!error && data && data.length > 0) {
        let results = data.map((row: DbContentSource) => mapDbSourceToItem(row));
        if (filter?.category) {
          results = results.filter((s) => s.category.includes(filter.category!));
        }
        return results;
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase content sources query error:', err);
    }
  }

  // Fallback to in-memory verified source registry
  let results = OFFICIAL_GOVERNMENT_SOURCES.filter((s) => s.active);
  if (filter?.scope) {
    results = results.filter((s) => s.scope === filter.scope);
  }
  if (filter?.stateCode) {
    results = results.filter((s) => s.stateCode === filter.stateCode?.toUpperCase());
  }
  if (filter?.priority) {
    results = results.filter((s) => s.priority === filter.priority);
  }
  if (filter?.category) {
    results = results.filter((s) => s.category.includes(filter.category!));
  }

  return results;
}

