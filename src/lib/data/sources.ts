import { getSupabase } from '../supabase';
import { ContentSourceInfo, SourceScope, SourcePriority, SourceCategory } from '../../types';
import { DbContentSource } from '../../types/database';
import { mapDbSourceToItem, mapJobSourceToContentSourceInfo } from './mappers';
import { VERIFIED_OFFICIAL_JOB_SOURCES } from '../../data/verifiedJobSources';
import { OFFICIAL_GOVERNMENT_SOURCES } from '../../data/officialSources';

export const DEFAULT_CONTENT_SOURCES: ContentSourceInfo[] = VERIFIED_OFFICIAL_JOB_SOURCES.map((s) => ({
  id: s.id,
  sourceName: s.name,
  officialUrl: s.official_url,
  scope: s.region === 'ALL' ? 'central' : 'state',
  stateCode: s.region === 'ALL' ? undefined : s.region,
  category: s.category as unknown as SourceCategory[],
  sourceType: s.source_type as any,
  priority: s.priority,
  checkIntervalMinutes: 30,
  active: s.active,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export async function fetchContentSources(filter?: {
  scope?: SourceScope;
  stateCode?: string;
  priority?: SourcePriority;
  category?: SourceCategory;
}): Promise<ContentSourceInfo[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      // 1. Primary: Query authoritative job_sources table
      let jobSourcesQuery = supabase
        .from('job_sources')
        .select('*')
        .eq('active', true);

      if (filter?.stateCode) {
        jobSourcesQuery = jobSourcesQuery.eq('region', filter.stateCode.toUpperCase());
      }

      const { data: jobSourcesData, error: jobSourcesErr } = await jobSourcesQuery.order('name', { ascending: true });

      if (!jobSourcesErr && jobSourcesData && jobSourcesData.length > 0) {
        let results = jobSourcesData.map(mapJobSourceToContentSourceInfo);
        if (filter?.scope) {
          results = results.filter((s) => s.scope === filter.scope);
        }
        if (filter?.category) {
          results = results.filter((s) => s.category.includes(filter.category!));
        }
        return results;
      }

      // 2. Secondary fallback: content_sources table
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
  let results = DEFAULT_CONTENT_SOURCES.filter((s) => s.active);
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

