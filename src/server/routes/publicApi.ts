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

export default router;
