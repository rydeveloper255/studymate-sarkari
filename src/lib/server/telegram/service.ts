/**
 * StudyMate Sarkari — Step 7: Telegram Notification Service
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - Isolated server-side notification delivery
 * - Idempotency enforcement to prevent duplicate messages
 * - Dry-run & safe-mode support (defaults to non-destructive dry-run)
 * - Complete isolation: Telegram failures NEVER break publishing or website delivery
 * - Comprehensive delivery audit logging in telegram_notification_log
 */

import {
  TelegramConfig,
  TelegramHealthResponse,
  TelegramMessagePayload,
  TelegramDeliveryResult,
  TelegramDeliveryStatus,
} from '../../../types/telegram';
import {
  DbGovernmentJob,
  DbGovernmentUpdate,
  DbAdmitCard,
  DbExamResult,
  DbAnswerKey,
  NormalizedExtractedItem,
  DbParsedContentItem,
} from '../../../types';
import { getTelegramConfig, redactTelegramSecrets } from './config';
import { TelegramClient } from './client';
import {
  formatVacancyMessage,
  formatAdmitCardMessage,
  formatResultMessage,
  formatAnswerKeyMessage,
  formatUpdateMessage,
} from './formatter';
import { isTelegramNotificationEligible } from './eligibility';
import {
  findTelegramNotificationLog,
  saveTelegramNotificationLog,
  getTelegramNotificationLogs,
} from '../supabaseAdmin';

export class TelegramNotificationService {
  private config: TelegramConfig;
  private client: TelegramClient;

  constructor(customConfig?: Partial<TelegramConfig>) {
    this.config = {
      ...getTelegramConfig(),
      ...customConfig,
    };
    this.client = new TelegramClient(this.config.botToken);
  }

  /**
   * Health check for internal monitoring (returns safe diagnostic status without token exposure).
   */
  public async getHealth(): Promise<TelegramHealthResponse> {
    const timestamp = new Date().toISOString();
    const config = this.config;

    if (!config.botToken) {
      return {
        connected: false,
        notificationsEnabled: config.notificationsEnabled,
        dryRun: config.dryRun,
        defaultChatConfigured: Boolean(config.defaultChatId),
        timestamp,
        error: 'TELEGRAM_BOT_TOKEN environment variable is not configured.',
      };
    }

    try {
      const me = await this.client.getMe();
      if (!me.ok || !me.botInfo) {
        return {
          connected: false,
          notificationsEnabled: config.notificationsEnabled,
          dryRun: config.dryRun,
          defaultChatConfigured: Boolean(config.defaultChatId),
          timestamp,
          error: me.error ? redactTelegramSecrets(me.error) : 'Failed to connect to Telegram Bot API.',
        };
      }

      return {
        connected: true,
        botUsername: me.botInfo.username || me.botInfo.firstName,
        botId: String(me.botInfo.id),
        notificationsEnabled: config.notificationsEnabled,
        dryRun: config.dryRun,
        defaultChatConfigured: Boolean(config.defaultChatId),
        timestamp,
      };
    } catch (err: any) {
      return {
        connected: false,
        notificationsEnabled: config.notificationsEnabled,
        dryRun: config.dryRun,
        defaultChatConfigured: Boolean(config.defaultChatId),
        timestamp,
        error: redactTelegramSecrets(err?.message || 'Error executing Telegram health check'),
      };
    }
  }

  /**
   * Dispatches a formatted notification message to Telegram.
   * Guarantees idempotency and safe logging.
   */
  public async dispatchNotification(
    payload: TelegramMessagePayload,
    options: { forceSend?: boolean; dryRun?: boolean } = {}
  ): Promise<TelegramDeliveryResult> {
    const startMs = Date.now();
    const config = this.config;
    const destinationChatId = payload.destinationChatId || config.defaultChatId || 'default';
    const isDryRun = options.dryRun !== undefined ? options.dryRun : config.dryRun;

    // 1. Idempotency Check (Check if already sent)
    const existingLog = await findTelegramNotificationLog(payload.idempotencyKey);
    if (existingLog && !options.forceSend) {
      if (existingLog.status === 'SENT' || existingLog.status === 'DRY_RUN_SUCCESS') {
        return {
          success: true,
          status: 'SKIPPED_DUPLICATE',
          idempotencyKey: payload.idempotencyKey,
          telegramMessageId: existingLog.telegram_message_id || undefined,
          destinationChatId,
          sentAt: existingLog.sent_at || undefined,
          durationMs: Date.now() - startMs,
        };
      }
    }

    // 2. Disabled Mode Check
    if (!config.notificationsEnabled && !options.forceSend) {
      await saveTelegramNotificationLog({
        target_type: payload.targetType,
        target_id: payload.targetId,
        notification_type: payload.notificationType,
        destination_chat_id: destinationChatId,
        idempotency_key: payload.idempotencyKey,
        message_hash: payload.messageHash,
        status: 'DISABLED',
        attempt_count: 0,
        last_error: 'Telegram notifications are disabled in server configuration.',
      });

      return {
        success: false,
        status: 'DISABLED',
        idempotencyKey: payload.idempotencyKey,
        destinationChatId,
        durationMs: Date.now() - startMs,
        errorCode: 'TELEGRAM_DISABLED',
        errorMessage: 'Telegram notifications disabled via TELEGRAM_NOTIFICATIONS_ENABLED=false.',
      };
    }

    // 3. Dry-Run Mode Check
    if (isDryRun) {
      await saveTelegramNotificationLog({
        target_type: payload.targetType,
        target_id: payload.targetId,
        notification_type: payload.notificationType,
        destination_chat_id: destinationChatId,
        idempotency_key: payload.idempotencyKey,
        message_hash: payload.messageHash,
        status: 'DRY_RUN_SUCCESS',
        attempt_count: 1,
        sent_at: new Date().toISOString(),
      });

      return {
        success: true,
        status: 'DRY_RUN_SUCCESS',
        idempotencyKey: payload.idempotencyKey,
        destinationChatId,
        durationMs: Date.now() - startMs,
        isDryRun: true,
      };
    }

    // 4. Live API Dispatch
    try {
      const sendRes = await this.client.sendMessage(destinationChatId, payload.formattedText, {
        buttons: payload.buttons,
      });

      if (sendRes.ok && sendRes.messageId) {
        await saveTelegramNotificationLog({
          target_type: payload.targetType,
          target_id: payload.targetId,
          notification_type: payload.notificationType,
          destination_chat_id: destinationChatId,
          idempotency_key: payload.idempotencyKey,
          message_hash: payload.messageHash,
          telegram_message_id: sendRes.messageId,
          status: 'SENT',
          attempt_count: (existingLog?.attempt_count || 0) + 1,
          sent_at: new Date().toISOString(),
          last_error: null,
        });

        return {
          success: true,
          status: 'SENT',
          idempotencyKey: payload.idempotencyKey,
          telegramMessageId: sendRes.messageId,
          destinationChatId,
          sentAt: new Date().toISOString(),
          durationMs: Date.now() - startMs,
        };
      }

      // Record API failure
      await saveTelegramNotificationLog({
        target_type: payload.targetType,
        target_id: payload.targetId,
        notification_type: payload.notificationType,
        destination_chat_id: destinationChatId,
        idempotency_key: payload.idempotencyKey,
        message_hash: payload.messageHash,
        status: 'FAILED',
        attempt_count: (existingLog?.attempt_count || 0) + 1,
        last_error: sendRes.error ? redactTelegramSecrets(sendRes.error) : 'Telegram API delivery failed.',
      });

      return {
        success: false,
        status: 'FAILED',
        idempotencyKey: payload.idempotencyKey,
        destinationChatId,
        durationMs: Date.now() - startMs,
        errorCode: sendRes.errorCode || 'TELEGRAM_UNKNOWN_ERROR',
        errorMessage: sendRes.error ? redactTelegramSecrets(sendRes.error) : 'Delivery failed',
      };
    } catch (err: any) {
      const errMsg = redactTelegramSecrets(err?.message || 'Unexpected exception during Telegram dispatch');
      await saveTelegramNotificationLog({
        target_type: payload.targetType,
        target_id: payload.targetId,
        notification_type: payload.notificationType,
        destination_chat_id: destinationChatId,
        idempotency_key: payload.idempotencyKey,
        message_hash: payload.messageHash,
        status: 'FAILED',
        attempt_count: (existingLog?.attempt_count || 0) + 1,
        last_error: errMsg,
      });

      return {
        success: false,
        status: 'FAILED',
        idempotencyKey: payload.idempotencyKey,
        destinationChatId,
        durationMs: Date.now() - startMs,
        errorCode: 'TELEGRAM_UNKNOWN_ERROR',
        errorMessage: errMsg,
      };
    }
  }

  /**
   * High-level handler that checks eligibility, formats, and dispatches alert for any verified published record.
   */
  public async handlePublishedItem(
    item:
      | DbGovernmentJob
      | DbGovernmentUpdate
      | DbAdmitCard
      | DbExamResult
      | DbAnswerKey
      | NormalizedExtractedItem
      | DbParsedContentItem,
    options: { destinationChatId?: string; dryRun?: boolean; force?: boolean } = {}
  ): Promise<TelegramDeliveryResult> {
    const rawItem = 'normalized_payload' in item ? (item as DbParsedContentItem).normalized_payload : item;
    const eligibility = isTelegramNotificationEligible(rawItem);

    if (!eligibility.eligible && !options.force) {
      const targetId = 'id' in rawItem ? String(rawItem.id) : ('slug' in rawItem ? String(rawItem.slug) : 'unknown');
      return {
        success: false,
        status: 'SKIPPED_INELIGIBLE',
        idempotencyKey: `skipped:ineligible:${targetId}`,
        destinationChatId: options.destinationChatId || 'default',
        durationMs: 0,
        errorMessage: eligibility.reason || 'Item not eligible for Telegram alert.',
      };
    }

    // Format based on type
    let payload: TelegramMessagePayload;

    if ('total_vacancies' in rawItem || ('itemType' in rawItem && rawItem.itemType === 'vacancy')) {
      payload = formatVacancyMessage(rawItem as any, options);
    } else if ('download_url' in rawItem || ('itemType' in rawItem && rawItem.itemType === 'admit_card')) {
      payload = formatAdmitCardMessage(rawItem as any, options);
    } else if ('result_date' in rawItem || ('itemType' in rawItem && rawItem.itemType === 'result')) {
      payload = formatResultMessage(rawItem as any, options);
    } else if ('objection_last_date' in rawItem || ('itemType' in rawItem && rawItem.itemType === 'answer_key')) {
      payload = formatAnswerKeyMessage(rawItem as any, options);
    } else {
      payload = formatUpdateMessage(rawItem as any, options);
    }

    return this.dispatchNotification(payload, options);
  }

  /**
   * Safe test message for internal validation.
   */
  public async sendTestMessage(
    destinationChatId?: string
  ): Promise<TelegramDeliveryResult> {
    const config = this.config;
    const chatId = destinationChatId || config.defaultChatId || 'default';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const formattedText = [
      `🤖 <b>StudyMate Sarkari Telegram Bot — Test Alert</b>\n`,
      `✅ <b>Status:</b> Connected & Operational`,
      `🕒 <b>Time:</b> ${timestamp} IST`,
      `🔒 <b>Security:</b> Official Verified Channels Only`,
      `\n━━━━━━━━━━━━━━━━━━━━`,
      `⚡ <b>StudyMate Sarkari</b> — India's Official Sarkari Jobs Engine`,
    ].join('\n');

    const idempotencyKey = `test_message:${Date.now()}:${chatId}`;
    const payload: TelegramMessagePayload = {
      notificationType: 'EXAM_UPDATE',
      targetType: 'government_updates',
      targetId: 'test_msg',
      title: 'StudyMate Sarkari Bot Test',
      organization: 'StudyMate Sarkari',
      formattedText,
      buttons: [[{ text: '🌐 Visit Website', url: 'https://studymatesarkari.in' }]],
      destinationChatId: chatId,
      idempotencyKey,
      messageHash: 'test_hash_' + Date.now(),
    };

    return this.dispatchNotification(payload, { forceSend: true, dryRun: config.dryRun });
  }

  /**
   * Retrieves recent audit logs.
   */
  public async getLogs(limit = 50) {
    return getTelegramNotificationLogs(limit);
  }
}

// Global Singleton Instance
let defaultService: TelegramNotificationService | null = null;

export function getTelegramService(): TelegramNotificationService {
  if (!defaultService) {
    defaultService = new TelegramNotificationService();
  }
  return defaultService;
}
