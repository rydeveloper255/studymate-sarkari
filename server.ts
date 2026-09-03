/**
 * StudyMate Sarkari — Full-Stack Server Entry Point
 * Express Server + Vite Middleware + Security Hardening + XML Sitemaps + Protected Internal Pipeline
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { applySecurityHeaders } from './src/server/middleware/securityHeaders';
import {
  generateSitemapIndex,
  generateJobsSitemap,
  generateUpdatesSitemap,
  generateStatesSitemap,
  generateStaticSitemap,
  generateFullSitemap,
} from './src/server/seo/sitemapGenerator';
import { generateRobotsTxt } from './src/server/seo/robotsGenerator';
import publicApiRoutes from './src/server/routes/publicApi';
import internalFetchRoutes from './src/server/routes/internalFetch';
import internalTelegramRoutes from './src/server/routes/internalTelegram';
import internalAutomationRoutes from './src/server/routes/internalAutomation';
import { verifyTelegramBotConnection } from './src/lib/telegramHealth';
import { startProductionScheduler, getScraperHealthStatus } from './src/lib/server/automation/productionScheduler';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Trust proxy for reverse proxy / Cloud Run IP rate limiting
  app.set('trust proxy', 1);

  // Security Headers Middleware
  app.use(applySecurityHeaders);

  // Body parser with size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Dynamic Robots.txt
  app.get('/robots.txt', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    res.send(generateRobotsTxt());
  });

  // Dynamic Sitemaps (XML format compliant with Google Search Central)
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    try {
      const xml = await generateSitemapIndex();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (err) {
      console.error('[Sitemap] Error generating sitemap index:', err);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/sitemap-static.xml', (req: Request, res: Response) => {
    try {
      const xml = generateStaticSitemap();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating static sitemap');
    }
  });

  app.get('/sitemap-jobs.xml', async (req: Request, res: Response) => {
    try {
      const xml = await generateJobsSitemap();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating jobs sitemap');
    }
  });

  app.get('/sitemap-updates.xml', async (req: Request, res: Response) => {
    try {
      const xml = await generateUpdatesSitemap();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating updates sitemap');
    }
  });

  app.get('/sitemap-states.xml', (req: Request, res: Response) => {
    try {
      const xml = generateStatesSitemap();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating states sitemap');
    }
  });

  app.get('/sitemap-full.xml', async (req: Request, res: Response) => {
    try {
      const xml = await generateFullSitemap();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating full sitemap');
    }
  });

  // Health and Public API Routes
  app.get('/api/health', async (req: Request, res: Response) => {
    let telegramStatus: 'connected' | 'not_configured' | 'error' = 'not_configured';
    let botName: string | undefined;

    try {
      const tgHealth = await verifyTelegramBotConnection();
      telegramStatus = tgHealth.status;
      if (tgHealth.ok && tgHealth.bot?.username) {
        botName = tgHealth.bot.username;
      }
    } catch {
      telegramStatus = 'error';
    }

    const payload: Record<string, any> = {
      status: 'ok',
      app: 'StudyMate Sarkari',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      telegram: telegramStatus,
    };

    if (botName) {
      payload.bot = botName;
    }

    try {
      const scraperHealth = getScraperHealthStatus();
      payload.scraper = {
        status: scraperHealth.scraper_status,
        last_successful_run: scraperHealth.last_successful_run,
        active_sources: scraperHealth.active_sources_count,
      };
    } catch {
      // Best-effort scraper health
    }

    res.json(payload);
  });

  // Dedicated Scraper Health Check Endpoint
  app.get('/api/health/scraper', (req: Request, res: Response) => {
    try {
      const scraperHealth = getScraperHealthStatus();
      res.json(scraperHealth);
    } catch (err: any) {
      res.status(500).json({
        status: 'error',
        error: err?.message || 'Failed to retrieve scraper health',
      });
    }
  });

  // Dedicated Telegram Health Check Endpoint
  app.get('/api/health/telegram', async (req: Request, res: Response) => {
    try {
      const tgHealth = await verifyTelegramBotConnection();
      const payload: Record<string, any> = {
        status: tgHealth.ok ? 'ok' : 'error',
        telegram: tgHealth.status,
      };
      if (tgHealth.bot?.username) {
        payload.bot = tgHealth.bot.username;
      }
      if (tgHealth.bot?.id) {
        payload.botId = tgHealth.bot.id;
      }
      if (tgHealth.error) {
        payload.message = tgHealth.error;
      }
      res.status(tgHealth.status === 'error' ? 502 : 200).json(payload);
    } catch {
      res.status(500).json({
        status: 'error',
        telegram: 'error',
      });
    }
  });

  app.use('/api/v1', publicApiRoutes);

  // Mount Internal Protected Routes
  app.use('/api/internal/telegram', internalTelegramRoutes);
  app.use('/api/internal/automation', internalAutomationRoutes);
  app.use('/api/internal', internalAutomationRoutes);
  app.use('/api/internal', internalFetchRoutes);

  // Global API error handler
  app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[API Error]', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
    });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudyMate Sarkari] Server running on http://0.0.0.0:${PORT}`);

    // Autonomous background monitoring scheduler
    if (process.env.DISABLE_BACKGROUND_SCHEDULER !== 'true') {
      startProductionScheduler();
    }
  });
}

startServer().catch((err) => {
  console.error('[StudyMate Sarkari] Failed to start server:', err);
  process.exit(1);
});
