import { getSupabase } from '../supabase';
import { StateInfo } from '../../types';
import { DbState } from '../../types/database';
import { ALL_STATES_AND_UTS, getStateBySlug as getLocalStateBySlug } from '../../data/statesData';
import { mapDbStateToStateInfo } from './mappers';

export async function fetchAllStates(): Promise<StateInfo[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row: DbState) => mapDbStateToStateInfo(row));
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase states query error:', err);
    }
  }

  return ALL_STATES_AND_UTS;
}

export async function fetchStateBySlug(slug: string): Promise<StateInfo | null> {
  if (!slug) return null;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .eq('slug', slug.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return mapDbStateToStateInfo(data as DbState);
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase state lookup error:', err);
    }
  }

  const localState = getLocalStateBySlug(slug);
  return localState || null;
}

export async function fetchStateByCode(code: string): Promise<StateInfo | null> {
  if (!code) return null;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .ilike('code', code)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return mapDbStateToStateInfo(data as DbState);
      }
    } catch (err) {
      console.warn('[Data Layer] Supabase state code lookup error:', err);
    }
  }

  const localState = ALL_STATES_AND_UTS.find(
    (s) => s.code.toLowerCase() === code.toLowerCase()
  );
  return localState || null;
}
