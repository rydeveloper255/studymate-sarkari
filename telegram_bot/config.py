"""
Configuration file for StudyMate Sarkari Telegram Bot & Web Scraper.
Contains API keys, scraping settings, and official government website lists.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# =====================================================================
# 1. CREDENTIALS & SETTINGS (CONFIGURED FOR RENDER & LOCAL DEPLOYMENT)
# =====================================================================
# Get Telegram Bot Token from @BotFather on Telegram
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN_FROM_BOTFATHER")

# Admin Telegram ID (Direct destination for alert dispatches & admin pings)
TELEGRAM_ADMIN_ID = os.getenv("TELEGRAM_ADMIN_ID", "5165363865")

# Your Telegram Channel or Chat ID (defaults to user's Telegram ID: 5165363865)
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "5165363865")
TELEGRAM_CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", TELEGRAM_CHAT_ID)

# Supabase Project Credentials (from Render environment or .env)
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "https://your-project.supabase.co"))

# Supports SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_ROLE_KEY, SUPABASE_KEY, or SUPABASE_ANON_KEY
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_SECRET_ROLE_KEY")
    or os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("VITE_SUPABASE_ANON_KEY", "your-supabase-key")
)

# Scraping Frequency (in hours) - set to 1 hour as requested
SCRAPING_INTERVAL_HOURS = int(os.getenv("SCRAPING_INTERVAL_HOURS", 1))


# =====================================================================
# 2. CENTRAL GOVERNMENT OFFICIAL WEBSITES LIST
# =====================================================================
CENTRAL_GOVT_LINKS = [
    {
        "name": "Staff Selection Commission (SSC Central)",
        "url": "https://ssc.gov.in",
        "notices_url": "https://ssc.gov.in/notice-board",
        "department": "SSC (Govt of India)",
        "state": "All India",
    },
    {
        "name": "Union Public Service Commission (UPSC)",
        "url": "https://upsc.gov.in",
        "notices_url": "https://upsc.gov.in/whats-new",
        "department": "UPSC (Govt of India)",
        "state": "All India",
    },
    {
        "name": "Railway Recruitment Board (RRB Central)",
        "url": "https://rrbapply.gov.in",
        "notices_url": "https://www.rrbcdg.gov.in",
        "department": "Ministry of Railways",
        "state": "All India",
    },
    {
        "name": "Institute of Banking Personnel Selection (IBPS)",
        "url": "https://www.ibps.in",
        "notices_url": "https://www.ibps.in",
        "department": "Public Sector Banks / IBPS",
        "state": "All India",
    },
    {
        "name": "National Testing Agency (NTA)",
        "url": "https://nta.ac.in",
        "notices_url": "https://nta.ac.in/NoticeBoardArchive",
        "department": "Ministry of Education (NTA)",
        "state": "All India",
    },
    {
        "name": "State Bank of India Careers (SBI)",
        "url": "https://sbi.co.in/careers",
        "notices_url": "https://sbi.co.in/web/careers/current-openings",
        "department": "State Bank of India",
        "state": "All India",
    },
    {
        "name": "Join Indian Army Official",
        "url": "https://joinindianarmy.nic.in",
        "notices_url": "https://joinindianarmy.nic.in",
        "department": "Indian Army (Ministry of Defence)",
        "state": "All India",
    },
    {
        "name": "Indian Air Force AFCAT / Agniveer",
        "url": "https://afcat.cdac.in",
        "notices_url": "https://afcat.cdac.in/AFCAT/",
        "department": "Indian Air Force",
        "state": "All India",
    },
    {
        "name": "Central Teacher Eligibility Test (CTET)",
        "url": "https://ctet.nic.in",
        "notices_url": "https://ctet.nic.in",
        "department": "CBSE / CTET",
        "state": "All India",
    }
]


# =====================================================================
# 3. STATE-WISE GOVERNMENT OFFICIAL WEBSITES LIST
# =====================================================================
# You can add as many state links here as you want!
STATE_WISE_GOVT_LINKS = [
    # Uttar Pradesh
    {
        "name": "Uttar Pradesh PSC (UPPSC)",
        "url": "https://uppsc.up.nic.in",
        "notices_url": "https://uppsc.up.nic.in",
        "department": "UPPSC Prayagraj",
        "state": "Uttar Pradesh",
    },
    {
        "name": "UP Police Recruitment & Promotion Board (UPPRPB)",
        "url": "https://uppbpb.gov.in",
        "notices_url": "https://uppbpb.gov.in",
        "department": "UPPRPB Lucknow",
        "state": "Uttar Pradesh",
    },
    {
        "name": "UP Subordinate Staff Commission (UPSSSC)",
        "url": "http://upsssc.gov.in",
        "notices_url": "http://upsssc.gov.in",
        "department": "UPSSSC Lucknow",
        "state": "Uttar Pradesh",
    },

    # Bihar
    {
        "name": "Bihar Public Service Commission (BPSC)",
        "url": "https://bpsc.bih.nic.in",
        "notices_url": "https://bpsc.bih.nic.in",
        "department": "BPSC Patna",
        "state": "Bihar",
    },
    {
        "name": "Bihar Central Selection Board of Constable (CSBC)",
        "url": "https://csbc.bih.nic.in",
        "notices_url": "https://csbc.bih.nic.in",
        "department": "CSBC Bihar",
        "state": "Bihar",
    },

    # Rajasthan
    {
        "name": "Rajasthan Public Service Commission (RPSC)",
        "url": "https://rpsc.rajasthan.gov.in",
        "notices_url": "https://rpsc.rajasthan.gov.in/news",
        "department": "RPSC Ajmer",
        "state": "Rajasthan",
    },
    {
        "name": "Rajasthan Staff Selection Board (RSMSSB)",
        "url": "https://rsmssb.rajasthan.gov.in",
        "notices_url": "https://rsmssb.rajasthan.gov.in/page?menuName=latestNews",
        "department": "RSMSSB Jaipur",
        "state": "Rajasthan",
    },

    # Karnataka
    {
        "name": "Karnataka Public Service Commission (KPSC)",
        "url": "https://kpsc.kar.nic.in",
        "notices_url": "https://kpsc.kar.nic.in",
        "department": "KPSC Bengaluru",
        "state": "Karnataka",
    },

    # Maharashtra
    {
        "name": "Maharashtra Public Service Commission (MPSC)",
        "url": "https://mpsc.gov.in",
        "notices_url": "https://mpsc.gov.in",
        "department": "MPSC Mumbai",
        "state": "Maharashtra",
    },

    # Madhya Pradesh
    {
        "name": "Madhya Pradesh PSC (MPPSC)",
        "url": "https://mppsc.mp.gov.in",
        "notices_url": "https://mppsc.mp.gov.in",
        "department": "MPPSC Indore",
        "state": "Madhya Pradesh",
    },

    # Delhi
    {
        "name": "Delhi Subordinate Services Selection Board (DSSSB)",
        "url": "https://dsssb.delhi.gov.in",
        "notices_url": "https://dsssb.delhi.gov.in/current-vacancies",
        "department": "DSSSB Delhi NCT",
        "state": "Delhi",
    },

    # Haryana
    {
        "name": "Haryana Staff Selection Commission (HSSC)",
        "url": "https://hssc.gov.in",
        "notices_url": "https://hssc.gov.in/advertisements",
        "department": "HSSC Panchkula",
        "state": "Haryana",
    },

    # West Bengal
    {
        "name": "West Bengal PSC (WBPSC)",
        "url": "https://psc.wb.gov.in",
        "notices_url": "https://psc.wb.gov.in",
        "department": "WBPSC Kolkata",
        "state": "West Bengal",
    },
]


# =====================================================================
# 4. KEYWORD MAPPING RULES
# =====================================================================
KEYWORD_MAPPINGS = {
    "Admit Card": ["admit card", "hall ticket", "call letter", "city slip", "city intimation", "e-admit"],
    "Results": ["result", "merit list", "selected candidates", "cut off", "score card", "marks", "rank list"],
    "Answer Key": ["answer key", "response sheet", "objection", "master question paper", "answer keys"],
    "Jobs": ["recruitment", "vacancy", "notification", "apply online", "advertisement", "posts", "bharti"]
}
