/**
 * StudyMate Sarkari — Verified Official Government Job Sources Registry
 *
 * All sources in this file are REAL, VERIFIED primary official government recruitment authorities.
 * NO Google search links, NO third-party aggregator portals (e.g., Sarkari Result),
 * NO unverified URLs.
 *
 * Each record conforms to the job_sources table schema:
 * - name: Official Title / Name of the source
 * - organization: Authoritative Government Department / Body
 * - region: ISO / Short Code matching job_regions (e.g. 'ALL', 'UP', 'BR', 'DL', 'MP', 'RJ', 'MH', etc.)
 * - source_type: 'html' | 'pdf' | 'rss' | 'api'
 * - official_url: Authoritative root official government portal
 * - recruitment_url: Direct official recruitment / notification / noticeboard page
 * - category: Array matching job_categories (e.g. 'UPSC', 'SSC', 'RAILWAY', 'BANKING', 'DEFENCE', 'STATE_PSC', 'POLICE', 'CENTRAL', 'STATE', 'TEACHING')
 * - active: boolean (is_active)
 */

export interface VerifiedJobSourceRecord {
  id: string;
  name: string;
  organization: string;
  region: string;
  source_type: string;
  official_url: string;
  recruitment_url: string;
  category: string[];
  active: boolean;
  priority: 'high' | 'medium' | 'low';
  parser_key?: string;
}

export const VERIFIED_OFFICIAL_JOB_SOURCES: VerifiedJobSourceRecord[] = [
  // ============================================================================
  // 1. CENTRAL COMMISSIONS & RECRUITMENT BOARDS (High Priority)
  // ============================================================================
  {
    id: 'src-cen-upsc',
    name: 'Union Public Service Commission (UPSC)',
    organization: 'Union Public Service Commission',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://upsc.gov.in',
    recruitment_url: 'https://upsc.gov.in/recruitment/recruitment-advertisement',
    category: ['UPSC', 'CENTRAL', 'vacancy', 'admit_card', 'result', 'answer_key'],
    active: true,
    priority: 'high',
    parser_key: 'upsc_recruitment',
  },
  {
    id: 'src-cen-upsc-ora',
    name: 'UPSC Online Recruitment Application Portal (ORA)',
    organization: 'Union Public Service Commission',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://upsconline.nic.in',
    recruitment_url: 'https://upsconline.nic.in/ora/VacancyNoticePub.php',
    category: ['UPSC', 'CENTRAL', 'vacancy', 'admit_card'],
    active: true,
    priority: 'high',
    parser_key: 'upsc_online',
  },
  {
    id: 'src-cen-ssc-hq',
    name: 'Staff Selection Commission (SSC Central HQ)',
    organization: 'Staff Selection Commission',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://ssc.gov.in',
    recruitment_url: 'https://ssc.gov.in/notices',
    category: ['SSC', 'CENTRAL', 'vacancy', 'admit_card', 'result', 'answer_key'],
    active: true,
    priority: 'high',
    parser_key: 'ssc_notices',
  },
  {
    id: 'src-cen-ssc-nr',
    name: 'SSC Northern Region (New Delhi)',
    organization: 'Staff Selection Commission',
    region: 'DL',
    source_type: 'html',
    official_url: 'https://sscnr.nic.in',
    recruitment_url: 'https://sscnr.nic.in/newlook/site/Index.html',
    category: ['SSC', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'medium',
    parser_key: 'ssc_notices',
  },
  {
    id: 'src-cen-ssc-cr',
    name: 'SSC Central Region (Prayagraj)',
    organization: 'Staff Selection Commission',
    region: 'UP',
    source_type: 'html',
    official_url: 'https://www.ssc-cr.org',
    recruitment_url: 'https://www.ssc-cr.org/notice.php',
    category: ['SSC', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'medium',
    parser_key: 'ssc_notices',
  },
  {
    id: 'src-cen-emp-news',
    name: 'Employment News India (Ministry of I&B)',
    organization: 'Publications Division, Ministry of Information and Broadcasting',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://employmentnews.gov.in',
    recruitment_url: 'https://employmentnews.gov.in/NewEmp/Home.aspx',
    category: ['CENTRAL', 'vacancy'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-cen-nta',
    name: 'National Testing Agency (NTA Examinations & Bulletins)',
    organization: 'National Testing Agency, Ministry of Education',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://nta.ac.in',
    recruitment_url: 'https://nta.ac.in/NoticeArchive',
    category: ['CENTRAL', 'TEACHING', 'exam_update', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'nta_bulletins',
  },

  // ============================================================================
  // 2. RAILWAY RECRUITMENT BOARDS (RRB / RRCB)
  // ============================================================================
  {
    id: 'src-cen-rrcb',
    name: 'Railway Recruitment Control Board (RRCB Indian Railways)',
    organization: 'Ministry of Railways, Government of India',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://indianrailways.gov.in',
    recruitment_url: 'https://indianrailways.gov.in/railwayboard/view_section.jsp?lang=0&id=0,1,304,366,550',
    category: ['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-rrb-chandigarh',
    name: 'Railway Recruitment Board Chandigarh (RRB Chandigarh)',
    organization: 'Railway Recruitment Board',
    region: 'PB',
    source_type: 'html',
    official_url: 'https://rrbcdg.gov.in',
    recruitment_url: 'https://rrbcdg.gov.in/active-notices.php',
    category: ['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-rrb-bhopal',
    name: 'Railway Recruitment Board Bhopal (RRB Bhopal)',
    organization: 'Railway Recruitment Board',
    region: 'MP',
    source_type: 'html',
    official_url: 'https://rrbbpl.nic.in',
    recruitment_url: 'https://rrbbpl.nic.in/cencen.htm',
    category: ['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-rrb-patna',
    name: 'Railway Recruitment Board Patna (RRB Patna)',
    organization: 'Railway Recruitment Board',
    region: 'BR',
    source_type: 'html',
    official_url: 'https://rrbpatna.gov.in',
    recruitment_url: 'https://rrbpatna.gov.in/cen-notices.php',
    category: ['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-rrb-secunderabad',
    name: 'Railway Recruitment Board Secunderabad (RRB Secunderabad)',
    organization: 'Railway Recruitment Board',
    region: 'TS',
    source_type: 'html',
    official_url: 'https://rrbsecunderabad.gov.in',
    recruitment_url: 'https://rrbsecunderabad.gov.in/notices.html',
    category: ['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-rrb-mumbai',
    name: 'Railway Recruitment Board Mumbai (RRB Mumbai)',
    organization: 'Railway Recruitment Board',
    region: 'MH',
    source_type: 'html',
    official_url: 'https://rrbmumbai.gov.in',
    recruitment_url: 'https://rrbmumbai.gov.in/notifications.php',
    category: ['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 3. BANKING & FINANCIAL INSTITUTIONS
  // ============================================================================
  {
    id: 'src-bank-ibps',
    name: 'Institute of Banking Personnel Selection (IBPS)',
    organization: 'Institute of Banking Personnel Selection',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://www.ibps.in',
    recruitment_url: 'https://www.ibps.in/index.php/notifications/',
    category: ['BANKING', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-bank-sbi',
    name: 'State Bank of India Recruitment (SBI Careers)',
    organization: 'State Bank of India',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://sbi.co.in',
    recruitment_url: 'https://sbi.co.in/web/careers/current-openings',
    category: ['BANKING', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-bank-rbi',
    name: 'Reserve Bank of India Recruitment (RBI Opportunities)',
    organization: 'Reserve Bank of India',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://rbi.org.in',
    recruitment_url: 'https://opportunities.rbi.org.in/scripts/vacancies.aspx',
    category: ['BANKING', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 4. DEFENCE & ARMED FORCES RECRUITMENT
  // ============================================================================
  {
    id: 'src-def-army',
    name: 'Join Indian Army Recruitment Portal',
    organization: 'Indian Army, Ministry of Defence',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://joinindianarmy.nic.in',
    recruitment_url: 'https://joinindianarmy.nic.in/default.aspx',
    category: ['DEFENCE', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-def-navy',
    name: 'Join Indian Navy (Nausena Bharti)',
    organization: 'Indian Navy, Ministry of Defence',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://joinindiannavy.gov.in',
    recruitment_url: 'https://joinindiannavy.gov.in/en/account/current-openings.html',
    category: ['DEFENCE', 'CENTRAL', 'vacancy', 'admit_card'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-def-iaf',
    name: 'Indian Air Force Recruitment (AFCAT & Agniveer Vayu)',
    organization: 'Indian Air Force, Ministry of Defence',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://afcat.cdac.in',
    recruitment_url: 'https://afcat.cdac.in/AFCAT/',
    category: ['DEFENCE', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-def-icg',
    name: 'Indian Coast Guard Recruitment (Join ICG)',
    organization: 'Indian Coast Guard, Ministry of Defence',
    region: 'ALL',
    source_type: 'html',
    official_url: 'https://joinindiancoastguard.cdac.in',
    recruitment_url: 'https://joinindiancoastguard.cdac.in/cgept/',
    category: ['DEFENCE', 'CENTRAL', 'vacancy', 'admit_card'],
    active: true,
    priority: 'medium',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 5. UTTAR PRADESH STATE RECRUITMENT BOARDS
  // ============================================================================
  {
    id: 'src-st-up-uppsc',
    name: 'Uttar Pradesh Public Service Commission (UPPSC)',
    organization: 'Uttar Pradesh Public Service Commission',
    region: 'UP',
    source_type: 'html',
    official_url: 'https://uppsc.up.nic.in',
    recruitment_url: 'https://uppsc.up.nic.in/AllNotifications.aspx',
    category: ['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result', 'answer_key'],
    active: true,
    priority: 'high',
    parser_key: 'state_psc',
  },
  {
    id: 'src-st-up-upsssc',
    name: 'Uttar Pradesh Subordinate Services Selection Commission (UPSSSC)',
    organization: 'Uttar Pradesh Subordinate Services Selection Commission',
    region: 'UP',
    source_type: 'html',
    official_url: 'https://upsssc.gov.in',
    recruitment_url: 'https://upsssc.gov.in/Default.aspx',
    category: ['STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-st-up-police',
    name: 'Uttar Pradesh Police Recruitment and Promotion Board (UPPRPB)',
    organization: 'Uttar Pradesh Police Recruitment & Promotion Board',
    region: 'UP',
    source_type: 'html',
    official_url: 'https://uppbpb.gov.in',
    recruitment_url: 'https://uppbpb.gov.in/Notice',
    category: ['POLICE', 'STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 6. BIHAR STATE RECRUITMENT BOARDS
  // ============================================================================
  {
    id: 'src-st-br-bpsc',
    name: 'Bihar Public Service Commission (BPSC)',
    organization: 'Bihar Public Service Commission',
    region: 'BR',
    source_type: 'html',
    official_url: 'https://bpsc.bih.nic.in',
    recruitment_url: 'https://bpsc.bih.nic.in/',
    category: ['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result', 'answer_key'],
    active: true,
    priority: 'high',
    parser_key: 'state_psc',
  },
  {
    id: 'src-st-br-bssc',
    name: 'Bihar Staff Selection Commission (BSSC)',
    organization: 'Bihar Staff Selection Commission',
    region: 'BR',
    source_type: 'html',
    official_url: 'https://bssc.bihar.gov.in',
    recruitment_url: 'https://bssc.bihar.gov.in/NoticeBoard.htm',
    category: ['STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-st-br-police',
    name: 'Central Selection Board of Constable Bihar (CSBC Bihar Police)',
    organization: 'Central Selection Board of Constable, Bihar',
    region: 'BR',
    source_type: 'html',
    official_url: 'https://csbc.bih.nic.in',
    recruitment_url: 'https://csbc.bih.nic.in/',
    category: ['POLICE', 'STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 7. RAJASTHAN STATE RECRUITMENT BOARDS
  // ============================================================================
  {
    id: 'src-st-rj-rpsc',
    name: 'Rajasthan Public Service Commission (RPSC)',
    organization: 'Rajasthan Public Service Commission',
    region: 'RJ',
    source_type: 'html',
    official_url: 'https://rpsc.rajasthan.gov.in',
    recruitment_url: 'https://rpsc.rajasthan.gov.in/news',
    category: ['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'state_psc',
  },
  {
    id: 'src-st-rj-rsmssb',
    name: 'Rajasthan Staff Selection Board (RSMSSB / RSSB)',
    organization: 'Rajasthan Staff Selection Board',
    region: 'RJ',
    source_type: 'html',
    official_url: 'https://rsmssb.rajasthan.gov.in',
    recruitment_url: 'https://rsmssb.rajasthan.gov.in/page?menuName=ApMoNwsAds',
    category: ['STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
  {
    id: 'src-st-rj-police',
    name: 'Rajasthan Police Recruitment Portal',
    organization: 'Rajasthan Police Department',
    region: 'RJ',
    source_type: 'html',
    official_url: 'https://police.rajasthan.gov.in',
    recruitment_url: 'https://police.rajasthan.gov.in/recruitment.aspx',
    category: ['POLICE', 'STATE', 'vacancy', 'admit_card'],
    active: true,
    priority: 'medium',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 8. MADHYA PRADESH STATE RECRUITMENT BOARDS
  // ============================================================================
  {
    id: 'src-st-mp-mppsc',
    name: 'Madhya Pradesh Public Service Commission (MPPSC)',
    organization: 'Madhya Pradesh Public Service Commission',
    region: 'MP',
    source_type: 'html',
    official_url: 'https://mppsc.mp.gov.in',
    recruitment_url: 'https://mppsc.mp.gov.in/Advertisement',
    category: ['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'state_psc',
  },
  {
    id: 'src-st-mp-esb',
    name: 'Madhya Pradesh Employees Selection Board (MPESB / Vyapam)',
    organization: 'Madhya Pradesh Employees Selection Board',
    region: 'MP',
    source_type: 'html',
    official_url: 'https://esb.mp.gov.in',
    recruitment_url: 'https://esb.mp.gov.in/t_menu/Rulebooks.html',
    category: ['STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 9. HARYANA STATE RECRUITMENT BOARDS
  // ============================================================================
  {
    id: 'src-st-hr-hpsc',
    name: 'Haryana Public Service Commission (HPSC)',
    organization: 'Haryana Public Service Commission',
    region: 'HR',
    source_type: 'html',
    official_url: 'https://hpsc.gov.in',
    recruitment_url: 'https://hpsc.gov.in/en-us/Advertisements',
    category: ['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'state_psc',
  },
  {
    id: 'src-st-hr-hssc',
    name: 'Haryana Staff Selection Commission (HSSC)',
    organization: 'Haryana Staff Selection Commission',
    region: 'HR',
    source_type: 'html',
    official_url: 'https://www.hssc.gov.in',
    recruitment_url: 'https://www.hssc.gov.in/advertisements.htm',
    category: ['STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 10. MAHARASHTRA STATE RECRUITMENT BOARDS
  // ============================================================================
  {
    id: 'src-st-mh-mpsc',
    name: 'Maharashtra Public Service Commission (MPSC)',
    organization: 'Maharashtra Public Service Commission',
    region: 'MH',
    source_type: 'html',
    official_url: 'https://mpsc.gov.in',
    recruitment_url: 'https://mpsc.gov.in/advertisement',
    category: ['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'state_psc',
  },
  {
    id: 'src-st-mh-police',
    name: 'Maharashtra Police Recruitment Board',
    organization: 'Maharashtra State Police',
    region: 'MH',
    source_type: 'html',
    official_url: 'https://mahapolice.gov.in',
    recruitment_url: 'https://mahapolice.gov.in/recruitment/',
    category: ['POLICE', 'STATE', 'vacancy', 'admit_card'],
    active: true,
    priority: 'medium',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 11. TAMIL NADU STATE RECRUITMENT BOARDS
  // ============================================================================
  {
    id: 'src-st-tn-tnpsc',
    name: 'Tamil Nadu Public Service Commission (TNPSC)',
    organization: 'Tamil Nadu Public Service Commission',
    region: 'TN',
    source_type: 'html',
    official_url: 'https://www.tnpsc.gov.in',
    recruitment_url: 'https://www.tnpsc.gov.in/English/Notification.aspx',
    category: ['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'state_psc',
  },
  {
    id: 'src-st-tn-tnusrb',
    name: 'Tamil Nadu Uniformed Services Recruitment Board (TNUSRB Police)',
    organization: 'Tamil Nadu Uniformed Services Recruitment Board',
    region: 'TN',
    source_type: 'html',
    official_url: 'https://www.tnusrb.tn.gov.in',
    recruitment_url: 'https://www.tnusrb.tn.gov.in/',
    category: ['POLICE', 'STATE', 'vacancy', 'admit_card'],
    active: true,
    priority: 'medium',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 12. KARNATAKA STATE RECRUITMENT BOARDS
  // ============================================================================
  {
    id: 'src-st-ka-kpsc',
    name: 'Karnataka Public Service Commission (KPSC)',
    organization: 'Karnataka Public Service Commission',
    region: 'KA',
    source_type: 'html',
    official_url: 'https://kpsc.kar.nic.in',
    recruitment_url: 'https://kpsc.kar.nic.in/notif.html',
    category: ['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'state_psc',
  },
  {
    id: 'src-st-ka-police',
    name: 'Karnataka State Police Recruitment (KSP)',
    organization: 'Karnataka State Police',
    region: 'KA',
    source_type: 'html',
    official_url: 'https://ksp.karnataka.gov.in',
    recruitment_url: 'https://ksp-recruitment.in/',
    category: ['POLICE', 'STATE', 'vacancy', 'admit_card'],
    active: true,
    priority: 'medium',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 13. WEST BENGAL STATE RECRUITMENT BOARDS
  // ============================================================================
  {
    id: 'src-st-wb-wbpsc',
    name: 'West Bengal Public Service Commission (WBPSC)',
    organization: 'West Bengal Public Service Commission',
    region: 'WB',
    source_type: 'html',
    official_url: 'https://psc.wb.gov.in',
    recruitment_url: 'https://psc.wb.gov.in/advertisement.jsp',
    category: ['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'state_psc',
  },
  {
    id: 'src-st-wb-wbprb',
    name: 'West Bengal Police Recruitment Board (WBPRB)',
    organization: 'West Bengal Police Recruitment Board',
    region: 'WB',
    source_type: 'html',
    official_url: 'https://prb.wb.gov.in',
    recruitment_url: 'https://prb.wb.gov.in/notices',
    category: ['POLICE', 'STATE', 'vacancy', 'admit_card'],
    active: true,
    priority: 'medium',
    parser_key: 'generic_html',
  },

  // ============================================================================
  // 14. DELHI SUBORDINATE SERVICES SELECTION BOARD
  // ============================================================================
  {
    id: 'src-ut-dl-dsssb',
    name: 'Delhi Subordinate Services Selection Board (DSSSB)',
    organization: 'Delhi Subordinate Services Selection Board, GNCTD',
    region: 'DL',
    source_type: 'html',
    official_url: 'https://dsssb.delhi.gov.in',
    recruitment_url: 'https://dsssb.delhi.gov.in/current-vacancies',
    category: ['STATE', 'CENTRAL', 'TEACHING', 'vacancy', 'admit_card', 'result'],
    active: true,
    priority: 'high',
    parser_key: 'generic_html',
  },
];
