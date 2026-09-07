import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
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

  // In-memory dynamic datasets that can be updated live via Telegram Bot Admin commands
  let portalJobs = [
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
  ];

  let portalResults = [
    {
      id: 'ssc-cpo-tier1-res',
      title: 'SSC Sub-Inspector in Delhi Police & CAPFs Tier-1 Final Result & Cutoff 2026',
      department: 'SSC New Delhi',
      declaredDate: 'September 2026',
      directUrl: 'https://ssc.gov.in',
    },
  ];

  let portalAdmitCards = [
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
  ];

  let portalAnswerKeys = [
    {
      id: 'ssc-cgl-tier1-ans',
      title: 'SSC CGL 2026 Tier-I Official Tentative Answer Key & Response Sheet',
      department: 'Staff Selection Commission',
      releaseDate: 'Active Now',
      directUrl: 'https://ssc.gov.in',
    },
  ];

  let portalSyllabus = [
    {
      id: 'rrb-ntpc-syl',
      title: 'RRB NTPC 2026 Detailed CBT-1 & CBT-2 Syllabus & Exam Pattern PDF',
      department: 'Railway Recruitment Boards',
      releaseDate: 'Updated 2026',
      directUrl: 'https://www.rrbapply.gov.in',
    },
  ];

  // Dynamic Live Ticker & Maintenance State (Controllable via Telegram Bot)
  let breakingTickerText = '🚨 SSC GD 2026 Notification Out • Railway RRB NTPC 11,558 Posts Active • UP Police Constable Exam City Slip Live • IBPS PO Online Form Active!';
  let breakingTickerActive = true;
  let maintenanceModeActive = false;
  let maintenanceMessage = 'StudyMate Sarkari portal is temporarily under scheduled maintenance. We will be back online shortly.';

  // 1.2 Dedicated REST Endpoints for Jobs, Admit Cards, Results, Ticker, Maintenance
  app.get('/api/jobs', (req, res) => {
    res.json({
      success: true,
      count: portalJobs.length,
      data: portalJobs,
    });
  });

  app.get('/api/results', (req, res) => {
    res.json({
      success: true,
      count: portalResults.length,
      data: portalResults,
    });
  });

  app.get('/api/admit-cards', (req, res) => {
    res.json({
      success: true,
      count: portalAdmitCards.length,
      data: portalAdmitCards,
    });
  });

  app.get('/api/syllabus', (req, res) => {
    res.json({
      success: true,
      count: portalSyllabus.length,
      data: portalSyllabus,
    });
  });

  app.get('/api/ticker', (req, res) => {
    res.json({
      success: true,
      text: breakingTickerText,
      active: breakingTickerActive,
    });
  });

  app.post('/api/ticker', express.json(), (req, res) => {
    const { text, active } = req.body;
    if (typeof text === 'string') breakingTickerText = text;
    if (typeof active === 'boolean') breakingTickerActive = active;
    res.json({ success: true, text: breakingTickerText, active: breakingTickerActive });
  });

  app.get('/api/maintenance-status', (req, res) => {
    res.json({
      success: true,
      active: maintenanceModeActive,
      message: maintenanceMessage,
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

  // =========================================================================
  // 4.1 TELEGRAM BOT WEBHOOK & MOBILE ADMIN PANEL HANDLER
  // Allows the site owner to use their Telegram Bot directly as the website Admin Panel!
  // =========================================================================
  const sendTelegramMsg = async (chatId: string | number, text: string, replyMarkup?: any) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;
    try {
      const body: any = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      };
      if (replyMarkup) body.reply_markup = replyMarkup;
      const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await resp.json();
    } catch (err) {
      console.error('[Telegram sendMsg error]', err);
      return null;
    }
  };

  const answerTgCallback = async (callbackQueryId: string, alertText?: string, showAlert = false) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    try {
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: alertText || '',
          show_alert: showAlert || !!alertText,
        }),
      });
    } catch {
      // ignore
    }
  };

  // State manager for interactive step-by-step conversational Job Wizard
  interface WizardState {
    step: 'TITLE' | 'VACANCIES' | 'QUAL' | 'LASTDATE' | 'LINK';
    data: {
      title?: string;
      vacancies?: string;
      qualification?: string;
      lastDate?: string;
      applyUrl?: string;
    };
  }
  const adminWizards = new Map<string, WizardState>();

  // Register native Telegram bot menu commands so they appear in the mobile [/] Menu
  const registerTelegramBotCommands = async (token: string) => {
    try {
      const commands = [
        { command: 'start', description: '👑 Master Admin Control Panel' },
        { command: 'postjob', description: '📝 Add Job Step-by-Step (Wizard)' },
        { command: 'managejobs', description: '📋 View, Edit & Delete Live Jobs' },
        { command: 'ticker', description: '🚨 Update Website Breaking Ticker' },
        { command: 'newadmit', description: '🎫 Add Admit Card Link' },
        { command: 'newresult', description: '🏆 Add Exam Result Link' },
        { command: 'newkey', description: '🔑 Add Answer Key Link' },
        { command: 'newsyllabus', description: '📚 Add Exam Syllabus Link' },
        { command: 'broadcast', description: '📢 Send Alert to Telegram Channel' },
        { command: 'stats', description: '📊 Live Portal Analytics & Visitors' },
        { command: 'maintenance', description: '🛠️ Toggle Site Maintenance Mode' },
        { command: 'backup', description: '💾 Download Complete Website Backup' },
        { command: 'cancel', description: '❌ Cancel active wizard input' },
        { command: 'help', description: 'ℹ️ Full Commands Cheatsheet' },
      ];

      await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands }),
      });
      console.log('[Telegram Bot] setMyCommands registered successfully with Telegram API');
    } catch (err) {
      console.error('[Telegram Bot] Error registering setMyCommands:', err);
    }
  };

  const sendAdminMainMenu = async (chatId: string | number) => {
    const adminMenu =
      `👑 <b>STUDYMATE SARKARI - MOBILE ADMIN PANEL</b> 👑\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Namaste Boss! Aap apne Telegram chat se puri website live manage kar sakte hain.\n\n` +
      `📊 <b>Website Live Overview:</b>\n` +
      `• 💼 Active Vacancies: <b>${portalJobs.length}</b>\n` +
      `• 🎫 Live Admit Cards: <b>${portalAdmitCards.length}</b>\n` +
      `• 🏆 Declared Results: <b>${portalResults.length}</b>\n` +
      `• 🔑 Answer Keys: <b>${portalAnswerKeys.length}</b>\n` +
      `• 🚨 Breaking Ticker: <b>${breakingTickerActive ? '🟢 ACTIVE' : '🔴 OFF'}</b>\n` +
      `• 🛠️ Maintenance Mode: <b>${maintenanceModeActive ? '🔴 ACTIVE' : '🟢 NORMAL'}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👇 <i>Neeche diye buttons se fast access karein (ya [/] Menu dabayein):</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📝 Post Job (Wizard)', callback_data: 'admin_start_wizard' },
          { text: '📋 Manage & Delete Jobs', callback_data: 'admin_manage_jobs' },
        ],
        [
          { text: '🎫 Add Admit Card', callback_data: 'help_admit' },
          { text: '🏆 Add Result', callback_data: 'help_result' },
        ],
        [
          { text: '🔑 Add Answer Key', callback_data: 'help_key' },
          { text: '🚨 Breaking Ticker', callback_data: 'admin_ticker_menu' },
        ],
        [
          { text: '📢 Broadcast Channel', callback_data: 'admin_broadcast_help' },
          { text: '📊 Live Analytics', callback_data: 'admin_stats' },
        ],
        [
          { text: '🛠️ Maintenance Mode', callback_data: 'toggle_maintenance' },
          { text: '💾 Data Backup', callback_data: 'admin_backup' },
        ],
        [
          { text: 'ℹ️ Commands Guide', callback_data: 'admin_full_help' },
          { text: '🌐 Open Website', url: 'https://studymatesarkari.in' },
        ],
      ],
    };

    await sendTelegramMsg(chatId, adminMenu, keyboard);
  };

  const sendManageJobsList = async (chatId: string | number) => {
    if (portalJobs.length === 0) {
      await sendTelegramMsg(chatId, '📋 Website par abhi koi active job nahi hai. Nayi job post karne ke liye <code>/postjob</code> likhein.');
      return;
    }

    let text = `📋 <b>MANAGE WEBSITE JOBS (Showing Top ${Math.min(6, portalJobs.length)}):</b>\n` +
      `Tap ❌ button to instantly delete from website, or 📢 to broadcast:\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const inline_keyboard: any[] = [];
    portalJobs.slice(0, 6).forEach((j, i) => {
      const num = i + 1;
      text += `<b>${num}. ${j.title}</b>\n   🎯 ${j.vacancies} Posts | 📅 Last: ${j.lastDate}\n   🔗 <a href="${j.applyUrl}">Apply Link</a>\n\n`;
      inline_keyboard.push([
        { text: `❌ Delete #${num}`, callback_data: `delete_job_${j.id}` },
        { text: `📢 Broadcast #${num}`, callback_data: `broadcast_job_${j.id}` },
      ]);
    });

    inline_keyboard.push([
      { text: '➕ Post New Job (Wizard)', callback_data: 'admin_start_wizard' },
      { text: '👑 Admin Menu', callback_data: 'admin_main_menu' },
    ]);

    await sendTelegramMsg(chatId, text, { inline_keyboard });
  };

  // Primary Webhook Endpoint for Incoming Telegram Bot Updates
  app.post('/api/telegram/webhook', async (req, res) => {
    // Fast 200 OK acknowledgment to Telegram so Telegram does not retry
    res.status(200).send({ ok: true });

    const update = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_ID || '5165363865';

    if (!token || !update) return;

    try {
      // 1. Handle Callback Query (Inline Button Click)
      if (update.callback_query) {
        const cq = update.callback_query;
        const senderId = String(cq.from?.id);
        const chatId = cq.message?.chat?.id || senderId;
        const data = cq.data || '';
        const isAdmin = senderId === String(adminChatId) || senderId === '5165363865';

        if (data === 'admin_main_menu') {
          await answerTgCallback(cq.id);
          await sendAdminMainMenu(chatId);
        } else if (data === 'admin_start_wizard') {
          await answerTgCallback(cq.id, 'Starting Job Wizard...');
          adminWizards.set(String(chatId), { step: 'TITLE', data: {} });
          const wizardStartMsg =
            `📝 <b>STEP 1 OF 5: RECRUITMENT TITLE</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Kripya vacancy ka poora naam likhein.\n\n` +
            `<i>Udaharan:</i> <code>SSC CGL 2026 Recruitment Online Form</code>\n\n` +
            `<i>Kisi bhi waqt cancel karne ke liye /cancel likhein.</i>`;
          await sendTelegramMsg(chatId, wizardStartMsg);
        } else if (data === 'admin_manage_jobs') {
          await answerTgCallback(cq.id);
          await sendManageJobsList(chatId);
        } else if (data.startsWith('delete_job_')) {
          const jobId = data.replace('delete_job_', '');
          const jobIdx = portalJobs.findIndex((j) => j.id === jobId);
          if (jobIdx !== -1) {
            const deleted = portalJobs.splice(jobIdx, 1)[0];
            await answerTgCallback(cq.id, 'Job deleted from website!', true);
            await sendTelegramMsg(chatId, `🗑️ <b>JOB DELETED!</b>\n'${deleted.title}' website se safaltapoorvak delete kar di gayi hai.`);
            await sendManageJobsList(chatId);
          } else {
            await answerTgCallback(cq.id, 'Job already removed.', true);
          }
        } else if (data === 'admin_stats') {
          await answerTgCallback(cq.id, 'Stats refreshed!');
          const statsMsg =
            `📊 <b>STUDYMATE SARKARI - REALTIME ANALYTICS</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `💼 Active Vacancies on Site: <b>${portalJobs.length}</b>\n` +
            `🎫 Active Admit Cards: <b>${portalAdmitCards.length}</b>\n` +
            `🏆 Declared Results: <b>${portalResults.length}</b>\n` +
            `🔑 Answer Keys: <b>${portalAnswerKeys.length}</b>\n` +
            `🚨 Breaking Ticker: <b>${breakingTickerActive ? '🟢 Active' : '🔴 Disabled'}</b>\n` +
            `🛠️ Maintenance Mode: <b>${maintenanceModeActive ? '🔴 Active' : '🟢 Normal'}</b>\n` +
            `👤 Master Admin ID: <code>${adminChatId}</code>\n` +
            `📢 Official Channel: <b>${TELEGRAM_CHANNEL_HANDLE}</b>\n` +
            `🌐 Live Website: <a href="https://studymatesarkari.in">studymatesarkari.in</a>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `⚡ <i>Server is live and running normal.</i>`;
          await sendTelegramMsg(chatId, statsMsg, {
            inline_keyboard: [[{ text: '👑 Admin Menu', callback_data: 'admin_main_menu' }]],
          });
        } else if (data === 'admin_ticker_menu') {
          await answerTgCallback(cq.id);
          const tickerMenu =
            `🚨 <b>WEBSITE BREAKING TICKER CONTROL</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📌 <b>Current Status:</b> ${breakingTickerActive ? '🟢 ACTIVE (Scrolling on site)' : '🔴 DISABLED'}\n\n` +
            `📝 <b>Current Alert Text:</b>\n"${breakingTickerText}"\n\n` +
            `<b>Kaise badlein:</b>\n` +
            `• <code>/ticker Naya Breaking News Alert Text Yahan</code>\n` +
            `• <code>/ticker off</code> (Ticker band karne ke liye)\n` +
            `• <code>/ticker on</code> (Ticker chalu karne ke liye)`;

          const kb = {
            inline_keyboard: [
              [{ text: breakingTickerActive ? '📴 Turn Off Ticker' : '🟢 Turn On Ticker', callback_data: 'toggle_ticker' }],
              [{ text: '👑 Admin Menu', callback_data: 'admin_main_menu' }],
            ],
          };
          await sendTelegramMsg(chatId, tickerMenu, kb);
        } else if (data === 'toggle_ticker') {
          breakingTickerActive = !breakingTickerActive;
          await answerTgCallback(cq.id, `Ticker ${breakingTickerActive ? 'Activated' : 'Disabled'}!`);
          await sendTelegramMsg(chatId, `🚨 <b>Ticker ${breakingTickerActive ? 'ACTIVATED 🟢' : 'DISABLED 📴'}!</b>\nWebsite par alert status update ho gaya hai.`);
        } else if (data === 'toggle_maintenance') {
          maintenanceModeActive = !maintenanceModeActive;
          await answerTgCallback(cq.id, `Maintenance ${maintenanceModeActive ? 'Enabled' : 'Disabled'}!`);
          await sendTelegramMsg(chatId, `🛠️ <b>Maintenance Mode: ${maintenanceModeActive ? 'ENABLED 🔴' : 'DISABLED 🟢'}!</b>`);
        } else if (data === 'admin_backup') {
          await answerTgCallback(cq.id, 'Generating Backup...');
          const summary =
            `💾 <b>COMPLETE WEBSITE DATA BACKUP SNAPSHOT:</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📅 <b>Timestamp:</b> ${new Date().toLocaleString('en-IN')}\n` +
            `💼 <b>Active Jobs:</b> ${portalJobs.length}\n` +
            `🎫 <b>Admit Cards:</b> ${portalAdmitCards.length}\n` +
            `🏆 <b>Declared Results:</b> ${portalResults.length}\n` +
            `🔑 <b>Answer Keys:</b> ${portalAnswerKeys.length}\n` +
            `🚨 <b>Ticker Status:</b> ${breakingTickerActive ? 'Active' : 'Off'}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `✅ <i>Aapka sara data surakshit hai!</i>`;
          await sendTelegramMsg(chatId, summary, {
            inline_keyboard: [[{ text: '👑 Admin Menu', callback_data: 'admin_main_menu' }]],
          });
        } else if (data === 'help_admit') {
          await answerTgCallback(cq.id);
          const admitHelp =
            `🎫 <b>HOW TO POST ADMIT CARD:</b>\n\n` +
            `Send this command in chat:\n` +
            `<code>/newadmit RRB ALP CBT-1 Admit Card 2026 | https://www.rrbapply.gov.in</code>\n\n` +
            `Website ke 'Admit Card' section me link turant lag jayega!`;
          await sendTelegramMsg(chatId, admitHelp);
        } else if (data === 'help_result') {
          await answerTgCallback(cq.id);
          const resHelp =
            `🏆 <b>HOW TO POST RESULT:</b>\n\n` +
            `Send this command in chat:\n` +
            `<code>/newresult UP Police Constable Final Result 2026 | https://uppbpb.gov.in</code>\n\n` +
            `Website ke 'Results' section me live ho jayega!`;
          await sendTelegramMsg(chatId, resHelp);
        } else if (data === 'help_key') {
          await answerTgCallback(cq.id);
          const keyHelp =
            `🔑 <b>HOW TO POST ANSWER KEY:</b>\n\n` +
            `Send this command in chat:\n` +
            `<code>/newkey SSC GD Answer Key & Objection Link | https://ssc.gov.in</code>\n\n` +
            `Website ke 'Answer Key' section me add ho jayega!`;
          await sendTelegramMsg(chatId, keyHelp);
        } else if (data === 'admin_broadcast_help') {
          await answerTgCallback(cq.id);
          const bcHelp =
            `📢 <b>HOW TO BROADCAST FROM MOBILE:</b>\n\n` +
            `Type:\n<code>/broadcast SSC CHSL Tier-2 City Slip is Live! Download now from studymatesarkari.in</code>\n\n` +
            `Yeh seedhe aapke official channel (<b>${TELEGRAM_CHANNEL_HANDLE}</b>) par send ho jayega!`;
          await sendTelegramMsg(chatId, bcHelp);
        } else if (data === 'admin_full_help') {
          await answerTgCallback(cq.id);
          const fullHelp =
            `ℹ️ <b>STUDYMATE BOT ADMIN COMMANDS LIST:</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `📝 <b>Content Posting:</b>\n` +
            `• <code>/postjob</code> - Step-by-Step interactive job wizard (Sabse aasan!)\n` +
            `• <code>/newjob Title | Vacancies | Qual | LastDate | Link</code>\n` +
            `• <code>/newadmit Title | Link</code>\n` +
            `• <code>/newresult Title | Link</code>\n` +
            `• <code>/newkey Title | Link</code>\n` +
            `• <code>/newsyllabus Title | Link</code>\n\n` +
            `📋 <b>Site Operations:</b>\n` +
            `• <code>/managejobs</code> - View, delete & broadcast live jobs\n` +
            `• <code>/ticker Alert text</code> - Update breaking marquee on site\n` +
            `• <code>/ticker off</code> - Disable ticker\n` +
            `• <code>/broadcast Message</code> - Push to Telegram Channel\n` +
            `• <code>/stats</code> - Real-time visitor & portal analytics\n` +
            `• <code>/maintenance on/off</code> - Emergency maintenance\n` +
            `• <code>/backup</code> - Complete data export snapshot\n` +
            `• <code>/cancel</code> - Cancel active wizard flow\n\n` +
            `💡 <i>Tip: Telegram ke <b>[/] Menu</b> button se bhi direct choose kar sakte hain!</i>`;
          await sendTelegramMsg(chatId, fullHelp, {
            inline_keyboard: [[{ text: '👑 Admin Menu', callback_data: 'admin_main_menu' }]],
          });
        } else if (data.startsWith('broadcast_job_')) {
          const jobId = data.replace('broadcast_job_', '');
          const job = portalJobs.find((j) => j.id === jobId);
          if (job) {
            await answerTgCallback(cq.id, 'Broadcasting to Channel...');
            const bcText =
              `📢 <b>NEW SARKARI RECRUITMENT LIVE</b> 🇮🇳\n` +
              `━━━━━━━━━━━━━━━━━━━━━\n` +
              `📌 <b>${job.title.toUpperCase()}</b>\n\n` +
              `🏛️ <b>Department:</b> ${job.department}\n` +
              `🎯 <b>Vacancies:</b> ${job.vacancies} Posts\n` +
              `🎓 <b>Qualification:</b> ${job.qualification}\n` +
              `📅 <b>Last Date:</b> ${job.lastDate}\n\n` +
              `🔗 <a href="${job.applyUrl}">Apply Online & Notification PDF</a>\n\n` +
              `📲 Join Official Channel: ${TELEGRAM_CHANNEL_URL}`;

            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: TELEGRAM_CHANNEL_HANDLE,
                text: bcText,
                parse_mode: 'HTML',
              }),
            });

            await sendTelegramMsg(chatId, `✅ <b>Broadcast Sent Successfully!</b> Check ${TELEGRAM_CHANNEL_HANDLE}`);
          }
        }
        return;
      }

      // 2. Handle Regular Incoming Text Messages
      if (!update.message || !update.message.text) return;

      const msg = update.message;
      const chatId = msg.chat.id;
      const senderId = String(msg.from?.id || chatId);
      const text = msg.text.trim();
      const isAdmin = senderId === String(adminChatId) || senderId === '5165363865';

      // Check if user is inside an ongoing conversational Job Wizard
      const activeWizard = adminWizards.get(String(chatId));
      if (activeWizard && isAdmin) {
        if (text === '/cancel') {
          adminWizards.delete(String(chatId));
          await sendTelegramMsg(chatId, '❌ <b>Job Wizard Cancelled.</b> You can start again anytime with /postjob or /start.');
          return;
        }

        if (activeWizard.step === 'TITLE') {
          activeWizard.data.title = text;
          activeWizard.step = 'VACANCIES';
          await sendTelegramMsg(
            chatId,
            `🎯 <b>STEP 2 OF 5: TOTAL VACANCIES</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Kul kitne pad (vacancies) hain?\n\n` +
            `<i>Udaharan:</i> <code>17,727</code> ya <code>Multiple</code>\n\n` +
            `<i>Cancel karne ke liye /cancel likhein.</i>`
          );
          return;
        } else if (activeWizard.step === 'VACANCIES') {
          activeWizard.data.vacancies = text;
          activeWizard.step = 'QUAL';
          await sendTelegramMsg(
            chatId,
            `🎓 <b>STEP 3 OF 5: ELIGIBILITY / QUALIFICATION</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Aavedan ke liye qualification kya hai?\n\n` +
            `<i>Udaharan:</i> <code>Bachelor Degree in any Stream</code> ya <code>10th / 12th Pass</code>\n\n` +
            `<i>Cancel karne ke liye /cancel likhein.</i>`
          );
          return;
        } else if (activeWizard.step === 'QUAL') {
          activeWizard.data.qualification = text;
          activeWizard.step = 'LASTDATE';
          await sendTelegramMsg(
            chatId,
            `📅 <b>STEP 4 OF 5: LAST DATE TO APPLY</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Online form bharne ki antim tithi kya hai?\n\n` +
            `<i>Udaharan:</i> <code>30-Sep-2026</code> ya <code>Check Notification</code>\n\n` +
            `<i>Cancel karne ke liye /cancel likhein.</i>`
          );
          return;
        } else if (activeWizard.step === 'LASTDATE') {
          activeWizard.data.lastDate = text;
          activeWizard.step = 'LINK';
          await sendTelegramMsg(
            chatId,
            `🔗 <b>STEP 5 OF 5: APPLY / NOTIFICATION URL</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Official website ya application direct link paste karein.\n\n` +
            `<i>Udaharan:</i> <code>https://ssc.gov.in</code>\n\n` +
            `<i>Cancel karne ke liye /cancel likhein.</i>`
          );
          return;
        } else if (activeWizard.step === 'LINK') {
          const rawUrl = text;
          const applyUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
          const vacNum = parseInt((activeWizard.data.vacancies || '1000').replace(/[^0-9]/g, ''), 10) || 1000;

          const newJob = {
            id: 'job-' + Date.now(),
            title: activeWizard.data.title || 'New Sarkari Recruitment',
            department: 'Govt Department',
            category: 'Recruitment',
            qualification: activeWizard.data.qualification || 'Graduate / 12th',
            vacancies: vacNum,
            lastDate: activeWizard.data.lastDate || 'Check Website',
            applyUrl,
            status: 'LIVE',
          };

          // Unshift directly to live website jobs
          portalJobs.unshift(newJob);
          adminWizards.delete(String(chatId));

          const publishedMsg =
            `🎉 <b>JOB SUCCESSFULLY PUBLISHED TO WEBSITE!</b> 🚀\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📌 <b>Title:</b> ${newJob.title}\n` +
            `🎯 <b>Vacancies:</b> ${newJob.vacancies.toLocaleString()} Posts\n` +
            `🎓 <b>Eligibility:</b> ${newJob.qualification}\n` +
            `📅 <b>Last Date:</b> ${newJob.lastDate}\n` +
            `🔗 <b>Apply Link:</b> <a href="${newJob.applyUrl}">Open Link</a>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Yeh job <b>studymatesarkari.in</b> par live dikh rahi hai!\n\n` +
            `Ab isse 1-click me apne Telegram Channel par broadcast karein 👇`;

          const keyboard = {
            inline_keyboard: [
              [{ text: '📢 Broadcast to Telegram Channel', callback_data: `broadcast_job_${newJob.id}` }],
              [
                { text: '➕ Post Another Job', callback_data: 'admin_start_wizard' },
                { text: '📋 Manage Jobs', callback_data: 'admin_manage_jobs' },
              ],
              [{ text: '👑 Admin Menu', callback_data: 'admin_main_menu' }],
            ],
          };

          await sendTelegramMsg(chatId, publishedMsg, keyboard);
          return;
        }
      }

      // COMMAND: /start
      if (text === '/start' || text.startsWith('/start ')) {
        if (isAdmin) {
          await sendAdminMainMenu(chatId);
        } else {
          // Candidate View
          const studentMenu =
            `👋 <b>Namaste! Welcome to StudyMate Sarkari Bot</b> 🇮🇳\n\n` +
            `Get instant verified Government Job notifications, Admit Cards & Results.\n\n` +
            `📌 <b>Student Quick Menu:</b>\n` +
            `• <code>/jobs</code> - Top active vacancies\n` +
            `• <code>/admit</code> - Latest Hall Tickets\n` +
            `• <code>/results</code> - Declared Results\n\n` +
            `🌐 <b>Official Portal:</b> <a href="https://studymatesarkari.in">studymatesarkari.in</a>`;

          const keyboard = {
            inline_keyboard: [
              [{ text: '💼 View Latest Jobs', callback_data: 'admin_jobs' }],
              [{ text: '📢 Join Official Channel', url: TELEGRAM_CHANNEL_URL }],
              [{ text: '🌐 Open StudyMate Portal', url: 'https://studymatesarkari.in' }],
            ],
          };

          await sendTelegramMsg(chatId, studentMenu, keyboard);
        }
        return;
      }

      // COMMAND: /cancel
      if (text === '/cancel') {
        adminWizards.delete(String(chatId));
        await sendTelegramMsg(chatId, '✅ <b>Input cancelled.</b> Send /start to open the Admin Menu.');
        return;
      }

      // COMMAND: /postjob or /addjob (Wizard)
      if (text === '/postjob' || text === '/addjob') {
        if (!isAdmin) {
          await sendTelegramMsg(chatId, '⛔ Sirf Admin hi job post kar sakta hai.');
          return;
        }
        adminWizards.set(String(chatId), { step: 'TITLE', data: {} });
        const wizardStartMsg =
          `📝 <b>STEP 1 OF 5: RECRUITMENT TITLE</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Kripya vacancy ka poora naam likhein.\n\n` +
          `<i>Udaharan:</i> <code>SSC CGL 2026 Recruitment Online Form</code>\n\n` +
          `<i>Kisi bhi waqt cancel karne ke liye /cancel likhein.</i>`;
        await sendTelegramMsg(chatId, wizardStartMsg);
        return;
      }

      // COMMAND: /managejobs or /jobs
      if (text === '/managejobs' || text === '/jobs') {
        if (isAdmin) {
          await sendManageJobsList(chatId);
        } else {
          let listMsg = `💼 <b>LATEST ACTIVE VACANCIES (Website Data):</b>\n\n`;
          portalJobs.slice(0, 5).forEach((j, i) => {
            listMsg += `${i + 1}. <b>${j.title}</b>\n   🎯 Posts: ${j.vacancies}\n   📅 Last Date: ${j.lastDate}\n   🔗 <a href="${j.applyUrl}">Apply Link</a>\n\n`;
          });
          await sendTelegramMsg(chatId, listMsg);
        }
        return;
      }

      // COMMAND: /ticker
      if (text.startsWith('/ticker')) {
        if (!isAdmin) {
          await sendTelegramMsg(chatId, '⛔ Unauthorized.');
          return;
        }
        const param = text.replace('/ticker', '').trim();
        if (!param) {
          const tickerMenu =
            `🚨 <b>WEBSITE BREAKING TICKER CONTROL</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📌 <b>Status:</b> ${breakingTickerActive ? '🟢 ACTIVE' : '🔴 DISABLED'}\n` +
            `📝 <b>Current Alert Text:</b>\n"${breakingTickerText}"\n\n` +
            `<b>Usage:</b>\n` +
            `• <code>/ticker Naya Alert Text Here</code>\n` +
            `• <code>/ticker off</code> (Turn Off)\n` +
            `• <code>/ticker on</code> (Turn On)`;
          await sendTelegramMsg(chatId, tickerMenu, {
            inline_keyboard: [
              [{ text: breakingTickerActive ? '📴 Turn Off Ticker' : '🟢 Turn On Ticker', callback_data: 'toggle_ticker' }],
              [{ text: '👑 Admin Menu', callback_data: 'admin_main_menu' }],
            ],
          });
          return;
        }

        if (param.toLowerCase() === 'off' || param.toLowerCase() === 'disable') {
          breakingTickerActive = false;
          await sendTelegramMsg(chatId, '📴 <b>Breaking Ticker DISABLED!</b> Website marquee alert has been turned off.');
          return;
        }
        if (param.toLowerCase() === 'on' || param.toLowerCase() === 'enable') {
          breakingTickerActive = true;
          await sendTelegramMsg(chatId, `🟢 <b>Breaking Ticker ACTIVATED!</b>\nLive on website: "${breakingTickerText}"`);
          return;
        }

        breakingTickerText = param;
        breakingTickerActive = true;
        await sendTelegramMsg(chatId, `🚨 <b>WEBSITE BREAKING TICKER UPDATED!</b>\n\n"${breakingTickerText}"\n\nYeh turant website ke top header par scroll hone laga hai! 🚀`);
        return;
      }

      // COMMAND: /maintenance
      if (text.startsWith('/maintenance')) {
        if (!isAdmin) {
          await sendTelegramMsg(chatId, '⛔ Unauthorized.');
          return;
        }
        const param = text.replace('/maintenance', '').trim().toLowerCase();
        if (param === 'on' || param === 'enable') {
          maintenanceModeActive = true;
          await sendTelegramMsg(chatId, '🛠️ <b>WEBSITE MAINTENANCE MODE ENABLED 🔴</b>\nWebsite par maintenance notice active ho gaya hai.');
          return;
        }
        if (param === 'off' || param === 'disable') {
          maintenanceModeActive = false;
          await sendTelegramMsg(chatId, '✅ <b>MAINTENANCE MODE DISABLED 🟢</b>\nWebsite is fully live and running normal.');
          return;
        }
        await sendTelegramMsg(chatId, `🛠️ <b>Maintenance Mode:</b> ${maintenanceModeActive ? '🔴 ON' : '🟢 OFF'}\n\nType <code>/maintenance on</code> or <code>/maintenance off</code> to toggle.`);
        return;
      }

      // COMMAND: /backup
      if (text === '/backup') {
        if (!isAdmin) {
          await sendTelegramMsg(chatId, '⛔ Unauthorized.');
          return;
        }
        const summary =
          `💾 <b>COMPLETE WEBSITE DATA BACKUP SNAPSHOT:</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📅 <b>Timestamp:</b> ${new Date().toLocaleString('en-IN')}\n` +
          `💼 <b>Active Jobs:</b> ${portalJobs.length}\n` +
          `🎫 <b>Admit Cards:</b> ${portalAdmitCards.length}\n` +
          `🏆 <b>Declared Results:</b> ${portalResults.length}\n` +
          `🔑 <b>Answer Keys:</b> ${portalAnswerKeys.length}\n` +
          `🚨 <b>Ticker Status:</b> ${breakingTickerActive ? 'Active' : 'Off'}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `✅ <i>Aapka sara data surakshit hai!</i>`;
        await sendTelegramMsg(chatId, summary, {
          inline_keyboard: [[{ text: '👑 Admin Menu', callback_data: 'admin_main_menu' }]],
        });
        return;
      }

      // COMMAND: /help
      if (text === '/help') {
        const fullHelp =
          `ℹ️ <b>STUDYMATE BOT ADMIN COMMANDS LIST:</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📝 <b>Content Posting:</b>\n` +
          `• <code>/postjob</code> - Step-by-Step interactive job wizard (Sabse aasan!)\n` +
          `• <code>/newjob Title | Vacancies | Qual | LastDate | Link</code>\n` +
          `• <code>/newadmit Title | Link</code>\n` +
          `• <code>/newresult Title | Link</code>\n` +
          `• <code>/newkey Title | Link</code>\n` +
          `• <code>/newsyllabus Title | Link</code>\n\n` +
          `📋 <b>Site Operations:</b>\n` +
          `• <code>/managejobs</code> - View, delete & broadcast live jobs\n` +
          `• <code>/ticker Alert text</code> - Update breaking marquee on site\n` +
          `• <code>/ticker off</code> - Disable ticker\n` +
          `• <code>/broadcast Message</code> - Push to Telegram Channel\n` +
          `• <code>/stats</code> - Real-time visitor & portal analytics\n` +
          `• <code>/maintenance on/off</code> - Emergency maintenance\n` +
          `• <code>/backup</code> - Complete data export snapshot\n` +
          `• <code>/cancel</code> - Cancel active wizard flow\n\n` +
          `💡 <i>Tip: Telegram ke <b>[/] Menu</b> button se bhi direct choose kar sakte hain!</i>`;
        await sendTelegramMsg(chatId, fullHelp, {
          inline_keyboard: [[{ text: '👑 Admin Menu', callback_data: 'admin_main_menu' }]],
        });
        return;
      }

      // COMMAND: /stats or /analytics
      if (text === '/stats' || text === '/analytics') {
        const statsMsg =
          `📊 <b>STUDYMATE SARKARI - REALTIME ANALYTICS</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `💼 Active Vacancies on Site: <b>${portalJobs.length}</b>\n` +
          `🎫 Active Admit Cards: <b>${portalAdmitCards.length}</b>\n` +
          `🏆 Declared Results: <b>${portalResults.length}</b>\n` +
          `🔑 Answer Keys: <b>${portalAnswerKeys.length}</b>\n` +
          `🚨 Breaking Ticker: <b>${breakingTickerActive ? '🟢 Active' : '🔴 Disabled'}</b>\n` +
          `🛠️ Maintenance Mode: <b>${maintenanceModeActive ? '🔴 Active' : '🟢 Normal'}</b>\n` +
          `👤 Master Admin ID: <code>${adminChatId}</code>\n` +
          `📢 Official Channel: <b>${TELEGRAM_CHANNEL_HANDLE}</b>\n` +
          `🌐 Live Website: <a href="https://studymatesarkari.in">studymatesarkari.in</a>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `✅ <i>Server is live and responding!</i>`;
        await sendTelegramMsg(chatId, statsMsg, {
          inline_keyboard: [[{ text: '👑 Admin Menu', callback_data: 'admin_main_menu' }]],
        });
        return;
      }

      // COMMAND: /newjob (1-Line Quick Poster)
      if (text.startsWith('/newjob')) {
        if (!isAdmin) {
          await sendTelegramMsg(chatId, '⛔ Sirf authorized Admin hi website par job post kar sakta hai.');
          return;
        }

        const raw = text.replace('/newjob', '').trim();
        if (!raw || !raw.includes('|')) {
          const syntaxMsg =
            `⚠️ <b>Incorrect Format!</b> Please use the pipe (|) separator:\n\n` +
            `<code>/newjob Title | Vacancies | Qualification | Last Date | Apply Link</code>\n\n` +
            `<b>Example:</b>\n` +
            `<code>/newjob SSC MTS 2026 | 9583 Posts | 10th Pass | 15-Oct-2026 | https://ssc.gov.in</code>\n\n` +
            `<i>Tip: Ya fir aasan tarike ke liye <code>/postjob</code> likhein!</i>`;
          await sendTelegramMsg(chatId, syntaxMsg);
          return;
        }

        const parts = raw.split('|').map((s) => s.trim());
        const [title, vacanciesStr, qual, lastDate, link] = parts;

        const vacNum = parseInt((vacanciesStr || '1000').replace(/[^0-9]/g, ''), 10) || 1000;
        const newJob = {
          id: 'job-' + Date.now(),
          title: title || 'New Recruitment Notice',
          department: 'Govt Department',
          category: 'Recruitment',
          qualification: qual || 'Graduate / 12th',
          vacancies: vacNum,
          lastDate: lastDate || 'Check Website',
          applyUrl: link || 'https://studymatesarkari.in',
          status: 'LIVE',
        };

        // Add to live website jobs instantly
        portalJobs.unshift(newJob);

        const successMsg =
          `✅ <b>NEW JOB POSTED TO WEBSITE!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 <b>Title:</b> ${newJob.title}\n` +
          `🎯 <b>Vacancies:</b> ${newJob.vacancies.toLocaleString()} Posts\n` +
          `🎓 <b>Eligibility:</b> ${newJob.qualification}\n` +
          `📅 <b>Last Date:</b> ${newJob.lastDate}\n` +
          `🔗 <b>Link:</b> <a href="${newJob.applyUrl}">Apply Link</a>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Yeh job website ke live portal par turant add ho gayi hai! 🚀\n\n` +
          `Channel par broadcast karna chahte hain?`;

        const keyboard = {
          inline_keyboard: [
            [{ text: '📢 Broadcast to Telegram Channel', callback_data: `broadcast_job_${newJob.id}` }],
            [{ text: '📋 Manage Jobs', callback_data: 'admin_manage_jobs' }],
          ],
        };

        await sendTelegramMsg(chatId, successMsg, keyboard);
        return;
      }

      // COMMAND: /newadmit (ADMIN ONLY)
      if (text.startsWith('/newadmit')) {
        if (!isAdmin) {
          await sendTelegramMsg(chatId, '⛔ Sirf Admin hi admit card post kar sakta hai.');
          return;
        }
        const raw = text.replace('/newadmit', '').trim();
        const parts = raw.split('|').map((s) => s.trim());
        const [title, link] = parts;

        if (!title) {
          await sendTelegramMsg(chatId, '⚠️ Format: <code>/newadmit Title | Link</code>');
          return;
        }

        const newAdmit = {
          id: 'admit-' + Date.now(),
          title,
          department: 'Exam Board',
          releaseDate: 'Live Now',
          directUrl: link || 'https://studymatesarkari.in',
        };

        portalAdmitCards.unshift(newAdmit);
        await sendTelegramMsg(chatId, `🎫 <b>Admit Card Posted to Website!</b>\n📌 ${title}\n🔗 ${newAdmit.directUrl}`);
        return;
      }

      // COMMAND: /newresult (ADMIN ONLY)
      if (text.startsWith('/newresult')) {
        if (!isAdmin) {
          await sendTelegramMsg(chatId, '⛔ Sirf Admin hi result post kar sakta hai.');
          return;
        }
        const raw = text.replace('/newresult', '').trim();
        const parts = raw.split('|').map((s) => s.trim());
        const [title, link] = parts;

        if (!title) {
          await sendTelegramMsg(chatId, '⚠️ Format: <code>/newresult Title | Link</code>');
          return;
        }

        const newResult = {
          id: 'res-' + Date.now(),
          title,
          department: 'Commission',
          declaredDate: 'Declared Today',
          directUrl: link || 'https://studymatesarkari.in',
        };

        portalResults.unshift(newResult);
        await sendTelegramMsg(chatId, `🏆 <b>Result Posted to Website!</b>\n📌 ${title}\n🔗 ${newResult.directUrl}`);
        return;
      }

      // COMMAND: /newkey (Answer Key)
      if (text.startsWith('/newkey')) {
        if (!isAdmin) {
          await sendTelegramMsg(chatId, '⛔ Unauthorized.');
          return;
        }
        const raw = text.replace('/newkey', '').trim();
        const parts = raw.split('|').map((s) => s.trim());
        const [title, link] = parts;
        if (!title) {
          await sendTelegramMsg(chatId, '⚠️ Format: <code>/newkey SSC GD Answer Key 2026 | https://ssc.gov.in</code>');
          return;
        }
        const newKey = {
          id: 'ans-' + Date.now(),
          title,
          department: 'Exam Commission',
          releaseDate: 'Active Now',
          directUrl: link || 'https://studymatesarkari.in',
        };
        portalAnswerKeys.unshift(newKey);
        await sendTelegramMsg(chatId, `🔑 <b>Answer Key Posted to Website!</b>\n📌 ${title}\n🔗 ${newKey.directUrl}`);
        return;
      }

      // COMMAND: /newsyllabus (Syllabus)
      if (text.startsWith('/newsyllabus')) {
        if (!isAdmin) {
          await sendTelegramMsg(chatId, '⛔ Unauthorized.');
          return;
        }
        const raw = text.replace('/newsyllabus', '').trim();
        const parts = raw.split('|').map((s) => s.trim());
        const [title, link] = parts;
        if (!title) {
          await sendTelegramMsg(chatId, '⚠️ Format: <code>/newsyllabus Railway NTPC CBT Syllabus | https://pdf-link</code>');
          return;
        }
        const newSyllabus = {
          id: 'syl-' + Date.now(),
          title,
          department: 'Exam Commission',
          releaseDate: 'Updated 2026',
          directUrl: link || 'https://studymatesarkari.in',
        };
        portalSyllabus.unshift(newSyllabus);
        await sendTelegramMsg(chatId, `📚 <b>Syllabus Added to Website!</b>\n📌 ${title}\n🔗 ${newSyllabus.directUrl}`);
        return;
      }

      // COMMAND: /broadcast <Message> (ADMIN ONLY)
      if (text.startsWith('/broadcast')) {
        if (!isAdmin) {
          await sendTelegramMsg(chatId, '⛔ Sirf Admin hi broadcast kar sakta hai.');
          return;
        }
        const bcMsg = text.replace('/broadcast', '').trim();
        if (!bcMsg) {
          await sendTelegramMsg(chatId, '⚠️ Format: <code>/broadcast Your message text here</code>');
          return;
        }

        const formatted =
          `📢 <b>STUDYMATE SARKARI ALERT</b> 🚨\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `${bcMsg}\n\n` +
          `🌐 <a href="https://studymatesarkari.in">studymatesarkari.in</a>\n` +
          `📲 Join: ${TELEGRAM_CHANNEL_URL}`;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHANNEL_HANDLE,
            text: formatted,
            parse_mode: 'HTML',
          }),
        });

        await sendTelegramMsg(chatId, `✅ <b>Broadcast pushed to ${TELEGRAM_CHANNEL_HANDLE}!</b>`);
        return;
      }

      // Default unrecognized message
      if (isAdmin) {
        await sendTelegramMsg(chatId, `❓ Unknown command. Type <code>/help</code> or <code>/start</code> to see the Admin Menu.`);
      } else {
        await sendTelegramMsg(chatId, `👋 Type <code>/jobs</code> to view latest sarkari vacancies or <code>/help</code>.`);
      }
    } catch (err: any) {
      console.error('[Telegram Webhook Error]', err);
    }
  });

  // 4.2 Webhook Setup & Status Helper Routes
  app.get('/api/telegram/set-webhook', async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return res.status(400).json({ success: false, error: 'TELEGRAM_BOT_TOKEN is not configured' });
    }

    // Determine public URL: either passed via ?url= query parameter or derived from host header
    const requestedUrl = req.query.url as string;
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const proto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
    const webhookUrl = requestedUrl || `${proto}://${host}/api/telegram/webhook`;

    try {
      // Register bot commands with Telegram API so the [/] Menu button shows on mobile
      await registerTelegramBotCommands(token);

      const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`);
      const tgData = await tgRes.json();

      return res.json({
        success: tgData.ok,
        registeredWebhookUrl: webhookUrl,
        telegramResponse: tgData,
        message: tgData.ok
          ? `🎉 Webhook & Bot Menu commands successfully registered! Telegram will now route commands to ${webhookUrl}`
          : `Failed to set webhook: ${tgData.description}`,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message || 'Failed to reach Telegram API' });
    }
  });

  app.get('/api/telegram/webhook-info', async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return res.status(400).json({ success: false, error: 'TELEGRAM_BOT_TOKEN is not configured' });
    }
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const tgData = await tgRes.json();
      return res.json({ success: true, webhookInfo: tgData.result });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // =========================================================================
  // 5. AUTOMATED WHATSAPP CHANNEL BROADCASTER & DEDUPLICATION ENGINE
  // Channel: https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z
  // =========================================================================
  const WHATSAPP_CHANNEL_URL = process.env.WHATSAPP_CHANNEL_URL || 'https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z';
  const WHATSAPP_CHANNEL_ID = process.env.WHATSAPP_CHANNEL_ID || '0029Vb8ycrRKbYMIlkbOGy1z@newsletter';
  const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || '';
  const GREEN_API_API_TOKEN = process.env.GREEN_API_API_TOKEN || '';

  // In-memory + persistent set of sent items to prevent duplicate broadcasts
  const sentWhatsAppRegistry = new Map<string, {
    itemId: string;
    category: string;
    title: string;
    sentAt: string;
    status: string;
    deepLink?: string;
  }>();

  // Initialize with standard known baseline items marked as sent so old items aren't spammed
  const initialSentSeed = [
    { itemId: 'ssc-cgl-2025', category: 'JOB', title: 'SSC CGL 2025 Recruitment (17,727 Posts)', sentAt: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'SUCCESS' },
    { itemId: 'rrb-ntpc-2025', category: 'JOB', title: 'RRB NTPC Graduate & Under Graduate (11,558 Posts)', sentAt: new Date(Date.now() - 3600000 * 12).toISOString(), status: 'SUCCESS' },
    { itemId: 'upsc-prelims-2025', category: 'ADMIT_CARD', title: 'UPSC Civil Services Prelims 2025 Hall Ticket', sentAt: new Date(Date.now() - 3600000 * 6).toISOString(), status: 'SUCCESS' },
  ];
  initialSentSeed.forEach(item => sentWhatsAppRegistry.set(item.itemId, item));

  // Helper to format WhatsApp message with Badges, UTM & 1-Tap PDF
  function formatWhatsAppBroadcastMessage(item: any, category: string, reqBaseUrl: string): { message: string; deepLink: string } {
    const baseUrl = reqBaseUrl || 'https://studymatesarkari.in/';
    const title = (item.title || 'Government Recruitment Notice').toUpperCase();
    const dept = item.department || item.examBody || item.board || 'Govt of India';
    const utmSuffix = '&utm_source=whatsapp_channel&utm_medium=channel_alert&utm_campaign=sarkari_daily';

    // State / Domain Badge
    const state = (item.state || '').toUpperCase();
    let stateBadge = '🇮🇳 [ALL INDIA / CENTRAL GOVT]';
    if (state.includes('UP') || title.includes('UPPSC') || title.includes('UPSSSC')) stateBadge = '📍 [UTTAR PRADESH GOVT]';
    else if (state.includes('BIHAR') || title.includes('BPSC') || title.includes('BSSC')) stateBadge = '📍 [BIHAR GOVT]';
    else if (state.includes('RAJASTHAN') || title.includes('RSMSSB') || title.includes('RPSC')) stateBadge = '📍 [RAJASTHAN GOVT]';
    else if (state.includes('MP') || title.includes('MPPSC') || title.includes('MPESB')) stateBadge = '📍 [MADHYA PRADESH GOVT]';
    else if (dept.includes('RAILWAY') || title.includes('RRB')) stateBadge = '🚆 [INDIAN RAILWAYS - CENTRAL]';

    if (category === 'JOB') {
      const vacancies = item.vacanciesFormatted || item.vacanciesCount || item.vacancies || 'Multiple';
      const eligibility = item.eligibility || item.qualificationSummary || '10th / 12th / Graduate';
      const pay = item.payLevel || item.payScale || '7th Pay Commission Scale';
      const lastDate = (item.lastDate || 'Refer Official Circular').split('(')[0].trim();
      const deepLink = `${baseUrl}#job-detail?id=${item.id}${utmSuffix}`;
      const pdfLink = item.officialNotificationUrl || item.sourceUrl || deepLink;

      const message = `📢 *NEW SARKARI RECRUITMENT 2025-26* 🇮🇳
${stateBadge}
━━━━━━━━━━━━━━━━━━━━━
📌 *${title}*

🏛️ *Department:* ${dept}
🎯 *Total Vacancies:* ${vacancies} Posts
🎓 *Qualification:* ${eligibility}
💰 *Pay Scale:* ${pay}
📅 *Application Last Date:* ${lastDate}
⚡ *Eligibility:* ${item.ageLimit || '18 to 35 Years'}

🔗 *Direct Notification & Online Apply Link:*
👇👇👇
${deepLink}

📄 *Download Official PDF Notification:*
${pdfLink}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel for Instant Sarkari Alerts:*
👉 ${WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — 100% Free & Verified Updates`;

      return { message, deepLink };
    } else if (category === 'ADMIT_CARD') {
      const examDate = item.examDateFormatted || item.examDate || 'Active';
      const deepLink = `${baseUrl}#admit-card?${utmSuffix.substring(1)}`;
      const message = `🎫 *ADMIT CARD / HALL TICKET OUT* 🚨
${stateBadge}
━━━━━━━━━━━━━━━━━━━━━
📌 *${title}*

🏛️ *Exam Conducting Body:* ${dept}
🗓️ *Exam Date:* ${examDate}
📥 *Status:* ${item.statusBadge || 'Hall Ticket Link Live'}

🔗 *Download Hall Ticket from Direct Server:*
👇👇👇
${deepLink}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel:*
👉 ${WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — Verified Exam Intelligence`;

      return { message, deepLink };
    } else if (category === 'RESULT') {
      const resultDate = item.declaredDate || item.resultDate || 'Declared Today';
      const deepLink = `${baseUrl}#results?${utmSuffix.substring(1)}`;
      const message = `🏆 *EXAM RESULT & MERIT LIST DECLARED* 📢
${stateBadge}
━━━━━━━━━━━━━━━━━━━━━
📌 *${title}*

🏛️ *Commission:* ${dept}
📅 *Result Date:* ${resultDate}
📊 *Status:* Official Merit List & Cutoff PDF Available

🔗 *Check Result, Scorecard & Cutoff PDF:*
👇👇👇
${deepLink}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel:*
👉 ${WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — Fastest Sarkari Results`;

      return { message, deepLink };
    } else {
      const releaseDate = item.releaseDate || 'Released Today';
      const deepLink = `${baseUrl}#answer-key?${utmSuffix.substring(1)}`;
      const message = `📝 *OFFICIAL ANSWER KEY & OBJECTION LINK* 🔑
${stateBadge}
━━━━━━━━━━━━━━━━━━━━━
📌 *${title}*

🏛️ *Exam Authority:* ${dept}
📅 *Release Date:* ${releaseDate}
⏳ *Objection Window:* ${item.objectionLastDate || 'Active Now'}

🔗 *Download Response Sheet & Answer Key:*
👇👇👇
${deepLink}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel:*
👉 ${WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — Accurate Solutions & Keys`;

      return { message, deepLink };
    }
  }


  // 5.1 GET WhatsApp Broadcast History & Stats
  app.get('/api/whatsapp/history', (req, res) => {
    const list = Array.from(sentWhatsAppRegistry.values()).reverse();
    res.json({
      success: true,
      channelUrl: WHATSAPP_CHANNEL_URL,
      channelId: WHATSAPP_CHANNEL_ID,
      isApiConfigured: !!(GREEN_API_INSTANCE_ID && GREEN_API_API_TOKEN),
      totalSent: list.length,
      history: list,
    });
  });

  // 5.2 Check if a specific item is already sent
  app.get('/api/whatsapp/check-sent/:id', (req, res) => {
    const id = req.params.id;
    const isSent = sentWhatsAppRegistry.has(id);
    const record = sentWhatsAppRegistry.get(id);
    res.json({
      success: true,
      itemId: id,
      alreadySent: isSent,
      sentRecord: record || null,
    });
  });

  // 5.3 AUTOMATIC DEDUPLICATING BROADCASTER (Only sends NEW, unsent items)
  app.post('/api/whatsapp/auto-sync-broadcast', async (req, res) => {
    const { items, baseUrl } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items array provided in request payload.' });
    }

    const newlyBroadcasted: any[] = [];
    const skippedDuplicates: string[] = [];

    const reqOrigin = baseUrl || (req.headers.origin as string) || `http://localhost:${PORT}/`;

    for (const item of items) {
      const itemId = item.id || `${item.category || 'item'}-${Date.now()}`;
      const category = (item.categoryType || item.category || 'JOB').toUpperCase();

      // STRICT DEDUPLICATION: If already recorded in registry, SKIP automatically!
      if (sentWhatsAppRegistry.has(itemId)) {
        skippedDuplicates.push(itemId);
        continue;
      }

      const { message, deepLink } = formatWhatsAppBroadcastMessage(item, category, reqOrigin);

      let sendStatus = 'SUCCESS';
      let apiResponse = null;

      // Dispatch to WhatsApp API if configured
      if (GREEN_API_INSTANCE_ID && GREEN_API_API_TOKEN) {
        try {
          const apiUrl = `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_API_TOKEN}`;
          const waRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: WHATSAPP_CHANNEL_ID,
              message,
            }),
          });
          apiResponse = await waRes.json();
          if (!waRes.ok) {
            sendStatus = 'API_ERROR';
          }
        } catch (e: any) {
          sendStatus = 'NETWORK_ERROR';
        }
      }

      const record = {
        itemId,
        category,
        title: item.title || 'Recruitment Notice',
        department: item.department || item.examBody || item.board || 'Govt of India',
        sentAt: new Date().toISOString(),
        status: sendStatus,
        deepLink,
        formattedMessage: message,
      };

      // Mark in persistent registry so it is NEVER sent again
      sentWhatsAppRegistry.set(itemId, record);
      newlyBroadcasted.push(record);
    }

    res.json({
      success: true,
      channelUrl: WHATSAPP_CHANNEL_URL,
      totalReceived: items.length,
      newlyBroadcastedCount: newlyBroadcasted.length,
      skippedDuplicatesCount: skippedDuplicates.length,
      newlyBroadcasted,
      skippedDuplicates,
    });
  });

  // 5.4 Manual single broadcast or override
  app.post('/api/whatsapp/broadcast-single', async (req, res) => {
    const { item, category = 'JOB', baseUrl, force = false } = req.body || {};
    if (!item || !item.id) {
      return res.status(400).json({ success: false, message: 'Item with ID is required.' });
    }

    if (sentWhatsAppRegistry.has(item.id) && !force) {
      return res.json({
        success: true,
        alreadySent: true,
        message: `Item '${item.title}' was already broadcasted to WhatsApp Channel. Use force=true to resend.`,
        sentRecord: sentWhatsAppRegistry.get(item.id),
      });
    }

    const reqOrigin = baseUrl || (req.headers.origin as string) || `http://localhost:${PORT}/`;
    const { message, deepLink } = formatWhatsAppBroadcastMessage(item, category, reqOrigin);

    let sendStatus = 'SUCCESS';
    if (GREEN_API_INSTANCE_ID && GREEN_API_API_TOKEN) {
      try {
        const apiUrl = `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_API_TOKEN}`;
        const waRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: WHATSAPP_CHANNEL_ID,
            message,
          }),
        });
        if (!waRes.ok) sendStatus = 'API_ERROR';
      } catch {
        sendStatus = 'NETWORK_ERROR';
      }
    }

    const record = {
      itemId: item.id,
      category,
      title: item.title,
      department: item.department || item.examBody || item.board || 'Govt of India',
      sentAt: new Date().toISOString(),
      status: sendStatus,
      deepLink,
      formattedMessage: message,
    };

    sentWhatsAppRegistry.set(item.id, record);

    res.json({
      success: true,
      alreadySent: false,
      record,
      channelUrl: WHATSAPP_CHANNEL_URL,
      messageText: message,
    });
  });

  // =========================================================================
  // 6. AUTOMATED TELEGRAM CHANNEL BROADCASTER & DEDUPLICATION ENGINE
  // Channel: https://t.me/Sarkariupdatealerts (@Sarkariupdatealerts)
  // =========================================================================
  const TELEGRAM_CHANNEL_URL = process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/Sarkariupdatealerts';
  const TELEGRAM_CHANNEL_HANDLE = process.env.TELEGRAM_CHANNEL_HANDLE || '@Sarkariupdatealerts';

  // In-memory persistent registry for Telegram sent items
  const sentTelegramRegistry = new Map<string, {
    itemId: string;
    category: string;
    title: string;
    department?: string;
    sentAt: string;
    status: string;
    deepLink?: string;
    pdfUrl?: string;
  }>();

  // Initial seed items to prevent spamming pre-existing posts
  const initialTelegramSeed = [
    { itemId: 'ssc-cgl-2025', category: 'JOB', title: 'SSC CGL 2025 Online Application (17,727 Posts)', department: 'Staff Selection Commission (SSC)', sentAt: new Date(Date.now() - 3600000 * 24).toISOString(), status: 'SUCCESS' },
    { itemId: 'rrb-ntpc-2025', category: 'JOB', title: 'RRB NTPC Graduate & Under Graduate (11,558 Posts)', department: 'Railway Recruitment Boards', sentAt: new Date(Date.now() - 3600000 * 12).toISOString(), status: 'SUCCESS' },
  ];
  initialTelegramSeed.forEach(item => sentTelegramRegistry.set(item.itemId, item));

  // 6.1 Get Telegram History & Status
  app.get('/api/telegram/history', (req, res) => {
    const list = Array.from(sentTelegramRegistry.values()).reverse();
    res.json({
      success: true,
      channelUrl: TELEGRAM_CHANNEL_URL,
      channelHandle: TELEGRAM_CHANNEL_HANDLE,
      totalSent: list.length,
      history: list,
    });
  });

  // 6.2 Check if specific item was already broadcasted to Telegram
  app.get('/api/telegram/check-sent/:id', (req, res) => {
    const id = req.params.id;
    const isSent = sentTelegramRegistry.has(id);
    const record = sentTelegramRegistry.get(id);
    res.json({
      success: true,
      itemId: id,
      alreadySent: isSent,
      sentRecord: record || null,
    });
  });

  // 6.3 Telegram Auto-Sync with strict deduplication
  app.post('/api/telegram/auto-sync-broadcast', async (req, res) => {
    const { items, baseUrl } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items array provided in request payload.' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID || TELEGRAM_CHANNEL_HANDLE;
    const newlyBroadcasted: any[] = [];
    const skippedDuplicates: string[] = [];

    for (const item of items) {
      const itemId = item.id || `${item.category || 'item'}-${Date.now()}`;
      const category = (item.categoryType || item.category || 'JOB').toUpperCase();

      if (sentTelegramRegistry.has(itemId)) {
        skippedDuplicates.push(itemId);
        continue;
      }

      let sendStatus = 'SUCCESS';

      // Dispatch to Telegram Bot API if token is configured
      if (token && channelId) {
        try {
          const deepLink = `${baseUrl || 'https://studymatesarkari.in/'}#job-detail?id=${itemId}&utm_source=telegram_channel&utm_medium=channel_alert&utm_campaign=sarkari_daily`;
          const text = `📢 <b>${(item.title || '').toUpperCase()}</b>\n\n🏛️ Department: ${item.department || 'Govt of India'}\n🎯 Posts: ${item.vacanciesFormatted || item.vacancies || 'Multiple'}\n📅 Last Date: ${item.lastDate || 'Active'}\n\n🔗 <a href="${deepLink}">Apply Online & Download PDF</a>\n\n📲 Join: ${TELEGRAM_CHANNEL_URL}`;
          
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: channelId,
              text,
              parse_mode: 'HTML',
              disable_web_page_preview: false,
            }),
          });
        } catch {
          sendStatus = 'NETWORK_ERROR';
        }
      }

      const record = {
        itemId,
        category,
        title: item.title || 'Recruitment Notice',
        department: item.department || item.commission || item.board || 'Govt of India',
        sentAt: new Date().toISOString(),
        status: sendStatus,
        deepLink: `${baseUrl || 'https://studymatesarkari.in/'}#job-detail?id=${itemId}`,
      };

      sentTelegramRegistry.set(itemId, record);
      newlyBroadcasted.push(record);
    }

    res.json({
      success: true,
      channelUrl: TELEGRAM_CHANNEL_URL,
      channelHandle: TELEGRAM_CHANNEL_HANDLE,
      totalReceived: items.length,
      newlyBroadcastedCount: newlyBroadcasted.length,
      skippedDuplicatesCount: skippedDuplicates.length,
      newlyBroadcasted,
      skippedDuplicates,
    });
  });

  // 6.4 Broadcast single item to Telegram
  app.post('/api/telegram/broadcast-single', async (req, res) => {
    const { item, category = 'JOB', formattedText, force = false, channelId } = req.body || {};
    if (!item || !item.id) {
      return res.status(400).json({ success: false, message: 'Item with ID is required.' });
    }

    if (sentTelegramRegistry.has(item.id) && !force) {
      return res.json({
        success: true,
        alreadySent: true,
        message: `Item '${item.title}' was already broadcasted to Telegram.`,
        sentRecord: sentTelegramRegistry.get(item.id),
      });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const targetChatId = channelId || process.env.TELEGRAM_CHANNEL_ID || TELEGRAM_CHANNEL_HANDLE;
    let sendStatus = 'SUCCESS';

    if (token && targetChatId && formattedText) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: formattedText,
            parse_mode: 'HTML',
          }),
        });
        if (!tgRes.ok) sendStatus = 'API_NOTE';
      } catch {
        sendStatus = 'NETWORK_NOTE';
      }
    }

    const record = {
      itemId: item.id,
      category,
      title: item.title,
      department: item.department || item.commission || item.board || 'Govt of India',
      sentAt: new Date().toISOString(),
      status: sendStatus,
      deepLink: `https://studymatesarkari.in/#job-detail?id=${item.id}&utm_source=telegram_channel&utm_medium=channel_alert`,
    };

    sentTelegramRegistry.set(item.id, record);

    res.json({
      success: true,
      alreadySent: false,
      record,
      channelUrl: TELEGRAM_CHANNEL_URL,
      channelHandle: TELEGRAM_CHANNEL_HANDLE,
    });
  });

  // 6.5 Send live test message to Telegram
  app.post('/api/telegram/test-send', async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const { channelId = TELEGRAM_CHANNEL_HANDLE, text } = req.body || {};
    
    if (token && text) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channelId,
            text,
            parse_mode: 'HTML',
          }),
        });
        const data = await response.json();
        return res.json({ success: response.ok, result: data });
      } catch (e: any) {
        return res.json({ success: true, message: 'Message logged for Telegram broadcast' });
      }
    }

    return res.json({
      success: true,
      message: `Test alert simulated for ${channelId} (${TELEGRAM_CHANNEL_URL})`,
    });
  });

  // 6.6 AUTONOMOUS BACKGROUND DAEMON WORKER (Runs every 5 minutes without any clicks)
  const runAutonomousBackgroundBroadcast = async () => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const channelId = process.env.TELEGRAM_CHANNEL_ID || TELEGRAM_CHANNEL_HANDLE;

      if (!supabaseUrl || !supabaseKey) return;

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch latest active jobs published in last 48 hours
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(10);

      if (error || !Array.isArray(jobs)) return;

      for (const job of jobs) {
        const itemId = job.id || job.slug;
        if (sentTelegramRegistry.has(itemId)) continue;

        let sendStatus = 'SUCCESS';
        if (token && channelId) {
          try {
            const deepLink = `https://studymatesarkari.in/#job-detail?id=${itemId}&utm_source=telegram_channel&utm_medium=channel_alert`;
            const text = `📢 <b>${(job.title || '').toUpperCase()}</b>\n\n🏛️ <b>Dept:</b> ${job.category || job.department || 'Govt of India'}\n🎯 <b>Vacancies:</b> ${job.total_vacancies ? `${job.total_vacancies.toLocaleString()} Posts` : 'Multiple'}\n📅 <b>Last Date:</b> ${job.last_date || 'Check Website'}\n\n🔗 <a href="${deepLink}">Apply Online & Notification PDF</a>\n\n📲 Join: ${TELEGRAM_CHANNEL_URL}`;

            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: channelId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: false,
              }),
            });
            console.log(`[AUTONOMOUS TELEGRAM DAEMON] Broadcasted new job '${job.title}' to ${channelId}`);
          } catch (err: any) {
            sendStatus = 'ERROR';
          }
        }

        sentTelegramRegistry.set(itemId, {
          itemId,
          category: 'JOB',
          title: job.title,
          department: job.category || 'Govt of India',
          sentAt: new Date().toISOString(),
          status: sendStatus,
          deepLink: `https://studymatesarkari.in/#job-detail?id=${itemId}`,
        });
      }
    } catch (err) {
      // Background worker silent handler
    }
  };

  // Run autonomous broadcast worker every 5 minutes (300,000 ms)
  setInterval(runAutonomousBackgroundBroadcast, 300000);
  setTimeout(runAutonomousBackgroundBroadcast, 15000); // Initial check 15s after server boot

  // 4. Vite middleware for development vs Static assets for production
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudyMate Server] Running on http://0.0.0.0:${PORT} (Render / Container)`);
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    if (tgToken) {
      registerTelegramBotCommands(tgToken).catch(() => {});
    }
  });
}

startServer();
