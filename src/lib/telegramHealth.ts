/**
 * StudyMate Sarkari — Internal Telegram Health Verification
 *
 * Server-side module to verify Telegram bot connectivity using the Telegram
 * Bot API 'getMe' method and the TELEGRAM_BOT_TOKEN environment variable.
 *
 * CRITICAL SECURITY & OPERATIONAL RULES:
 * - Server-only execution.
 * - Never logs, prints, or exposes TELEGRAM_BOT_TOKEN in any return value, error, or log.
 * - Handles network timeouts, unreachable API, 401 Unauthorized, and JSON errors gracefully.
 * - In-memory response caching (30s) to prevent spamming Telegram Bot API on frequent health checks.
 */

import { redactTelegramSecrets } from './server/telegram/config';

export interface TelegramBotMeResult {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface TelegramConnectionHealth {
  ok: boolean;
  status: 'connected' | 'not_configured' | 'error';
  bot?: {
    id: number | string;
    username?: string;
    firstName?: string;
  };
  error?: string;
  timestamp: string;
}

// In-memory cache to prevent hitting Telegram API rate limits during rapid health probes
let cachedResult: {
  data: TelegramConnectionHealth;
  expiresAt: number;
} | null = null;

/**
 * Internal function to verify Telegram bot connectivity using the 'getMe' API method.
 *
 * Reads TELEGRAM_BOT_TOKEN from process.env, queries Telegram Bot API,
 * catches all errors gracefully, and returns sanitized connection health.
 *
 * @param options.bypassCache - If true, ignores the 30-second cache and queries Telegram immediately
 * @param options.timeoutMs - Custom timeout in milliseconds (default: 8000ms)
 */
export async function verifyTelegramBotConnection(options?: {
  bypassCache?: boolean;
  timeoutMs?: number;
}): Promise<TelegramConnectionHealth> {
  const token = typeof process !== 'undefined' ? process.env?.TELEGRAM_BOT_TOKEN?.trim() : undefined;

  // 1. If token is missing or too short, return 'not_configured' safely
  if (!token || token.length < 10) {
    return {
      ok: false,
      status: 'not_configured',
      error: 'TELEGRAM_BOT_TOKEN is not configured on server.',
      timestamp: new Date().toISOString(),
    };
  }

  // 2. Return cached result if still valid and bypassCache is not requested
  const now = Date.now();
  if (!options?.bypassCache && cachedResult && cachedResult.expiresAt > now) {
    return cachedResult.data;
  }

  const timeoutMs = options?.timeoutMs || 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const apiUrl = `https://api.telegram.org/bot${token}/getMe`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StudyMateSarkari-TelegramHealthCheck/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = (await response.json()) as {
      ok: boolean;
      result?: TelegramBotMeResult;
      description?: string;
      error_code?: number;
    };

    if (response.ok && json.ok && json.result) {
      const successResult: TelegramConnectionHealth = {
        ok: true,
        status: 'connected',
        bot: {
          id: json.result.id,
          username: json.result.username || 'StudyMateOfficialBot',
          firstName: json.result.first_name,
        },
        timestamp: new Date().toISOString(),
      };

      cachedResult = {
        data: successResult,
        expiresAt: now + 30000, // Cache successful health for 30s
      };

      return successResult;
    }

    // Handle Telegram API failure (e.g. 401 Invalid Token, 404, etc.)
    const rawError = json.description || `Telegram API returned HTTP ${response.status}`;
    const sanitizedError = redactTelegramSecrets(rawError);

    const errorResult: TelegramConnectionHealth = {
      ok: false,
      status: 'error',
      error: sanitizedError,
      timestamp: new Date().toISOString(),
    };

    cachedResult = {
      data: errorResult,
      expiresAt: now + 10000, // Cache error status for 10s
    };

    return errorResult;
  } catch (err: any) {
    clearTimeout(timeoutId);

    let rawMessage = 'Failed to connect to Telegram API';
    if (err?.name === 'AbortError') {
      rawMessage = `Telegram API getMe request timed out after ${timeoutMs}ms.`;
    } else if (err?.message) {
      rawMessage = err.message;
    }

    const sanitizedError = redactTelegramSecrets(rawMessage);

    const errorResult: TelegramConnectionHealth = {
      ok: false,
      status: 'error',
      error: sanitizedError,
      timestamp: new Date().toISOString(),
    };

    cachedResult = {
      data: errorResult,
      expiresAt: now + 10000, // Cache error status for 10s
    };

    return errorResult;
  }
}

/**
 * Convenient alias function to get safe telegram connection status.
 */
export async function getTelegramHealthStatus(): Promise<{
  telegram: 'connected' | 'not_configured' | 'error';
  bot?: string;
  botId?: string | number;
}> {
  const result = await verifyTelegramBotConnection();
  return {
    telegram: result.status,
    bot: result.bot?.username,
    botId: result.bot?.id,
  };
}

export default verifyTelegramBotConnection;
