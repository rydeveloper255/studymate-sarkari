/**
 * StudyMate Sarkari — Step 7: Telegram Configuration Module
 *
 * CRITICAL SECURITY CONSTRAINTS:
 * - Reads TELEGRAM_BOT_TOKEN ONLY from server-side process.env
 * - Never exposes tokens to client bundles, frontend code, or logs
 * - Default flags enforce safety: notifications disabled & dry-run active until explicitly toggled
 * - All log sanitizers redact tokens automatically
 */

import { TelegramConfig } from '../../../types/telegram';

export function getTelegramConfig(): TelegramConfig {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() || undefined;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME?.trim() || undefined;
  const botId = process.env.TELEGRAM_BOT_ID?.trim() || undefined;
  const defaultChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID?.trim() || undefined;

  const notificationsEnabled =
    process.env.TELEGRAM_NOTIFICATIONS_ENABLED === 'true' ||
    process.env.TELEGRAM_NOTIFICATIONS_ENABLED === '1';

  // Default to dry-run unless explicitly set to false
  const dryRun =
    process.env.TELEGRAM_DRY_RUN === undefined
      ? true
      : process.env.TELEGRAM_DRY_RUN === 'true' || process.env.TELEGRAM_DRY_RUN === '1';

  const maxRetries = parseInt(process.env.TELEGRAM_MAX_RETRIES || '3', 10);
  const requestTimeoutMs = parseInt(process.env.TELEGRAM_REQUEST_TIMEOUT_MS || '15000', 10);

  return {
    botToken: token,
    botUsername,
    botId,
    defaultChatId,
    notificationsEnabled,
    dryRun,
    maxRetries: Number.isNaN(maxRetries) ? 3 : Math.max(1, Math.min(maxRetries, 5)),
    requestTimeoutMs: Number.isNaN(requestTimeoutMs) ? 15000 : Math.max(3000, requestTimeoutMs),
  };
}

/**
 * Redacts Telegram bot tokens from any text or error string to prevent accidental leaks in logs.
 */
export function redactTelegramSecrets(input: string): string {
  if (!input) return '';
  // Telegram bot tokens match format: <digits>:[A-Za-z0-9_-]{35}
  return input.replace(/\d{8,12}:[A-Za-z0-9_-]{30,45}/g, '[REDACTED_TELEGRAM_TOKEN]');
}

/**
 * Validates that an official URL is secure and permissible for Telegram inline buttons and messages.
 */
export function isValidOfficialUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  // Block internal/loopback/metadata URLs
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('169.254.169.254') ||
    lower.includes('metadata.google.internal')
  ) {
    return false;
  }
  return true;
}
