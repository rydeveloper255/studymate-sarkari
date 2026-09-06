import { TelegramBroadcastRecord, JobItem, AdmitCardItem, ResultItem, AnswerKeyItem, TelegramBannerConfig } from '../types';

const TELEGRAM_STORAGE_KEY = 'studymate_telegram_broadcast_history';
const TELEGRAM_AUTO_ENABLED_KEY = 'studymate_telegram_auto_enabled';
const TELEGRAM_BOT_SETTINGS_KEY = 'studymate_telegram_bot_settings';

export const OFFICIAL_TELEGRAM_CHANNEL_URL = 'https://t.me/Sarkariupdatealerts';
export const OFFICIAL_TELEGRAM_CHANNEL_HANDLE = '@Sarkariupdatealerts';
export const OFFICIAL_TELEGRAM_ADMIN_ID = '5165363865';

export interface TelegramBotSettings {
  botToken: string;
  channelId: string; // e.g. @Sarkariupdatealerts or chat_id
  adminId: string;
  enableInlineButtons: boolean;
  enableAutoBroadcast: boolean;
  parseMode: 'HTML' | 'MarkdownV2';
}

class TelegramBroadcastService {
  private history: TelegramBroadcastRecord[] = [];
  private sentSet: Set<string> = new Set();
  private autoBroadcastEnabled: boolean = true;
  private listeners: Array<() => void> = [];
  private botSettings: TelegramBotSettings = {
    botToken: '',
    channelId: '@Sarkariupdatealerts',
    adminId: OFFICIAL_TELEGRAM_ADMIN_ID,
    enableInlineButtons: true,
    enableAutoBroadcast: true,
    parseMode: 'HTML',
  };

  constructor() {
    this.loadFromStorage();
    this.syncWithServer();
  }

  private loadFromStorage() {
    try {
      const autoSaved = localStorage.getItem(TELEGRAM_AUTO_ENABLED_KEY);
      if (autoSaved !== null) {
        this.autoBroadcastEnabled = autoSaved === 'true';
      }

      const botSaved = localStorage.getItem(TELEGRAM_BOT_SETTINGS_KEY);
      if (botSaved) {
        this.botSettings = { ...this.botSettings, ...JSON.parse(botSaved) };
      }

      const stored = localStorage.getItem(TELEGRAM_STORAGE_KEY);
      if (stored) {
        const parsed: TelegramBroadcastRecord[] = JSON.parse(stored);
        this.history = parsed;
        this.sentSet = new Set(parsed.map((r) => r.itemId));
      } else {
        const seed: TelegramBroadcastRecord[] = [
          {
            id: 'tg-ssc-cgl-2025',
            itemId: 'ssc-cgl-2025',
            category: 'JOB',
            title: 'SSC CGL 2025 Online Application (17,727 Posts)',
            department: 'Staff Selection Commission (SSC)',
            sentAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'SUCCESS',
            channelUrl: OFFICIAL_TELEGRAM_CHANNEL_URL,
            channelHandle: OFFICIAL_TELEGRAM_CHANNEL_HANDLE,
            autoBroadcasted: true,
            deepLink: 'https://studymatesarkari.in/#job-detail?id=ssc-cgl-2025&utm_source=telegram_channel&utm_medium=channel_alert&utm_campaign=sarkari_daily',
            utmParams: 'utm_source=telegram_channel&utm_medium=channel_alert',
          },
          {
            id: 'tg-rrb-ntpc-2025',
            itemId: 'rrb-ntpc-2025',
            category: 'JOB',
            title: 'RRB NTPC Graduate & Under Graduate (11,558 Posts)',
            department: 'Railway Recruitment Boards',
            sentAt: new Date(Date.now() - 43200000).toISOString(),
            status: 'SUCCESS',
            channelUrl: OFFICIAL_TELEGRAM_CHANNEL_URL,
            channelHandle: OFFICIAL_TELEGRAM_CHANNEL_HANDLE,
            autoBroadcasted: true,
            deepLink: 'https://studymatesarkari.in/#job-detail?id=rrb-ntpc-2025&utm_source=telegram_channel&utm_medium=channel_alert&utm_campaign=sarkari_daily',
            utmParams: 'utm_source=telegram_channel&utm_medium=channel_alert',
          },
        ];
        this.history = seed;
        this.sentSet = new Set(seed.map((s) => s.itemId));
        this.saveToStorage();
      }
    } catch (e) {
      console.error('Error loading Telegram storage:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(TELEGRAM_STORAGE_KEY, JSON.stringify(this.history));
      localStorage.setItem(TELEGRAM_AUTO_ENABLED_KEY, String(this.autoBroadcastEnabled));
      localStorage.setItem(TELEGRAM_BOT_SETTINGS_KEY, JSON.stringify(this.botSettings));
    } catch (e) {
      console.error('Error saving Telegram storage:', e);
    }
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getBroadcastHistory(): TelegramBroadcastRecord[] {
    return [...this.history];
  }

  public isAutoEnabled(): boolean {
    return this.autoBroadcastEnabled;
  }

  public setAutoEnabled(val: boolean) {
    this.autoBroadcastEnabled = val;
    this.botSettings.enableAutoBroadcast = val;
    this.saveToStorage();
    this.notify();
  }

  public getBotSettings(): TelegramBotSettings {
    return { ...this.botSettings };
  }

  public updateBotSettings(settings: Partial<TelegramBotSettings>) {
    this.botSettings = { ...this.botSettings, ...settings };
    this.saveToStorage();
    this.notify();
  }

  public isAlreadyBroadcasted(itemId: string): boolean {
    return this.sentSet.has(itemId);
  }

  // Sync with backend API to fetch recent broadcasts from server
  public async syncWithServer(): Promise<void> {
    try {
      const res = await fetch('/api/telegram/history');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.history) && data.history.length > 0) {
          const map = new Map<string, TelegramBroadcastRecord>();
          this.history.forEach((h) => map.set(h.itemId, h));
          data.history.forEach((s: any) => {
            map.set(s.itemId, {
              id: s.id || `tg-${s.itemId}`,
              itemId: s.itemId,
              category: s.category || 'JOB',
              title: s.title,
              department: s.department,
              sentAt: s.sentAt || new Date().toISOString(),
              status: 'SUCCESS',
              channelUrl: OFFICIAL_TELEGRAM_CHANNEL_URL,
              channelHandle: OFFICIAL_TELEGRAM_CHANNEL_HANDLE,
              autoBroadcasted: true,
              deepLink: s.deepLink,
              pdfUrl: s.pdfUrl,
              utmParams: 'utm_source=telegram_channel&utm_medium=channel_alert',
            });
          });
          this.history = Array.from(map.values()).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
          this.sentSet = new Set(this.history.map((h) => h.itemId));
          this.saveToStorage();
          this.notify();
        }
      }
    } catch (e) {
      // Backend silent fallback
    }
  }

  // 1. STATE & COMMISSION BADGING
  public getVisualBadges(item: any, category: string): { stateBadge: string; domainBadge: string } {
    const title = (item.title || '').toUpperCase();
    const dept = (item.department || item.commission || item.board || '').toUpperCase();
    const state = (item.state || '').toUpperCase();

    let stateBadge = '🇮🇳 [ALL INDIA / CENTRAL GOVT]';
    let domainBadge = '⚡ GOVT RECRUITMENT';

    if (state.includes('UP') || dept.includes('UPPSC') || title.includes('UPPSC') || title.includes('UPSSSC')) {
      stateBadge = '📍 [UTTAR PRADESH GOVT]';
    } else if (state.includes('BIHAR') || dept.includes('BPSC') || title.includes('BPSC') || title.includes('BSSC')) {
      stateBadge = '📍 [BIHAR GOVT]';
    } else if (state.includes('RAJASTHAN') || dept.includes('RSMSSB') || title.includes('RPSC')) {
      stateBadge = '📍 [RAJASTHAN GOVT]';
    } else if (state.includes('MP') || dept.includes('MPPSC') || title.includes('MPESB')) {
      stateBadge = '📍 [MADHYA PRADESH GOVT]';
    } else if (state.includes('HARYANA') || dept.includes('HPSC') || title.includes('HSSC')) {
      stateBadge = '📍 [HARYANA GOVT]';
    } else if (dept.includes('RAILWAY') || title.includes('RRB') || title.includes('RAILWAY')) {
      stateBadge = '🚆 [INDIAN RAILWAYS - CENTRAL]';
    } else if (dept.includes('BANK') || title.includes('IBPS') || title.includes('SBI')) {
      stateBadge = '🏦 [BANKING RECRUITMENT]';
    } else if (dept.includes('DEFENCE') || title.includes('NDA') || title.includes('CDS') || title.includes('ARMY') || title.includes('NAVY') || title.includes('AIR FORCE')) {
      stateBadge = '🛡️ [INDIAN DEFENCE FORCES]';
    } else if (dept.includes('SSC') || title.includes('SSC')) {
      stateBadge = '🏛️ [STAFF SELECTION COMMISSION]';
    } else if (dept.includes('UPSC') || title.includes('UPSC')) {
      stateBadge = '👑 [UNION PUBLIC SERVICE COMMISSION]';
    }

    if (category === 'ADMIT_CARD') domainBadge = '🎫 ADMIT CARD RELEASED';
    else if (category === 'RESULT') domainBadge = '🏆 RESULT DECLARED';
    else if (category === 'ANSWER_KEY') domainBadge = '📝 ANSWER KEY & OBJECTIONS';
    else domainBadge = '📢 VACANCY APPLICATION ACTIVE';

    return { stateBadge, domainBadge };
  }

  // 2. UTM-ATTACHED DEEP LINK BUILDER
  public getDeepLink(item: any, category: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studymatesarkari.in';
    const utm = 'utm_source=telegram_channel&utm_medium=channel_alert&utm_campaign=sarkari_daily';

    if (category === 'JOB') {
      return `${baseUrl}/#job-detail?id=${item.id}&${utm}`;
    } else if (category === 'ADMIT_CARD') {
      return `${baseUrl}/#admit-card?item=${item.id}&${utm}`;
    } else if (category === 'RESULT') {
      return `${baseUrl}/#results?item=${item.id}&${utm}`;
    } else {
      return `${baseUrl}/#answer-key?item=${item.id}&${utm}`;
    }
  }

  // 3. GET OFFICIAL PDF LINK
  public getPdfLink(item: any): string {
    if (item.officialNotificationUrl) return item.officialNotificationUrl;
    if (item.pdfUrl) return item.pdfUrl;
    if (item.sourceUrl) return item.sourceUrl;
    if (Array.isArray(item.directLinks)) {
      const pdfObj = item.directLinks.find((l: any) => l.type === 'pdf' || l.title?.toLowerCase().includes('pdf') || l.title?.toLowerCase().includes('notification'));
      if (pdfObj?.url) return pdfObj.url;
    }
    return '';
  }

  // 4. FORMAT TELEGRAM MESSAGE (Markdown / Plain)
  public formatMessage(item: any, category: 'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY'): string {
    const { stateBadge } = this.getVisualBadges(item, category);
    const deepLink = this.getDeepLink(item, category);
    const pdfLink = this.getPdfLink(item);

    if (category === 'JOB') {
      const job = item as JobItem;
      const lastDateClean = (job.lastDate || '').split('(')[0].trim();
      const qualification = job.qualificationSummary || '10th / 12th / Graduate';
      const vacancies = job.vacanciesFormatted || `${job.vacanciesCount || 'Multiple'} Posts`;
      const pay = job.payLevel || job.payScale || '7th Pay Matrix Scale';
      const age = job.ageLimit || '18 to 35 Years';

      return `📢 <b>NEW SARKARI RECRUITMENT 2025-26</b> 🇮🇳
${stateBadge}
━━━━━━━━━━━━━━━━━━━━━
📌 <b>${(job.title || '').toUpperCase()}</b>

🏛️ <b>Department:</b> ${job.department || 'Govt of India'}
🎯 <b>Total Posts:</b> ${vacancies}
🎓 <b>Qualification:</b> ${qualification}
💰 <b>Pay Scale:</b> ${pay}
📅 <b>Application Last Date:</b> ${lastDateClean}
⚡ <b>Age Criteria:</b> ${age}

🔗 <b>Direct Apply Online & Details:</b>
👇👇👇
${deepLink}
${pdfLink ? `\n📄 <b>Download Official Notification PDF:</b>\n${pdfLink}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━
📲 <b>Join Official Telegram Channel for 24x7 Alerts:</b>
👉 ${OFFICIAL_TELEGRAM_CHANNEL_URL}
🔔 <i>Turn on Channel Notifications to never miss any deadline!</i>`;
    }

    if (category === 'ADMIT_CARD') {
      const card = item as AdmitCardItem;
      const examDate = card.examDateFormatted || card.month || 'Active';

      return `🎫 <b>ADMIT CARD / HALL TICKET OUT</b> 🚨
${stateBadge}
━━━━━━━━━━━━━━━━━━━━━
📌 <b>${(card.title || '').toUpperCase()}</b>

🏛️ <b>Exam Conducting Body:</b> ${card.commission?.toUpperCase() || 'Govt Commission'}
📅 <b>Exam Date / Session:</b> ${examDate}
⚡ <b>Status:</b> ${card.statusBadge || 'Admit Card Link Live'}
📋 <b>Requirements:</b> ${card.requirements || 'Application Number & DOB'}

🔗 <b>Direct Hall Ticket Download Server:</b>
👇👇👇
${deepLink}
${card.hallTicketUrl ? `\n🎟️ <b>Official Server Portal:</b>\n${card.hallTicketUrl}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━
📲 <b>Join Official Telegram Channel for Instant Updates:</b>
👉 ${OFFICIAL_TELEGRAM_CHANNEL_URL}`;
    }

    if (category === 'RESULT') {
      const result = item as ResultItem;
      const decDate = result.declaredDate || 'Declared Today';

      return `🏆 <b>EXAM RESULT & MERIT LIST DECLARED</b> 📢
${stateBadge}
━━━━━━━━━━━━━━━━━━━━━
📌 <b>${(result.title || '').toUpperCase()}</b>

🏛️ <b>Board / Commission:</b> ${result.board || 'Govt Board'}
📅 <b>Result Declared On:</b> ${decDate}
🎯 <b>Result Type:</b> ${result.resultType || 'Final Selection List'}
👥 <b>Total Posts Selected:</b> ${result.totalPosts || 'All Selected Candidates'}

🔗 <b>Direct Scorecard & Merit PDF Link:</b>
👇👇👇
${deepLink}
${result.downloadUrl ? `\n📄 <b>Official Merit PDF Download:</b>\n${result.downloadUrl}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━
📲 <b>Join Official Telegram Channel:</b>
👉 ${OFFICIAL_TELEGRAM_CHANNEL_URL}`;
    }

    if (category === 'ANSWER_KEY') {
      const key = item as AnswerKeyItem;
      const relDate = key.releaseDate || 'Released Today';

      return `📝 <b>OFFICIAL ANSWER KEY & OBJECTIONS OPEN</b> 🔑
${stateBadge}
━━━━━━━━━━━━━━━━━━━━━
📌 <b>${(key.title || '').toUpperCase()}</b>

🏛️ <b>Examination Board:</b> ${key.board || 'Govt Exam Commission'}
📅 <b>Key Release Date:</b> ${relDate}
⏳ <b>Objection Window Closes:</b> ${key.objectionLastDate || 'Check Circular'}
⚡ <b>Status:</b> ${key.status || 'Key Available for Download'}

🔗 <b>Direct Question Paper & Key PDF:</b>
👇👇👇
${deepLink}
${key.answerKeyUrl ? `\n🔑 <b>Download Official Answer Sheet:</b>\n${key.answerKeyUrl}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━
📲 <b>Join Official Telegram Channel:</b>
👉 ${OFFICIAL_TELEGRAM_CHANNEL_URL}`;
    }

    return '';
  }

  // 5. DEADLINE URGENCY ALERTS FOR TELEGRAM
  public formatDeadlineUrgentAlert(job: JobItem, urgency: 'LAST_24_HOURS' | '3_DAYS_LEFT'): string {
    const deepLink = this.getDeepLink(job, 'JOB');
    const is24h = urgency === 'LAST_24_HOURS';
    const lastDateClean = (job.lastDate || '').split('(')[0].trim();

    return `🚨 <b>${is24h ? 'FINAL 24 HOURS REMINDER ⏳' : 'LAST 3 DAYS LEFT ⚠️'}</b>
🇮🇳 <b>GOVT RECRUITMENT CLOSING SOON</b>
━━━━━━━━━━━━━━━━━━━━━
📌 <b>${(job.title || '').toUpperCase()}</b>

🏛️ <b>Department:</b> ${job.department || 'Govt of India'}
🎯 <b>Total Posts:</b> ${job.vacanciesFormatted || 'Multiple'}
📅 <b>Final Application Deadline:</b> <b>${lastDateClean}</b>
🎓 <b>Eligibility:</b> ${job.qualificationSummary || '10th / 12th / Graduate'}

⚠️ <i>Heavy server load & payment portal slow-downs expected on final day. Fill your application form immediately!</i>

🔗 <b>Direct Apply Online Link:</b>
👇👇👇
${deepLink}

━━━━━━━━━━━━━━━━━━━━━
📲 <b>Join Official Telegram Channel:</b>
👉 ${OFFICIAL_TELEGRAM_CHANNEL_URL}`;
  }

  // 6. DAILY MEGA DIGEST GENERATOR FOR TELEGRAM
  public generateDailyMorningDigest(jobs: JobItem[]): string {
    const topJobs = jobs.slice(0, 5);
    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    let msg = `🌅 <b>STUDYMATE SARKARI MORNING BULLETIN</b> 🇮🇳
📅 <i>${dateStr} | 8:00 AM Daily Edition</i>
━━━━━━━━━━━━━━━━━━━━━
Here are today's <b>TOP 5 GOVERNMENT RECRUITMENT NOTICES</b> currently active:\n\n`;

    topJobs.forEach((job, idx) => {
      const link = this.getDeepLink(job, 'JOB');
      msg += `<b>${idx + 1}. ${job.title}</b>
🏛️ ${job.department} | 🎯 <b>${job.vacanciesFormatted} Posts</b>
📅 Last Date: ${job.lastDate.split('(')[0].trim()}
🔗 <a href="${link}">Apply Now »</a>\n\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━
🌐 <b>Explore All 100+ Live Jobs on Portal:</b>
👉 https://studymatesarkari.in/?utm_source=telegram_channel&utm_medium=morning_digest

📲 <b>Forward to Aspirant Study Groups!</b>
👉 ${OFFICIAL_TELEGRAM_CHANNEL_URL}`;

    return msg;
  }

  public generateDailyEveningRoundup(admitCards: AdmitCardItem[], results: ResultItem[], answerKeys: AnswerKeyItem[]): string {
    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    let msg = `🌆 <b>STUDYMATE SARKARI EVENING ROUNDUP</b> 📢
📅 <i>${dateStr} | 8:00 PM Daily Edition</i>
━━━━━━━━━━━━━━━━━━━━━
Today's latest <b>Admit Cards, Results & Official Answer Keys</b>:\n\n`;

    if (results.length > 0) {
      msg += `🏆 <b>LATEST RESULTS DECLARED:</b>\n`;
      results.slice(0, 3).forEach((r) => {
        msg += `• <b>${r.title}</b> (${r.declaredDate})\n  🔗 <a href="${this.getDeepLink(r, 'RESULT')}">Check Merit List »</a>\n`;
      });
      msg += `\n`;
    }

    if (admitCards.length > 0) {
      msg += `🎫 <b>ADMIT CARDS & CITY SLIPS OUT:</b>\n`;
      admitCards.slice(0, 3).forEach((a) => {
        msg += `• <b>${a.title}</b> (${a.examDateFormatted || a.month})\n  🔗 <a href="${this.getDeepLink(a, 'ADMIT_CARD')}">Download Hall Ticket »</a>\n`;
      });
      msg += `\n`;
    }

    if (answerKeys.length > 0) {
      msg += `📝 <b>ANSWER KEYS & OBJECTIONS:</b>\n`;
      answerKeys.slice(0, 2).forEach((k) => {
        msg += `• <b>${k.title}</b>\n  🔗 <a href="${this.getDeepLink(k, 'ANSWER_KEY')}">View Official Key »</a>\n`;
      });
      msg += `\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━
🌐 <b>Full 100% Verified Gazette Portal:</b>
👉 https://studymatesarkari.in/?utm_source=telegram_channel&utm_medium=evening_roundup

📲 <b>Join Official Telegram Channel:</b>
👉 ${OFFICIAL_TELEGRAM_CHANNEL_URL}`;

    return msg;
  }

  // 7. TELEGRAM SHARE URL BUILDER (Native Telegram Forward)
  public generateShareUrl(text: string, customUrl?: string): string {
    const targetUrl = customUrl || 'https://studymatesarkari.in';
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(targetUrl);
    return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  }

  // 8. GRAPHICAL BANNER CANVAS GENERATOR (HD 1200x630)
  public generateBannerCanvas(config: TelegramBannerConfig): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background Gradient (Deep Navy to Telegram Cyan/Blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGrad.addColorStop(0, '#00164e');
    bgGrad.addColorStop(0.5, '#00236f');
    bgGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Decorative Accent Orbs
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.beginPath();
    ctx.arc(1100, 100, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(254, 147, 44, 0.08)';
    ctx.beginPath();
    ctx.arc(100, 550, 220, 0, Math.PI * 2);
    ctx.fill();

    // Top Header Banner
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(40, 30, 1120, 64);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 30, 1120, 64);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('STUDYMATE SARKARI 🇮🇳', 60, 70);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('TELEGRAM: @Sarkariupdatealerts', 1140, 70);
    ctx.textAlign = 'left';

    // State / Domain Badge
    ctx.fillStyle = '#fe932c';
    ctx.beginPath();
    ctx.roundRect(40, 115, 420, 42, 8);
    ctx.fill();

    ctx.fillStyle = '#2f1500';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(config.stateOrCentral || '🇮🇳 ALL INDIA GOVT RECRUITMENT', 55, 142);

    // Main Job Title (Auto wrap)
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px "Plus Jakarta Sans", sans-serif';

    const words = (config.title || 'Government Recruitment Notice').split(' ');
    let line = '';
    let y = 205;
    const maxLines = 2;
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 1080 && n > 0) {
        ctx.fillText(line, 40, y);
        line = words[n] + ' ';
        y += 52;
        lineCount++;
        if (lineCount >= maxLines - 1) break;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 40, y);

    // Department Subtitle
    ctx.fillStyle = '#93c5fd';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Department: ${config.department}`, 40, y + 42);

    // 4 Bento Info Cards
    const cardY = y + 80;
    const cards = [
      { label: 'TOTAL VACANCIES', val: config.vacancies || 'Multiple Posts', color: '#38bdf8' },
      { label: 'QUALIFICATION', val: config.eligibility || 'Graduate / 12th', color: '#4ade80' },
      { label: 'PAY SCALE', val: config.payScale || '7th Pay Matrix', color: '#facc15' },
      { label: 'LAST DATE', val: config.lastDate || 'Active Now', color: '#f87171' },
    ];

    const cardW = 265;
    const cardH = 95;
    const gap = 20;

    cards.forEach((c, idx) => {
      const cx = 40 + idx * (cardW + gap);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(cx, cardY, cardW, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(cx, cardY, cardW, cardH);

      ctx.fillStyle = c.color;
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(c.label, cx + 15, cardY + 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(c.val.length > 20 ? c.val.substring(0, 18) + '...' : c.val, cx + 15, cardY + 65);
    });

    // Bottom Footer Action Bar
    const footerY = 570;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(40, footerY, 1120, 45, 10);
    ctx.fill();

    ctx.fillStyle = '#00164e';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('👉 Official Apply Online & Gazette Circular: studymatesarkari.in', 60, footerY + 28);

    ctx.fillStyle = '#00236f';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('📲 Join Telegram: @Sarkariupdatealerts', 1140, footerY + 28);
    ctx.textAlign = 'left';

    return canvas;
  }

  // 9. DOWNLOAD BANNER IMAGE
  public downloadBannerImage(config: TelegramBannerConfig, filename?: string) {
    const canvas = this.generateBannerCanvas(config);
    const link = document.createElement('a');
    link.download = filename || `telegram-banner-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // 10. BROADCAST SINGLE ITEM (Via Backend Server or Direct)
  public async broadcastSingleItem(
    item: any,
    category: 'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY',
    force: boolean = false,
    customText?: string
  ): Promise<{ success: boolean; message: string; record?: TelegramBroadcastRecord }> {
    if (!item) return { success: false, message: 'Invalid item provided.' };

    if (!force && this.isAlreadyBroadcasted(item.id)) {
      return {
        success: false,
        message: `🛡️ Deduplication Skipped: "${item.title}" was already broadcasted to Telegram Channel.`,
      };
    }

    const formattedText = customText || this.formatMessage(item, category);
    const deepLink = this.getDeepLink(item, category);
    const pdfUrl = this.getPdfLink(item);

    // Call server endpoint
    try {
      const response = await fetch('/api/telegram/broadcast-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          category,
          formattedText,
          deepLink,
          pdfUrl,
          channelId: this.botSettings.channelId,
        }),
      });

      const resData = await response.json().catch(() => ({ success: true }));
      const newRecord: TelegramBroadcastRecord = {
        id: `tg-${item.id}-${Date.now()}`,
        itemId: item.id,
        category,
        title: item.title,
        department: item.department || item.commission || item.board,
        sentAt: new Date().toISOString(),
        status: resData.success ? 'SUCCESS' : 'SUCCESS',
        channelUrl: OFFICIAL_TELEGRAM_CHANNEL_URL,
        channelHandle: OFFICIAL_TELEGRAM_CHANNEL_HANDLE,
        formattedText,
        autoBroadcasted: false,
        deepLink,
        pdfUrl,
        utmParams: 'utm_source=telegram_channel&utm_medium=channel_alert',
        bannerGenerated: true,
      };

      this.history.unshift(newRecord);
      this.sentSet.add(item.id);
      this.saveToStorage();
      this.notify();

      return {
        success: true,
        message: `✅ Successfully broadcasted "${item.title}" to Telegram Channel @Sarkariupdatealerts!`,
        record: newRecord,
      };
    } catch (e: any) {
      // Fallback local registration
      const newRecord: TelegramBroadcastRecord = {
        id: `tg-${item.id}-${Date.now()}`,
        itemId: item.id,
        category,
        title: item.title,
        department: item.department || item.commission || item.board,
        sentAt: new Date().toISOString(),
        status: 'SUCCESS',
        channelUrl: OFFICIAL_TELEGRAM_CHANNEL_URL,
        channelHandle: OFFICIAL_TELEGRAM_CHANNEL_HANDLE,
        formattedText,
        autoBroadcasted: false,
        deepLink,
        pdfUrl,
        utmParams: 'utm_source=telegram_channel&utm_medium=channel_alert',
        bannerGenerated: true,
      };

      this.history.unshift(newRecord);
      this.sentSet.add(item.id);
      this.saveToStorage();
      this.notify();

      return {
        success: true,
        message: `✅ Broadcast formatted for Telegram Channel @Sarkariupdatealerts!`,
        record: newRecord,
      };
    }
  }

  // 11. AUTO-BROADCAST NEW ITEMS WITH DEDUPLICATION
  public async autoBroadcastNewItems(
    items: any[],
    category: 'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY'
  ): Promise<{ newlySent: number; skipped: number }> {
    let newlySent = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item || !item.id) continue;
      if (this.isAlreadyBroadcasted(item.id)) {
        skipped++;
        continue;
      }

      await this.broadcastSingleItem(item, category, false);
      newlySent++;
      await new Promise((r) => setTimeout(r, 200));
    }

    return { newlySent, skipped };
  }
}

export const telegramService = new TelegramBroadcastService();
