// SarkariResult-Level Data Pipeline & Scraping Intelligence Engine
// Excludes #8 (Proxy Rotation & Mock Test Quiz) as requested by user

export interface ScrapedNoticeItem {
  id: string;
  examSlug: string;
  title: string;
  department: string;
  category: 'Job' | 'Admit Card' | 'Result' | 'Answer Key' | 'Syllabus';
  state: string;
  qualification: string;
  vacancies: string | number;
  applicationFee: {
    general_obc: string;
    sc_st_ph: string;
    female: string;
  };
  ageLimit: {
    min: string;
    max: string;
    relaxation: string;
  };
  importantDates: {
    startDate: string;
    lastDate: string;
    feeLastDate: string;
    examDate: string;
  };
  sourceUrl: string;
  sourcePortal: string;
  detectedAt: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'DISCARDED';
  confidenceScore: number;
}

// Initial realistic scraped notices awaiting 1-tap approval
export const initialScrapedQueue: ScrapedNoticeItem[] = [
  {
    id: 'scraped-ssc-gd-2026',
    examSlug: 'ssc-gd-constable-2026',
    title: 'SSC GD Constable (CAPFs, SSF & Assam Rifles) 2026 Recruitment',
    department: 'Staff Selection Commission (Central)',
    category: 'Job',
    state: 'All India',
    qualification: '10th (Matriculation) Pass from Recognized Board',
    vacancies: '26,146 Posts',
    applicationFee: { general_obc: '₹100', sc_st_ph: '₹0 (Exempted)', female: '₹0 (All Female)' },
    ageLimit: { min: '18 Years', max: '23 Years', relaxation: 'OBC: 3 Yrs, SC/ST: 5 Yrs' },
    importantDates: { startDate: '05-Sep-2026', lastDate: '14-Oct-2026', feeLastDate: '15-Oct-2026', examDate: 'Nov/Dec 2026' },
    sourceUrl: 'https://ssc.gov.in',
    sourcePortal: 'SSC Official Portal (Central)',
    detectedAt: 'Just now (Automated Pipeline)',
    status: 'PENDING_REVIEW',
    confidenceScore: 98,
  },
  {
    id: 'scraped-uppsc-pcs-2026',
    examSlug: 'uppsc-pcs-pre-2026',
    title: 'UPPSC Combined State / Upper Subordinate Services (PCS Pre) 2026',
    department: 'Uttar Pradesh Public Service Commission',
    category: 'Job',
    state: 'Uttar Pradesh',
    qualification: 'Bachelor Degree in any stream from recognized University',
    vacancies: '420 Posts',
    applicationFee: { general_obc: '₹125', sc_st_ph: '₹65', female: '₹25' },
    ageLimit: { min: '21 Years', max: '40 Years', relaxation: 'As per UPPSC Rules' },
    importantDates: { startDate: '01-Sep-2026', lastDate: '28-Sep-2026', feeLastDate: '28-Sep-2026', examDate: 'December 2026' },
    sourceUrl: 'https://uppsc.up.nic.in',
    sourcePortal: 'UPPSC Prayagraj',
    detectedAt: '24 mins ago (RSS Sitemap Hash)',
    status: 'PENDING_REVIEW',
    confidenceScore: 99,
  },
  {
    id: 'scraped-rrb-rpf-slip',
    examSlug: 'rrb-rpf-si-constable-2026',
    title: 'Railway RPF Sub-Inspector (SI) & Constable CBT Exam City Slip 2026',
    department: 'Railway Recruitment Control Board',
    category: 'Admit Card',
    state: 'All India',
    qualification: 'Registered Candidates for CEN RPF 01/2026',
    vacancies: '4,660 Posts',
    applicationFee: { general_obc: 'N/A', sc_st_ph: 'N/A', female: 'N/A' },
    ageLimit: { min: '20 Years', max: '28 Years', relaxation: 'N/A' },
    importantDates: { startDate: 'Released', lastDate: 'Active Till Exam', feeLastDate: 'N/A', examDate: '15-Oct-2026 Onwards' },
    sourceUrl: 'https://www.rrbapply.gov.in',
    sourcePortal: 'RRB Apply Central Server',
    detectedAt: '1 hour ago (DOM Hash Diffing)',
    status: 'PENDING_REVIEW',
    confidenceScore: 96,
  },
  {
    id: 'scraped-bpsc-70th-mains',
    examSlug: 'bpsc-70th-cce-2026',
    title: 'BPSC 70th Integrated Combined Competitive Examination Mains Online Form',
    department: 'Bihar Public Service Commission',
    category: 'Job',
    state: 'Bihar',
    qualification: 'Prelims Qualified Candidates (Degree Holder)',
    vacancies: '2,045 Posts',
    applicationFee: { general_obc: '₹750', sc_st_ph: '₹200', female: '₹200 (Bihar Domicile)' },
    ageLimit: { min: '20-22 Years', max: '37-40 Years', relaxation: 'As per Bihar Govt rules' },
    importantDates: { startDate: '10-Sep-2026', lastDate: '05-Oct-2026', feeLastDate: '05-Oct-2026', examDate: 'November 2026' },
    sourceUrl: 'https://bpsc.bih.nic.in',
    sourcePortal: 'BPSC Official Portal',
    detectedAt: '3 hours ago (Employment News Weekly)',
    status: 'PENDING_REVIEW',
    confidenceScore: 97,
  },
];

// 1. Official Government Recruiting Bodies Master Roster
export const officialSourcesRoster = [
  // Tier-1 Central
  {
    id: 'ssc-gov',
    name: 'Staff Selection Commission (SSC)',
    tier: 'Tier-1 Central',
    domain: 'ssc.gov.in',
    whatsNewEndpoint: 'https://ssc.gov.in/notices',
    sitemapRssUrl: 'https://ssc.gov.in/sitemap.xml',
    checkInterval: 'Every 5 Mins',
    lastScraped: '2 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 1420,
  },
  {
    id: 'upsc-gov',
    name: 'Union Public Service Commission (UPSC)',
    tier: 'Tier-1 Central',
    domain: 'upsc.gov.in',
    whatsNewEndpoint: 'https://upsc.gov.in/whats-new',
    sitemapRssUrl: 'https://upsc.gov.in/rss.xml',
    checkInterval: 'Every 5 Mins',
    lastScraped: '1 min ago',
    status: 'ONLINE',
    totalNoticesIndexed: 890,
  },
  {
    id: 'rrb-central',
    name: 'Railway Recruitment Control Board (All 21 RRBs)',
    tier: 'Railway Board',
    domain: 'rrbapply.gov.in',
    whatsNewEndpoint: 'https://www.rrbapply.gov.in/#/notices',
    sitemapRssUrl: 'https://www.rrbapply.gov.in/sitemap.xml',
    checkInterval: 'Every 3 Mins',
    lastScraped: 'Just now',
    status: 'ONLINE',
    totalNoticesIndexed: 2150,
  },
  {
    id: 'ibps-in',
    name: 'Institute of Banking Personnel Selection (IBPS)',
    tier: 'Tier-1 Central',
    domain: 'ibps.in',
    whatsNewEndpoint: 'https://www.ibps.in',
    sitemapRssUrl: 'https://www.ibps.in/rss-feed',
    checkInterval: 'Every 10 Mins',
    lastScraped: '7 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 630,
  },
  {
    id: 'nta-ac-in',
    name: 'National Testing Agency (NTA)',
    tier: 'Tier-1 Central',
    domain: 'nta.ac.in',
    whatsNewEndpoint: 'https://nta.ac.in/NoticeArchive',
    sitemapRssUrl: 'https://nta.ac.in/sitemap.xml',
    checkInterval: 'Every 10 Mins',
    lastScraped: '12 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 540,
  },
  // Key State Public Service Commissions
  {
    id: 'uppsc-up',
    name: 'Uttar Pradesh PSC (UPPSC)',
    tier: 'State PSC',
    domain: 'uppsc.up.nic.in',
    whatsNewEndpoint: 'https://uppsc.up.nic.in/AllNotices.aspx',
    sitemapRssUrl: 'https://uppsc.up.nic.in/rss.xml',
    checkInterval: 'Every 10 Mins',
    lastScraped: '4 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 780,
  },
  {
    id: 'upsssc-up',
    name: 'UP Subordinate Services (UPSSSC)',
    tier: 'State PSC',
    domain: 'upsssc.gov.in',
    whatsNewEndpoint: 'http://upsssc.gov.in/Default.aspx',
    sitemapRssUrl: 'http://upsssc.gov.in/sitemap.xml',
    checkInterval: 'Every 10 Mins',
    lastScraped: '9 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 620,
  },
  {
    id: 'bpsc-bih',
    name: 'Bihar Public Service Commission (BPSC)',
    tier: 'State PSC',
    domain: 'bpsc.bih.nic.in',
    whatsNewEndpoint: 'https://bpsc.bih.nic.in',
    sitemapRssUrl: 'https://bpsc.bih.nic.in/sitemap.xml',
    checkInterval: 'Every 10 Mins',
    lastScraped: '5 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 910,
  },
  {
    id: 'csbc-bih',
    name: 'Central Selection Board of Constable (CSBC Bihar)',
    tier: 'Police Recruitment',
    domain: 'csbc.bih.nic.in',
    whatsNewEndpoint: 'https://csbc.bih.nic.in',
    sitemapRssUrl: 'https://csbc.bih.nic.in/feed.xml',
    checkInterval: 'Every 15 Mins',
    lastScraped: '14 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 310,
  },
  {
    id: 'mppsc-mp',
    name: 'Madhya Pradesh PSC (MPPSC)',
    tier: 'State PSC',
    domain: 'mppsc.mp.gov.in',
    whatsNewEndpoint: 'https://mppsc.mp.gov.in/whats_new',
    sitemapRssUrl: 'https://mppsc.mp.gov.in/sitemap.xml',
    checkInterval: 'Every 15 Mins',
    lastScraped: '18 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 450,
  },
  {
    id: 'rpsc-raj',
    name: 'Rajasthan Public Service Commission (RPSC)',
    tier: 'State PSC',
    domain: 'rpsc.rajasthan.gov.in',
    whatsNewEndpoint: 'https://rpsc.rajasthan.gov.in/news',
    sitemapRssUrl: 'https://rpsc.rajasthan.gov.in/rss',
    checkInterval: 'Every 15 Mins',
    lastScraped: '11 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 820,
  },
  {
    id: 'hssc-hry',
    name: 'Haryana Staff Selection Commission (HSSC)',
    tier: 'State PSC',
    domain: 'hssc.gov.in',
    whatsNewEndpoint: 'https://www.hssc.gov.in/public-notices',
    sitemapRssUrl: 'https://www.hssc.gov.in/sitemap.xml',
    checkInterval: 'Every 15 Mins',
    lastScraped: '8 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 540,
  },
  {
    id: 'join-army',
    name: 'Join Indian Army (Agniveer & Officers)',
    tier: 'Defence',
    domain: 'joinindianarmy.nic.in',
    whatsNewEndpoint: 'https://joinindianarmy.nic.in',
    sitemapRssUrl: 'https://joinindianarmy.nic.in/feed',
    checkInterval: 'Every 20 Mins',
    lastScraped: '6 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 410,
  },
  {
    id: 'allahabad-hc',
    name: 'Allahabad High Court Recruitment Cell',
    tier: 'High Court',
    domain: 'allahabadhighcourt.in',
    whatsNewEndpoint: 'http://www.allahabadhighcourt.in/calendar/recruitment.html',
    sitemapRssUrl: 'http://www.allahabadhighcourt.in/sitemap.xml',
    checkInterval: 'Every 30 Mins',
    lastScraped: '19 mins ago',
    status: 'ONLINE',
    totalNoticesIndexed: 230,
  },
];

// 6. DOM Hash Watchers for official Results and Admit Card portals
export const initialDomWatchers = [
  {
    id: 'dom-ssc-res',
    portalName: 'SSC Official Results Notice Table',
    targetUrl: 'https://ssc.gov.in/results',
    targetSelector: 'table.result-notices-table tbody tr:first-child',
    lastHash: 'a8f4c2e89d0b3104e76a54',
    lastChecked: '2 mins ago',
    changeStatus: 'NO_CHANGE',
  },
  {
    id: 'dom-rrb-admit',
    portalName: 'RRB Apply Central Candidate Portal',
    targetUrl: 'https://www.rrbapply.gov.in/#/admit-card',
    targetSelector: 'div.candidate-call-letter-container',
    lastHash: '7c9e120fbd45a80193bb22',
    lastChecked: '4 mins ago',
    changeStatus: 'NEW_NOTICE_DETECTED',
    detectedDelta: 'New link added: CEN RPF 01/2026 CBT Exam City Slip',
  },
  {
    id: 'dom-uppsc-whatsnew',
    portalName: 'UPPSC Whats New Notice Marquee',
    targetUrl: 'https://uppsc.up.nic.in',
    targetSelector: '#divWhatsNewContent marquee a:first-child',
    lastHash: '18d9ef601bce430299ac87',
    lastChecked: '5 mins ago',
    changeStatus: 'NO_CHANGE',
  },
];

// Real-time Traffic Simulator Stats
export let currentTrafficStats = {
  activeRealTimeVisitors: 154,
  todayPageviews: 26840,
  yesterdayPageviews: 22410,
  totalSubscribers: {
    telegram: 48950,
    whatsapp: 36240,
    webPush: 62410,
  },
  topViewedVacancies: [
    { title: 'Railway RRB NTPC 2026 (11,558 Posts)', views: 9140, change: '+28%' },
    { title: 'SSC CGL 2026 Online Application', views: 6820, change: '+15%' },
    { title: 'UP Police Constable Result & Cutoff', views: 5410, change: '+34%' },
    { title: 'IBPS PO XV Online Form 2026', views: 3240, change: '+12%' },
  ],
  topVisitorStates: [
    { state: 'Uttar Pradesh', percentage: 38 },
    { state: 'Bihar', percentage: 25 },
    { state: 'Rajasthan', percentage: 14 },
    { state: 'Madhya Pradesh', percentage: 11 },
    { state: 'Delhi, Haryana & Other', percentage: 12 },
  ],
  serverUptimeHours: 356,
  apiSuccessRate: '99.98%',
};

// Simple rule-based PDF / Notification parser with Category-wise and Physical Standards Extraction
export function parseNotificationText(rawText: string) {
  const text = rawText || '';
  
  // Extract vacancies count
  const vacMatch = text.match(/(\d{1,3}(?:,\d{3})+|\d+)\s*(?:posts|vacancies|पद|seating)/i);
  const vacancies = vacMatch ? vacMatch[1] : 'Check Notification';

  // Extract dates
  const dateMatch = text.match(/(?:last date|apply online till|अंतिम तिथि|closing date)[:\s]*([0-9]{1,2}[-/.\s][A-Za-z0-9]+[-/.\s][0-9]{4})/i);
  const lastDate = dateMatch ? dateMatch[1] : 'Check Notification';

  // Extract fee
  const feeMatch = text.match(/(?:fee|application fee|शुल्क)[:\s]*(?:₹|rs\.?|inr)?\s*([0-9]+)/i);
  const generalFee = feeMatch ? `₹${feeMatch[1]}` : '₹100';

  // Extract age
  const ageMatch = text.match(/(?:age limit|आयु सीमा)[:\s]*([0-9]{2})\s*(?:to|-)\s*([0-9]{2})/i);
  const minAge = ageMatch ? `${ageMatch[1]} Years` : '18 Years';
  const maxAge = ageMatch ? `${ageMatch[2]} Years` : '27-30 Years';

  // Extract qualification
  let qual = '10th / 12th / Graduate';
  if (/graduate|bachelor|degree|स्नातक/i.test(text)) qual = 'Bachelor Degree in any stream';
  else if (/12th|intermediate|10\+2/i.test(text)) qual = '12th (Intermediate) Pass';
  else if (/10th|matric|हाईस्कूल/i.test(text)) qual = '10th (Matriculation) Pass';

  // Category-wise vacancy estimation
  const totalNum = parseInt(vacancies.replace(/[^0-9]/g, ''), 10) || 1000;
  const urSeats = Math.round(totalNum * 0.40);
  const obcSeats = Math.round(totalNum * 0.27);
  const ewsSeats = Math.round(totalNum * 0.10);
  const scSeats = Math.round(totalNum * 0.15);
  const stSeats = Math.max(1, totalNum - (urSeats + obcSeats + ewsSeats + scSeats));

  // Physical standards estimation (Police, Defence, Constable, SI)
  const isUniformPost = /constable|police|si|sub inspector|army|navy|air force|capf|crpf|bsf|cisf|rifle/i.test(text);
  const physicalStandards = isUniformPost
    ? {
        heightMale: '168 cms (160 cms for ST)',
        heightFemale: '152 cms (147 cms for ST)',
        chestMale: '79-84 cms (Min 5 cms expansion)',
        runningMale: '4.8 km in 25 minutes (or 1600m in 6:30 mins)',
        runningFemale: '2.4 km in 14 minutes (or 800m in 4:00 mins)',
      }
    : undefined;

  return {
    vacancies,
    lastDate,
    applicationFee: { general_obc: generalFee, sc_st_ph: '₹0', female: '₹0' },
    ageLimit: { min: minAge, max: maxAge, relaxation: 'OBC: +3 Yrs, SC/ST: +5 Yrs, PwD: +10 Yrs' },
    qualification: qual,
    categoryVacancies: {
      ur: urSeats,
      ews: ewsSeats,
      obc: obcSeats,
      sc: scSeats,
      st: stSeats,
      total: totalNum,
    },
    physicalStandards,
  };
}

// 7. Dynamic Peak-Hour Smart Polling Scheduler State
export let smartScheduleState = {
  isPeakHour: true,
  activeMode: 'PEAK' as 'PEAK' | 'OFF_PEAK',
  intervalSeconds: 120, // 2 minutes during peak hours
  nextRunInSeconds: 84,
  peakWindow: '09:00 AM - 07:00 PM IST',
  manualPeakOverride: false,
  activeSourcesCrawling: 8,
};

// 8. Official Result PDF Mirroring Registry (Anti-Crash CDN)
export const initialMirrorPdfs = [
  {
    id: 'mirror-ssc-cgl-2026',
    jobId: 'ssc-cgl-2026',
    title: 'SSC CGL 2026 Complete Notification & Vacancy Matrix PDF',
    sourceCommission: 'Staff Selection Commission (Govt of India)',
    fileSizeBytes: '4.2 MB',
    mirrorEndpoint: '/api/mirror-download?key=ssc-cgl-2026',
    originalUrl: 'https://ssc.gov.in/api/notices/cgl-2026.pdf',
    cdnStatus: 'CACHED_HOT' as const,
    cachedAt: '12 mins ago',
    downloadsServed: 14820,
    downloadSpeed: '58 MB/s (High-Speed Edge CDN)',
  },
  {
    id: 'mirror-rrb-ntpc-2026',
    jobId: 'rrb-ntpc-2026',
    title: 'RRB NTPC CEN 05/2026 Bilingual Detailed Advertisement & Syllabus PDF',
    sourceCommission: 'Ministry of Railways (Railway Recruitment Control Board)',
    fileSizeBytes: '6.8 MB',
    mirrorEndpoint: '/api/mirror-download?key=rrb-ntpc-2026',
    originalUrl: 'https://www.rrbapply.gov.in/notices/cen-05-2026.pdf',
    cdnStatus: 'CACHED_HOT' as const,
    cachedAt: '25 mins ago',
    downloadsServed: 28940,
    downloadSpeed: '64 MB/s (High-Speed Edge CDN)',
  },
  {
    id: 'mirror-up-police-si-2026',
    jobId: 'up-police-si-2026',
    title: 'UP Police SI Civil & Platoon Commander Official Rules & Physical Norms',
    sourceCommission: 'UP Police Recruitment & Promotion Board (UPPRPB)',
    fileSizeBytes: '2.9 MB',
    mirrorEndpoint: '/api/mirror-download?key=up-police-si-2026',
    originalUrl: 'https://uppbpb.gov.in/si_recruitment_rules.pdf',
    cdnStatus: 'MIRROR_READY' as const,
    cachedAt: '1 hour ago',
    downloadsServed: 9340,
    downloadSpeed: '45 MB/s (High-Speed Edge CDN)',
  },
  {
    id: 'mirror-ssc-gd-constable',
    jobId: 'ssc-gd-constable-2026',
    title: 'SSC GD Constable in CAPFs, SSF & Assam Rifles Official Brochure',
    sourceCommission: 'SSC Headquarters New Delhi',
    fileSizeBytes: '5.1 MB',
    mirrorEndpoint: '/api/mirror-download?key=ssc-gd-2026',
    originalUrl: 'https://ssc.gov.in/gd_constable_2026.pdf',
    cdnStatus: 'CACHED_HOT' as const,
    cachedAt: '35 mins ago',
    downloadsServed: 31200,
    downloadSpeed: '72 MB/s (High-Speed Edge CDN)',
  },
];

// 9. Employment News (रोजगार समाचार) Weekly Gazette Auto-Feed
export const initialEmploymentGazetteNotices = [
  {
    id: 'gazette-navy-tradesman-2026',
    editionDate: 'Upcoming Saturday Print Gazette (Vol. XLIX No. 24)',
    title: 'Indian Navy Civilian Entrance Test (INCET) - Tradesman Mate Recruitment 2026',
    department: 'Indian Navy, Ministry of Defence',
    category: 'Defence' as const,
    vacancies: '1,450 Posts',
    qualification: '10th Standard Pass + ITI Certificate in Relevant Trade',
    expectedPortalRelease: 'Online form expected in 3 days on joinindiannavy.gov.in',
    gazetteSnippet: 'Applications invited from eligible Indian citizens for the post of Tradesman Mate in Naval Dockyards (Mumbai, Visakhapatnam, Karwar & Port Blair). Pay Level-1 (₹18000-56900).',
    isAdvanceNotice: true,
    sourceIssueNo: 'Weekly Gazette Issue 24/2026',
  },
  {
    id: 'gazette-iaf-agniveer-2027',
    editionDate: 'Upcoming Saturday Print Gazette (Vol. XLIX No. 24)',
    title: 'Indian Air Force Agniveervayu (Intake 01/2027) Recruitment Notice',
    department: 'Indian Air Force, Ministry of Defence',
    category: 'Defence' as const,
    vacancies: '3,500 Posts (Male & Female)',
    qualification: '10+2 with Math, Physics & English with minimum 50% marks',
    expectedPortalRelease: 'Online registration begins on agnipathvayu.cdac.in next week',
    gazetteSnippet: 'Unmarried Indian male and female candidates are invited for selection test for Agniveervayu intake 01/2027. Age 17.5 to 21 years.',
    isAdvanceNotice: true,
    sourceIssueNo: 'Weekly Gazette Issue 24/2026',
  },
  {
    id: 'gazette-drdo-ceptam-11',
    editionDate: 'Upcoming Saturday Print Gazette (Vol. XLIX No. 24)',
    title: 'DRDO CEPTAM-11 Senior Technical Assistant-B (STA-B) & Technician-A',
    department: 'Defence Research & Development Organisation (DRDO)',
    category: 'Defence' as const,
    vacancies: '1,920 Posts',
    qualification: "B.Sc Degree or 3-Year Diploma in Engineering / Tech-A requires ITI",
    expectedPortalRelease: 'Online form will be hosted on drdo.gov.in within 48 hours',
    gazetteSnippet: 'Centre for Personnel Talent Management (CEPTAM) invites applications for recruitment to STA-B (Pay Level-6) and Tech-A (Pay Level-2) posts.',
    isAdvanceNotice: true,
    sourceIssueNo: 'Weekly Gazette Issue 24/2026',
  },
  {
    id: 'gazette-ordnance-factory-2026',
    editionDate: 'Upcoming Saturday Print Gazette (Vol. XLIX No. 24)',
    title: 'Yantra India / Munitions India Ordnance Factories Trade Apprentice Recruitment',
    department: 'Department of Defence Production, Ministry of Defence',
    category: 'Defence' as const,
    vacancies: '3,800 Posts',
    qualification: '10th (Matriculation) with minimum 50% marks + NCVT ITI',
    expectedPortalRelease: 'Portal link goes live on Monday at recruit-gov.com',
    gazetteSnippet: '58th Batch of Trade Apprentices for Non-ITI and ITI candidates in all Ordnance & Ordnance Equipment Factories located across India.',
    isAdvanceNotice: true,
    sourceIssueNo: 'Weekly Gazette Issue 24/2026',
  },
];
