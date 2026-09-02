/**
 * StudyMate Sarkari — High Performance In-Memory Cache with TTL and Tag Invalidation
 * Used for fast server-side caching of Sitemaps, Public Jobs Listings, and Category Counts.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags: string[];
}

class PublicMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes to avoid memory leaks
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.purgeExpired();
      }, 5 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Store item with TTL in seconds and optional tags
   */
  set<T>(key: string, data: T, ttlSeconds: number, tags: string[] = []): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt, tags });
  }

  /**
   * Retrieve item if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Invalidate by exact key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries tagged with specific tag (e.g. 'jobs', 'sitemap')
   */
  invalidateTag(tag: string): number {
    let invalidatedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    return invalidatedCount;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Periodic purge of expired entries
   */
  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Cache telemetry
   */
  getStats(): { size: number } {
    return { size: this.cache.size };
  }
}

export const serverCache = new PublicMemoryCache();
