/**
 * StudyMate Sarkari — Step 4: Core HTTP Source Fetcher & Hash Engine
 *
 * SPECIFICATION & SAFETY MANDATES:
 * - Server-side only
 * - Enforces timeout (AbortController) & response size ceiling
 * - Validates redirects through SSRF engine at every hop
 * - Conditional request headers (ETag, Last-Modified)
 * - SHA-256 hash generation for change detection
 * - Exponential backoff with jitter for transient failures
 * - Transparent StudyMate Sarkari User-Agent
 * - PDF safety: hashes without execution
 */

import { createHash } from 'node:crypto';
import { DbContentSource, FetchState } from '../../types';
import { validateSourceUrl, validateRedirect } from './urlValidator';

export interface FetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRetries?: number;
  maxRedirects?: number;
  userAgent?: string;
  customHeaders?: Record<string, string>;
  forceFetch?: boolean;
  allowLoopbackForTesting?: boolean;
}

export interface FetchExecutionResult {
  state: FetchState;
  success: boolean;
  changed: boolean;
  httpStatus: number | null;
  contentHash: string | null;
  contentType: string | null;
  contentLength: number | null;
  etag: string | null;
  lastModified: string | null;
  responseTimeMs: number;
  attempts: number;
  finalUrl: string;
  errorCode: string | null;
  errorMessage: string | null;
}

const DEFAULT_TIMEOUT_MS = parseInt(process.env.SOURCE_FETCH_TIMEOUT_MS || '30000', 10);
const DEFAULT_MAX_BYTES = parseInt(process.env.SOURCE_FETCH_MAX_BYTES || '10485760', 10); // 10 MB
const DEFAULT_MAX_RETRIES = parseInt(process.env.SOURCE_FETCH_MAX_RETRIES || '2', 10);
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_USER_AGENT =
  process.env.SOURCE_FETCH_USER_AGENT ||
  'StudyMateSarkariBot/1.0 (+https://studymatesarkari.in/bot; contact@studymatesarkari.in)';

/**
 * Calculates SHA-256 hash of a buffer or string.
 */
export function calculateContentHash(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Computes exponential backoff delay with jitter.
 */
function getBackoffDelay(attempt: number, retryAfterSec?: number): number {
  if (retryAfterSec && retryAfterSec > 0 && retryAfterSec <= 30) {
    return retryAfterSec * 1000;
  }
  const baseMs = 1000;
  const maxMs = 8000;
  const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  const jitter = Math.floor(Math.random() * 500);
  return exp + jitter;
}

/**
 * Checks if an HTTP status or error is transient and eligible for retry.
 */
function isTransientError(status: number | null, errorCode: string | null): boolean {
  if (status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  if (errorCode === 'TIMEOUT' || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'EAI_AGAIN') {
    return true;
  }
  return false;
}

/**
 * Fetches a single source URL with safety checks, redirects, retries, and change detection.
 */
export async function fetchSourceContent(
  source: DbContentSource,
  options: FetchOptions = {}
): Promise<FetchExecutionResult> {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes || DEFAULT_MAX_BYTES;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const userAgent = options.userAgent || DEFAULT_USER_AGENT;

  const initialUrl = source.official_url;
  const validation = validateSourceUrl(initialUrl, {
    allowLoopbackForTesting: options.allowLoopbackForTesting,
  });

  if (!validation.isValid) {
    return {
      state: 'INVALID_URL',
      success: false,
      changed: false,
      httpStatus: null,
      contentHash: null,
      contentType: null,
      contentLength: null,
      etag: null,
      lastModified: null,
      responseTimeMs: 0,
      attempts: 1,
      finalUrl: initialUrl,
      errorCode: 'INVALID_URL',
      errorMessage: validation.error || 'Invalid or forbidden URL',
    };
  }

  let attempt = 0;
  const startTime = Date.now();

  while (attempt <= maxRetries) {
    attempt++;
    const attemptStartTime = Date.now();

    try {
      let currentUrl = validation.normalizedUrl || initialUrl;
      let redirectCount = 0;
      let response: Response | null = null;

      // Custom redirect loop with strict SSRF checks at every hop
      while (redirectCount <= maxRedirects) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const headers: Record<string, string> = {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
          'Cache-Control': 'no-cache',
          ...options.customHeaders,
        };

        // Add conditional headers if not forcing
        if (!options.forceFetch && attempt === 1) {
          if (source.etag) {
            headers['If-None-Match'] = source.etag;
          }
          if (source.last_modified) {
            headers['If-Modified-Since'] = source.last_modified;
          }
        }

        try {
          response = await fetch(currentUrl, {
            method: 'GET',
            headers,
            signal: controller.signal,
            redirect: 'manual', // Handle manually for SSRF verification
          });
        } finally {
          clearTimeout(timer);
        }

        // Handle Redirects (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const redirectLocation = response.headers.get('location');
          if (!redirectLocation) {
            return {
              state: 'HTTP_ERROR',
              success: false,
              changed: false,
              httpStatus: response.status,
              contentHash: null,
              contentType: null,
              contentLength: null,
              etag: null,
              lastModified: null,
              responseTimeMs: Date.now() - attemptStartTime,
              attempts: attempt,
              finalUrl: currentUrl,
              errorCode: 'MISSING_REDIRECT_LOCATION',
              errorMessage: `Server returned ${response.status} without a Location header`,
            };
          }

          const redirectValidation = validateRedirect(currentUrl, redirectLocation, {
            allowLoopbackForTesting: options.allowLoopbackForTesting,
          });
          if (!redirectValidation.isValid) {
            return {
              state: 'REDIRECT_REJECTED',
              success: false,
              changed: false,
              httpStatus: response.status,
              contentHash: null,
              contentType: null,
              contentLength: null,
              etag: null,
              lastModified: null,
              responseTimeMs: Date.now() - attemptStartTime,
              attempts: attempt,
              finalUrl: currentUrl,
              errorCode: 'UNSAFE_REDIRECT',
              errorMessage: `Redirect blocked by security filter: ${redirectValidation.error}`,
            };
          }

          currentUrl = redirectValidation.normalizedUrl || redirectLocation;
          redirectCount++;
          continue;
        }

        break;
      }

      if (redirectCount > maxRedirects) {
        return {
          state: 'REDIRECT_REJECTED',
          success: false,
          changed: false,
          httpStatus: 310,
          contentHash: null,
          contentType: null,
          contentLength: null,
          etag: null,
          lastModified: null,
          responseTimeMs: Date.now() - attemptStartTime,
          attempts: attempt,
          finalUrl: currentUrl,
          errorCode: 'TOO_MANY_REDIRECTS',
          errorMessage: `Exceeded maximum redirect limit (${maxRedirects})`,
        };
      }

      if (!response) {
        throw new Error('No response received');
      }

      const responseTimeMs = Date.now() - attemptStartTime;
      const httpStatus = response.status;
      const etag = response.headers.get('etag');
      const lastModified = response.headers.get('last-modified');
      const rawContentType = response.headers.get('content-type') || 'text/html';
      const contentType = rawContentType.split(';')[0].trim().toLowerCase();

      // Handle 304 Not Modified
      if (httpStatus === 304) {
        return {
          state: 'SUCCESS_UNCHANGED',
          success: true,
          changed: false,
          httpStatus: 304,
          contentHash: source.content_hash || null,
          contentType,
          contentLength: 0,
          etag: etag || source.etag || null,
          lastModified: lastModified || source.last_modified || null,
          responseTimeMs,
          attempts: attempt,
          finalUrl: currentUrl,
          errorCode: null,
          errorMessage: null,
        };
      }

      // Handle 429 Rate Limited
      if (httpStatus === 429) {
        if (attempt <= maxRetries) {
          const retryAfterHeader = response.headers.get('retry-after');
          const retrySec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
          const delay = getBackoffDelay(attempt, isNaN(retrySec as number) ? undefined : retrySec);
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
        return {
          state: 'RATE_LIMITED',
          success: false,
          changed: false,
          httpStatus: 429,
          contentHash: null,
          contentType,
          contentLength: null,
          etag,
          lastModified,
          responseTimeMs,
          attempts: attempt,
          finalUrl: currentUrl,
          errorCode: 'HTTP_429',
          errorMessage: 'Rate limit exceeded on target government server',
        };
      }

      // Handle Client Errors (400, 401, 403, 404, etc.) - Non-transient
      if (httpStatus >= 400 && httpStatus < 500 && httpStatus !== 408) {
        return {
          state: 'HTTP_ERROR',
          success: false,
          changed: false,
          httpStatus,
          contentHash: null,
          contentType,
          contentLength: null,
          etag,
          lastModified,
          responseTimeMs,
          attempts: attempt,
          finalUrl: currentUrl,
          errorCode: `HTTP_${httpStatus}`,
          errorMessage: `Target server returned HTTP ${httpStatus}`,
        };
      }

      // Handle Server Errors (500, 502, 503, 504, 408) - Transient
      if (httpStatus >= 500 || httpStatus === 408) {
        if (attempt <= maxRetries) {
          const delay = getBackoffDelay(attempt);
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
        return {
          state: 'HTTP_ERROR',
          success: false,
          changed: false,
          httpStatus,
          contentHash: null,
          contentType,
          contentLength: null,
          etag,
          lastModified,
          responseTimeMs,
          attempts: attempt,
          finalUrl: currentUrl,
          errorCode: `HTTP_${httpStatus}`,
          errorMessage: `Target server returned HTTP ${httpStatus} after ${attempt} attempts`,
        };
      }

      // Handle 200 OK — Read body with size limits
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > maxBytes) {
        return {
          state: 'CONTENT_TOO_LARGE',
          success: false,
          changed: false,
          httpStatus,
          contentHash: null,
          contentType,
          contentLength: parseInt(contentLengthHeader, 10),
          etag,
          lastModified,
          responseTimeMs,
          attempts: attempt,
          finalUrl: currentUrl,
          errorCode: 'CONTENT_TOO_LARGE',
          errorMessage: `Content-Length ${contentLengthHeader} bytes exceeds limit of ${maxBytes} bytes`,
        };
      }

      // Read arrayBuffer safely
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.byteLength > maxBytes) {
        return {
          state: 'CONTENT_TOO_LARGE',
          success: false,
          changed: false,
          httpStatus,
          contentHash: null,
          contentType,
          contentLength: buffer.byteLength,
          etag,
          lastModified,
          responseTimeMs,
          attempts: attempt,
          finalUrl: currentUrl,
          errorCode: 'CONTENT_TOO_LARGE',
          errorMessage: `Downloaded body ${buffer.byteLength} bytes exceeds limit of ${maxBytes} bytes`,
        };
      }

      // Calculate content hash
      const contentHash = calculateContentHash(buffer);
      const isChanged = source.content_hash ? source.content_hash !== contentHash : true;
      const state: FetchState = isChanged ? 'SUCCESS_CHANGED' : 'SUCCESS_UNCHANGED';

      return {
        state,
        success: true,
        changed: isChanged,
        httpStatus,
        contentHash,
        contentType,
        contentLength: buffer.byteLength,
        etag: etag || null,
        lastModified: lastModified || null,
        responseTimeMs,
        attempts: attempt,
        finalUrl: currentUrl,
        errorCode: null,
        errorMessage: null,
      };
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError' || err?.code === 'ETIMEDOUT';
      const errorCode = isTimeout ? 'TIMEOUT' : err?.code || 'FETCH_EXCEPTION';
      const errorMessage = err?.message || 'Network request failed';

      if (attempt <= maxRetries && isTransientError(null, errorCode)) {
        const delay = getBackoffDelay(attempt);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      const totalTimeMs = Date.now() - startTime;
      return {
        state: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        success: false,
        changed: false,
        httpStatus: null,
        contentHash: null,
        contentType: null,
        contentLength: null,
        etag: null,
        lastModified: null,
        responseTimeMs: totalTimeMs,
        attempts: attempt,
        finalUrl: initialUrl,
        errorCode,
        errorMessage,
      };
    }
  }

  // Fallback if loop finishes unexpectedly
  return {
    state: 'NETWORK_ERROR',
    success: false,
    changed: false,
    httpStatus: null,
    contentHash: null,
    contentType: null,
    contentLength: null,
    etag: null,
    lastModified: null,
    responseTimeMs: Date.now() - startTime,
    attempts: attempt,
    finalUrl: initialUrl,
    errorCode: 'UNKNOWN_FAILURE',
    errorMessage: 'Fetch process terminated without resolution',
  };
}
