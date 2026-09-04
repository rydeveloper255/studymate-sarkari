import { getSupabase } from './supabase';

export interface ConnectionCheckResult {
  success: boolean;
  table: string;
  count: number;
  mode: 'supabase_direct' | 'server_api' | 'none';
  sampleData?: Array<{ id: string; title: string; content_type: string; published_at: string }>;
  error?: string;
  timestamp: string;
}

/**
 * Connection checker utility that queries the `government_content` table
 * and verifies if data is being fetched correctly.
 *
 * Logs the count of rows found to the console to confirm that the frontend
 * can communicate with the backend Supabase setup.
 */
export async function checkGovernmentContentConnection(): Promise<ConnectionCheckResult> {
  const timestamp = new Date().toISOString();
  const supabase = getSupabase();

  console.groupCollapsed('%c[Database Connection Checker] Verifying government_content table...', 'color: #0284c7; font-weight: bold;');
  console.log(`[Connection Checker] Initiating check at ${timestamp}`);

  // 1. Attempt Direct Supabase query if client is initialized
  if (supabase) {
    try {
      console.log('[Connection Checker] Querying Supabase directly: public.government_content ...');
      const { data, count, error } = await supabase
        .from('government_content')
        .select('id, title, content_type, published_at', { count: 'exact' })
        .limit(5);

      if (error) {
        console.warn('[Connection Checker] Supabase direct query returned error:', error.message);
      } else {
        const rowCount = count ?? (data ? data.length : 0);
        console.info(
          `%c[Supabase Connection Checker] ✅ Connected to 'government_content' table successfully!`,
          'color: #16a34a; font-weight: bold;'
        );
        console.info(`[Supabase Connection Checker] Row count found in 'government_content': ${rowCount}`);
        if (data && data.length > 0) {
          console.table(data.map((r) => ({
            ID: r.id,
            Type: r.content_type,
            Title: r.title.length > 40 ? r.title.substring(0, 37) + '...' : r.title,
            Published: r.published_at,
          })));
        }
        console.groupEnd();

        return {
          success: true,
          table: 'government_content',
          count: rowCount,
          mode: 'supabase_direct',
          sampleData: data as any,
          timestamp,
        };
      }
    } catch (directErr: any) {
      console.warn('[Connection Checker] Direct Supabase exception:', directErr?.message || directErr);
    }
  } else {
    console.log('[Connection Checker] Direct Supabase client not initialized or credentials omitted in client env; checking backend API...');
  }

  // 2. Fallback / Complementary check via backend proxy API (/api/public/content)
  if (typeof window !== 'undefined') {
    try {
      console.log('[Connection Checker] Querying backend endpoint /api/public/content ...');
      const response = await fetch('/api/public/content?limit=5');
      if (response.ok) {
        const json = await response.json();
        const rowCount = typeof json.total === 'number' ? json.total : (json.data ? json.data.length : 0);
        
        console.info(
          `%c[Backend API Connection Checker] ✅ Connected to server data proxy successfully!`,
          'color: #16a34a; font-weight: bold;'
        );
        console.info(`[Backend API Connection Checker] Row count found for 'government_content': ${rowCount}`);
        if (json.data && json.data.length > 0) {
          console.table(json.data.slice(0, 5).map((r: any) => ({
            ID: r.id,
            Type: r.content_type,
            Title: (r.title || '').length > 40 ? (r.title || '').substring(0, 37) + '...' : r.title,
            Published: r.published_at,
          })));
        }
        console.groupEnd();

        return {
          success: true,
          table: 'government_content',
          count: rowCount,
          mode: 'server_api',
          sampleData: json.data,
          timestamp,
        };
      } else {
        const errorText = `HTTP ${response.status}: ${response.statusText}`;
        console.error(`[Connection Checker] ❌ Server API error: ${errorText}`);
        console.groupEnd();
        return {
          success: false,
          table: 'government_content',
          count: 0,
          mode: 'server_api',
          error: errorText,
          timestamp,
        };
      }
    } catch (apiErr: any) {
      const errorMsg = apiErr?.message || 'Network request failed';
      console.error('[Connection Checker] ❌ Backend API query failed:', errorMsg);
      console.groupEnd();
      return {
        success: false,
        table: 'government_content',
        count: 0,
        mode: 'none',
        error: errorMsg,
        timestamp,
      };
    }
  }

  console.groupEnd();
  return {
    success: false,
    table: 'government_content',
    count: 0,
    mode: 'none',
    error: 'No active connection method available',
    timestamp,
  };
}
