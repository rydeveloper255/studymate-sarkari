/**
 * StudyMate Sarkari — Step 7: Protected Internal Telegram Management Endpoints
 *
 * SECURITY & ACCESS CONTROL:
 * - Requires SOURCE_FETCH_SECRET in Bearer or x-source-fetch-secret header
 * - Prevents public abuse or spamming
 * - Never returns bot tokens or sensitive secrets
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getTelegramService } from '../../lib/server/telegram';
import { getJobById, getParsedItems } from '../../lib/server/supabaseAdmin';

const router = Router();
const DEFAULT_DEV_SECRET = 'studymate-internal-dev-secret';

/**
 * Authentication middleware for internal telegram endpoints.
 */
function authenticateInternalRequest(req: Request, res: Response, next: NextFunction) {
  const configuredSecret = process.env.SOURCE_FETCH_SECRET || DEFAULT_DEV_SECRET;

  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-source-fetch-secret'];

  let providedToken: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.slice(7).trim();
  } else if (typeof customHeader === 'string') {
    providedToken = customHeader.trim();
  }

  if (!providedToken || providedToken !== configuredSecret) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid SOURCE_FETCH_SECRET authentication token.',
    });
    return;
  }

  next();
}

/**
 * GET /api/internal/telegram/health
 * Returns bot connectivity status, dry-run mode, and config safely without tokens.
 */
router.get('/health', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const service = getTelegramService();
    const health = await service.getHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({
      error: 'Telegram health check failed',
      details: err?.message || 'Unknown error',
    });
  }
});

/**
 * POST /api/internal/telegram/test
 * Dispatches a safe test notification.
 */
router.post('/test', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const destinationChatId = req.body?.chatId || req.query?.chatId;
    const service = getTelegramService();
    const result = await service.sendTestMessage(
      typeof destinationChatId === 'string' ? destinationChatId : undefined
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'Telegram test message failed',
      details: err?.message || 'Unknown error',
    });
  }
});

/**
 * GET /api/internal/telegram/logs
 * Retrieves recent delivery and audit logs.
 */
router.get('/logs', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(String(req.query.limit || '50'), 10);
    const service = getTelegramService();
    const logs = await service.getLogs(Number.isNaN(limit) ? 50 : limit);
    res.json({
      total: logs.length,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch Telegram logs',
      details: err?.message || 'Unknown error',
    });
  }
});

/**
 * POST /api/internal/telegram/send-item
 * Manually dispatches an alert for an existing published job.
 */
router.post('/send-item', authenticateInternalRequest, async (req: Request, res: Response) => {
  try {
    const { jobId, parsedItemId, force, dryRun, chatId } = req.body || {};
    const service = getTelegramService();

    if (jobId) {
      const job = await getJobById(jobId);
      if (!job) {
        res.status(404).json({ error: 'Job not found', jobId });
        return;
      }
      const result = await service.handlePublishedItem(job, {
        destinationChatId: chatId,
        force: Boolean(force),
        dryRun: dryRun !== undefined ? Boolean(dryRun) : undefined,
      });
      res.json(result);
      return;
    }

    if (parsedItemId) {
      const items = await getParsedItems({ limit: 100 });
      const item = items.find((i) => i.id === parsedItemId);
      if (!item) {
        res.status(404).json({ error: 'Parsed item not found', parsedItemId });
        return;
      }
      const result = await service.handlePublishedItem(item, {
        destinationChatId: chatId,
        force: Boolean(force),
        dryRun: dryRun !== undefined ? Boolean(dryRun) : undefined,
      });
      res.json(result);
      return;
    }

    res.status(400).json({
      error: 'Missing required parameter: either jobId or parsedItemId must be provided in body.',
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Telegram item dispatch failed',
      details: err?.message || 'Unknown error',
    });
  }
});

export default router;
