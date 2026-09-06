import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  // On Render, process.env.PORT is provided dynamically (e.g. 10000). In dev container, defaults to 3000.
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Enable CORS for external apps (e.g. Study Focus app in another AI Studio session)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Health check endpoint for Render Web Service monitoring
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'StudyMate Sarkari Portal',
      timestamp: new Date().toISOString(),
      renderPort: PORT,
    });
  });

  // 1.1 Public Live Feed Endpoint for External Study Focus App & mobile apps
  app.get('/api/live-feed', (req, res) => {
    res.json({
      success: true,
      appName: 'StudyMate Sarkari Feed',
      portalUrl: 'https://studymate-sarkari.onrender.com',
      stats: {
        totalActiveJobs: 24,
        totalLiveVacancies: '1,42,800+ Posts',
        admitCardsLive: 8,
        resultsDeclared: 12,
        activeCountdownJobs: 6,
      },
      latestUpdates: [
        {
          id: 'ssc-cgl-2026',
          title: 'SSC CGL 2026 Online Application (17,727 Posts)',
          department: 'Staff Selection Commission (SSC)',
          category: 'SSC',
          qualification: 'Graduate',
          vacancies: 17727,
          lastDate: '2026-09-30',
          applyUrl: 'https://ssc.gov.in',
          status: 'LIVE',
        },
        {
          id: 'rrb-ntpc-2026',
          title: 'RRB NTPC (Graduate & Under Graduate) 2026 (11,558 Posts)',
          department: 'Railway Recruitment Boards',
          category: 'Railway',
          qualification: '12th / Graduate',
          vacancies: 11558,
          lastDate: '2026-10-13',
          applyUrl: 'https://www.rrbapply.gov.in',
          status: 'LIVE',
        },
        {
          id: 'up-police-constable-2026',
          title: 'UP Police Constable Recruitment 2026 (60,244 Posts)',
          department: 'UPPRPB Lucknow',
          category: 'Police',
          qualification: '12th Pass',
          vacancies: 60244,
          lastDate: '2026-09-15',
          applyUrl: 'https://uppbpb.gov.in',
          status: 'CLOSING_SOON',
        },
        {
          id: 'ibps-po-xvi',
          title: 'IBPS PO / MT-XVI Public Sector Banks (4,455 Posts)',
          department: 'Institute of Banking Personnel Selection',
          category: 'Banking',
          qualification: 'Graduate',
          vacancies: 4455,
          lastDate: '2026-09-21',
          applyUrl: 'https://www.ibps.in',
          status: 'LIVE',
        },
      ],
      admitCards: [
        {
          id: 'ssc-chsl-tier2-city',
          title: 'SSC CHSL 10+2 Tier-II Exam City Slip 2026',
          department: 'Staff Selection Commission',
          releaseDate: 'Live Today',
          directUrl: 'https://ssc.gov.in',
        },
        {
          id: 'rrb-alp-cbt1-admit',
          title: 'RRB Assistant Loco Pilot (ALP) CBT-1 Admit Card 2026',
          department: 'Railway Recruitment Boards',
          releaseDate: 'Active Now',
          directUrl: 'https://www.rrbapply.gov.in',
        },
      ],
      results: [
        {
          id: 'ssc-cpo-tier1-res',
          title: 'SSC Sub-Inspector in Delhi Police & CAPFs Tier-1 Final Result & Cutoff 2026',
          department: 'SSC New Delhi',
          declaredDate: 'September 2026',
          directUrl: 'https://ssc.gov.in',
        },
      ],
    });
  });

  // 1.2 Dedicated REST Endpoints for Jobs, Admit Cards, Results
  app.get('/api/jobs', (req, res) => {
    res.json({
      success: true,
      count: 4,
      data: [
        {
          id: 'ssc-cgl-2026',
          title: 'SSC CGL 2026 Online Application (17,727 Posts)',
          department: 'Staff Selection Commission (SSC)',
          category: 'SSC',
          qualification: 'Graduate',
          vacancies: 17727,
          lastDate: '2026-09-30',
          applyUrl: 'https://ssc.gov.in',
          status: 'LIVE',
        },
        {
          id: 'rrb-ntpc-2026',
          title: 'RRB NTPC 2026 (11,558 Posts)',
          department: 'Railway Recruitment Boards',
          category: 'Railway',
          qualification: '12th / Graduate',
          vacancies: 11558,
          lastDate: '2026-10-13',
          applyUrl: 'https://www.rrbapply.gov.in',
          status: 'LIVE',
        },
        {
          id: 'up-police-constable-2026',
          title: 'UP Police Constable Recruitment 2026 (60,244 Posts)',
          department: 'UPPRPB Lucknow',
          category: 'Police',
          qualification: '12th Pass',
          vacancies: 60244,
          lastDate: '2026-09-15',
          applyUrl: 'https://uppbpb.gov.in',
          status: 'CLOSING_SOON',
        },
        {
          id: 'ibps-po-xvi',
          title: 'IBPS PO / MT-XVI Public Sector Banks (4,455 Posts)',
          department: 'Institute of Banking Personnel Selection',
          category: 'Banking',
          qualification: 'Graduate',
          vacancies: 4455,
          lastDate: '2026-09-21',
          applyUrl: 'https://www.ibps.in',
          status: 'LIVE',
        },
      ],
    });
  });

  app.get('/api/results', (req, res) => {
    res.json({
      success: true,
      count: 1,
      data: [
        {
          id: 'ssc-cpo-tier1-res',
          title: 'SSC Sub-Inspector in Delhi Police & CAPFs Tier-1 Final Result & Cutoff 2026',
          department: 'SSC New Delhi',
          declaredDate: 'September 2026',
          directUrl: 'https://ssc.gov.in',
        },
      ],
    });
  });

  app.get('/api/admit-cards', (req, res) => {
    res.json({
      success: true,
      count: 2,
      data: [
        {
          id: 'ssc-chsl-tier2-city',
          title: 'SSC CHSL 10+2 Tier-II Exam City Slip 2026',
          department: 'Staff Selection Commission',
          releaseDate: 'Live Today',
          directUrl: 'https://ssc.gov.in',
        },
        {
          id: 'rrb-alp-cbt1-admit',
          title: 'RRB Assistant Loco Pilot (ALP) CBT-1 Admit Card 2026',
          department: 'Railway Recruitment Boards',
          releaseDate: 'Active Now',
          directUrl: 'https://www.rrbapply.gov.in',
        },
      ],
    });
  });

  // 2. Safe client configuration route (automatically supplies Render environment variables to frontend)
  app.get('/api/config', (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const hasServiceRoleKey = !!(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_ROLE_KEY ||
      process.env.SUPABASE_KEY
    );
    const hasTelegramToken = !!process.env.TELEGRAM_BOT_TOKEN;
    const telegramAdminId = process.env.TELEGRAM_ADMIN_ID || process.env.TELEGRAM_CHAT_ID || '5165363865';

    res.json({
      supabaseUrl,
      supabaseAnonKey,
      telegramAdminId,
      hasServiceRoleKey,
      hasTelegramToken,
      isConfigured: !!(supabaseUrl && supabaseAnonKey),
    });
  });

  // 3. Check Telegram Bot Connection Status & Diagnostics
  app.get(['/api/telegram/check', '/api/telegram/status'], async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_ID || '5165363865';

    if (!token) {
      return res.status(200).json({
        connected: false,
        status: 'DISCONNECTED',
        tokenConfigured: false,
        message: 'TELEGRAM_BOT_TOKEN is missing in environment variables. Bot is not yet connected.',
        adminTelegramId: adminChatId,
        instructions: {
          step1: 'Open Telegram and message @BotFather',
          step2: 'Send /newbot to create your bot and get the HTTP API token',
          step3: 'Set TELEGRAM_BOT_TOKEN in Render or container environment',
          step4: 'Reload or re-test this check link',
        },
        checkTime: new Date().toISOString(),
      });
    }

    try {
      const tgResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await tgResponse.json();

      if (tgResponse.ok && data.ok) {
        const bot = data.result;
        return res.status(200).json({
          connected: true,
          status: 'CONNECTED',
          tokenConfigured: true,
          message: `✅ Telegram Bot @${bot.username} is ACTIVE and CONNECTED successfully!`,
          bot: {
            id: bot.id,
            username: bot.username,
            firstName: bot.first_name,
            isBot: bot.is_bot,
            canJoinGroups: bot.can_join_groups,
            supportsInlineQueries: bot.supports_inline_queries,
          },
          botUrl: `https://t.me/${bot.username}`,
          adminTelegramId: adminChatId,
          testAlertEndpoint: '/api/telegram/test-notify',
          checkTime: new Date().toISOString(),
        });
      } else {
        return res.status(200).json({
          connected: false,
          status: 'INVALID_TOKEN',
          tokenConfigured: true,
          message: `Telegram API error: ${data.description || 'Token rejected by Telegram.'}`,
          adminTelegramId: adminChatId,
          checkTime: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        connected: false,
        status: 'NETWORK_ERROR',
        tokenConfigured: true,
        message: err.message || 'Failed to reach Telegram API servers',
        adminTelegramId: adminChatId,
        checkTime: new Date().toISOString(),
      });
    }
  });

  // 4. Test Telegram Alert endpoint (dispatches message directly to Telegram ID: 5165363865)
  app.post('/api/telegram/test-notify', async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_ID || '5165363865';

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'TELEGRAM_BOT_TOKEN is not set in Render environment variables.',
      });
    }

    const { customMessage } = req.body || {};
    const text =
      customMessage ||
      `🚀 *StudyMate Sarkari - Render Deployment Test*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *Telegram Bot Token:* Verified Active\n` +
      `👤 *Admin Telegram ID:* \`${chatId}\`\n` +
      `🌐 *Host:* Render.com Web Service\n` +
      `🕒 *Time:* ${new Date().toLocaleString('en-IN')}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ _Your StudyMate Sarkari portal & bot are fully synchronized!_`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(500).json({ success: false, error: data.description || 'Telegram API error' });
      }

      return res.json({ success: true, result: data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Network error reaching Telegram API' });
    }
  });

  // 4. Vite middleware for development vs Static assets for production
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
        watch: isHmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudyMate Server] Running on http://0.0.0.0:${PORT} (Render / Container)`);
  });
}

startServer();
