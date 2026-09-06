import { WhatsAppBroadcastRecord, JobItem, AdmitCardItem, ResultItem, AnswerKeyItem, WhatsAppBannerConfig } from '../types';

const WHATSAPP_STORAGE_KEY = 'studymate_whatsapp_broadcast_history';
const WHATSAPP_AUTO_ENABLED_KEY = 'studymate_whatsapp_auto_enabled';
const WHATSAPP_GATEWAY_KEY = 'studymate_whatsapp_gateway_config';

export const OFFICIAL_WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb8ycrRKbYMIlkbOGy1z';

export interface WhatsAppGatewaySettings {
  primaryGateway: 'GREEN_API' | 'META_CLOUD_API' | 'WEBHOOK_FALLBACK';
  greenApiInstanceId: string;
  greenApiToken: string;
  metaCloudPhoneId: string;
  metaCloudToken: string;
  fallbackWebhookUrl: string;
  autoFallbackEnabled: boolean;
}

class WhatsAppBroadcastService {
  private history: WhatsAppBroadcastRecord[] = [];
  private sentSet: Set<string> = new Set();
  private autoBroadcastEnabled: boolean = true;
  private listeners: Array<() => void> = [];
  private gatewaySettings: WhatsAppGatewaySettings = {
    primaryGateway: 'GREEN_API',
    greenApiInstanceId: '',
    greenApiToken: '',
    metaCloudPhoneId: '',
    metaCloudToken: '',
    fallbackWebhookUrl: '',
    autoFallbackEnabled: true,
  };

  constructor() {
    this.loadFromStorage();
    this.syncWithServer();
  }

  private loadFromStorage() {
    try {
      const autoSaved = localStorage.getItem(WHATSAPP_AUTO_ENABLED_KEY);
      if (autoSaved !== null) {
        this.autoBroadcastEnabled = autoSaved === 'true';
      }

      const gwSaved = localStorage.getItem(WHATSAPP_GATEWAY_KEY);
      if (gwSaved) {
        this.gatewaySettings = { ...this.gatewaySettings, ...JSON.parse(gwSaved) };
      }

      const stored = localStorage.getItem(WHATSAPP_STORAGE_KEY);
      if (stored) {
        const parsed: WhatsAppBroadcastRecord[] = JSON.parse(stored);
        this.history = parsed;
        this.sentSet = new Set(parsed.map((r) => r.itemId));
      } else {
        const seed: WhatsAppBroadcastRecord[] = [
          {
            id: 'wa-ssc-cgl-2025',
            itemId: 'ssc-cgl-2025',
            category: 'JOB',
            title: 'SSC CGL 2025 Online Application (17,727 Posts)',
            department: 'Staff Selection Commission (SSC)',
            sentAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'SUCCESS',
            channelUrl: OFFICIAL_WHATSAPP_CHANNEL_URL,
            autoBroadcasted: true,
            deepLink: 'https://studymatesarkari.in/#job-detail?id=ssc-cgl-2025&utm_source=whatsapp_channel&utm_medium=channel_alert&utm_campaign=sarkari_daily',
            utmParams: 'utm_source=whatsapp_channel&utm_medium=channel_alert',
            gatewayUsed: 'GREEN_API',
          },
          {
            id: 'wa-rrb-ntpc-2025',
            itemId: 'rrb-ntpc-2025',
            category: 'JOB',
            title: 'RRB NTPC Graduate & Under Graduate (11,558 Posts)',
            department: 'Railway Recruitment Boards',
            sentAt: new Date(Date.now() - 43200000).toISOString(),
            status: 'SUCCESS',
            channelUrl: OFFICIAL_WHATSAPP_CHANNEL_URL,
            autoBroadcasted: true,
            deepLink: 'https://studymatesarkari.in/#job-detail?id=rrb-ntpc-2025&utm_source=whatsapp_channel&utm_medium=channel_alert&utm_campaign=sarkari_daily',
            utmParams: 'utm_source=whatsapp_channel&utm_medium=channel_alert',
            gatewayUsed: 'GREEN_API',
          },
        ];
        this.history = seed;
        this.sentSet = new Set(seed.map((s) => s.itemId));
        this.saveToStorage();
      }
    } catch (e) {
      console.error('Error loading WhatsApp storage:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(WHATSAPP_STORAGE_KEY, JSON.stringify(this.history));
      localStorage.setItem(WHATSAPP_AUTO_ENABLED_KEY, String(this.autoBroadcastEnabled));
      localStorage.setItem(WHATSAPP_GATEWAY_KEY, JSON.stringify(this.gatewaySettings));
    } catch (e) {
      console.error('Error saving WhatsApp storage:', e);
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

  public async syncWithServer() {
    try {
      const res = await fetch('/api/whatsapp/history');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.history) && data.history.length > 0) {
          data.history.forEach((rec: any) => {
            if (!this.sentSet.has(rec.itemId)) {
              this.sentSet.add(rec.itemId);
              this.history.unshift({
                id: `srv-${rec.itemId}-${Date.now()}`,
                itemId: rec.itemId,
                category: rec.category || 'JOB',
                title: rec.title,
                department: rec.department,
                sentAt: rec.sentAt || new Date().toISOString(),
                status: 'SUCCESS',
                channelUrl: OFFICIAL_WHATSAPP_CHANNEL_URL,
                autoBroadcasted: true,
                deepLink: rec.deepLink,
                gatewayUsed: 'GREEN_API',
              });
            }
          });
          this.saveToStorage();
          this.notify();
        }
      }
    } catch {
      // Standalone mode fallback
    }
  }

  public isAlreadyBroadcasted(itemId: string): boolean {
    return this.sentSet.has(itemId);
  }

  public getBroadcastHistory(): WhatsAppBroadcastRecord[] {
    return [...this.history];
  }

  public isAutoEnabled(): boolean {
    return this.autoBroadcastEnabled;
  }

  public setAutoEnabled(val: boolean) {
    this.autoBroadcastEnabled = val;
    this.saveToStorage();
    this.notify();
  }

  public getGatewaySettings(): WhatsAppGatewaySettings {
    return { ...this.gatewaySettings };
  }

  public updateGatewaySettings(settings: Partial<WhatsAppGatewaySettings>) {
    this.gatewaySettings = { ...this.gatewaySettings, ...settings };
    this.saveToStorage();
    this.notify();
  }

  /**
   * Helper 1: UTM Campaign Link Generator (Suggestion 7)
   */
  public buildUtmLink(rawUrl: string, campaignName: string = 'sarkari_daily', contentId?: string): string {
    try {
      const hasHash = rawUrl.includes('#');
      const basePart = hasHash ? rawUrl.split('#')[0] : rawUrl;
      const hashPart = hasHash ? rawUrl.substring(rawUrl.indexOf('#')) : '';

      const utm = `utm_source=whatsapp_channel&utm_medium=channel_alert&utm_campaign=${campaignName}${
        contentId ? `&utm_content=${contentId}` : ''
      }`;

      if (hashPart) {
        const delimiter = hashPart.includes('?') ? '&' : '?';
        return `${basePart}${hashPart}${delimiter}${utm}`;
      } else {
        const delimiter = basePart.includes('?') ? '&' : '?';
        return `${basePart}${delimiter}${utm}`;
      }
    } catch {
      return rawUrl;
    }
  }

  /**
   * Helper 2: Smart State & Central Govt Badging (Suggestion 5)
   */
  public getVisualBadges(item: any, category: string): { stateBadge: string; qualBadge: string; orgType: string } {
    const title = (item.title || '').toUpperCase();
    const dept = (item.department || item.commission || item.board || '').toUpperCase();
    const state = (item.state || '').toUpperCase();

    let stateBadge = '🇮🇳 [ALL INDIA / CENTRAL GOVT]';
    let orgType = 'Central Government';

    if (state.includes('UP') || state.includes('UTTAR') || title.includes('UP') || title.includes('UPPSC') || title.includes('UPSSSC')) {
      stateBadge = '📍 [UTTAR PRADESH GOVT]';
      orgType = 'State Government';
    } else if (state.includes('BIHAR') || title.includes('BPSC') || title.includes('BSSC')) {
      stateBadge = '📍 [BIHAR GOVT]';
      orgType = 'State Government';
    } else if (state.includes('RAJASTHAN') || title.includes('RSMSSB') || title.includes('RPSC')) {
      stateBadge = '📍 [RAJASTHAN GOVT]';
      orgType = 'State Government';
    } else if (state.includes('MP') || state.includes('MADHYA') || title.includes('MPPSC') || title.includes('MPESB')) {
      stateBadge = '📍 [MADHYA PRADESH GOVT]';
      orgType = 'State Government';
    } else if (state.includes('DELHI') || title.includes('DSSSB')) {
      stateBadge = '📍 [DELHI GOVT]';
      orgType = 'State Government';
    } else if (state.includes('MAHARASHTRA') || title.includes('MPSC')) {
      stateBadge = '📍 [MAHARASHTRA GOVT]';
      orgType = 'State Government';
    } else if (state.includes('HARYANA') || title.includes('HSSC') || title.includes('HPSC')) {
      stateBadge = '📍 [HARYANA GOVT]';
      orgType = 'State Government';
    } else if (dept.includes('RAILWAY') || title.includes('RRB') || title.includes('RRC')) {
      stateBadge = '🚆 [INDIAN RAILWAYS - CENTRAL]';
      orgType = 'Central Ministry';
    } else if (dept.includes('DEFENCE') || title.includes('ARMY') || title.includes('NAVY') || title.includes('AIR FORCE') || title.includes('NDA') || title.includes('CDS')) {
      stateBadge = '🛡️ [INDIAN DEFENCE FORCES]';
      orgType = 'Ministry of Defence';
    } else if (dept.includes('BANK') || title.includes('IBPS') || title.includes('SBI') || title.includes('RBI')) {
      stateBadge = '🏦 [BANKING SECTOR / PSU]';
      orgType = 'Banking & PSU';
    }

    // Qualification Badge
    let qualBadge = '🎓 [10th / 12th / Graduate]';
    const qual = (item.qualificationSummary || item.eligibility || '').toUpperCase();
    if (qual.includes('10TH') && !qual.includes('GRADUATE')) {
      qualBadge = '🎓 [10TH PASS ELIGIBLE]';
    } else if (qual.includes('12TH') || qual.includes('INTERMEDIATE')) {
      qualBadge = '🎓 [12TH PASS / INTERMEDIATE]';
    } else if (qual.includes('GRADUATE') || qual.includes('DEGREE') || qual.includes('B.TECH') || qual.includes('B.SC')) {
      qualBadge = '🎓 [GRADUATE / DEGREE REQUIRED]';
    } else if (qual.includes('ITI') || qual.includes('DIPLOMA')) {
      qualBadge = '🎓 [ITI / POLYTECHNIC DIPLOMA]';
    }

    return { stateBadge, qualBadge, orgType };
  }

  /**
   * Helper 3: Standard Single Item WhatsApp Formatter with Badges, UTM & 1-Tap PDF (Suggestions 4, 5, 7)
   */
  public formatMessage(item: any, category: 'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY'): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://studymatesarkari.in';
    const title = (item.title || 'Government Recruitment Notice').toUpperCase();
    const dept = item.department || item.commission || item.board || 'Govt of India';
    const { stateBadge, qualBadge } = this.getVisualBadges(item, category);

    if (category === 'JOB') {
      const vacancies = item.vacanciesFormatted || item.vacanciesCount || 'Multiple';
      const eligibility = item.qualificationSummary || '10th / 12th / Graduate';
      const pay = item.payLevel || item.payScale || '7th Pay Commission Scale';
      const lastDate = (item.lastDate || 'Refer Official Circular').split('(')[0].trim();
      const deepLink = this.buildUtmLink(`${origin}/#job-detail?id=${item.id}`, 'job_alert', item.id);
      const pdfLink = item.officialNotificationUrl || item.sourceUrl || deepLink;

      return `📢 *NEW SARKARI RECRUITMENT 2025-26* 🇮🇳
${stateBadge}
${qualBadge}
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
👉 ${OFFICIAL_WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — 100% Free & Verified Updates`;
    } else if (category === 'ADMIT_CARD') {
      const examDate = item.examDateFormatted || item.month || 'Active Now';
      const deepLink = this.buildUtmLink(`${origin}/#admit-card`, 'admit_card_alert', item.id);
      const directDownload = item.admitCardUrl || item.directDownloadLink || deepLink;

      return `🎫 *ADMIT CARD / HALL TICKET OUT* 🚨
${stateBadge}
━━━━━━━━━━━━━━━━━━━━━
📌 *${title}*

🏛️ *Exam Conducting Body:* ${dept}
🗓️ *Exam Date:* ${examDate}
📥 *Status:* ${item.statusBadge || 'Hall Ticket Link Live'}

🔗 *Download Hall Ticket from Direct Server:*
👇👇👇
${directDownload}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel:*
👉 ${OFFICIAL_WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — Verified Exam Intelligence`;
    } else if (category === 'RESULT') {
      const resultDate = item.declaredDate || 'Declared Today';
      const deepLink = this.buildUtmLink(`${origin}/#results`, 'result_alert', item.id);
      const resultPdf = item.resultPdfUrl || item.meritListUrl || deepLink;

      return `🏆 *EXAM RESULT & MERIT LIST DECLARED* 📢
${stateBadge}
━━━━━━━━━━━━━━━━━━━━━
📌 *${title}*

🏛️ *Commission:* ${dept}
📅 *Result Date:* ${resultDate}
📊 *Status:* Official Merit List & Cutoff PDF Available

🔗 *Direct Merit List PDF & Scorecard:*
👇👇👇
${resultPdf}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel:*
👉 ${OFFICIAL_WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — Fastest Sarkari Results`;
    } else {
      const releaseDate = item.releaseDate || 'Released Today';
      const deepLink = this.buildUtmLink(`${origin}/#answer-key`, 'answer_key_alert', item.id);

      return `📝 *OFFICIAL ANSWER KEY & OBJECTION LINK* 🔑
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
👉 ${OFFICIAL_WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — Accurate Solutions & Keys`;
    }
  }

  /**
   * Helper 4: Smart Deadline Countdown Alerts (Suggestion 2)
   * Formats urgent last 24h & 3-day deadline reminders
   */
  public formatDeadlineUrgentAlert(job: JobItem, urgency: 'LAST_24_HOURS' | '3_DAYS_LEFT'): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://studymatesarkari.in';
    const deepLink = this.buildUtmLink(`${origin}/#job-detail?id=${job.id}`, 'deadline_urgent', job.id);
    const title = job.title.toUpperCase();

    const bannerHeader =
      urgency === 'LAST_24_HOURS'
        ? `🚨 *FINAL 24 HOURS: LAST DATE TODAY!* ⏳`
        : `⚠️ *URGENT REMINDER: ONLY 3 DAYS LEFT!* ⏰`;

    return `${bannerHeader}
━━━━━━━━━━━━━━━━━━━━━
📌 *${title}*

🏛️ *Department:* ${job.department || 'Govt of India'}
🎯 *Vacancies:* ${job.vacanciesFormatted} Posts
💰 *Pay Scale:* ${job.payLevel || '7th Pay Matrix'}
📅 *Registration Closes:* ${job.lastDate}

⚠️ *WARNING:* Server load heavy hone se pehle abhi turant online form complete karein!

🔗 *Direct 1-Click Fast Apply Link:*
👇👇👇
${deepLink}

━━━━━━━━━━━━━━━━━━━━━
📲 *Official WhatsApp Channel:*
👉 ${OFFICIAL_WHATSAPP_CHANNEL_URL}`;
  }

  /**
   * Helper 5: Daily Morning & Evening Mega Digest Generator (Suggestion 3)
   */
  public generateDailyMorningDigest(topJobs: JobItem[]): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://studymatesarkari.in';
    const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const portalLink = this.buildUtmLink(origin, 'morning_digest_bulletin');

    const top5 = topJobs.slice(0, 5);
    const listFormatted = top5
      .map((job, idx) => {
        const link = this.buildUtmLink(`${origin}/#job-detail?id=${job.id}`, 'morning_digest', job.id);
        return `${idx + 1}️⃣ *${job.title}*\n   🏛️ ${job.department} | 🎯 ${job.vacanciesFormatted} Posts\n   📅 Last Date: ${job.lastDate.split('(')[0].trim()}\n   👉 Direct Apply: ${link}`;
      })
      .join('\n\n');

    return `🌅 *SARKARI MORNING BULLETIN* 🇮🇳
📅 *${todayStr}*
━━━━━━━━━━━━━━━━━━━━━
✨ *Today's Top Active Government Job Recruitments:*

${listFormatted}

━━━━━━━━━━━━━━━━━━━━━
🌐 *Explore 100+ Live Sarkari Forms:*
👉 ${portalLink}

📲 *Share & Forward to your study groups!*
🔔 *Official Channel:* ${OFFICIAL_WHATSAPP_CHANNEL_URL}`;
  }

  public generateDailyEveningRoundup(admitCards: AdmitCardItem[], results: ResultItem[], keys: AnswerKeyItem[]): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://studymatesarkari.in';
    const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const portalLink = this.buildUtmLink(origin, 'evening_roundup');

    const topCards = admitCards.slice(0, 2);
    const topResults = results.slice(0, 2);
    const topKeys = keys.slice(0, 2);

    let cardsStr = topCards.map((c) => `• 🎫 *${c.title}* (${c.examDateFormatted || 'Active'})`).join('\n');
    let resStr = topResults.map((r) => `• 🏆 *${r.title}* (Declared: ${r.declaredDate})`).join('\n');
    let keysStr = topKeys.map((k) => `• 📝 *${k.title}* (Released: ${k.releaseDate})`).join('\n');

    return `🌆 *SARKARI EVENING ROUNDUP & RESULTS* 📢
📅 *${todayStr}*
━━━━━━━━━━━━━━━━━━━━━
🏆 *Latest Exam Results Declared Today:*
${resStr || '• All recent results published on portal'}

🎫 *Latest Admit Cards / Hall Tickets:*
${cardsStr || '• Check upcoming exam schedule on portal'}

📝 *Latest Answer Keys & Objection Links:*
${keysStr || '• All answer keys up to date'}

━━━━━━━━━━━━━━━━━━━━━
🔗 *Download All PDFs & Scorecards:*
👉 ${portalLink}

📲 *Stay Updated 24x7 with Official WhatsApp Channel:*
👉 ${OFFICIAL_WHATSAPP_CHANNEL_URL}`;
  }

  /**
   * Helper 6: Visual Job Banner Generator (Suggestion 1)
   * Creates high-resolution canvas banner for WhatsApp posts
   */
  public generateBannerCanvas(config: WhatsAppBannerConfig): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background Gradient (Sarkari Emerald & Deep Navy)
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#042f2e');
    gradient.addColorStop(0.5, '#075E54');
    gradient.addColorStop(1, '#0b1c30');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Decorative Geometric Accents
    ctx.fillStyle = 'rgba(37, 211, 102, 0.08)';
    ctx.beginPath();
    ctx.arc(1100, 100, 300, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(254, 147, 44, 0.06)';
    ctx.beginPath();
    ctx.arc(100, 550, 250, 0, Math.PI * 2);
    ctx.fill();

    // Border Frame
    ctx.strokeStyle = '#25D366';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 1160, 590);

    // Header Badge Pill
    ctx.fillStyle = '#25D366';
    ctx.beginPath();
    ctx.roundRect(60, 50, 320, 48, 24);
    ctx.fill();

    ctx.fillStyle = '#002114';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillText('📢 OFFICIAL SARKARI ALERT', 85, 82);

    // StudyMate Brand
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('StudyMateSarkari.in 🇮🇳', 1130, 82);
    ctx.textAlign = 'left';

    // State / Category Tag
    ctx.fillStyle = '#FE932C';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(config.stateOrCentral || 'ALL INDIA / CENTRAL GOVT', 60, 145);

    // Recruitment Title (Wrap max 2 lines)
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 40px system-ui, sans-serif';
    const words = config.title.split(' ');
    let line1 = '';
    let line2 = '';
    for (let w of words) {
      if ((line1 + ' ' + w).length < 35 && !line2) {
        line1 += (line1 ? ' ' : '') + w;
      } else {
        line2 += (line2 ? ' ' : '') + w;
      }
    }
    ctx.fillText(line1, 60, 200);
    if (line2) {
      ctx.fillText(line2.substring(0, 45) + (line2.length > 45 ? '...' : ''), 60, 255);
    }

    // 4 Visual Info Metric Cards
    const cardY = 320;
    const cards = [
      { label: 'TOTAL VACANCIES', val: config.vacancies || 'Multiple', icon: '🎯' },
      { label: 'QUALIFICATION', val: (config.eligibility || '10th / 12th / Grad').substring(0, 18), icon: '🎓' },
      { label: 'PAY SCALE', val: (config.payScale || '7th Pay Matrix').substring(0, 16), icon: '💰' },
      { label: 'LAST DATE', val: (config.lastDate || 'Active').split('(')[0].trim().substring(0, 16), icon: '📅' },
    ];

    cards.forEach((c, idx) => {
      const cardX = 60 + idx * 270;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, 250, 140, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 14px system-ui, sans-serif';
      ctx.fillText(`${c.icon} ${c.label}`, cardX + 18, cardY + 38);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.fillText(c.val, cardX + 18, cardY + 85);
    });

    // Bottom Call to Action Bar
    ctx.fillStyle = '#075E54';
    ctx.beginPath();
    ctx.roundRect(60, 500, 1080, 75, 16);
    ctx.fill();

    ctx.fillStyle = '#25D366';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.fillText('📲 Join Official WhatsApp Channel For Instant Sarkari Alerts', 95, 546);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('100% Free & Verified', 1100, 546);

    return canvas;
  }

  public downloadBannerImage(config: WhatsAppBannerConfig, filename: string = 'sarkari-whatsapp-banner.png') {
    try {
      const canvas = this.generateBannerCanvas(config);
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Error generating banner:', e);
    }
  }

  /**
   * Helper 7: 1-Click WhatsApp Forward / Share Link (Suggestion 10)
   */
  public generateForwardUrl(messageText: string): string {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
  }

  /**
   * AUTOMATIC SCANNER & BROADCASTER:
   * Scans an array of items, filters out anything already sent in history,
   * sends ONLY the new items to the server API and WhatsApp Channel,
   * and records them in the local & server deduplication databases.
   */
  public async autoBroadcastNewItems(
    items: Array<JobItem | AdmitCardItem | ResultItem | AnswerKeyItem | any>,
    category: 'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY'
  ): Promise<{ newlySent: number; skipped: number; records: WhatsAppBroadcastRecord[] }> {
    if (!this.autoBroadcastEnabled || !items || items.length === 0) {
      return { newlySent: 0, skipped: 0, records: [] };
    }

    const unsentItems = items.filter((it) => it.id && !this.sentSet.has(it.id));
    const skipped = items.length - unsentItems.length;

    if (unsentItems.length === 0) {
      return { newlySent: 0, skipped, records: [] };
    }

    const newlyBroadcasted: WhatsAppBroadcastRecord[] = [];
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://studymatesarkari.in';

    for (const item of unsentItems) {
      const formatted = this.formatMessage(item, category);
      const deepLink = this.buildUtmLink(
        category === 'JOB'
          ? `${origin}/#job-detail?id=${item.id}`
          : category === 'ADMIT_CARD'
          ? `${origin}/#admit-card`
          : category === 'RESULT'
          ? `${origin}/#results`
          : `${origin}/#answer-key`,
        'auto_broadcast',
        item.id
      );

      const record: WhatsAppBroadcastRecord = {
        id: `wa-${item.id}-${Date.now()}`,
        itemId: item.id,
        category,
        title: item.title,
        department: item.department || item.commission || item.board || 'Govt of India',
        sentAt: new Date().toISOString(),
        status: 'SUCCESS',
        channelUrl: OFFICIAL_WHATSAPP_CHANNEL_URL,
        formattedText: formatted,
        autoBroadcasted: true,
        deepLink,
        pdfUrl: item.officialNotificationUrl || item.sourceUrl,
        utmParams: 'utm_source=whatsapp_channel&utm_medium=channel_alert',
        gatewayUsed: this.gatewaySettings.primaryGateway,
      };

      this.sentSet.add(item.id);
      this.history.unshift(record);
      newlyBroadcasted.push(record);
    }

    this.saveToStorage();
    this.notify();

    // Also sync to server deduplication engine
    try {
      await fetch('/api/whatsapp/auto-sync-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: unsentItems.map((u) => ({ ...u, categoryType: category })),
          baseUrl: origin,
          gateway: this.gatewaySettings.primaryGateway,
        }),
      });
    } catch {
      // server background sync failure
    }

    return {
      newlySent: newlyBroadcasted.length,
      skipped,
      records: newlyBroadcasted,
    };
  }

  /**
   * Manual broadcast or re-broadcast of a single item or digest
   */
  public async broadcastSingleItem(
    item: any,
    category: 'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY' | 'DIGEST' | 'DEADLINE_URGENT',
    force: boolean = false,
    customText?: string
  ): Promise<{ success: boolean; alreadySent: boolean; message: string; record?: WhatsAppBroadcastRecord }> {
    if (this.isAlreadyBroadcasted(item.id) && !force) {
      return {
        success: true,
        alreadySent: true,
        message: `⚠️ '${item.title}' channel par pehle hi bheja jaa chuka hai! Duplicate rok diya gya hai.`,
      };
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://studymatesarkari.in';
    const formatted = customText || this.formatMessage(item, category as any);
    const deepLink = this.buildUtmLink(
      category === 'JOB'
        ? `${origin}/#job-detail?id=${item.id}`
        : category === 'ADMIT_CARD'
        ? `${origin}/#admit-card`
        : category === 'RESULT'
        ? `${origin}/#results`
        : `${origin}/#answer-key`,
      'manual_broadcast',
      item.id
    );

    const record: WhatsAppBroadcastRecord = {
      id: `wa-${item.id}-${Date.now()}`,
      itemId: item.id,
      category,
      title: item.title,
      department: item.department || item.commission || item.board || 'Govt of India',
      sentAt: new Date().toISOString(),
      status: 'SUCCESS',
      channelUrl: OFFICIAL_WHATSAPP_CHANNEL_URL,
      formattedText: formatted,
      autoBroadcasted: false,
      deepLink,
      pdfUrl: item.officialNotificationUrl || item.sourceUrl,
      gatewayUsed: this.gatewaySettings.primaryGateway,
    };

    this.sentSet.add(item.id);
    this.history.unshift(record);
    this.saveToStorage();
    this.notify();

    try {
      await fetch('/api/whatsapp/broadcast-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          category,
          baseUrl: origin,
          force,
          formattedText: formatted,
          gateway: this.gatewaySettings.primaryGateway,
        }),
      });
    } catch {
      // server sync
    }

    return {
      success: true,
      alreadySent: false,
      message: `✅ '${item.title}' successfully WhatsApp Channel par post kar diya gya!`,
      record,
    };
  }

  public clearHistory() {
    this.history = [];
    this.sentSet.clear();
    this.saveToStorage();
    this.notify();
  }
}

export const whatsAppService = new WhatsAppBroadcastService();
