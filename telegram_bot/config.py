"""
telegram_bot/config.py
================================================================================
Centralized configuration, official links directory, and keyword filters
for StudyMate Sarkari Telegram Bot & 1-Hour Web Crawler.
All 28 Central Govt and 30 State-wise official portals with direct URLs.
================================================================================
"""

import os
from dotenv import load_dotenv

load_dotenv()

# =====================================================================
# 1. CORE CREDENTIALS & TELEGRAM SETTINGS
# =====================================================================
# Telegram Bot Token from @BotFather
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Telegram Admin ID (Configured to 5165363865 for instant direct alerts)
TELEGRAM_ADMIN_ID = os.getenv("TELEGRAM_ADMIN_ID", "5165363865")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "5165363865")
TELEGRAM_CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "5165363865")

# Supabase Credentials (Supports exact Render variable names)
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_SECRET_ROLE_KEY")
    or os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("VITE_SUPABASE_ANON_KEY", "")
)

# Scraping Frequency (in hours) - set to 1 hour as requested
SCRAPING_INTERVAL_HOURS = int(os.getenv("SCRAPING_INTERVAL_HOURS", 1))


# =====================================================================
# 2. ALL-INDIA CENTRAL GOVERNMENT OFFICIAL WEBSITES (28 PORTALS)
# =====================================================================
CENTRAL_GOVT_LINKS = [
    {
        "category": "All-India Administrative & Defense",
        "name": "Union Public Service Commission (UPSC)",
        "url": "https://upsc.gov.in",
        "notices_url": "https://upsc.gov.in/whats-new",
        "scope": "Civil Services (IAS/IPS/IFS), NDA, CDS, CAPF (AC), CMS, IES, Geologist, ORA notifications, admit cards, answer keys, results",
        "department": "UPSC (Govt of India)",
        "state": "All India",
    },
    {
        "category": "Staff Selection / Ministerial / Police",
        "name": "Staff Selection Commission (SSC)",
        "url": "https://ssc.gov.in",
        "notices_url": "https://ssc.gov.in/notice-board",
        "scope": "SSC CGL, CHSL, MTS, GD Constable, CPO (Delhi Police/CAPF SI), Stenographer, Selection Posts, exam calendars, answer keys, results",
        "department": "SSC (Govt of India)",
        "state": "All India",
    },
    {
        "category": "Railways (Centralized Application Portal)",
        "name": "Railway Recruitment Control Board (RRB Apply)",
        "url": "https://rrbapply.gov.in",
        "notices_url": "https://rrbapply.gov.in",
        "scope": "Central portal for online applications, city slips, admit cards for RRB NTPC, Group D, ALP, Technician, JE, Paramedical",
        "department": "Railway Recruitment Control Board",
        "state": "All India",
    },
    {
        "category": "Railways (National Apex)",
        "name": "Ministry of Railways / Indian Railways Official",
        "url": "https://indianrailways.gov.in",
        "notices_url": "https://indianrailways.gov.in",
        "scope": "Central recruitment notifications, consolidated RRB notifications, RPF recruitment links, official gazettes",
        "department": "Ministry of Railways",
        "state": "All India",
    },
    {
        "category": "Banking & Financial",
        "name": "Institute of Banking Personnel Selection (IBPS)",
        "url": "https://ibps.in",
        "notices_url": "https://ibps.in",
        "scope": "IBPS PO, Clerk, SO, RRB Office Assistant & Officers Scale I/II/III vacancies, admit cards, scorecards, answer keys",
        "department": "IBPS",
        "state": "All India",
    },
    {
        "category": "Banking (Central Bank)",
        "name": "Reserve Bank of India (RBI Careers)",
        "url": "https://opportunities.rbi.org.in",
        "notices_url": "https://opportunities.rbi.org.in",
        "scope": "RBI Grade B Officer, Assistant, Office Attendant recruitment notifications, result PDFs, cut-offs",
        "department": "Reserve Bank of India",
        "state": "All India",
    },
    {
        "category": "Banking (Public Sector Apex)",
        "name": "State Bank of India (SBI Careers)",
        "url": "https://sbi.co.in/web/careers",
        "notices_url": "https://sbi.co.in/web/careers",
        "scope": "SBI PO, Junior Associate (Clerk), Specialist Officer (SO), CBO recruitment notifications, admit cards, final results",
        "department": "State Bank of India",
        "state": "All India",
    },
    {
        "category": "Armed Forces (Indian Army)",
        "name": "Join Indian Army",
        "url": "https://joinindianarmy.nic.in",
        "notices_url": "https://joinindianarmy.nic.in",
        "scope": "Agniveer Army, TGC, TES, CDS/NDA army entry cutoffs, rally notifications, admit cards, final merits",
        "department": "Indian Army",
        "state": "All India",
    },
    {
        "category": "Armed Forces (Indian Air Force)",
        "name": "Join Indian Air Force / Agniveer Vayu (CASB)",
        "url": "https://agnipathvayu.cdac.in",
        "notices_url": "https://agnipathvayu.cdac.in",
        "scope": "Agniveer Vayu intake, admit card release, mock tests, results and city intimation",
        "department": "Indian Air Force (CASB)",
        "state": "All India",
    },
    {
        "category": "Armed Forces (Indian Air Force - Officers)",
        "name": "AFCAT CDAC Portal",
        "url": "https://afcat.cdac.in",
        "notices_url": "https://afcat.cdac.in",
        "scope": "Air Force Common Admission Test (AFCAT), officer selection admit cards, response sheets, results",
        "department": "Indian Air Force (AFCAT)",
        "state": "All India",
    },
    {
        "category": "Armed Forces (Indian Navy)",
        "name": "Join Indian Navy",
        "url": "https://joinindiannavy.gov.in",
        "notices_url": "https://joinindiannavy.gov.in",
        "scope": "Agniveer Navy (SSR, MR), Executive/Technical/Naval Officers, admit cards, CBT dates, stage-wise results",
        "department": "Indian Navy",
        "state": "All India",
    },
    {
        "category": "Coast Guard",
        "name": "Indian Coast Guard (Join ICG)",
        "url": "https://joinindiancoastguard.cdac.in",
        "notices_url": "https://joinindiancoastguard.cdac.in",
        "scope": "Navik (GD), Navik (DB), Yantrik recruitment notifications, exam city slips, CBT results",
        "department": "Indian Coast Guard",
        "state": "All India",
    },
    {
        "category": "Paramilitary (CAPF)",
        "name": "Central Reserve Police Force (CRPF Recruitment)",
        "url": "https://rect.crpf.gov.in",
        "notices_url": "https://rect.crpf.gov.in",
        "scope": "Central nodal updates for Constable (Technical/Tradesmen), Head Constable (Ministerial), ASI, CAPF joint rallies",
        "department": "CRPF",
        "state": "All India",
    },
    {
        "category": "Paramilitary (CAPF)",
        "name": "Border Security Force (BSF Recruitment)",
        "url": "https://rectt.bsf.gov.in",
        "notices_url": "https://rectt.bsf.gov.in",
        "scope": "BSF Constable Tradesman, RO/RM, Sub-Inspector, Air Wing, Water Wing notifications and admit cards",
        "department": "BSF",
        "state": "All India",
    },
    {
        "category": "Paramilitary (CAPF)",
        "name": "Central Industrial Security Force (CISF Recruitment)",
        "url": "https://cisfrectt.cisf.gov.in",
        "notices_url": "https://cisfrectt.cisf.gov.in",
        "scope": "CISF Constable Fire, Tradesman, Driver, ASI Steno, Head Constable Min notifications, results",
        "department": "CISF",
        "state": "All India",
    },
    {
        "category": "Paramilitary (CAPF)",
        "name": "Indo-Tibetan Border Police (ITBP Recruitment)",
        "url": "https://recruitment.itbpolice.nic.in",
        "notices_url": "https://recruitment.itbpolice.nic.in",
        "scope": "ITBP Sub-Inspector, Head Constable, Constable (Animal Transport, Telecommunication, Tradesman) recruitment",
        "department": "ITBP",
        "state": "All India",
    },
    {
        "category": "Paramilitary (CAPF)",
        "name": "Sashastra Seema Bal (SSB Recruitment)",
        "url": "https://ssbrectt.gov.in",
        "notices_url": "https://ssbrectt.gov.in",
        "scope": "SSB Sub-Inspector, Assistant Sub-Inspector, Head Constable, Constable notifications and admit cards",
        "department": "SSB",
        "state": "All India",
    },
    {
        "category": "National Testing Agency (NTA)",
        "name": "National Testing Agency",
        "url": "https://nta.ac.in",
        "notices_url": "https://nta.ac.in/NoticeBoardArchive",
        "scope": "Central University Non-Teaching staff (DU, JNU, IGNOU, BHU), UGC-NET, CSIR-NET, High Court recruitment exams",
        "department": "National Testing Agency",
        "state": "All India",
    },
    {
        "category": "Education / School Teachers",
        "name": "Kendriya Vidyalaya Sangathan (KVS)",
        "url": "https://kvsangathan.nic.in",
        "notices_url": "https://kvsangathan.nic.in",
        "scope": "KVS PRT, TGT, PGT, Principal, Non-Teaching vacancies, answer keys, interview call letters, cut-off lists",
        "department": "Kendriya Vidyalaya Sangathan",
        "state": "All India",
    },
    {
        "category": "Education / School Teachers",
        "name": "Navodaya Vidyalaya Samiti (NVS)",
        "url": "https://navodaya.gov.in",
        "notices_url": "https://navodaya.gov.in",
        "scope": "NVS TGT, PGT, Non-Teaching staff recruitment notices, CBT answer keys, interview schedules, final results",
        "department": "Navodaya Vidyalaya Samiti",
        "state": "All India",
    },
    {
        "category": "Education / Teacher Eligibility",
        "name": "Central Teacher Eligibility Test (CTET - CBSE)",
        "url": "https://ctet.nic.in",
        "notices_url": "https://ctet.nic.in",
        "scope": "CTET biannual exam notifications, pre-admit card (exam city), admit card, answer keys, result updates",
        "department": "CBSE / CTET",
        "state": "All India",
    },
    {
        "category": "Atomic Energy & Research",
        "name": "Bhabha Atomic Research Centre (BARC)",
        "url": "https://recruit.barc.gov.in",
        "notices_url": "https://recruit.barc.gov.in",
        "scope": "Scientific Officer (OCES/DGFS), Stipendiary Trainee Category I/II, Technical Officers, CBT result updates",
        "department": "BARC",
        "state": "All India",
    },
    {
        "category": "Space & Aerospace",
        "name": "Indian Space Research Organisation (ISRO Careers - ICRB)",
        "url": "https://isro.gov.in/Careers.html",
        "notices_url": "https://isro.gov.in/Careers.html",
        "scope": "Scientist/Engineer 'SC', Technical Assistant, Technician-B notifications, answer keys, interview shortlists",
        "department": "ISRO",
        "state": "All India",
    },
    {
        "category": "Defense Research",
        "name": "Defence Research and Development Organisation (DRDO - CEPTAM)",
        "url": "https://drdo.gov.in/careers",
        "notices_url": "https://drdo.gov.in/careers",
        "scope": "DRDO CEPTAM (Senior Technical Assistant - STA 'B', Technician 'A', Admin & Allied cadre) vacancies, scorecards",
        "department": "DRDO",
        "state": "All India",
    },
    {
        "category": "Insurance (Life)",
        "name": "Life Insurance Corporation of India (LIC Careers)",
        "url": "https://licindia.in/careers",
        "notices_url": "https://licindia.in/careers",
        "scope": "LIC AAO (Assistant Administrative Officer), ADO (Apprentice Development Officer), Assistant recruitments",
        "department": "LIC of India",
        "state": "All India",
    },
    {
        "category": "Insurance (General)",
        "name": "General Insurance Corporation / Public Sector Insurers (GIC Re)",
        "url": "https://gicre.in/en/careers",
        "notices_url": "https://gicre.in/en/careers",
        "scope": "General Insurance Corporation, NIACL AO, Assistant, UIIC AO recruitment notices and result links",
        "department": "GIC Re & Public Sector Insurers",
        "state": "All India",
    },
    {
        "category": "Postal Services",
        "name": "Department of Posts (India Post GDS Online Engagement)",
        "url": "https://indiapostgdsonline.gov.in",
        "notices_url": "https://indiapostgdsonline.gov.in",
        "scope": "Gramin Dak Sevak (BPM/ABPM/Dak Sevak) circle-wise merit lists, document verification schedules, rejection lists",
        "department": "Department of Posts",
        "state": "All India",
    },
    {
        "category": "National Employment Portal",
        "name": "National Career Service (Ministry of Labour & Employment)",
        "url": "https://ncs.gov.in",
        "notices_url": "https://ncs.gov.in",
        "scope": "Pan-India central govt job postings, Rozgar Mela registration, apprenticeship updates, career counseling",
        "department": "Ministry of Labour & Employment",
        "state": "All India",
    }
]


# =====================================================================
# 3. STATE-WISE GOVERNMENT OFFICIAL WEBSITES (30 BOARDS)
# =====================================================================
STATE_WISE_GOVT_LINKS = [
    # Uttar Pradesh
    {
        "state": "Uttar Pradesh",
        "board": "UPPSC",
        "category": "PSC (Civil / Technical)",
        "section_type": "Admit Card & Results Portal",
        "url": "https://uppsc.up.nic.in",
        "notices_url": "https://uppsc.up.nic.in",
        "description": "Direct sections for 'Download Admit Card', 'Notice Board', 'Key Answer Sheet', and 'Results' on the homepage.",
    },
    {
        "state": "Uttar Pradesh",
        "board": "UPSSSC",
        "category": "Subordinate / Group C",
        "section_type": "Results & Answer Keys Portal",
        "url": "https://upsssc.gov.in/Results/ResultsList.aspx",
        "notices_url": "https://upsssc.gov.in/Results/ResultsList.aspx",
        "description": "Dedicated Results tab, Final Cut-offs, PET Scorecard verification, and revised CBT answer keys.",
    },
    {
        "state": "Uttar Pradesh",
        "board": "UPPRPB",
        "category": "Police Recruitment Board",
        "section_type": "Notices & Result Corner",
        "url": "https://uppbpb.gov.in/Notice",
        "notices_url": "https://uppbpb.gov.in/Notice",
        "description": "Constable & SI written test answer keys, normalization score releases, DV/PST call letters, and final selection list PDFs.",
    },

    # Bihar
    {
        "state": "Bihar",
        "board": "BPSC",
        "category": "PSC & School Teachers (TRE)",
        "section_type": "Notices, Keys & Marks Portal",
        "url": "https://bpsc.bih.nic.in",
        "notices_url": "https://bpsc.bih.nic.in",
        "description": "Direct release center for Provisional/Final Answer Keys, OMR download links, TRE cutoff marks, and CCE Marksheet access.",
    },
    {
        "state": "Bihar",
        "board": "BSSC",
        "category": "Subordinate Staff Selection",
        "section_type": "Notice Board & Suchna Patt",
        "url": "https://bssc.bihar.gov.in/NoticeBoard.aspx",
        "notices_url": "https://bssc.bihar.gov.in/NoticeBoard.aspx",
        "description": "Inter-Level & CGL stage-wise results, CBT answer keys, typing test admit cards, and counselling schedule PDFs.",
    },
    {
        "state": "Bihar",
        "board": "BPSSC",
        "category": "Police Sub-Inspector",
        "section_type": "BPSSC Result & Notification Wing",
        "url": "https://bpssc.bih.nic.in",
        "notices_url": "https://bpssc.bih.nic.in",
        "description": "Direct links for Preliminary/Mains Police SI & Sergeant result lists, cut-off PDFs, and PET admit cards.",
    },
    {
        "state": "Bihar",
        "board": "CSBC",
        "category": "Police Constable",
        "section_type": "CSBC Bihar Result Center",
        "url": "https://csbc.bih.nic.in",
        "notices_url": "https://csbc.bih.nic.in",
        "description": "Constable written exam results, physical test (PET) admit cards, rejected lists, and final merit ranks.",
    },

    # Rajasthan
    {
        "state": "Rajasthan",
        "board": "RPSC",
        "category": "PSC",
        "section_type": "Candidate Information (Keys & Results)",
        "url": "https://rpsc.rajasthan.gov.in/candidateinformation",
        "notices_url": "https://rpsc.rajasthan.gov.in/candidateinformation",
        "description": "Dedicated tab for Answer Keys, Question Papers, Results, Marks/Rank lookup, and Press Notes.",
    },
    {
        "state": "Rajasthan",
        "board": "RSMSSB",
        "category": "Subordinate Selection Board",
        "section_type": "Results & Admit Cards Hub",
        "url": "https://rsmssb.rajasthan.gov.in/page?menuName=ApbuWnzwyuw=",
        "notices_url": "https://rsmssb.rajasthan.gov.in/page?menuName=ApbuWnzwyuw=",
        "description": "Direct access to CET scorecards, Master Question Papers, primary/final answer keys, and merit lists.",
    },

    # Madhya Pradesh
    {
        "state": "Madhya Pradesh",
        "board": "MPPSC",
        "category": "PSC",
        "section_type": "Admit Cards, Keys & Results Hub",
        "url": "https://mppsc.mp.gov.in/Results",
        "notices_url": "https://mppsc.mp.gov.in/Results",
        "description": "Central page for State Service Prelims/Mains answer keys, OMR sheet download, interview calls, and scorecards.",
    },
    {
        "state": "Madhya Pradesh",
        "board": "MP ESB (Vyapam)",
        "category": "Staff & Professional Exams",
        "section_type": "Result & Admit Card Center",
        "url": "https://esb.mp.gov.in/results/result.htm",
        "notices_url": "https://esb.mp.gov.in/results/result.htm",
        "description": "Online TAC (Test Admit Card), Candidate Key Objection/Response sheet, and Police/TET normalized results.",
    },

    # Delhi
    {
        "state": "Delhi",
        "board": "DSSSB",
        "category": "Subordinate Services",
        "section_type": "OARS & Answer Key Portal",
        "url": "https://dsssbonline.nic.in",
        "notices_url": "https://dsssbonline.nic.in",
        "description": "Direct e-Admit card download, draft/final CBT answer keys, and e-Dossier cut-off marks for Delhi teachers/staff.",
    },

    # Haryana
    {
        "state": "Haryana",
        "board": "HPSC",
        "category": "PSC",
        "section_type": "Announcements & Results Desk",
        "url": "https://hpsc.gov.in/en-us/Announcements",
        "notices_url": "https://hpsc.gov.in/en-us/Announcements",
        "description": "HCS executive branch answer key objection trackers, interview schedule, and final recommendation lists.",
    },
    {
        "state": "Haryana",
        "board": "HSSC",
        "category": "Staff Selection Commission",
        "section_type": "Results & Public Notices",
        "url": "https://hssc.gov.in/results",
        "notices_url": "https://hssc.gov.in/results",
        "description": "CET scorecards, group allocations, post-wise final results, socio-economic criteria lists, and revised keys.",
    },

    # Jharkhand
    {
        "state": "Jharkhand",
        "board": "JPSC",
        "category": "PSC",
        "section_type": "JPSC Results & Call Letters",
        "url": "https://jpsc.gov.in/results.php",
        "notices_url": "https://jpsc.gov.in/results.php",
        "description": "Combined Civil Services Prelims/Mains results, model answer keys, OMR sheets, and interview call letters.",
    },
    {
        "state": "Jharkhand",
        "board": "JSSC",
        "category": "Staff Selection Commission",
        "section_type": "Admit Card & Results Corner",
        "url": "https://jssc.nic.in/notices/results",
        "notices_url": "https://jssc.nic.in/notices/results",
        "description": "JSSC CGL answer keys, response sheet objections, skill test admit cards, and document verification shortlists.",
    },

    # West Bengal
    {
        "state": "West Bengal",
        "board": "WBPSC",
        "category": "PSC",
        "section_type": "Examination Results & Keys",
        "url": "https://wbpsc.gov.in/results.jsp",
        "notices_url": "https://wbpsc.gov.in/results.jsp",
        "description": "WBCS Executive preliminary keys, written test results, personality test schedules, and marksheets.",
    },
    {
        "state": "West Bengal",
        "board": "WBPRB",
        "category": "Police Recruitment Board",
        "section_type": "Result & Admit Card Center",
        "url": "https://prb.wb.gov.in",
        "notices_url": "https://prb.wb.gov.in",
        "description": "Direct link to check Police Constable / SI exam results, download PMT/PET e-admit cards, and final selection list.",
    },

    # Maharashtra
    {
        "state": "Maharashtra",
        "board": "MPSC",
        "category": "PSC",
        "section_type": "Candidate Information (Keys & Merits)",
        "url": "https://mpsc.gov.in/candidate_information",
        "notices_url": "https://mpsc.gov.in/candidate_information",
        "description": "First/Second answer keys, merit lists, general cutoff marks, DV notifications, and recommendation lists.",
    },

    # Uttarakhand
    {
        "state": "Uttarakhand",
        "board": "UKPSC",
        "category": "PSC",
        "section_type": "Results & Answer Keys Portal",
        "url": "https://psc.uk.gov.in/candidate-corner/results",
        "notices_url": "https://psc.uk.gov.in/candidate-corner/results",
        "description": "Model answer keys, online objection windows, marks of qualified/non-qualified candidates, and merit PDFs.",
    },

    # Himachal Pradesh
    {
        "state": "Himachal Pradesh",
        "board": "HPPSC",
        "category": "PSC & Selection Commission",
        "section_type": "Results & Provisional Keys",
        "url": "https://hppsc.hp.gov.in/hppsc/page/Results.aspx",
        "notices_url": "https://hppsc.hp.gov.in/hppsc/page/Results.aspx",
        "description": "Evaluation results, Personality Test marks, screening test keys, and final selection panel reports.",
    },

    # Punjab
    {
        "state": "Punjab",
        "board": "PPSC",
        "category": "PSC",
        "section_type": "Open Results & Public Notices",
        "url": "https://ppsc.gov.in/Results/results.aspx",
        "notices_url": "https://ppsc.gov.in/Results/results.aspx",
        "description": "PCS answer keys, objection forms, interview merit order lists, and category-wise cut-offs.",
    },
    {
        "state": "Punjab",
        "board": "PSSSB",
        "category": "Subordinate Services",
        "section_type": "Results & Current Updates",
        "url": "https://sssb.punjab.gov.in/Results.html",
        "notices_url": "https://sssb.punjab.gov.in/Results.html",
        "description": "Direct links to download admit cards, counseling lists, typing test results, and final appointments.",
    },

    # Odisha
    {
        "state": "Odisha",
        "board": "OPSC",
        "category": "PSC",
        "section_type": "Candidate Corner (Results & Keys)",
        "url": "https://opsc.gov.in/candidate-corner/results",
        "notices_url": "https://opsc.gov.in/candidate-corner/results",
        "description": "OAS/OPS marks, written examination cut-offs, rejected lists, and tentative key sheets.",
    },
    {
        "state": "Odisha",
        "board": "OSSC & OSSSC",
        "category": "Staff Selection Commissions",
        "section_type": "Web Notice & Result Section",
        "url": "https://ossc.gov.in/Public/Pages/Result.aspx",
        "notices_url": "https://ossc.gov.in/Public/Pages/Result.aspx",
        "description": "CGL results, revised answer key notices, typing/computer test call letters, and scorecards.",
    },

    # Chhattisgarh
    {
        "state": "Chhattisgarh",
        "board": "CGPSC",
        "category": "PSC",
        "section_type": "Results & Model Answer Keys",
        "url": "https://psc.cg.gov.in/result.htm",
        "notices_url": "https://psc.cg.gov.in/result.htm",
        "description": "State Service prelims amended answer keys, mains examination results, and interview mark lists.",
    },
    {
        "state": "Chhattisgarh",
        "board": "CG Vyapam",
        "category": "Professional Exam Board",
        "section_type": "Results, Admit Card & Model Ans",
        "url": "https://vyapam.cgstate.gov.in/result/result.html",
        "notices_url": "https://vyapam.cgstate.gov.in/result/result.html",
        "description": "Online admit card download, Model Answer Key objection portal, and final rank list generation.",
    },

    # Karnataka
    {
        "state": "Karnataka",
        "board": "KPSC",
        "category": "PSC",
        "section_type": "Answer Keys & Eligible Lists",
        "url": "https://kpsc.kar.nic.in/results.html",
        "notices_url": "https://kpsc.kar.nic.in/results.html",
        "description": "Gazetted Probationers key answers, provisional eligibility lists, and marks of candidates.",
    },

    # Tamil Nadu
    {
        "state": "Tamil Nadu",
        "board": "TNPSC",
        "category": "PSC",
        "section_type": "Hall Ticket, Keys & Results",
        "url": "https://tnpsc.gov.in/English/results.html",
        "notices_url": "https://tnpsc.gov.in/English/results.html",
        "description": "Direct access to download Hall Tickets (OTR login), Tentative Answer Keys, Marks & Rank Position, and Oral Test Lists.",
    },

    # Telangana
    {
        "state": "Telangana",
        "board": "TGPSC",
        "category": "PSC",
        "section_type": "Results, Keys & Hall Tickets",
        "url": "https://tspsc.gov.in/results",
        "notices_url": "https://tspsc.gov.in/results",
        "description": "Group-I to Group-IV preliminary answer keys, OMR sheet viewing, web options, and general ranking lists (GRL).",
    },
]


# =====================================================================
# 4. KEYWORD MAPPING RULES
# =====================================================================
KEYWORD_MAPPINGS = {
    "Admit Card": ["admit card", "hall ticket", "call letter", "city slip", "city intimation", "e-admit", "tac"],
    "Results": ["result", "merit list", "selected candidates", "cut off", "score card", "marks", "rank list", "selection list"],
    "Answer Key": ["answer key", "response sheet", "objection", "master question paper", "answer keys", "key answer sheet"],
    "Jobs": ["recruitment", "vacancy", "notification", "apply online", "advertisement", "posts", "bharti", "cgl", "chsl", "mts"]
}
