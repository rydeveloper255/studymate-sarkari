/**
 * StudyMate Sarkari — Public API Routes
 * High-performance, rate-limited endpoints for search, contact inquiries, and health checks.
 */

import { Router, Request, Response } from 'express';
import {
  contactFormRateLimiter,
  publicApiRateLimiter,
} from '../middleware/rateLimiter';
import {
  validateContactForm,
  sanitizeStringInput,
  sanitizeInteger,
} from '../middleware/inputValidation';
import {
  getAllActiveJobs,
  getAllActiveUpdates,
  getAllRegisteredSources,
  getJobBySlugOrId,
} from '../../lib/server/supabaseAdmin';
import { serverCache } from '../../lib/server/cache/publicCache';

const router = Router();

// In-memory feedback storage for contact submissions
const contactSubmissions: Array<{
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
  ip: string;
}> = [];

/**
 * Public Health Check
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'StudyMate Sarkari API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cacheStats: serverCache.getStats(),
  });
});

/**
 * Public Contact Form Submission (Protected by rate limiter + honeypot + validator)
 */
router.post(
  '/contact',
  contactFormRateLimiter,
  validateContactForm,
  (req: Request, res: Response) => {
    const { name, email, subject, message } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const submission = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
      ip,
    };

    contactSubmissions.unshift(submission);
    if (contactSubmissions.length > 500) {
      contactSubmissions.pop();
    }

    console.log(`[Contact Form] New submission from ${name} <${email}>: "${subject}"`);

    res.status(200).json({
      success: true,
      message: 'Thank you for reaching out. Your feedback has been recorded securely.',
      id: submission.id,
    });
  }
);

/**
 * Public Filtered Jobs Listing (Cached)
 */
router.get('/jobs', publicApiRateLimiter, async (req: Request, res: Response) => {
  try {
    const sector = sanitizeStringInput(req.query.sector as string, 30);
    const category = sanitizeStringInput(req.query.category as string, 50);
    const state = sanitizeStringInput(req.query.state as string, 50);
    const page = sanitizeInteger(req.query.page, 1, 1, 100);
    const limit = sanitizeInteger(req.query.limit, 20, 1, 50);

    const cacheKey = `jobs_${sector}_${category}_${state}_${page}_${limit}`;
    const cached = serverCache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    let allJobs = await getAllActiveJobs();

    if (sector && sector !== 'all') {
      allJobs = allJobs.filter((j) => j.sector === sector);
    }
    if (category && category !== 'All') {
      allJobs = allJobs.filter((j) => (j as any).central_category === category || (j as any).category === category);
    }
    if (state && state !== 'All') {
      allJobs = allJobs.filter(
        (j) =>
          (j.state_name && j.state_name.toLowerCase() === state.toLowerCase()) ||
          (j.state_code && j.state_code.toLowerCase() === state.toLowerCase())
      );
    }

    const total = allJobs.length;
    const startIndex = (page - 1) * limit;
    const paginated = allJobs.slice(startIndex, startIndex + limit);

    const responsePayload = {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    serverCache.set(cacheKey, responsePayload, 120, ['jobs']);
    res.json(responsePayload);
  } catch (err: any) {
    console.error('Error fetching public jobs:', err);
    res.status(500).json({ error: 'Failed to retrieve jobs list' });
  }
});

/**
 * Public Single Job Detail
 */
router.get('/jobs/:slugOrId', publicApiRateLimiter, async (req: Request, res: Response) => {
  try {
    const slugOrId = sanitizeStringInput(req.params.slugOrId, 100);
    const cacheKey = `job_detail_${slugOrId}`;
    const cached = serverCache.get(cacheKey);
    if (cached) {
      res.json({ data: cached });
      return;
    }

    const job = await getJobBySlugOrId(slugOrId);
    if (!job) {
      res.status(404).json({ error: 'Job Vacancy Not Found' });
      return;
    }

    serverCache.set(cacheKey, job, 300, ['jobs']);
    res.json({ data: job });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error fetching job' });
  }
});

/**
 * Public Government Updates Stream
 */
router.get('/updates', publicApiRateLimiter, async (req: Request, res: Response) => {
  try {
    const category = req.query.category ? sanitizeStringInput(req.query.category as string, 30) : null;
    const limit = req.query.limit ? sanitizeInteger(req.query.limit as string, 1, 100, 20) : 20;
    const cacheKey = `public_updates_${category || 'all'}_${limit}`;

    const cached = serverCache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    let updates = await getAllActiveUpdates(100);
    if (category && category !== 'all') {
      updates = updates.filter((u) => u.category === category);
    }

    const payload = {
      data: updates.slice(0, limit),
      total: updates.length,
    };

    serverCache.set(cacheKey, payload, 60, ['updates']);
    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve updates' });
  }
});

/**
 * Public Official Sources Directory
 */
router.get('/sources', publicApiRateLimiter, async (req: Request, res: Response) => {
  try {
    const cacheKey = 'public_sources_directory';
    const cached = serverCache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const sources = await getAllRegisteredSources();
    const payload = {
      data: sources.filter((s) => s.active),
      total: sources.filter((s) => s.active).length,
    };

    serverCache.set(cacheKey, payload, 180, ['sources']);
    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve official sources' });
  }
});

// In-memory store for registered client notification preferences & device subscriptions
const clientNotificationSubscriptions: Map<string, {
  id: string;
  categories: string[];
  states: string[];
  alertTypes: Record<string, boolean>;
  soundEnabled: boolean;
  minVacanciesOnly?: boolean;
  minVacanciesThreshold?: number;
  ip: string;
  updatedAt: string;
}> = new Map();

/**
 * Public User Notification Preferences Sync
 */
router.post('/notifications/preferences', publicApiRateLimiter, (req: Request, res: Response) => {
  try {
    const { categories, states, alertTypes, soundEnabled, minVacanciesOnly, minVacanciesThreshold } = req.body || {};
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const safeCategories = Array.isArray(categories)
      ? categories.map((c: any) => String(c).slice(0, 50)).filter(Boolean)
      : ['UPSC', 'SSC', 'Railway', 'Police', 'Banking'];
    const safeStates = Array.isArray(states)
      ? states.map((s: any) => String(s).slice(0, 50)).filter(Boolean)
      : ['ALL'];

    const subscriptionRecord = {
      id: `sub_${ip.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32)}`,
      categories: safeCategories,
      states: safeStates,
      alertTypes: typeof alertTypes === 'object' && alertTypes !== null ? alertTypes : { newVacancies: true, admitCards: true, results: true, answerKeys: true, closingSoon: true },
      soundEnabled: Boolean(soundEnabled),
      minVacanciesOnly: Boolean(minVacanciesOnly),
      minVacanciesThreshold: typeof minVacanciesThreshold === 'number' ? minVacanciesThreshold : 50,
      ip,
      updatedAt: new Date().toISOString(),
    };

    clientNotificationSubscriptions.set(subscriptionRecord.id, subscriptionRecord);

    res.status(200).json({
      success: true,
      message: 'Notification preferences synchronized securely',
      subscriptionId: subscriptionRecord.id,
      activeCategories: safeCategories.length,
      activeStates: safeStates.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record notification preferences' });
  }
});

/**
 * Generate a Tailored Notification Payload for Testing or Preview
 */
router.post('/notifications/test-payload', publicApiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { category, state } = req.body || {};
    const allJobs = await getAllActiveJobs();

    // Find a matching sample job
    let sample = allJobs.find((j) => {
      const matchCat = !category || category === 'All' || (j as any).central_category === category || (j as any).category === category;
      const matchState = !state || state === 'ALL' || (j.state_code && j.state_code.toUpperCase() === String(state).toUpperCase()) || (j.state_name && j.state_name.toLowerCase() === String(state).toLowerCase());
      return matchCat && matchState;
    });

    if (!sample && allJobs.length > 0) {
      sample = allJobs[0];
    }

    const payload = {
      title: 'StudyMate Sarkari Alert',
      body: sample
        ? `New Vacancy: ${sample.post_name || sample.title} (${sample.organization_name}) - Apply before ${sample.important_dates?.applyEndDate || 'due date'}.`
        : 'Tailored alert active. You will receive notifications when new matching forms release.',
      category: category || 'All India',
      state: state || 'All India',
      url: sample ? `/jobs/${sample.slug || sample.id}` : '/jobs',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      timestamp: new Date().toISOString(),
    };

    res.json({ success: true, payload });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate test payload' });
  }
});

export default router;
