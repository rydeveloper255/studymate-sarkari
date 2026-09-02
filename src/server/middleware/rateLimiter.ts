/**
 * StudyMate Sarkari — In-Memory Rate Limiter Middleware
 * Protects server and endpoints from abusive bot scraping, DoS, and spam.
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests from this IP. Please try again later.',
    keyGenerator = (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '127.0.0.1';
      return ip;
    },
  } = options;

  const hits = new Map<string, RateLimitRecord>();

  // Cleanup old keys every 5 minutes
  if (typeof setInterval !== 'undefined') {
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of hits.entries()) {
        if (now > record.resetTime) {
          hits.delete(key);
        }
      }
    }, 5 * 60 * 1000);
    if (cleanup.unref) cleanup.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    let record = hits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfterSeconds: resetSeconds,
      });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters
export const publicApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120,    // 120 reqs/min for public API
  message: 'API rate limit exceeded. Please slow down your requests.',
});

export const contactFormRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,           // 5 submissions per 15 minutes
  message: 'Too many contact messages submitted. Please wait a few minutes before trying again.',
});

export const internalAutomationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 300,    // High throughput for scheduler worker
});
