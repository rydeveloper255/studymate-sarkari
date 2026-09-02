/**
 * StudyMate Sarkari — Step 8: Distributed Locking Engine
 *
 * Prevents overlapping/simultaneous executions of the same source or scheduled job
 * across distributed Google Cloud Run instances.
 *
 * FEATURES:
 * - Unique owner token per lock acquisition
 * - Automatic TTL expiration (prevents stuck locks if a worker crashes)
 * - Safe release verification (only matching token owner can release)
 * - Database persistence (Supabase `distributed_locks`) with in-memory fallback
 */

import { getSupabaseAdmin } from '../supabaseAdmin';
import { DbDistributedLock, LockAcquireOptions } from '../../../types/automation';

const inMemoryLockStore = new Map<string, { token: string; expiresAt: number; metadata?: any }>();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes default TTL

function generateLockToken(): string {
  return 'lock_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
}

/**
 * Attempts to acquire an exclusive distributed lock.
 * Returns the lock token string if successfully acquired, or null if lock is already held.
 */
export async function acquireDistributedLock(
  lockKey: string,
  options: LockAcquireOptions = {}
): Promise<string | null> {
  const ttlMs = options.ttlMs || DEFAULT_TTL_MS;
  const token = options.token || generateLockToken();
  const now = Date.now();
  const expiresAt = new Date(now + ttlMs).toISOString();

  // 1. Try Supabase Distributed Lock Table if available
  const client = getSupabaseAdmin();
  if (client) {
    try {
      // Check existing lock
      const { data: existing } = await client
        .from('distributed_locks')
        .select('*')
        .eq('lock_key', lockKey)
        .maybeSingle();

      if (existing) {
        const isExpired = new Date(existing.expires_at).getTime() <= now;
        if (!isExpired && existing.lock_token !== token) {
          // Lock is actively held by another process
          return null;
        }
      }

      // Upsert lock
      const { error } = await client.from('distributed_locks').upsert({
        lock_key: lockKey,
        lock_token: token,
        locked_at: new Date(now).toISOString(),
        expires_at: expiresAt,
        metadata: {
          owner: options.owner || 'worker',
          ttlMs,
        },
      });

      if (!error) {
        inMemoryLockStore.set(lockKey, { token, expiresAt: now + ttlMs });
        return token;
      }
    } catch (err) {
      console.warn('[DistributedLock] Supabase lock acquisition failed, falling back to memory:', err);
    }
  }

  // 2. In-Memory Store Fallback
  const existingMem = inMemoryLockStore.get(lockKey);
  if (existingMem) {
    const isExpired = existingMem.expiresAt <= now;
    if (!isExpired && existingMem.token !== token) {
      return null;
    }
  }

  inMemoryLockStore.set(lockKey, { token, expiresAt: now + ttlMs, metadata: { owner: options.owner } });
  return token;
}

/**
 * Releases a distributed lock if the token matches.
 */
export async function releaseDistributedLock(
  lockKey: string,
  token: string
): Promise<boolean> {
  let released = false;

  // 1. In-Memory Release
  const mem = inMemoryLockStore.get(lockKey);
  if (mem && mem.token === token) {
    inMemoryLockStore.delete(lockKey);
    released = true;
  }

  // 2. Supabase Release
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { error } = await client
        .from('distributed_locks')
        .delete()
        .eq('lock_key', lockKey)
        .eq('lock_token', token);

      if (!error) {
        released = true;
      }
    } catch (err) {
      console.warn('[DistributedLock] Supabase lock release failed:', err);
    }
  }

  return released;
}

/**
 * Checks whether a lock is actively held.
 */
export async function isLockActive(lockKey: string): Promise<boolean> {
  const now = Date.now();

  const mem = inMemoryLockStore.get(lockKey);
  if (mem && mem.expiresAt > now) {
    return true;
  }

  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data } = await client
        .from('distributed_locks')
        .select('expires_at')
        .eq('lock_key', lockKey)
        .maybeSingle();

      if (data && new Date(data.expires_at).getTime() > now) {
        return true;
      }
    } catch {
      // Fallback to mem check
    }
  }

  return false;
}

/**
 * Cleans up expired locks in memory and database.
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const now = Date.now();
  let cleaned = 0;

  for (const [k, v] of inMemoryLockStore.entries()) {
    if (v.expiresAt <= now) {
      inMemoryLockStore.delete(k);
      cleaned++;
    }
  }

  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data } = await client
        .from('distributed_locks')
        .delete()
        .lte('expires_at', new Date(now).toISOString())
        .select('lock_key');

      if (data) {
        cleaned += data.length;
      }
    } catch {
      // Ignore
    }
  }

  return cleaned;
}

/**
 * Executes an asynchronous function with an exclusive distributed lock.
 */
export async function withDistributedLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  options: LockAcquireOptions = {}
): Promise<{ acquired: true; result: T } | { acquired: false; result: null }> {
  const token = await acquireDistributedLock(lockKey, options);
  if (!token) {
    return { acquired: false, result: null };
  }

  try {
    const result = await fn();
    return { acquired: true, result };
  } finally {
    await releaseDistributedLock(lockKey, token);
  }
}
