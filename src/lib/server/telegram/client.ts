/**
 * StudyMate Sarkari — Step 7: Telegram Bot API Client
 *
 * CRITICAL SECURITY & STABILITY RULES:
 * - Server-only execution
 * - Bot token NEVER logged, echoed, or leaked in error messages or responses
 * - Automatic timeout handling via AbortController
 * - Exponential backoff for transient 5xx and 429 rate limits
 * - Fast-fail for permanent errors (invalid token, chat not found, bot kicked/blocked)
 * - Safe internal error mapping
 */

import {
  TelegramBotInfo,
  TelegramErrorCode,
  TelegramInlineButton,
} from '../../../types/telegram';
import { getTelegramConfig, redactTelegramSecrets } from './config';

export interface TelegramApiResult<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
  parameters?: {
    retry_after?: number;
    migrate_to_chat_id?: number;
  };
}

export interface SendMessageOptions {
  parseMode?: 'HTML' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  buttons?: TelegramInlineButton[][];
}

export class TelegramClient {
  private botToken?: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(token?: string) {
    const config = getTelegramConfig();
    this.botToken = token || config.botToken;
    this.timeoutMs = config.requestTimeoutMs;
    this.maxRetries = config.maxRetries;
  }

  /**
   * Checks if bot token is configured server-side.
   */
  public hasToken(): boolean {
    return Boolean(this.botToken && this.botToken.length > 10);
  }

  /**
   * Helper to execute Telegram Bot API request with timeout and secret redaction.
   */
  private async executeApi<T>(
    method: string,
    payload?: Record<string, any>,
    attempt = 1
  ): Promise<{ ok: boolean; data?: T; errorCode?: TelegramErrorCode; error?: string }> {
    if (!this.hasToken()) {
      return {
        ok: false,
        errorCode: 'TELEGRAM_INVALID_TOKEN',
        error: 'Telegram bot token is not configured on server.',
      };
    }

    const apiUrl = `https://api.telegram.org/bot${this.botToken}/${method}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'StudyMateSarkari-TelegramBot/1.0',
        },
        body: payload ? JSON.stringify(payload) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const json: TelegramApiResult<T> = await response.json();

      if (json.ok && json.result) {
        return { ok: true, data: json.result };
      }

      // Handle Telegram API errors
      const status = response.status;
      const desc = json.description || 'Unknown Telegram API error';

      if (status === 401) {
        return {
          ok: false,
          errorCode: 'TELEGRAM_INVALID_TOKEN',
          error: 'Invalid Telegram Bot Token.',
        };
      }

      if (status === 403) {
        return {
          ok: false,
          errorCode: 'TELEGRAM_PERMISSION_ERROR',
          error: `Bot has insufficient permissions or is blocked by destination: ${desc}`,
        };
      }

      if (status === 400 && (desc.includes('chat not found') || desc.includes('chat_id is empty'))) {
        return {
          ok: false,
          errorCode: 'TELEGRAM_CHAT_NOT_FOUND',
          error: `Telegram destination chat not found: ${desc}`,
        };
      }

      if (status === 400 && desc.includes('can\'t parse entities')) {
        return {
          ok: false,
          errorCode: 'TELEGRAM_INVALID_MESSAGE',
          error: `Invalid HTML markup in message: ${desc}`,
        };
      }

      // Rate limit retry handling (429)
      if (status === 429 && attempt < this.maxRetries) {
        const retryAfter = json.parameters?.retry_after || 2;
        const delayMs = Math.min(retryAfter * 1000, 10000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.executeApi<T>(method, payload, attempt + 1);
      }

      // Server error retry (5xx)
      if (status >= 500 && attempt < this.maxRetries) {
        const backoffMs = attempt * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.executeApi<T>(method, payload, attempt + 1);
      }

      return {
        ok: false,
        errorCode: status === 429 ? 'TELEGRAM_RATE_LIMITED' : 'TELEGRAM_UNKNOWN_ERROR',
        error: redactTelegramSecrets(desc),
      };
    } catch (err: any) {
      clearTimeout(timeout);

      if (err.name === 'AbortError') {
        if (attempt < this.maxRetries) {
          return this.executeApi<T>(method, payload, attempt + 1);
        }
        return {
          ok: false,
          errorCode: 'TELEGRAM_TIMEOUT',
          error: `Telegram API request timed out after ${this.timeoutMs}ms.`,
        };
      }

      if (attempt < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        return this.executeApi<T>(method, payload, attempt + 1);
      }

      return {
        ok: false,
        errorCode: 'TELEGRAM_NETWORK_ERROR',
        error: redactTelegramSecrets(err?.message || 'Network connection to Telegram failed'),
      };
    }
  }

  /**
   * Health Check: Retrieves authenticated bot identity from getMe endpoint.
   * Safe to call; never returns or leaks the token.
   */
  public async getMe(): Promise<{ ok: boolean; botInfo?: TelegramBotInfo; error?: string; errorCode?: TelegramErrorCode }> {
    const res = await this.executeApi<any>('getMe');
    if (!res.ok || !res.data) {
      return {
        ok: false,
        errorCode: res.errorCode || 'TELEGRAM_INVALID_TOKEN',
        error: res.error || 'Failed to authenticate Telegram bot credentials.',
      };
    }

    const info: TelegramBotInfo = {
      id: res.data.id,
      isBot: res.data.is_bot,
      firstName: res.data.first_name,
      username: res.data.username,
      canJoinGroups: res.data.can_join_groups,
      canReadAllGroupMessages: res.data.can_read_all_group_messages,
      supportsInlineQueries: res.data.supports_inline_queries,
    };

    return { ok: true, botInfo: info };
  }

  /**
   * Sends an HTML formatted message to a Telegram chat / channel.
   */
  public async sendMessage(
    chatId: string,
    text: string,
    options: SendMessageOptions = {}
  ): Promise<{ ok: boolean; messageId?: number; error?: string; errorCode?: TelegramErrorCode }> {
    const body: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: options.parseMode || 'HTML',
      disable_web_page_preview: options.disableWebPagePreview ?? false,
      disable_notification: options.disableNotification ?? false,
    };

    if (options.buttons && options.buttons.length > 0) {
      body.reply_markup = {
        inline_keyboard: options.buttons.map((row) =>
          row.map((btn) => ({
            text: btn.text,
            url: btn.url,
          }))
        ),
      };
    }

    const res = await this.executeApi<{ message_id: number }>('sendMessage', body);

    if (!res.ok || !res.data) {
      return {
        ok: false,
        errorCode: res.errorCode || 'TELEGRAM_UNKNOWN_ERROR',
        error: res.error || 'Failed to deliver message to Telegram chat',
      };
    }

    return {
      ok: true,
      messageId: res.data.message_id,
    };
  }
}
