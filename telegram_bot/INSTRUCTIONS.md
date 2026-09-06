# 🚀 StudyMate Sarkari - Official Government Web Scraping & Telegram Bot Master Instructions

Yeh comprehensive instruction manual explain karta hai ki **StudyMate Sarkari** ka automated Python bot har 1 ghante (**1-Hour Scraping Cycle**) sabhi official **Central Government** aur **State Government** recruitment portals ko kaise crawl karega, data normalize karega, Supabase me persist karega aur seedhe **Telegram Admin ID: `5165363865`** par instant verified alert bheja karega.

---

## 📌 Master Configuration & Telegram Recipient

| Configuration Parameter | Value | Description |
| :--- | :--- | :--- |
| **Scraping Frequency** | `1 Hour` (`SCRAPING_INTERVAL_HOURS=1`) | Har ghante automatically run hota hai |
| **Telegram Admin ID** | `5165363865` | Instant direct alerts is Telegram ID par aayenge |
| **Telegram Chat ID** | `5165363865` | Broadcast channel / chat ID |
| **Database Engine** | Supabase PostgreSQL | Table: `public.sarkari_notifications` |
| **Deduplication Key** | `url` + `title` hash | Duplicate notifications ko filter karta hai |
| **Deployment Target** | Render.com Background Worker | Python 3.10+ with `asyncio` & `schedule` |

---

## 🏛️ PART 1: All-India Central Government Official Portals (28 Portals)

Ye sabhi 28 Central Government bodies All-India level par recruitment conduct karti hain. Bot har 1 ghante inke direct notice boards aur career pages se nayi notifications, admit cards, answer keys aur results extract karta hai:

| S.No | Category | Organization / Board Name | Official Website URL | Primary Updates and Scope | Crawler Target Section |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **All-India Administrative & Defense** | Union Public Service Commission (UPSC) | https://upsc.gov.in | Civil Services (IAS/IPS/IFS), NDA, CDS, CAPF (AC), CMS, IES, Geologist, ORA notifications, admit cards, answer keys, results | `/whats-new` & `/recruitment` |
| 2 | **Staff Selection / Ministerial / Police** | Staff Selection Commission (SSC) | https://ssc.gov.in | SSC CGL, CHSL, MTS, GD Constable, CPO (Delhi Police/CAPF SI), Stenographer, Selection Posts, exam calendars, answer keys, results | `/notice-board` & Home Carousel |
| 3 | **Railways (Centralized Application Portal)** | Railway Recruitment Control Board (RRB Apply) | https://rrbapply.gov.in | Central portal for online applications, city slips, admit cards for RRB NTPC, Group D, ALP, Technician, JE, Paramedical | Latest Notices & Candidate Portal |
| 4 | **Railways (National Apex)** | Ministry of Railways / Indian Railways Official | https://indianrailways.gov.in | Central recruitment notifications, consolidated RRB notifications, RPF recruitment links, official gazettes | Recruitment & Gazette Section |
| 5 | **Banking & Financial** | Institute of Banking Personnel Selection (IBPS) | https://ibps.in | IBPS PO, Clerk, SO, RRB Office Assistant & Officers Scale I/II/III vacancies, admit cards, scorecards, answer keys | CRP PO/MT, CRP Clerks, CRP RRBs |
| 6 | **Banking (Central Bank)** | Reserve Bank of India (RBI Careers) | https://opportunities.rbi.org.in | RBI Grade B Officer, Assistant, Office Attendant recruitment notifications, result PDFs, cut-offs | Current Vacancies / Results Wing |
| 7 | **Banking (Public Sector Apex)** | State Bank of India (SBI Careers) | https://sbi.co.in/web/careers | SBI PO, Junior Associate (Clerk), Specialist Officer (SO), CBO recruitment notifications, admit cards, final results | Current Openings & Results Hub |
| 8 | **Armed Forces (Indian Army)** | Join Indian Army | https://joinindianarmy.nic.in | Agniveer Army, TGC, TES, CDS/NDA army entry cutoffs, rally notifications, admit cards, final merits | JCO/OR Enrolment & Officer Entry |
| 9 | **Armed Forces (Indian Air Force)** | Join Indian Air Force / Agniveer Vayu (CASB) | https://agnipathvayu.cdac.in | Agniveer Vayu intake, admit card release, mock tests, results and city intimation | Candidate Login & News Ticker |
| 10 | **Armed Forces (Air Force Officers)** | AFCAT CDAC Portal | https://afcat.cdac.in | Air Force Common Admission Test (AFCAT), officer selection admit cards, response sheets, results | AFCAT News & Notifications |
| 11 | **Armed Forces (Indian Navy)** | Join Indian Navy | https://joinindiannavy.gov.in | Agniveer Navy (SSR, MR), Executive/Technical/Naval Officers, admit cards, CBT dates, stage-wise results | Current Events & Sailor Entry |
| 12 | **Coast Guard** | Indian Coast Guard (Join ICG) | https://joinindiancoastguard.cdac.in | Navik (GD), Navik (DB), Yantrik recruitment notifications, exam city slips, CBT results | C-DAC Enrolment Updates |
| 13 | **Paramilitary (CAPF)** | Central Reserve Police Force (CRPF Recruitment) | https://rect.crpf.gov.in | Central nodal updates for Constable (Technical/Tradesmen), Head Constable (Ministerial), ASI, CAPF joint rallies | Recruitment Notices & Results |
| 14 | **Paramilitary (CAPF)** | Border Security Force (BSF Recruitment) | https://rectt.bsf.gov.in | BSF Constable Tradesman, RO/RM, Sub-Inspector, Air Wing, Water Wing notifications and admit cards | Active Recruitments Portal |
| 15 | **Paramilitary (CAPF)** | Central Industrial Security Force (CISF Recruitment) | https://cisfrectt.cisf.gov.in | CISF Constable Fire, Tradesman, Driver, ASI Steno, Head Constable Min notifications, results | Notice Board & Candidate Corner |
| 16 | **Paramilitary (CAPF)** | Indo-Tibetan Border Police (ITBP Recruitment) | https://recruitment.itbpolice.nic.in | ITBP Sub-Inspector, Head Constable, Constable (Animal Transport, Telecommunication, Tradesman) recruitment | News & Circulars |
| 17 | **Paramilitary (CAPF)** | Sashastra Seema Bal (SSB Recruitment) | https://ssbrectt.gov.in | SSB Sub-Inspector, Assistant Sub-Inspector, Head Constable, Constable notifications and admit cards | Latest Advertisements |
| 18 | **National Testing Agency (NTA)** | National Testing Agency | https://nta.ac.in | Central University Non-Teaching staff (DU, JNU, IGNOU, BHU), UGC-NET, CSIR-NET, High Court recruitment exams | `/NoticeBoardArchive` |
| 19 | **Education / School Teachers** | Kendriya Vidyalaya Sangathan (KVS) | https://kvsangathan.nic.in | KVS PRT, TGT, PGT, Principal, Non-Teaching vacancies, answer keys, interview call letters, cut-off lists | Announcements & Employment Notices |
| 20 | **Education / School Teachers** | Navodaya Vidyalaya Samiti (NVS) | https://navodaya.gov.in | NVS TGT, PGT, Non-Teaching staff recruitment notices, CBT answer keys, interview schedules, final results | Recruitment Drives & Results |
| 21 | **Education / Teacher Eligibility** | Central Teacher Eligibility Test (CTET - CBSE) | https://ctet.nic.in | CTET biannual exam notifications, pre-admit card (exam city), admit card, answer keys, result updates | Candidate Activity & News Feed |
| 22 | **Atomic Energy & Research** | Bhabha Atomic Research Centre (BARC) | https://recruit.barc.gov.in | Scientific Officer (OCES/DGFS), Stipendiary Trainee Category I/II, Technical Officers, CBT result updates | Job Openings & Call Letters |
| 23 | **Space & Aerospace** | Indian Space Research Organisation (ISRO Careers) | https://isro.gov.in/Careers.html | Scientist/Engineer 'SC', Technical Assistant, Technician-B notifications, answer keys, interview shortlists | ICRB Recruitment Notices |
| 24 | **Defense Research** | Defence Research and Development Organisation (DRDO) | https://drdo.gov.in/careers | DRDO CEPTAM (Senior Technical Assistant - STA 'B', Technician 'A', Admin & Allied cadre) vacancies, scorecards | CEPTAM Notice Board |
| 25 | **Insurance (Life)** | Life Insurance Corporation of India (LIC Careers) | https://licindia.in/careers | LIC AAO (Assistant Administrative Officer), ADO (Apprentice Development Officer), Assistant recruitments | Recruitment of Officers & Assistants |
| 26 | **Insurance (General)** | General Insurance Corporation / Public Sector Insurers | https://gicre.in/en/careers | General Insurance Corporation, NIACL AO, Assistant, UIIC AO recruitment notices and result links | Career Openings & Announcements |
| 27 | **Postal Services** | Department of Posts (India Post GDS) | https://indiapostgdsonline.gov.in | Gramin Dak Sevak (BPM/ABPM/Dak Sevak) circle-wise merit lists, document verification schedules, rejection lists | Circle-wise Shortlisted Candidates |
| 28 | **National Employment Portal** | National Career Service (Ministry of Labour & Employment) | https://ncs.gov.in | Pan-India central govt job postings, Rozgar Mela registration, apprenticeship updates, career counseling | Central Vacancies & News Feed |

---

## 🗺️ PART 2: State-Wise Government Official Recruitment Boards (30 Boards)

Ye State Public Service Commissions (PSC), Subordinate Staff Selection Boards (SSSC), aur Police Recruitment Boards hain jinka direct results, answer keys aur admit cards portal monitor kiya jata hai:

| State / UT | Board Name | Category | Dedicated Section Type | Direct Official URL | Description & Key Extraction Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Uttar Pradesh** | UPPSC | PSC (Civil / Technical) | Admit Card & Results Portal | https://uppsc.up.nic.in | Direct sections for 'Download Admit Card', 'Notice Board', 'Key Answer Sheet', and 'Results' on the homepage. |
| **Uttar Pradesh** | UPSSSC | Subordinate / Group C | Results & Answer Keys Portal | https://upsssc.gov.in/Results/ResultsList.aspx | Dedicated Results tab, Final Cut-offs, PET Scorecard verification, and revised CBT answer keys. |
| **Uttar Pradesh** | UPPRPB | Police Recruitment Board | Notices & Result Corner | https://uppbpb.gov.in/Notice | Constable & SI written test answer keys, normalization score releases, DV/PST call letters, and final selection list PDFs. |
| **Bihar** | BPSC | PSC & School Teachers (TRE) | Notices, Keys & Marks Portal | https://bpsc.bih.nic.in | Direct release center for Provisional/Final Answer Keys, OMR download links, TRE cutoff marks, and CCE Marksheet access. |
| **Bihar** | BSSC | Subordinate Staff Selection | Notice Board & Suchna Patt | https://bssc.bihar.gov.in/NoticeBoard.aspx | Inter-Level & CGL stage-wise results, CBT answer keys, typing test admit cards, and counselling schedule PDFs. |
| **Bihar** | BPSSC | Police Sub-Inspector | BPSSC Result & Notification Wing | https://bpssc.bih.nic.in | Direct links for Preliminary/Mains Police SI & Sergeant result lists, cut-off PDFs, and PET admit cards. |
| **Bihar** | CSBC | Police Constable | CSBC Bihar Result Center | https://csbc.bih.nic.in | Constable written exam results, physical test (PET) admit cards, rejected lists, and final merit ranks. |
| **Rajasthan** | RPSC | PSC | Candidate Information (Keys & Results) | https://rpsc.rajasthan.gov.in/candidateinformation | Dedicated tab for Answer Keys, Question Papers, Results, Marks/Rank lookup, and Press Notes. |
| **Rajasthan** | RSMSSB | Subordinate Selection Board | Results & Admit Cards Hub | https://rsmssb.rajasthan.gov.in/page?menuName=ApbuWnzwyuw= | Direct access to CET scorecards, Master Question Papers, primary/final answer keys, and merit lists. |
| **Madhya Pradesh** | MPPSC | PSC | Admit Cards, Keys & Results Hub | https://mppsc.mp.gov.in/Results | Central page for State Service Prelims/Mains answer keys, OMR sheet download, interview calls, and scorecards. |
| **Madhya Pradesh** | MP ESB (Vyapam) | Staff & Professional Exams | Result & Admit Card Center | https://esb.mp.gov.in/results/result.htm | Online TAC (Test Admit Card), Candidate Key Objection/Response sheet, and Police/TET normalized results. |
| **Delhi** | DSSSB | Subordinate Services | OARS & Answer Key Portal | https://dsssbonline.nic.in | Direct e-Admit card download, draft/final CBT answer keys, and e-Dossier cut-off marks for Delhi teachers/staff. |
| **Haryana** | HPSC | PSC | Announcements & Results Desk | https://hpsc.gov.in/en-us/Announcements | HCS executive branch answer key objection trackers, interview schedule, and final recommendation lists. |
| **Haryana** | HSSC | Staff Selection Commission | Results & Public Notices | https://hssc.gov.in/results | CET scorecards, group allocations, post-wise final results, socio-economic criteria lists, and revised keys. |
| **Jharkhand** | JPSC | PSC | JPSC Results & Call Letters | https://jpsc.gov.in/results.php | Combined Civil Services Prelims/Mains results, model answer keys, OMR sheets, and interview call letters. |
| **Jharkhand** | JSSC | Staff Selection Commission | Admit Card & Results Corner | https://jssc.nic.in/notices/results | JSSC CGL answer keys, response sheet objections, skill test admit cards, and document verification shortlists. |
| **West Bengal** | WBPSC | PSC | Examination Results & Keys | https://wbpsc.gov.in/results.jsp | WBCS Executive preliminary keys, written test results, personality test schedules, and marksheets. |
| **West Bengal** | WBPRB | Police Recruitment Board | Result & Admit Card Center | https://prb.wb.gov.in | Direct link to check Police Constable / SI exam results, download PMT/PET e-admit cards, and final selection list. |
| **Maharashtra** | MPSC | PSC | Candidate Information (Keys & Merits) | https://mpsc.gov.in/candidate_information | First/Second answer keys, merit lists, general cutoff marks, DV notifications, and recommendation lists. |
| **Uttarakhand** | UKPSC | PSC | Results & Answer Keys Portal | https://psc.uk.gov.in/candidate-corner/results | Model answer keys, online objection windows, marks of qualified/non-qualified candidates, and merit PDFs. |
| **Himachal Pradesh** | HPPSC | PSC & Selection Commission | Results & Provisional Keys | https://hppsc.hp.gov.in/hppsc/page/Results.aspx | Evaluation results, Personality Test marks, screening test keys, and final selection panel reports. |
| **Punjab** | PPSC | PSC | Open Results & Public Notices | https://ppsc.gov.in/Results/results.aspx | PCS answer keys, objection forms, interview merit order lists, and category-wise cut-offs. |
| **Punjab** | PSSSB | Subordinate Services | Results & Current Updates | https://sssb.punjab.gov.in/Results.html | Direct links to download admit cards, counseling lists, typing test results, and final appointments. |
| **Odisha** | OPSC | PSC | Candidate Corner (Results & Keys) | https://opsc.gov.in/candidate-corner/results | OAS/OPS marks, written examination cut-offs, rejected lists, and tentative key sheets. |
| **Odisha** | OSSC & OSSSC | Staff Selection Commissions | Web Notice & Result Section | https://ossc.gov.in/Public/Pages/Result.aspx | CGL results, revised answer key notices, typing/computer test call letters, and scorecards. |
| **Chhattisgarh** | CGPSC | PSC | Results & Model Answer Keys | https://psc.cg.gov.in/result.htm | State Service prelims amended answer keys, mains examination results, and interview mark lists. |
| **Chhattisgarh** | CG Vyapam | Professional Exam Board | Results, Admit Card & Model Ans | https://vyapam.cgstate.gov.in/result/result.html | Online admit card download, Model Answer Key objection portal, and final rank list generation. |
| **Karnataka** | KPSC | PSC | Answer Keys & Eligible Lists | https://kpsc.kar.nic.in/results.html | Gazetted Probationers key answers, provisional eligibility lists, and marks of candidates. |
| **Tamil Nadu** | TNPSC | PSC | Hall Ticket, Keys & Results | https://tnpsc.gov.in/English/results.html | Direct access to download Hall Tickets (OTR login), Tentative Answer Keys, Marks & Rank Position, and Oral Test Lists. |
| **Telangana** | TGPSC | PSC | Results, Keys & Hall Tickets | https://tspsc.gov.in/results | Group-I to Group-IV preliminary answer keys, OMR sheet viewing, web options, and general ranking lists (GRL). |

---

## ⚙️ PART 3: 1-Hour Automated Scraping Pipeline & Workflow

```
┌────────────────────────────────────────────────────────┐
│  Every 1 Hour (3600 seconds) Scheduler Triggers Loop   │
└───────────────────────────┬────────────────────────────┘
                            │
       ┌────────────────────┴─────────────────────┐
       ▼                                          ▼
┌─────────────────────────────┐        ┌─────────────────────────────┐
│ 28 Central Govt Portals     │        │ 30 State Boards Portals     │
│ (UPSC, SSC, RRB, IBPS, etc.)│        │ (UPPSC, BPSC, RPSC, etc.)   │
└──────────────┬──────────────┘        └──────────────┬──────────────┘
               │                                      │
               └──────────────────┬───────────────────┘
                                  ▼
┌────────────────────────────────────────────────────────────┐
│ HTTP GET Request with Custom User-Agent & Timeout (15s)    │
│ BeautifulSoup / lxml HTML Parsing (Extracting links & PDFs)│
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│ Check Supabase Table: sarkari_notifications                │
│ (Deduplication check: Does link or hash already exist?)    │
└───────────────────────────┬────────────────────────────────┘
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
       [ALREADY EXISTS]               [NEW RECORD]
       Skip, no spam.            1. Insert into Supabase DB
                                 2. Dispatch Telegram Alert to:
                                    ID: 5165363865
```

### 1. Extraction Rules:
- **Link Detection**: Extracts anchor tags `<a>` matching keywords like *Notification*, *Advertisement*, *Result*, *Answer Key*, *Admit Card*, *Cut-off*, *.pdf*.
- **Absolute URLs**: Joins relative links using `urllib.parse.urljoin(portal_url, href)`.
- **Date Parsing**: Identifies dates in standard formats (`DD/MM/YYYY`, `DD-Mon-YYYY`) to assign proper chronological order.
- **Category Tagging**: Classifies updates into `Latest Jobs`, `Admit Cards`, `Answer Keys`, `Results`, `Syllabus`, or `Admission`.

---

## 📱 PART 4: Telegram Alert Formatting Template

Jab bhi bot ko koi naya update milta hai, yeh Telegram ID `5165363865` par is formatted markdown style me alert send karta hai:

```markdown
🚨 *NEW SARKARI NOTIFICATION DETECTED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏛️ *Organization / Board:* {organization_name}
📋 *Category:* {category} ({state})
📌 *Update Title:* {notification_title}

🗓️ *Release Date:* {release_date}
⚡ *Status:* Active / Freshly Released

🔗 *Direct Official Link:*
{direct_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 *Sent to Telegram ID:* `5165363865`
🛡️ *Verified Source:* StudyMate Sarkari Automated Crawler
```

---

## 🛠️ PART 5: How to Run the Bot on Render.com (24/7 Free)

Render.com par bot ko deploy karne ke liye ye steps follow karein:

### Step 1: Render me Background Worker Banayein
1. Render.com par login karein -> **New +** -> **Background Worker** click karein.
2. Apna GitHub repository connect karein.
3. Settings:
   - **Name:** `studymate-sarkari-bot`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r telegram_bot/requirements.txt`
   - **Start Command:** `python telegram_bot/bot.py`

### Step 2: Environment Variables Set Karein
Aapke Render dashboard me wahi exact 7 variables dalein jo aapne save kiye hain:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_ADMIN_ID=5165363865
TELEGRAM_CHAT_ID=5165363865
SCRAPING_INTERVAL_HOURS=1
```

### Step 3: Local Testing (Optional)
Agar aap apne computer par test karna chahte hain:
```bash
cd telegram_bot
pip install -r requirements.txt
python bot.py
```

Bot execute hote hi sabse pehle Telegram ID `5165363865` par startup alert bhejega aur fir har 1 ghante Central & State portals ko crawl karega!

---
*Created for StudyMate Sarkari - India's 100% Verified Govt Job & Alert Gateway.*
