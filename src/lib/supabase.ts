import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe Supabase client initialization for public website access
// Uses Vite client-side public environment variables with Node.js fallback
const getEnvVar = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('[StudyMate Sarkari] Supabase initialization failed:', error);
  }
}

/**
 * Returns the Supabase client instance if configured.
 * For Step 1, the app uses verified local demo datasets until database synchronization is enabled in later steps.
 */
export function getSupabase(): SupabaseClient | null {
  return supabaseInstance;
}

export const isSupabaseConfigured = Boolean(supabaseInstance);
