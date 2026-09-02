/**
 * StudyMate Sarkari — Step 7: Telegram Bot Integration Types
 *
 * Safe, strictly-typed schemas for:
 * - Bot configuration & health
 * - Message formatting & classification
 * - Eligibility rules & idempotency
 * - Notification audit logging & error categorization
 */

export type TelegramNotificationType =
  | 'NEW_VACANCY'
  | 'ADMIT_CARD'
  | 'RESULT'
  | 'ANSWER_KEY'
  | 'EXAM_UPDATE'
  | 'JOB_UPDATE';

export type TelegramDeliveryStatus =
  | 'QUEUED'
  | 'SENT'
  | 'FAILED'
  | 'SKIPPED_DUPLICATE'
  | 'SKIPPED_INELIGIBLE'
  | 'DRY_RUN_SUCCESS'
  | 'DISABLED';

export type TelegramErrorCode =
  | 'TELEGRAM_INVALID_TOKEN'
  | 'TELEGRAM_CHAT_NOT_FOUND'
  | 'TELEGRAM_PERMISSION_ERROR'
  | 'TELEGRAM_RATE_LIMITED'
  | 'TELEGRAM_NETWORK_ERROR'
  | 'TELEGRAM_SERVER_ERROR'
  | 'TELEGRAM_INVALID_MESSAGE'
  | 'TELEGRAM_TIMEOUT'
  | 'TELEGRAM_DISABLED'
  | 'TELEGRAM_DRY_RUN'
  | 'TELEGRAM_UNKNOWN_ERROR';

export interface TelegramConfig {
  botToken?: string;
  botUsername?: string;
  botId?: string;
  defaultChatId?: string;
  notificationsEnabled: boolean;
  dryRun: boolean;
  maxRetries: number;
  requestTimeoutMs: number;
}

export interface TelegramBotInfo {
  id: number | string;
  isBot: boolean;
  firstName: string;
  username?: string;
  canJoinGroups?: boolean;
  canReadAllGroupMessages?: boolean;
  supportsInlineQueries?: boolean;
}

export interface TelegramHealthResponse {
  connected: boolean;
  botUsername?: string;
  botId?: string;
  notificationsEnabled: boolean;
  dryRun: boolean;
  defaultChatConfigured: boolean;
  timestamp: string;
  error?: string;
}

export interface TelegramInlineButton {
  text: string;
  url: string;
}

export interface TelegramMessagePayload {
  notificationType: TelegramNotificationType;
  targetType: 'government_jobs' | 'government_updates' | 'admit_cards' | 'exam_results' | 'answer_keys';
  targetId: string;
  title: string;
  organization: string;
  formattedText: string;
  buttons?: TelegramInlineButton[][];
  destinationChatId?: string;
  sourceUrl?: string | null;
  officialNotificationUrl?: string | null;
  officialApplyUrl?: string | null;
  idempotencyKey: string;
  messageHash: string;
}

export interface TelegramDeliveryResult {
  success: boolean;
  status: TelegramDeliveryStatus;
  idempotencyKey: string;
  telegramMessageId?: number;
  destinationChatId: string;
  sentAt?: string;
  durationMs: number;
  errorCode?: TelegramErrorCode;
  errorMessage?: string;
  isDryRun?: boolean;
}

export interface DbTelegramNotificationLog {
  id: string;
  target_type: string;
  target_id: string;
  notification_type: TelegramNotificationType;
  destination_chat_id: string;
  idempotency_key: string;
  message_hash: string;
  telegram_message_id?: number | null;
  status: TelegramDeliveryStatus;
  attempt_count: number;
  sent_at?: string | null;
  last_error?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TelegramEligibilityResult {
  eligible: boolean;
  reason?: string;
  notificationType?: TelegramNotificationType;
}
