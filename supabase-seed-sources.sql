-- ============================================================================
-- STUDYMATE SARKARI — SEED VERIFIED OFFICIAL RECRUITMENT SOURCES
-- Target Table: job_sources (Authoritative official registry)
-- ============================================================================
-- Ensures all 42 primary official government sources are present in job_sources.
-- Safe & idempotent: handles re-runs without creating duplicates.
-- ============================================================================

-- Ensure unique index on official_url for clean idempotent upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_sources_official_url ON job_sources(official_url);

-- Insert / Upsert 42 Verified Official Sources
INSERT INTO job_sources (name, organization, region, source_type, official_url, recruitment_url, category, active, updated_at)
VALUES
  -- 1. Central Recruitment & Commissions
  (
    'Union Public Service Commission (UPSC)',
    'Union Public Service Commission',
    'ALL',
    'html',
    'https://upsc.gov.in',
    'https://upsc.gov.in/recruitment/recruitment-advertisement',
    ARRAY['UPSC', 'CENTRAL', 'vacancy', 'admit_card', 'result', 'answer_key'],
    true,
    NOW()
  ),
  (
    'UPSC Online Recruitment Application Portal (ORA)',
    'Union Public Service Commission',
    'ALL',
    'html',
    'https://upsconline.nic.in',
    'https://upsconline.nic.in/ora/VacancyNoticePub.php',
    ARRAY['UPSC', 'CENTRAL', 'vacancy', 'admit_card'],
    true,
    NOW()
  ),
  (
    'Staff Selection Commission (SSC Central HQ)',
    'Staff Selection Commission',
    'ALL',
    'html',
    'https://ssc.gov.in',
    'https://ssc.gov.in/notices',
    ARRAY['SSC', 'CENTRAL', 'vacancy', 'admit_card', 'result', 'answer_key'],
    true,
    NOW()
  ),
  (
    'SSC Northern Region (New Delhi)',
    'Staff Selection Commission',
    'DL',
    'html',
    'https://sscnr.nic.in',
    'https://sscnr.nic.in/newlook/site/Index.html',
    ARRAY['SSC', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'SSC Central Region (Prayagraj)',
    'Staff Selection Commission',
    'UP',
    'html',
    'https://www.ssc-cr.org',
    'https://www.ssc-cr.org/notice.php',
    ARRAY['SSC', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Employment News India (Ministry of I&B)',
    'Publications Division, Ministry of Information and Broadcasting',
    'ALL',
    'html',
    'https://employmentnews.gov.in',
    'https://employmentnews.gov.in/NewEmp/Home.aspx',
    ARRAY['CENTRAL', 'vacancy'],
    true,
    NOW()
  ),
  (
    'National Testing Agency (NTA Examinations & Bulletins)',
    'National Testing Agency, Ministry of Education',
    'ALL',
    'html',
    'https://nta.ac.in',
    'https://nta.ac.in/NoticeArchive',
    ARRAY['CENTRAL', 'TEACHING', 'exam_update', 'admit_card', 'result'],
    true,
    NOW()
  ),

  -- 2. Railway Recruitment Boards (RRB)
  (
    'Railway Recruitment Control Board (RRCB Indian Railways)',
    'Ministry of Railways, Government of India',
    'ALL',
    'html',
    'https://indianrailways.gov.in',
    'https://indianrailways.gov.in/railwayboard/view_section.jsp?lang=0&id=0,1,304,366,550',
    ARRAY['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Railway Recruitment Board Chandigarh (RRB Chandigarh)',
    'Railway Recruitment Board',
    'PB',
    'html',
    'https://rrbcdg.gov.in',
    'https://rrbcdg.gov.in/active-notices.php',
    ARRAY['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Railway Recruitment Board Bhopal (RRB Bhopal)',
    'Railway Recruitment Board',
    'MP',
    'html',
    'https://rrbbpl.nic.in',
    'https://rrbbpl.nic.in/cencen.htm',
    ARRAY['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Railway Recruitment Board Patna (RRB Patna)',
    'Railway Recruitment Board',
    'BR',
    'html',
    'https://rrbpatna.gov.in',
    'https://rrbpatna.gov.in/cen-notices.php',
    ARRAY['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Railway Recruitment Board Secunderabad (RRB Secunderabad)',
    'Railway Recruitment Board',
    'TS',
    'html',
    'https://rrbsecunderabad.gov.in',
    'https://rrbsecunderabad.gov.in/notices.html',
    ARRAY['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Railway Recruitment Board Mumbai (RRB Mumbai)',
    'Railway Recruitment Board',
    'MH',
    'html',
    'https://rrbmumbai.gov.in',
    'https://rrbmumbai.gov.in/notifications.php',
    ARRAY['RAILWAY', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),

  -- 3. Banking & Financial
  (
    'Institute of Banking Personnel Selection (IBPS)',
    'Institute of Banking Personnel Selection',
    'ALL',
    'html',
    'https://www.ibps.in',
    'https://www.ibps.in/index.php/notifications/',
    ARRAY['BANKING', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'State Bank of India Recruitment (SBI Careers)',
    'State Bank of India',
    'ALL',
    'html',
    'https://sbi.co.in',
    'https://sbi.co.in/web/careers/current-openings',
    ARRAY['BANKING', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Reserve Bank of India Recruitment (RBI Opportunities)',
    'Reserve Bank of India',
    'ALL',
    'html',
    'https://rbi.org.in',
    'https://opportunities.rbi.org.in/scripts/vacancies.aspx',
    ARRAY['BANKING', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),

  -- 4. Defence & Armed Forces
  (
    'Join Indian Army Recruitment Portal',
    'Indian Army, Ministry of Defence',
    'ALL',
    'html',
    'https://joinindianarmy.nic.in',
    'https://joinindianarmy.nic.in/default.aspx',
    ARRAY['DEFENCE', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Join Indian Navy (Nausena Bharti)',
    'Indian Navy, Ministry of Defence',
    'ALL',
    'html',
    'https://joinindiannavy.gov.in',
    'https://joinindiannavy.gov.in/en/account/current-openings.html',
    ARRAY['DEFENCE', 'CENTRAL', 'vacancy', 'admit_card'],
    true,
    NOW()
  ),
  (
    'Indian Air Force Recruitment (AFCAT & Agniveer Vayu)',
    'Indian Air Force, Ministry of Defence',
    'ALL',
    'html',
    'https://afcat.cdac.in',
    'https://afcat.cdac.in/AFCAT/',
    ARRAY['DEFENCE', 'CENTRAL', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Indian Coast Guard Recruitment (Join ICG)',
    'Indian Coast Guard, Ministry of Defence',
    'ALL',
    'html',
    'https://joinindiancoastguard.cdac.in',
    'https://joinindiancoastguard.cdac.in/cgept/',
    ARRAY['DEFENCE', 'CENTRAL', 'vacancy', 'admit_card'],
    true,
    NOW()
  ),

  -- 5. Uttar Pradesh State Authorities
  (
    'Uttar Pradesh Public Service Commission (UPPSC)',
    'Uttar Pradesh Public Service Commission',
    'UP',
    'html',
    'https://uppsc.up.nic.in',
    'https://uppsc.up.nic.in/AllNotifications.aspx',
    ARRAY['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result', 'answer_key'],
    true,
    NOW()
  ),
  (
    'Uttar Pradesh Subordinate Services Selection Commission (UPSSSC)',
    'Uttar Pradesh Subordinate Services Selection Commission',
    'UP',
    'html',
    'https://upsssc.gov.in',
    'https://upsssc.gov.in/Default.aspx',
    ARRAY['STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Uttar Pradesh Police Recruitment and Promotion Board (UPPRPB)',
    'Uttar Pradesh Police Recruitment & Promotion Board',
    'UP',
    'html',
    'https://uppbpb.gov.in',
    'https://uppbpb.gov.in/Notice',
    ARRAY['POLICE', 'STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),

  -- 6. Bihar State Authorities
  (
    'Bihar Public Service Commission (BPSC)',
    'Bihar Public Service Commission',
    'BR',
    'html',
    'https://bpsc.bih.nic.in',
    'https://bpsc.bih.nic.in/',
    ARRAY['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result', 'answer_key'],
    true,
    NOW()
  ),
  (
    'Bihar Staff Selection Commission (BSSC)',
    'Bihar Staff Selection Commission',
    'BR',
    'html',
    'https://bssc.bihar.gov.in',
    'https://bssc.bihar.gov.in/NoticeBoard.htm',
    ARRAY['STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Central Selection Board of Constable Bihar (CSBC Bihar Police)',
    'Central Selection Board of Constable, Bihar',
    'BR',
    'html',
    'https://csbc.bih.nic.in',
    'https://csbc.bih.nic.in/',
    ARRAY['POLICE', 'STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),

  -- 7. Rajasthan State Authorities
  (
    'Rajasthan Public Service Commission (RPSC)',
    'Rajasthan Public Service Commission',
    'RJ',
    'html',
    'https://rpsc.rajasthan.gov.in',
    'https://rpsc.rajasthan.gov.in/news',
    ARRAY['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Rajasthan Staff Selection Board (RSMSSB / RSSB)',
    'Rajasthan Staff Selection Board',
    'RJ',
    'html',
    'https://rsmssb.rajasthan.gov.in',
    'https://rsmssb.rajasthan.gov.in/page?menuName=ApMoNwsAds',
    ARRAY['STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Rajasthan Police Recruitment Portal',
    'Rajasthan Police Department',
    'RJ',
    'html',
    'https://police.rajasthan.gov.in',
    'https://police.rajasthan.gov.in/recruitment.aspx',
    ARRAY['POLICE', 'STATE', 'vacancy', 'admit_card'],
    true,
    NOW()
  ),

  -- 8. Madhya Pradesh State Authorities
  (
    'Madhya Pradesh Public Service Commission (MPPSC)',
    'Madhya Pradesh Public Service Commission',
    'MP',
    'html',
    'https://mppsc.mp.gov.in',
    'https://mppsc.mp.gov.in/Advertisement',
    ARRAY['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Madhya Pradesh Employees Selection Board (MPESB / Vyapam)',
    'Madhya Pradesh Employees Selection Board',
    'MP',
    'html',
    'https://esb.mp.gov.in',
    'https://esb.mp.gov.in/t_menu/Rulebooks.html',
    ARRAY['STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),

  -- 9. Haryana State Authorities
  (
    'Haryana Public Service Commission (HPSC)',
    'Haryana Public Service Commission',
    'HR',
    'html',
    'https://hpsc.gov.in',
    'https://hpsc.gov.in/en-us/Advertisements',
    ARRAY['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Haryana Staff Selection Commission (HSSC)',
    'Haryana Staff Selection Commission',
    'HR',
    'html',
    'https://www.hssc.gov.in',
    'https://www.hssc.gov.in/advertisements.htm',
    ARRAY['STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),

  -- 10. Maharashtra State Authorities
  (
    'Maharashtra Public Service Commission (MPSC)',
    'Maharashtra Public Service Commission',
    'MH',
    'html',
    'https://mpsc.gov.in',
    'https://mpsc.gov.in/advertisement',
    ARRAY['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Maharashtra Police Recruitment Board',
    'Maharashtra State Police',
    'MH',
    'html',
    'https://mahapolice.gov.in',
    'https://mahapolice.gov.in/recruitment/',
    ARRAY['POLICE', 'STATE', 'vacancy', 'admit_card'],
    true,
    NOW()
  ),

  -- 11. Tamil Nadu State Authorities
  (
    'Tamil Nadu Public Service Commission (TNPSC)',
    'Tamil Nadu Public Service Commission',
    'TN',
    'html',
    'https://www.tnpsc.gov.in',
    'https://www.tnpsc.gov.in/English/Notification.aspx',
    ARRAY['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Tamil Nadu Uniformed Services Recruitment Board (TNUSRB Police)',
    'Tamil Nadu Uniformed Services Recruitment Board',
    'TN',
    'html',
    'https://www.tnusrb.tn.gov.in',
    'https://www.tnusrb.tn.gov.in/',
    ARRAY['POLICE', 'STATE', 'vacancy', 'admit_card'],
    true,
    NOW()
  ),

  -- 12. Karnataka State Authorities
  (
    'Karnataka Public Service Commission (KPSC)',
    'Karnataka Public Service Commission',
    'KA',
    'html',
    'https://kpsc.kar.nic.in',
    'https://kpsc.kar.nic.in/notif.html',
    ARRAY['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'Karnataka State Police Recruitment (KSP)',
    'Karnataka State Police',
    'KA',
    'html',
    'https://ksp.karnataka.gov.in',
    'https://ksp-recruitment.in/',
    ARRAY['POLICE', 'STATE', 'vacancy', 'admit_card'],
    true,
    NOW()
  ),

  -- 13. West Bengal State Authorities
  (
    'West Bengal Public Service Commission (WBPSC)',
    'West Bengal Public Service Commission',
    'WB',
    'html',
    'https://psc.wb.gov.in',
    'https://psc.wb.gov.in/advertisement.jsp',
    ARRAY['STATE_PSC', 'STATE', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  ),
  (
    'West Bengal Police Recruitment Board (WBPRB)',
    'West Bengal Police Recruitment Board',
    'WB',
    'html',
    'https://prb.wb.gov.in',
    'https://prb.wb.gov.in/notices',
    ARRAY['POLICE', 'STATE', 'vacancy', 'admit_card'],
    true,
    NOW()
  ),

  -- 14. Delhi NCT Subordinate Services
  (
    'Delhi Subordinate Services Selection Board (DSSSB)',
    'Delhi Subordinate Services Selection Board, GNCTD',
    'DL',
    'html',
    'https://dsssb.delhi.gov.in',
    'https://dsssb.delhi.gov.in/current-vacancies',
    ARRAY['STATE', 'CENTRAL', 'TEACHING', 'vacancy', 'admit_card', 'result'],
    true,
    NOW()
  )

ON CONFLICT (official_url) DO UPDATE SET
  name = EXCLUDED.name,
  organization = EXCLUDED.organization,
  region = EXCLUDED.region,
  recruitment_url = EXCLUDED.recruitment_url,
  category = EXCLUDED.category,
  active = EXCLUDED.active,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- 1. Total & Active Sources Count
SELECT 
  count(*) as total_sources,
  count(*) FILTER (WHERE active = true) as active_sources
FROM job_sources;

-- 2. Sources Grouped by Region
SELECT 
  COALESCE(region, 'UNSPECIFIED') as region_code,
  count(*) as count
FROM job_sources
GROUP BY region
ORDER BY count(*) DESC;

-- 3. Sources Grouped by Category
SELECT 
  cat,
  count(*) as count
FROM (
  SELECT unnest(category) as cat FROM job_sources
) sub
GROUP BY cat
ORDER BY count(*) DESC;
