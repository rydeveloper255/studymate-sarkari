/**
 * StudyMate Sarkari — Step 8: Bounded Retry Policy & Error Classification Engine
 *
 * Implements exponential backoff with jitter and strictly differentiates
 * permanent non-retryable failures from transient recoverable errors.
 */

import { RetryPolicyOptions } from '../../../types/automation';

export interface ClassifiedError {
  isPermanent: boolean;
  errorCode: string;
  safeMessage: string;
}

const DEFAULT_MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const DEFAULT_BASE_DELAY_MS = parseInt(process.env.RETRY_BASE_DELAY_MS || '1000', 10);
const DEFAULT_MAX_DELAY_MS = 15000;

/**
 * Classifies an error into permanent (non-retryable) vs transient (retryable).
 */
export function classifyError(error: any, httpStatus?: number | null): ClassifiedError {
  const message = error?.message || (typeof error === 'string' ? error : 'Unknown error');
  const code = error?.code || error?.errorCode || '';

  // 1. Permanent HTTP Status Codes
  if (httpStatus) {
    if ([400, 401, 403, 404, 405, 410, 415, 422].includes(httpStatus)) {
      return {
        isPermanent: true,
        errorCode: `HTTP_${httpStatus}`,
        safeMessage: `Permanent HTTP ${httpStatus} error: ${message}`,
      };
    }
    if ([429, 500, 502, 503, 504].includes(httpStatus)) {
      return {
        isPermanent: false,
        errorCode: `HTTP_${httpStatus}`,
        safeMessage: `Transient HTTP ${httpStatus} error: ${message}`,
      };
    }
  }

  // 2. Permanent Error Keywords & Codes
  const permanentCodes = [
    'INVALID_URL',
    'SSRF_DETECTED',
    'REDIRECT_REJECTED',
    'UNSUPPORTED_CONTENT_TYPE',
    'AUTHENTICATION_FAILED',
    'SOURCE_NOT_FOUND',
    'INVALID_PAYLOAD',
  ];

  if (permanentCodes.some((c) => code.toUpperCase().includes(c) || message.toUpperCase().includes(c))) {
    return {
      isPermanent: true,
      errorCode: code || 'PERMANENT_ERROR',
      safeMessage: message,
    };
  }

  // 3. Transient Error Keywords & Network Codes
  const transientCodes = [
    'TIMEOUT',
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'NETWORK_ERROR',
    'RATE_LIMITED',
    'FETCH_FAILED',
    'DATABASE_TIMEOUT',
    'DEADLOCK',
  ];

  if (transientCodes.some((c) => code.toUpperCase().includes(c) || message.toUpperCase().includes(c))) {
    return {
      isPermanent: false,
      errorCode: code || 'TRANSIENT_ERROR',
      safeMessage: message,
    };
  }

  // Default to transient for unexpected runtime exceptions up to max retries
  return {
    isPermanent: false,
    errorCode: code || 'UNKNOWN_ERROR',
    safeMessage: message,
  };
}

/**
 * Calculates exponential backoff with full jitter to avoid thundering herd.
 * Formula: Math.random() * min(maxDelay, baseDelay * (2 ** (attempt - 1)))
 */
export function calculateBackoffMs(
  attempt: number,
  baseDelayMs: number = DEFAULT_BASE_DELAY_MS,
  maxDelayMs: number = DEFAULT_MAX_DELAY_MS,
  withJitter: boolean = true
): number {
  const exponential = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const capped = Math.min(maxDelayMs, exponential);

  if (!withJitter) {
    return capped;
  }

  // Full jitter: random value between 0.5 * capped and capped
  const minJitter = capped * 0.5;
  const jitterRange = capped * 0.5;
  return Math.floor(minJitter + Math.random() * jitterRange);
}

export interface ExecuteWithRetryResult<T> {
  success: boolean;
  result?: T;
  attempts: number;
  totalDurationMs: number;
  lastError?: ClassifiedError;
}

/**
 * Executes an operation with bounded exponential backoff retries.
 */
export async function executeWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryPolicyOptions = {}
): Promise<ExecuteWithRetryResult<T>> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const jitter = options.jitter ?? true;

  const startMs = Date.now();
  let attempt = 0;
  let lastError: ClassifiedError | undefined;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const result = await operation(attempt);
      return {
        success: true,
        result,
        attempts: attempt,
        totalDurationMs: Date.now() - startMs,
      };
    } catch (err: any) {
      lastError = classifyError(err, err?.httpStatus || err?.status);

      // If error is permanent, do NOT waste retries
      if (lastError.isPermanent || attempt >= maxRetries) {
        break;
      }

      // Calculate backoff delay
      const delayMs = calculateBackoffMs(attempt, baseDelayMs, maxDelayMs, jitter);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    success: false,
    attempts: attempt,
    totalDurationMs: Date.now() - startMs,
    lastError,
  };
}
