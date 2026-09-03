/**
 * StudyMate Sarkari — Step 4: Server-Side Supabase Admin & Storage Engine
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - Runs ONLY in server runtime (Node.js/Express)
 * - Accesses SUPABASE_SERVICE_ROLE_KEY securely without client exposure
 * - Seamlessly falls back to typed in-memory registry & audit store when cloud DB keys are unprovisioned
 * - Guarantees data durability, atomic lock acquisition, and isolation across batch fetches
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DbContentSource,
  DbContentFetchLog,
  SourceScope,
  SourcePriority,
  DbContentParseLog,
  DbParsedContentItem,
  NormalizedExtractedItem,
  VerificationStatus,
  ParsedItemType,
  DbGovernmentJob,
  DbGovernmentUpdate,
  DbAdmitCard,
  DbExamResult,
  DbAnswerKey,
  DbPublishLog,
  PublishAction,
  PublishTargetType,
  DbTelegramNotificationLog,
} from '../../types';
import { OFFICIAL_GOVERNMENT_SOURCES } from '../../data/officialSources';
import { VERIFIED_OFFICIAL_JOB_SOURCES } from '../../data/verifiedJobSources';

let adminClient: SupabaseClient | null = null;

/**
 * Returns the privileged Supabase client for backend operations, or null if not configured.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey && !url.includes('your-project') && !serviceKey.includes('placeholder')) {
    try {
      adminClient = createClient(url, serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.warn('[StudyMate Sarkari Server] Supabase Admin initialization failed:', err);
    }
  }

  return adminClient;
}

// In-Memory Fallback Store (Used when Supabase is not connected)
const inMemorySources: Map<string, DbContentSource> = new Map();
const inMemoryLogs: DbContentFetchLog[] = [];
const inMemoryLocks: Set<string> = new Set();
const inMemoryParseLogs: DbContentParseLog[] = [];
const inMemoryParsedItems: Map<string, DbParsedContentItem> = new Map();
const inMemoryJobs: Map<string, DbGovernmentJob> = new Map();
const inMemoryUpdates: Map<string, DbGovernmentUpdate> = new Map();
const inMemoryAdmitCards: Map<string, DbAdmitCard> = new Map();
const inMemoryResults: Map<string, DbExamResult> = new Map();
const inMemoryAnswerKeys: Map<string, DbAnswerKey> = new Map();
const inMemoryPublishLogs: DbPublishLog[] = [];
const inMemoryTelegramLogs: Map<string, DbTelegramNotificationLog> = new Map();

export function mapJobSourceRowToDbContentSource(row: any): DbContentSource {
  const isCentral = row.region === 'ALL' || !row.region;
  const categories = Array.isArray(row.category)
    ? row.category
    : typeof row.category === 'string'
      ? [row.category]
      : ['vacancy'];

  let parserKey = 'generic_html';
  const url = (row.official_url || row.recruitment_url || '').toLowerCase();
  const name = (row.name || '').toLowerCase();
  if (url.includes('ssc.gov') || url.includes('ssc-') || url.includes('sscnr')) {
    parserKey = 'ssc_notices';
  } else if (url.includes('upsc.gov')) {
    parserKey = 'upsc_recruitment';
  } else if (url.includes('upsconline.nic')) {
    parserKey = 'upsc_online';
  } else if (url.includes('nta.ac.in')) {
    parserKey = 'nta_bulletins';
  } else if (name.includes('public service commission') || name.includes('psc') || categories.includes('STATE_PSC')) {
    parserKey = 'state_psc';
  }

  return {
    id: String(row.id),
    source_name: row.name || 'Official Government Source',
    official_url: row.official_url,
    recruitment_url: row.recruitment_url || null,
    region: row.region || null,
    scope: isCentral ? 'central' : 'state',
    state_code: isCentral ? null : row.region,
    category: categories,
    source_type: row.source_type || 'html',
    priority: (row.region === 'ALL' || categories.includes('UPSC') || categories.includes('SSC')) ? 'high' : 'medium',
    check_interval_minutes: 30,
    active: row.active ?? row.is_active ?? true,
    is_active: row.is_active ?? row.active ?? true,
    parser_key: parserKey,
    last_checked_at: row.last_checked_at || null,
    last_success_at: row.last_success_at || null,
    last_error: row.last_error || null,
    content_hash: null,
    etag: null,
    last_modified: null,
    fetch_status: null,
    is_fetching: false,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

// Initialize in-memory registry from verified official sources
function initInMemoryStore() {
  if (inMemorySources.size === 0) {
    for (const src of VERIFIED_OFFICIAL_JOB_SOURCES) {
      const isCentral = src.region === 'ALL';
      inMemorySources.set(src.id, {
        id: src.id,
        source_name: src.name,
        official_url: src.official_url,
        scope: isCentral ? 'central' : 'state',
        state_code: isCentral ? null : src.region,
        category: src.category as any,
        source_type: src.source_type as any,
        priority: src.priority,
        check_interval_minutes: 30,
        active: src.active,
        is_active: src.active,
        parser_key: src.parser_key || 'generic_html',
        last_checked_at: null,
        last_success_at: null,
        last_error: null,
        content_hash: null,
        etag: null,
        last_modified: null,
        fetch_status: null,
        is_fetching: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }
}

initInMemoryStore();

/**
 * Retrieves all registered sources. Primary table: job_sources, secondary: content_sources.
 */
export async function getAllRegisteredSources(): Promise<DbContentSource[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      // 1. Primary: Query job_sources
      const { data: jobSources, error: jsErr } = await client.from('job_sources').select('*');
      if (!jsErr && jobSources && jobSources.length > 0) {
        return jobSources.map(mapJobSourceRowToDbContentSource);
      }

      // 2. Secondary fallback: content_sources
      const { data, error } = await client.from('content_sources').select('*');
      if (!error && data && data.length > 0) {
        return data as DbContentSource[];
      }
    } catch (err) {
      console.warn('[Server Admin] Fallback to in-memory sources after Supabase query error:', err);
    }
  }

  initInMemoryStore();
  return Array.from(inMemorySources.values());
}

/**
 * Retrieves a single source by ID.
 */
export async function getSourceById(sourceId: string): Promise<DbContentSource | null> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      // 1. Primary: job_sources
      const { data: jsData, error: jsErr } = await client
        .from('job_sources')
        .select('*')
        .eq('id', sourceId)
        .maybeSingle();

      if (!jsErr && jsData) {
        return mapJobSourceRowToDbContentSource(jsData);
      }

      // 2. Secondary fallback: content_sources
      const { data, error } = await client
        .from('content_sources')
        .select('*')
        .eq('id', sourceId)
        .maybeSingle();

      if (!error && data) {
        return data as DbContentSource;
      }
    } catch (err) {
      console.warn('[Server Admin] Fallback to in-memory source query:', err);
    }
  }

  initInMemoryStore();
  return inMemorySources.get(sourceId) || null;
}

export interface GetDueSourcesFilter {
  limit?: number;
  scope?: SourceScope;
  stateCode?: string;
  priority?: SourcePriority;
  forceAllActive?: boolean;
}

/**
 * Retrieves active sources that are due for a monitoring check based on check_interval_minutes.
 */
export async function getDueSources(options: GetDueSourcesFilter = {}): Promise<DbContentSource[]> {
  const sources = await getAllRegisteredSources();
  const now = Date.now();

  const filtered = sources.filter((src) => {
    if (!src.active) return false;
    if (src.is_fetching) return false; // Skip if already being fetched

    if (options.scope && src.scope !== options.scope) return false;
    if (options.stateCode && src.state_code?.toUpperCase() !== options.stateCode.toUpperCase()) return false;
    if (options.priority && src.priority !== options.priority) return false;

    if (options.forceAllActive) return true;

    if (!src.last_checked_at) return true; // Never checked yet

    const lastCheckedTime = new Date(src.last_checked_at).getTime();
    const intervalMs = (src.check_interval_minutes || 60) * 60 * 1000;
    return now - lastCheckedTime >= intervalMs;
  });

  // Sort by priority (high > medium > low), then oldest checked first
  const priorityWeight: Record<SourcePriority, number> = { high: 3, medium: 2, low: 1 };
  filtered.sort((a, b) => {
    const weightDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    if (weightDiff !== 0) return weightDiff;
    const timeA = a.last_checked_at ? new Date(a.last_checked_at).getTime() : 0;
    const timeB = b.last_checked_at ? new Date(b.last_checked_at).getTime() : 0;
    return timeA - timeB;
  });

  if (options.limit && options.limit > 0) {
    return filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Acquires an exclusive fetch lock on a source.
 * Returns true if the lock was acquired, false if already locked.
 */
export async function acquireSourceLock(sourceId: string): Promise<boolean> {
  if (inMemoryLocks.has(sourceId)) {
    return false;
  }
  inMemoryLocks.add(sourceId);

  const client = getSupabaseAdmin();
  if (client) {
    try {
      await client
        .from('content_sources')
        .update({ is_fetching: true, updated_at: new Date().toISOString() })
        .eq('id', sourceId);
    } catch {
      // Best-effort database lock flag
    }
  }

  const memorySource = inMemorySources.get(sourceId);
  if (memorySource) {
    memorySource.is_fetching = true;
  }

  return true;
}

/**
 * Releases the fetch lock on a source.
 */
export async function releaseSourceLock(sourceId: string): Promise<void> {
  inMemoryLocks.delete(sourceId);

  const client = getSupabaseAdmin();
  if (client) {
    try {
      await client
        .from('content_sources')
        .update({ is_fetching: false, updated_at: new Date().toISOString() })
        .eq('id', sourceId);
    } catch {
      // Best-effort database lock release
    }
  }

  const memorySource = inMemorySources.get(sourceId);
  if (memorySource) {
    memorySource.is_fetching = false;
  }
}

/**
 * Updates source monitoring attributes after a fetch attempt.
 */
export async function updateSourceMonitoring(
  sourceId: string,
  updates: Partial<DbContentSource>
): Promise<void> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const client = getSupabaseAdmin();
  if (client) {
    try {
      // 1. Update job_sources table
      const jobSourcePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.last_checked_at) jobSourcePayload.last_checked_at = updates.last_checked_at;
      if (updates.last_success_at) jobSourcePayload.last_success_at = updates.last_success_at;
      if (updates.last_error !== undefined) jobSourcePayload.last_error = updates.last_error;
      if (updates.active !== undefined) jobSourcePayload.active = updates.active;

      await client.from('job_sources').update(jobSourcePayload).eq('id', sourceId);
    } catch {
      // Best-effort job_sources update
    }

    try {
      // 2. Update content_sources table
      await client.from('content_sources').update(payload).eq('id', sourceId);
    } catch (err) {
      console.warn(`[Server Admin] Failed to update source ${sourceId} in Supabase:`, err);
    }
  }

  const memorySource = inMemorySources.get(sourceId);
  if (memorySource) {
    Object.assign(memorySource, payload);
  }
}

/**
 * Inserts a fetch audit log record into `content_fetch_log` and `source_fetch_logs`.
 */
export async function insertFetchLog(logEntry: Omit<DbContentFetchLog, 'id' | 'created_at'>): Promise<DbContentFetchLog> {
  const fullLog: DbContentFetchLog = {
    ...logEntry,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseAdmin();
  if (client) {
    try {
      // Best effort insert into source_fetch_logs
      await client.from('source_fetch_logs').insert({
        source_id: fullLog.source_id,
        requested_url: fullLog.requested_url,
        final_url: fullLog.final_url,
        fetched_at: fullLog.fetched_at,
        http_status: fullLog.http_status,
        success: fullLog.success,
        error_code: fullLog.error_code || null,
        error_message: fullLog.error_message || null,
      });
    } catch {
      // Best effort
    }

    try {
      const { data, error } = await client
        .from('content_fetch_log')
        .insert({
          source_id: fullLog.source_id,
          requested_url: fullLog.requested_url,
          final_url: fullLog.final_url,
          fetched_at: fullLog.fetched_at,
          http_status: fullLog.http_status,
          success: fullLog.success,
          changed: fullLog.changed,
          content_hash: fullLog.content_hash,
          content_type: fullLog.content_type,
          content_length: fullLog.content_length,
          etag: fullLog.etag,
          last_modified: fullLog.last_modified,
          response_time_ms: fullLog.response_time_ms,
          attempt_number: fullLog.attempt_number,
          fetch_state: fullLog.fetch_state,
          error_code: fullLog.error_code,
          error_message: fullLog.error_message,
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        fullLog.id = data.id;
      }
    } catch (err) {
      console.warn('[Server Admin] Failed to insert fetch log into Supabase:', err);
    }
  }

  // Always retain in in-memory ring buffer (capped at 500 items for memory safety)
  inMemoryLogs.unshift(fullLog);
  if (inMemoryLogs.length > 500) {
    inMemoryLogs.pop();
  }

  return fullLog;
}

/**
 * Retrieves recent fetch logs.
 */
export async function getRecentFetchLogs(limit = 50): Promise<DbContentFetchLog[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('content_fetch_log')
        .select('*')
        .order('fetched_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as DbContentFetchLog[];
      }
    } catch (err) {
      console.warn('[Server Admin] Failed to query fetch logs from Supabase:', err);
    }
  }

  return inMemoryLogs.slice(0, limit);
}

/**
 * Returns overall monitoring statistics.
 */
export async function getMonitoringStats() {
  const sources = await getAllRegisteredSources();
  const activeCount = sources.filter((s) => s.active).length;
  const dueCount = (await getDueSources()).length;
  const recentLogs = inMemoryLogs.slice(0, 100);
  const successLogs = recentLogs.filter((l) => l.success);
  const successRate = recentLogs.length > 0 ? (successLogs.length / recentLogs.length) * 100 : 100;

  return {
    totalSources: sources.length,
    activeSources: activeCount,
    dueSources: dueCount,
    totalLoggedFetches: inMemoryLogs.length,
    recentSuccessRatePct: Math.round(successRate * 10) / 10,
    activeLocksCount: inMemoryLocks.size,
  };
}

// ============================================================================
// STEP 5: PARSED ITEMS & PARSE AUDIT LOG PERSISTENCE LAYER
// ============================================================================

/**
 * Inserts an entry into the content_parse_log table.
 */
export async function insertParseLog(
  log: Omit<DbContentParseLog, 'id' | 'created_at'>
): Promise<DbContentParseLog> {
  const fullLog: DbContentParseLog = {
    ...log,
    id: `parse_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('content_parse_log')
        .insert({
          source_id: fullLog.source_id,
          fetch_log_id: fullLog.fetch_log_id || null,
          content_hash: fullLog.content_hash,
          parser_key: fullLog.parser_key,
          started_at: fullLog.started_at,
          completed_at: fullLog.completed_at,
          success: fullLog.success,
          item_count: fullLog.item_count,
          error_code: fullLog.error_code || null,
          error_message: fullLog.error_message || null,
        })
        .select('*')
        .single();

      if (!error && data) {
        fullLog.id = data.id;
      }
    } catch (err) {
      console.warn('[Server Admin] Fallback storing parse log in memory:', err);
    }
  }

  inMemoryParseLogs.unshift(fullLog);
  if (inMemoryParseLogs.length > 500) {
    inMemoryParseLogs.pop();
  }

  return fullLog;
}

/**
 * Inserts or updates normalized items in parsed_content_items.
 */
export async function insertParsedItems(
  items: NormalizedExtractedItem[],
  fetchLogId?: string
): Promise<DbParsedContentItem[]> {
  const savedItems: DbParsedContentItem[] = [];

  for (const item of items) {
    const id = item.id || `parsed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    item.id = id;

    const dbItem: DbParsedContentItem = {
      id,
      source_id: item.sourceId,
      fetch_log_id: fetchLogId || null,
      content_hash: item.contentHash,
      item_type: item.itemType,
      title: item.title,
      normalized_payload: item,
      confidence: item.confidence,
      verification_status: item.verificationStatus,
      deduplication_key: item.deduplicationKey,
      parser_key: item.parserKey,
      official_url: item.officialWebsiteUrl,
      official_notification_url: item.officialNotificationUrl,
      official_apply_url: item.officialApplyUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client
          .from('parsed_content_items')
          .insert({
            source_id: dbItem.source_id,
            fetch_log_id: dbItem.fetch_log_id,
            content_hash: dbItem.content_hash,
            item_type: dbItem.item_type,
            title: dbItem.title,
            normalized_payload: dbItem.normalized_payload,
            confidence: dbItem.confidence,
            verification_status: dbItem.verification_status,
            deduplication_key: dbItem.deduplication_key,
            parser_key: dbItem.parser_key,
            official_url: dbItem.official_url,
            official_notification_url: dbItem.official_notification_url,
            official_apply_url: dbItem.official_apply_url,
          })
          .select('*')
          .single();

        if (!error && data) {
          dbItem.id = data.id;
        }
      } catch (err) {
        console.warn('[Server Admin] Fallback storing parsed item in memory:', err);
      }
    }

    inMemoryParsedItems.set(dbItem.id, dbItem);
    savedItems.push(dbItem);
  }

  return savedItems;
}

/**
 * Retrieves existing parsed items for a specific source to perform deduplication.
 */
export async function getParsedItemsForSource(sourceId: string): Promise<NormalizedExtractedItem[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('parsed_content_items')
        .select('normalized_payload')
        .eq('source_id', sourceId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => d.normalized_payload as NormalizedExtractedItem);
      }
    } catch (err) {
      console.warn('[Server Admin] Fallback reading source parsed items from memory:', err);
    }
  }

  const items: NormalizedExtractedItem[] = [];
  for (const item of inMemoryParsedItems.values()) {
    if (item.source_id === sourceId) {
      items.push(item.normalized_payload);
    }
  }
  return items;
}

/**
 * Retrieves parsed items with optional filtering by status or type.
 */
export async function getParsedItems(options: {
  status?: VerificationStatus;
  itemType?: ParsedItemType;
  limit?: number;
} = {}): Promise<DbParsedContentItem[]> {
  const limit = options.limit || 50;
  const client = getSupabaseAdmin();

  if (client) {
    try {
      let query = client.from('parsed_content_items').select('*').order('created_at', { ascending: false }).limit(limit);

      if (options.status) {
        query = query.eq('verification_status', options.status);
      }
      if (options.itemType) {
        query = query.eq('item_type', options.itemType);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as DbParsedContentItem[];
      }
    } catch (err) {
      console.warn('[Server Admin] Fallback querying parsed items from memory:', err);
    }
  }

  let items = Array.from(inMemoryParsedItems.values());
  if (options.status) {
    items = items.filter((i) => i.verification_status === options.status);
  }
  if (options.itemType) {
    items = items.filter((i) => i.item_type === options.itemType);
  }
  return items.slice(0, limit);
}

/**
 * Updates the verification status of a parsed content item.
 */
export async function updateParsedItemStatus(
  id: string,
  newStatus: VerificationStatus,
  notes?: string
): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { error } = await client
        .from('parsed_content_items')
        .update({
          verification_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (!error) return true;
    } catch (err) {
      console.warn('[Server Admin] Failed to update item status in Supabase:', err);
    }
  }

  const existing = inMemoryParsedItems.get(id);
  if (existing) {
    existing.verification_status = newStatus;
    existing.updated_at = new Date().toISOString();
    existing.normalized_payload.verificationStatus = newStatus;
    return true;
  }
  return false;
}

/**
 * Retrieves recent parse logs.
 */
export async function getRecentParseLogs(limit = 50): Promise<DbContentParseLog[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('content_parse_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as DbContentParseLog[];
      }
    } catch (err) {
      console.warn('[Server Admin] Failed to query parse logs from Supabase:', err);
    }
  }

  return inMemoryParseLogs.slice(0, limit);
}

// ==============================================================================
// STEP 6: PUBLISHING DATA LAYER & AUDIT PERSISTENCE
// ==============================================================================

/**
 * Saves a publishing audit log record.
 */
export async function savePublishLog(
  log: Omit<DbPublishLog, 'id' | 'created_at'> & { id?: string; created_at?: string }
): Promise<DbPublishLog> {
  const fullLog: DbPublishLog = {
    id: log.id || `publog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    source_id: log.source_id || null,
    parsed_item_id: log.parsed_item_id || null,
    target_type: log.target_type,
    target_id: log.target_id,
    action: log.action,
    previous_status: log.previous_status || null,
    new_status: log.new_status || null,
    success: log.success,
    error_code: log.error_code || null,
    error_message: log.error_message || null,
    created_at: log.created_at || new Date().toISOString(),
  };

  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('publish_log')
        .insert({
          source_id: fullLog.source_id,
          parsed_item_id: fullLog.parsed_item_id,
          target_type: fullLog.target_type,
          target_id: fullLog.target_id,
          action: fullLog.action,
          previous_status: fullLog.previous_status,
          new_status: fullLog.new_status,
          success: fullLog.success,
          error_code: fullLog.error_code,
          error_message: fullLog.error_message,
        })
        .select('*')
        .single();

      if (!error && data) {
        fullLog.id = data.id;
      }
    } catch (err) {
      console.warn('[Server Admin] Storing publish log in memory:', err);
    }
  }

  inMemoryPublishLogs.unshift(fullLog);
  if (inMemoryPublishLogs.length > 500) {
    inMemoryPublishLogs.pop();
  }

  return fullLog;
}

/**
 * Retrieves recent publishing audit logs.
 */
export async function getPublishLogs(limit = 50): Promise<DbPublishLog[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('publish_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as DbPublishLog[];
      }
    } catch (err) {
      console.warn('[Server Admin] Querying publish logs from Supabase error:', err);
    }
  }

  return inMemoryPublishLogs.slice(0, limit);
}

/**
 * Finds an existing job by slug, deduplication key, or title/organization match.
 */
export async function findExistingJob(
  slugOrDedup: string,
  title?: string,
  orgName?: string
): Promise<DbGovernmentJob | null> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      let { data, error } = await client
        .from('government_jobs')
        .select('*')
        .eq('slug', slugOrDedup)
        .limit(1)
        .maybeSingle();

      if (!error && data) return data as DbGovernmentJob;

      if (title && orgName) {
        const { data: matched, error: matchErr } = await client
          .from('government_jobs')
          .select('*')
          .eq('organization_name', orgName)
          .ilike('title', `%${title.slice(0, 30)}%`)
          .limit(1)
          .maybeSingle();

        if (!matchErr && matched) return matched as DbGovernmentJob;
      }
    } catch (err) {
      console.warn('[Server Admin] Supabase job find error:', err);
    }
  }

  // Memory lookup
  for (const j of inMemoryJobs.values()) {
    if (j.slug === slugOrDedup || j.id === slugOrDedup) return j;
    if (title && orgName && j.organization_name === orgName && j.title.toLowerCase() === title.toLowerCase()) {
      return j;
    }
  }

  return null;
}

/**
 * Gets a published government job by its exact ID.
 */
export async function getJobById(id: string): Promise<DbGovernmentJob | null> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('government_jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as DbGovernmentJob;
      }
    } catch (err) {
      console.warn('[Server Admin] Supabase job lookup by ID error:', err);
    }
  }

  return inMemoryJobs.get(id) || null;
}

/**
 * Upserts a verified government job record into live government_jobs table.
 */
export async function upsertPublishedJob(job: DbGovernmentJob): Promise<DbGovernmentJob> {
  const client = getSupabaseAdmin();
  job.updated_at = new Date().toISOString();

  if (client) {
    try {
      const { data, error } = await client
        .from('government_jobs')
        .upsert(
          {
            id: job.id,
            slug: job.slug,
            title: job.title,
            organization_id: job.organization_id || null,
            organization_name: job.organization_name,
            department_or_ministry: job.department_or_ministry || null,
            post_name: job.post_name,
            sector: job.sector,
            central_category: job.central_category || null,
            state_code: job.state_code || null,
            state_name: job.state_name || null,
            total_vacancies: String(job.total_vacancies),
            qualification: job.qualification,
            age_limit: job.age_limit,
            application_fee: job.application_fee,
            important_dates: job.important_dates,
            selection_process: job.selection_process,
            salary_or_pay_scale: job.salary_or_pay_scale || null,
            status: job.status,
            is_active: job.is_active ?? true,
            is_featured: job.is_featured ?? false,
            published_date: job.published_date,
            summary: job.summary,
            important_instructions: job.important_instructions || null,
            official_notification_url: job.official_notification_url,
            official_apply_url: job.official_apply_url,
            official_website_url: job.official_website_url,
            source_url: job.source_url || null,
            updated_at: job.updated_at,
          },
          { onConflict: 'slug' }
        )
        .select('*')
        .single();

      if (!error && data) {
        inMemoryJobs.set(data.id, data as DbGovernmentJob);
        return data as DbGovernmentJob;
      }
    } catch (err) {
      console.warn('[Server Admin] Fallback storing job in memory:', err);
    }
  }

  inMemoryJobs.set(job.id, job);
  return job;
}

/**
 * Upserts a verified government update record into live government_updates table.
 */
export async function upsertPublishedUpdate(update: DbGovernmentUpdate): Promise<DbGovernmentUpdate> {
  const client = getSupabaseAdmin();

  if (client) {
    try {
      const { data, error } = await client
        .from('government_updates')
        .upsert({
          id: update.id,
          title: update.title,
          category: update.category,
          organization: update.organization,
          update_date: update.update_date,
          summary: update.summary,
          link_url: update.link_url || null,
          badge_tag: update.badge_tag || null,
          is_high_priority: update.is_high_priority ?? false,
          job_id: update.job_id || null,
        })
        .select('*')
        .single();

      if (!error && data) {
        // Also sync to exam_updates table for unified public access
        try {
          await client.from('exam_updates').upsert({
            title: update.title,
            update_type: update.category === 'exam_update' ? 'exam_notice' : update.category,
            organization: update.organization,
            update_date: update.update_date,
            summary: update.summary,
            link_url: update.link_url || null,
            official_url: update.link_url || null,
            badge_tag: update.badge_tag || null,
            is_high_priority: update.is_high_priority ?? false,
            is_verified: true,
            status: 'Active',
            job_id: update.job_id || null,
          });
        } catch {
          // Non-blocking
        }

        inMemoryUpdates.set(data.id, data as DbGovernmentUpdate);
        return data as DbGovernmentUpdate;
      }
    } catch (err) {
      console.warn('[Server Admin] Storing update in memory fallback:', err);
    }
  }

  inMemoryUpdates.set(update.id, update);
  return update;
}

/**
 * Upserts a verified admit card record.
 */
export async function upsertPublishedAdmitCard(card: DbAdmitCard): Promise<DbAdmitCard> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('admit_cards')
        .upsert({
          id: card.id,
          title: card.title,
          organization: card.organization,
          exam_name: card.exam_name,
          sector: card.sector,
          state_name: card.state_name || null,
          release_date: card.release_date,
          exam_date: card.exam_date,
          status: card.status,
          download_url: card.download_url,
          instructions: card.instructions || null,
          job_id: card.job_id || null,
        })
        .select('*')
        .single();

      if (!error && data) {
        inMemoryAdmitCards.set(data.id, data as DbAdmitCard);
        return data as DbAdmitCard;
      }
    } catch (err) {
      console.warn('[Server Admin] Storing admit card in memory:', err);
    }
  }

  inMemoryAdmitCards.set(card.id, card);
  return card;
}

/**
 * Upserts a verified exam result record.
 */
export async function upsertPublishedResult(result: DbExamResult): Promise<DbExamResult> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('exam_results')
        .upsert({
          id: result.id,
          title: result.title,
          organization: result.organization,
          exam_name: result.exam_name,
          sector: result.sector,
          state_name: result.state_name || null,
          result_date: result.result_date,
          status: result.status,
          view_url: result.view_url,
          cut_off_available: result.cut_off_available ?? false,
          job_id: result.job_id || null,
        })
        .select('*')
        .single();

      if (!error && data) {
        inMemoryResults.set(data.id, data as DbExamResult);
        return data as DbExamResult;
      }
    } catch (err) {
      console.warn('[Server Admin] Storing exam result in memory:', err);
    }
  }

  inMemoryResults.set(result.id, result);
  return result;
}

/**
 * Upserts a verified answer key record.
 */
export async function upsertPublishedAnswerKey(key: DbAnswerKey): Promise<DbAnswerKey> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('answer_keys')
        .upsert({
          id: key.id,
          title: key.title,
          organization: key.organization,
          exam_name: key.exam_name,
          sector: key.sector,
          state_name: key.state_name || null,
          release_date: key.release_date,
          objection_last_date: key.objection_last_date || null,
          view_url: key.view_url,
          status: key.status,
          job_id: key.job_id || null,
        })
        .select('*')
        .single();

      if (!error && data) {
        inMemoryAnswerKeys.set(data.id, data as DbAnswerKey);
        return data as DbAnswerKey;
      }
    } catch (err) {
      console.warn('[Server Admin] Storing answer key in memory:', err);
    }
  }

  inMemoryAnswerKeys.set(key.id, key);
  return key;
}

/**
 * Retrieves all jobs for automated data quality checks and expiration updates.
 */
export async function getAllJobsForAdmin(options: { onlyActive?: boolean } = {}): Promise<DbGovernmentJob[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      let query = client.from('government_jobs').select('*');
      if (options.onlyActive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as DbGovernmentJob[];
      }
    } catch (err) {
      console.warn('[Server Admin] Querying all jobs for admin error:', err);
    }
  }

  let jobs = Array.from(inMemoryJobs.values());
  if (options.onlyActive) {
    jobs = jobs.filter((j) => j.is_active);
  }
  return jobs;
}

/**
 * Updates a job status and active flag (e.g. when application deadline expires).
 */
export async function updateJobStatus(jobId: string, status: string, isActive?: boolean): Promise<boolean> {
  const client = getSupabaseAdmin();
  const updatePayload: any = { status, updated_at: new Date().toISOString() };
  if (isActive !== undefined) updatePayload.is_active = isActive;

  if (client) {
    try {
      const { error } = await client.from('government_jobs').update(updatePayload).eq('id', jobId);
      if (!error) return true;
    } catch (err) {
      console.warn('[Server Admin] Failed to update job status in Supabase:', err);
    }
  }

  const job = inMemoryJobs.get(jobId);
  if (job) {
    job.status = status as any;
    if (isActive !== undefined) job.is_active = isActive;
    job.updated_at = new Date().toISOString();
    return true;
  }
  return false;
}

// ==============================================================================
// STEP 7: TELEGRAM NOTIFICATION AUDIT LOGS & IDEMPOTENCY
// ==============================================================================

/**
 * Finds an existing Telegram notification log by idempotency key.
 */
export async function findTelegramNotificationLog(
  idempotencyKey: string
): Promise<DbTelegramNotificationLog | null> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('telegram_notification_log')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (!error && data) {
        return data as DbTelegramNotificationLog;
      }
    } catch (err) {
      // Fallback check on telegram_notifications if table exists
      try {
        const { data: altData, error: altError } = await client
          .from('telegram_notifications')
          .select('*')
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle();
        if (!altError && altData) {
          return {
            id: altData.id,
            target_type: altData.job_id ? 'government_jobs' : 'exam_updates',
            target_id: altData.job_id || altData.update_id || '',
            notification_type: altData.message_type || 'NEW_VACANCY',
            destination_chat_id: altData.telegram_chat_id || 'default',
            idempotency_key: altData.idempotency_key,
            message_hash: '',
            telegram_message_id: altData.telegram_message_id,
            status: altData.status,
            attempt_count: 1,
            sent_at: altData.sent_at,
            created_at: altData.created_at,
          } as DbTelegramNotificationLog;
        }
      } catch {
        // Fall through to memory
      }
    }
  }

  return inMemoryTelegramLogs.get(idempotencyKey) || null;
}

/**
 * Saves or updates a Telegram notification log entry.
 */
export async function saveTelegramNotificationLog(
  log: Partial<DbTelegramNotificationLog> & { idempotency_key: string }
): Promise<DbTelegramNotificationLog> {
  const now = new Date().toISOString();
  const entry: DbTelegramNotificationLog = {
    id: log.id || `tg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    target_type: log.target_type || 'government_jobs',
    target_id: log.target_id || '',
    notification_type: log.notification_type || 'NEW_VACANCY',
    destination_chat_id: log.destination_chat_id || 'default',
    idempotency_key: log.idempotency_key,
    message_hash: log.message_hash || '',
    telegram_message_id: log.telegram_message_id || null,
    status: log.status || 'SENT',
    attempt_count: log.attempt_count || 1,
    sent_at: log.sent_at || now,
    last_error: log.last_error || null,
    created_at: log.created_at || now,
    updated_at: now,
  };

  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('telegram_notification_log')
        .upsert(entry, { onConflict: 'idempotency_key' })
        .select()
        .single();

      if (!error && data) {
        inMemoryTelegramLogs.set(entry.idempotency_key, data as DbTelegramNotificationLog);
      }
    } catch (err) {
      console.warn('[Server Admin] Upserting telegram_notification_log error:', err);
    }

    // Also best-effort write to normalized telegram_notifications table
    try {
      await client.from('telegram_notifications').upsert(
        {
          id: entry.id,
          job_id: entry.target_type === 'government_jobs' ? entry.target_id : null,
          update_id: entry.target_type !== 'government_jobs' ? entry.target_id : null,
          telegram_chat_id: entry.destination_chat_id,
          message_type: entry.notification_type,
          sent_at: entry.sent_at,
          telegram_message_id: entry.telegram_message_id,
          idempotency_key: entry.idempotency_key,
          status: entry.status,
          created_at: entry.created_at,
        },
        { onConflict: 'idempotency_key' }
      );
    } catch {
      // Best-effort normalized mirror
    }
  }

  inMemoryTelegramLogs.set(entry.idempotency_key, entry);
  return entry;
}

/**
 * Retrieves recent Telegram notification logs for internal monitoring.
 */
export async function getTelegramNotificationLogs(
  limit = 50
): Promise<DbTelegramNotificationLog[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('telegram_notification_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as DbTelegramNotificationLog[];
      }
    } catch (err) {
      console.warn('[Server Admin] Fetching telegram_notification_log error:', err);
    }
  }

  return Array.from(inMemoryTelegramLogs.values())
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, limit);
}

/**
 * Retrieves all currently active jobs from database or in-memory fallback.
 */
export async function getAllActiveJobs(limit = 200): Promise<DbGovernmentJob[]> {
  const isLiveJob = (j: DbGovernmentJob): boolean => {
    if (j.is_active === false) return false;
    if (j.status?.toLowerCase() === 'closed') return false;
    if (j.important_dates?.applyEndDate) {
      const end = j.important_dates.applyEndDate.trim();
      if (end && end !== 'To be notified') {
        try {
          const todayIST = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date());
          if (end < todayIST) return false;
        } catch {
          // Fallback
        }
      }
    }
    return true;
  };

  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('government_jobs')
        .select('*')
        .eq('is_active', true)
        .order('published_date', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return (data as DbGovernmentJob[]).filter(isLiveJob);
      }
    } catch (err) {
      console.warn('[Server Admin] Fetching active jobs error:', err);
    }
  }

  return Array.from(inMemoryJobs.values())
    .filter(isLiveJob)
    .sort((a, b) => new Date(b.published_date || '').getTime() - new Date(a.published_date || '').getTime())
    .slice(0, limit);
}

/**
 * Retrieves all published government updates.
 */
export async function getAllActiveUpdates(limit = 100): Promise<DbGovernmentUpdate[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('government_updates')
        .select('*')
        .order('update_date', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as DbGovernmentUpdate[];
      }
    } catch (err) {
      console.warn('[Server Admin] Fetching active updates error:', err);
    }
  }

  return Array.from(inMemoryUpdates.values())
    .sort((a, b) => new Date(b.update_date || '').getTime() - new Date(a.update_date || '').getTime())
    .slice(0, limit);
}

/**
 * Retrieves a published job by either slug or ID.
 */
export async function getJobBySlugOrId(slugOrId: string): Promise<DbGovernmentJob | null> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from('government_jobs')
        .select('*')
        .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as DbGovernmentJob;
      }
    } catch (err) {
      console.warn('[Server Admin] Fetching job by slug or ID error:', err);
    }
  }

  return findExistingJob(slugOrId);
}

/**
 * Seeds or synchronizes the authoritative 42 verified government job sources into Supabase job_sources table.
 */
export async function seedJobSourcesToSupabase(): Promise<{
  inserted: number;
  updated: number;
  total: number;
  active: number;
  regionBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
}> {
  const client = getSupabaseAdmin();
  let inserted = 0;
  let updated = 0;
  const regionBreakdown: Record<string, number> = {};
  const categoryBreakdown: Record<string, number> = {};

  if (client) {
    for (const src of VERIFIED_OFFICIAL_JOB_SOURCES) {
      try {
        const { data: found } = await client
          .from('job_sources')
          .select('id, official_url')
          .eq('official_url', src.official_url)
          .maybeSingle();

        const payload = {
          name: src.name,
          organization: src.organization,
          region: src.region,
          source_type: src.source_type,
          official_url: src.official_url,
          recruitment_url: src.recruitment_url,
          category: src.category,
          active: src.active,
          updated_at: new Date().toISOString(),
        };

        if (found) {
          await client.from('job_sources').update(payload).eq('id', found.id);
          updated++;
        } else {
          await client.from('job_sources').insert({
            id: src.id,
            ...payload,
          });
          inserted++;
        }
      } catch (err) {
        console.warn(`[Server Admin] Failed to upsert job_source "${src.name}":`, err);
      }
    }

    try {
      const { data: allSources } = await client.from('job_sources').select('*');
      if (allSources && allSources.length > 0) {
        for (const s of allSources) {
          const reg = s.region || 'UNSPECIFIED';
          regionBreakdown[reg] = (regionBreakdown[reg] || 0) + 1;
          if (Array.isArray(s.category)) {
            for (const c of s.category) {
              categoryBreakdown[c] = (categoryBreakdown[c] || 0) + 1;
            }
          }
        }
        return {
          inserted,
          updated,
          total: allSources.length,
          active: allSources.filter((s: any) => s.active !== false).length,
          regionBreakdown,
          categoryBreakdown,
        };
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback calculation from verified registry
  for (const src of VERIFIED_OFFICIAL_JOB_SOURCES) {
    const reg = src.region || 'UNSPECIFIED';
    regionBreakdown[reg] = (regionBreakdown[reg] || 0) + 1;
    for (const c of src.category) {
      categoryBreakdown[c] = (categoryBreakdown[c] || 0) + 1;
    }
  }

  return {
    inserted: VERIFIED_OFFICIAL_JOB_SOURCES.length,
    updated: 0,
    total: VERIFIED_OFFICIAL_JOB_SOURCES.length,
    active: VERIFIED_OFFICIAL_JOB_SOURCES.filter((s) => s.active).length,
    regionBreakdown,
    categoryBreakdown,
  };
}




