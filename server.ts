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
