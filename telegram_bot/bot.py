"""
=============================================================================
StudyMate Sarkari - Automated 24/7 Government Notification & Telegram Bot
=============================================================================
Author: StudyMate Sarkari Tech Team
Description:
  Automatically crawls central and state government recruitment websites
  every 1 hour, extracts new Sarkari Jobs, Admit Cards, Results & Answer Keys,
  saves deduplicated entries into your Supabase database according to your
  production SQL schema (jobs, admit_cards, results, answer_keys, notifications,
  latest_updates, scraper_logs, official_sources), and broadcasts alert
  bulletins to your Telegram Channel and Admin (ID: 5165363865).
=============================================================================
"""

import os
import sys
import time
import re
import hashlib
import asyncio
import logging
from datetime import datetime, date
from dotenv import load_dotenv

load_dotenv()

# Third-party dependencies (see requirements.txt)
try:
    import schedule
    from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
    from telegram.constants import ParseMode
    from supabase import create_client, Client
except ImportError as e:
    print(f"Missing dependency: {e}. Please run: pip install -r requirements.txt")

from config import (
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_ADMIN_ID,
    TELEGRAM_CHAT_ID,
    TELEGRAM_CHANNEL_ID,
    SUPABASE_URL,
    SUPABASE_KEY,
    SCRAPING_INTERVAL_HOURS,
    CENTRAL_GOVT_LINKS,
    STATE_WISE_GOVT_LINKS,
    KEYWORD_MAPPINGS
)
from scrapers import scrape_all_sources

# Logging Configuration
logging.basicConfig(
    format="%(asctime)s - [%(levelname)s] - %(message)s",
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("bot_activity.log", encoding="utf-8")
    ]
)
logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY and "YOUR_" not in SUPABASE_URL:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("✅ Supabase client connected successfully to production tables!")
    except Exception as e:
        logger.warning(f"⚠️ Supabase connection failed: {e}. Running in standalone mode.")
else:
    logger.info("ℹ️ Supabase credentials not set in .env. Bot will broadcast to Telegram directly.")

# Initialize Telegram Bot
bot: Bot = None
if TELEGRAM_BOT_TOKEN and "YOUR_" not in TELEGRAM_BOT_TOKEN:
    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    logger.info("✅ Telegram Bot initialized!")
else:
    logger.warning("⚠️ TELEGRAM_BOT_TOKEN not provided in .env!")

# In-memory caches for fast foreign key resolution
STATE_NAME_TO_ID = {}
STATE_CODE_TO_ID = {}
SOURCE_URL_TO_ID = {}
SOURCE_NAME_TO_ID = {}
FIRST_SOURCE_ID = None


def init_database_lookups():
    """Fetches states and official_sources from Supabase for instant FK lookups."""
    global STATE_NAME_TO_ID, STATE_CODE_TO_ID, SOURCE_URL_TO_ID, SOURCE_NAME_TO_ID, FIRST_SOURCE_ID
    if not supabase:
        return

    try:
        # 1. Load States mapping
        res = supabase.table("states").select("id, name, code").execute()
        if res.data:
            for s in res.data:
                STATE_NAME_TO_ID[s["name"].strip().lower()] = s["id"]
                STATE_CODE_TO_ID[s["code"].strip().upper()] = s["id"]
            logger.info(f"🗺️ Loaded {len(res.data)} Indian States & UTs into memory cache.")

        # 2. Load and auto-seed official_sources
        res_src = supabase.table("official_sources").select("id, name, source_url").execute()
        existing_urls = set()
        if res_src.data:
            for src in res_src.data:
                SOURCE_URL_TO_ID[src["source_url"].rstrip("/")] = src["id"]
                SOURCE_NAME_TO_ID[src["name"].lower().strip()] = src["id"]
                existing_urls.add(src["source_url"].rstrip("/"))
                if FIRST_SOURCE_ID is None:
                    FIRST_SOURCE_ID = src["id"]

        # If official_sources is not yet fully seeded, auto-seed from config links
        all_portals = CENTRAL_GOVT_LINKS + STATE_WISE_GOVT_LINKS
        new_sources_to_insert = []
        for portal in all_portals:
            clean_url = portal["url"].rstrip("/")
            if clean_url not in existing_urls:
                st_name = portal.get("state", "All India").strip()
                scope = "CENTRAL" if st_name in ["All India", "Central"] else "STATE"
                state_id = STATE_NAME_TO_ID.get(st_name.lower())

                new_sources_to_insert.append({
                    "name": portal["name"],
                    "scope": scope,
                    "state_id": state_id,
                    "source_url": portal["url"],
                    "source_type": "WEBSITE",
                    "check_interval_minutes": 60,
                    "status": "ACTIVE",
                    "is_active": True,
                })

        if new_sources_to_insert:
            logger.info(f"🌱 Seeding {len(new_sources_to_insert)} official government portals into public.official_sources...")
            ins_res = supabase.table("official_sources").insert(new_sources_to_insert).execute()
            if ins_res.data:
                for src in ins_res.data:
                    SOURCE_URL_TO_ID[src["source_url"].rstrip("/")] = src["id"]
                    SOURCE_NAME_TO_ID[src["name"].lower().strip()] = src["id"]
                    if FIRST_SOURCE_ID is None:
                        FIRST_SOURCE_ID = src["id"]
            logger.info("✅ Official government portals seeded into Supabase.")
    except Exception as e:
        logger.warning(f"⚠️ Notice on database lookups init: {e}")


def get_state_id(state_name: str):
    """Returns integer state_id from public.states if state is a state, else None."""
    if not state_name or state_name.lower() in ["all india", "central", "national", "defence forces", "banking sector"]:
        return None
    return STATE_NAME_TO_ID.get(state_name.strip().lower())


def get_source_id(source_name: str, source_url: str = None):
    """Returns official_source id for relational integrity."""
    if source_url:
        src_id = SOURCE_URL_TO_ID.get(source_url.rstrip("/"))
        if src_id:
            return src_id
    if source_name:
        src_id = SOURCE_NAME_TO_ID.get(source_name.lower().strip())
        if src_id:
            return src_id
    return FIRST_SOURCE_ID


def format_telegram_message(item: dict) -> str:
    """Formats scraped notification into an attractive Telegram Markdown bulletin."""
    category_emoji = {
        "Jobs": "💼",
        "Admit Card": "🎫",
        "Results": "🏆",
        "Answer Key": "🔑",
    }.get(item.get("category", "Jobs"), "📢")

    msg = (
        f"{category_emoji} *NEW SARKARI NOTIFICATION ALERT*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"📌 *Title:* {item['title']}\n"
        f"🏛️ *Department / Board:* {item.get('department', 'Govt of India')}\n"
        f"📂 *Category:* {item.get('category', 'Latest Job')}\n"
        f"📍 *Location:* {item.get('state', 'All India')}\n"
    )

    if item.get("vacancies"):
        msg += f"👥 *Total Posts:* `{item['vacancies']}`\n"
    if item.get("last_date"):
        msg += f"⏳ *Last Date / Exam:* `{item['last_date']}`\n"

    msg += (
        f"🕒 *Found:* {datetime.now().strftime('%d %b %Y, %I:%M %p')}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"⚡ _Verified directly from official government gazette portal._\n"
        f"🌐 *StudyMate Sarkari Gateway*"
    )
    return msg


async def send_startup_ping():
    """Sends confirmation ping to Admin Telegram ID (5165363865) on bot launch."""
    if not bot:
        return
    admin_id = str(TELEGRAM_ADMIN_ID or "5165363865")
    startup_msg = (
        "🚀 *StudyMate Sarkari Bot Online on Render/Server!*\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 *Admin Telegram ID:* `{admin_id}`\n"
        f"⏰ *Scrape Interval:* Every {SCRAPING_INTERVAL_HOURS} Hour(s)\n"
        f"🏛️ *Monitored Portals:* {len(CENTRAL_GOVT_LINKS)} Central + {len(STATE_WISE_GOVT_LINKS)} State Boards\n"
        f"💾 *Supabase Schema:* Connected to `jobs`, `admit_cards`, `results`, `answer_keys`, `latest_updates` ✅\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "⚡ _Automated crawler active. All breaking sarkari jobs will be saved and dispatched here!_"
    )
    try:
        await bot.send_message(
            chat_id=admin_id,
            text=startup_msg,
            parse_mode=ParseMode.MARKDOWN
        )
        logger.info(f"✅ Startup ping sent to Admin Telegram ID: {admin_id}")
    except Exception as e:
        logger.warning(f"⚠️ Could not send startup ping to {admin_id}: {e}")


async def send_telegram_alert(item: dict):
    """Sends notification to Telegram Admin (5165363865) and Channel with Direct Action buttons."""
    if not bot:
        logger.info(f"[SIMULATED TELEGRAM SEND] -> {item['title']}")
        return

    text = format_telegram_message(item)
    buttons = []
    
    if item.get("url"):
        buttons.append([InlineKeyboardButton("🔗 Open Official Notice / Apply", url=item["url"])])
    
    reply_markup = InlineKeyboardMarkup(buttons) if buttons else None

    # Collect destination recipients (Admin ID: 5165363865 + optional Channel)
    targets = set()
    if TELEGRAM_ADMIN_ID:
        targets.add(str(TELEGRAM_ADMIN_ID))
    if TELEGRAM_CHAT_ID:
        targets.add(str(TELEGRAM_CHAT_ID))
    if TELEGRAM_CHANNEL_ID and TELEGRAM_CHANNEL_ID != "@StudyMateSarkariLive":
        targets.add(str(TELEGRAM_CHANNEL_ID))
    
    if not targets:
        targets.add("5165363865")

    for target_chat in targets:
        try:
            await bot.send_message(
                chat_id=target_chat,
                text=text,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=reply_markup,
                disable_web_page_preview=False
            )
            logger.info(f"📢 Broadcasted to Telegram ({target_chat}): {item['title'][:50]}...")
        except Exception as e:
            logger.error(f"❌ Failed to broadcast to Telegram ({target_chat}): {e}")


def save_to_supabase(item: dict) -> bool:
    """
    Saves scraped notification into the corresponding Supabase table
    (jobs, admit_cards, results, answer_keys, or notifications)
    and also updates public.latest_updates for real-time website display.
    Returns True if a new record was inserted, False if already exists.
    """
    if not supabase:
        return True

    try:
        title = item["title"].strip()
        url = item.get("url", "").strip()
        category = item.get("category", "Jobs")
        state_name = item.get("state", "All India")
        source_name = item.get("source_site", "Govt Portal")
        source_url = item.get("source_url", url)

        # Generate unique source_key for deduplication constraint
        source_key = hashlib.md5(f"{title}_{url}".encode("utf-8")).hexdigest()
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:80]

        # Determine Scope & State
        is_central = state_name.lower() in ["all india", "central", "national", "defence forces", "banking sector"]
        scope = "CENTRAL" if is_central else "STATE"
        state_id = get_state_id(state_name)
        source_id = get_source_id(source_name, source_url)

        # Parse numeric vacancies if present
        vacancies_str = item.get("vacancies", "")
        vacancies_int = None
        if vacancies_str:
            num_match = re.search(r'\d+', vacancies_str.replace(',', ''))
            if num_match:
                vacancies_int = int(num_match.group(0))

        now_iso = datetime.utcnow().isoformat()
        today_iso = date.today().isoformat()

        # =========================================================
        # 1. CATEGORY: JOBS -> Save to public.jobs & latest_updates
        # =========================================================
        if category == "Jobs":
            # Check if exists
            query = supabase.table("jobs").select("id").eq("source_key", source_key)
            if source_id:
                query = query.eq("source_id", source_id)
            existing = query.execute()

            if existing.data and len(existing.data) > 0:
                return False  # Already present

            job_data = {
                "source_id": source_id,
                "source_key": source_key,
                "title": title,
                "slug": slug,
                "scope": scope,
                "state_id": state_id,
                "category": item.get("department", "Sarkari Job"),
                "total_vacancies": vacancies_int,
                "qualification": "10th / 12th / Graduate as per notification",
                "description": title,
                "notification_url": url,
                "apply_url": url,
                "official_website": source_url or url,
                "source_url": url,
                "published_at": now_iso,
                "status": "ACTIVE",
                "is_active": True,
            }
            ins = supabase.table("jobs").insert(job_data).execute()
            inserted_id = ins.data[0]["id"] if ins.data else None

            # Add to latest_updates view
            supabase.table("latest_updates").insert({
                "title": title,
                "category": "JOB",
                "scope": scope,
                "state_id": state_id,
                "reference_type": "jobs",
                "reference_id": inserted_id,
                "short_description": f"New Vacancy from {item.get('department', source_name)}. Total Posts: {vacancies_str or 'Check Notice'}",
                "source_url": url,
                "published_at": now_iso,
                "is_active": True,
            }).execute()

            logger.info(f"💾 [JOBS] Saved to Supabase: {title[:45]}...")
            return True

        # =========================================================
        # 2. CATEGORY: ADMIT CARD -> Save to public.admit_cards
        # =========================================================
        elif category == "Admit Card":
            query = supabase.table("admit_cards").select("id").eq("source_key", source_key)
            if source_id:
                query = query.eq("source_id", source_id)
            existing = query.execute()

            if existing.data and len(existing.data) > 0:
                return False

            admit_data = {
                "source_id": source_id,
                "source_key": source_key,
                "title": title,
                "exam_name": title,
                "scope": scope,
                "state_id": state_id,
                "download_url": url,
                "official_website": source_url or url,
                "source_url": url,
                "status": "RELEASED",
                "admit_card_release_date": today_iso,
                "is_active": True,
            }
            ins = supabase.table("admit_cards").insert(admit_data).execute()
            inserted_id = ins.data[0]["id"] if ins.data else None

            supabase.table("latest_updates").insert({
                "title": title,
                "category": "ADMIT_CARD",
                "scope": scope,
                "state_id": state_id,
                "reference_type": "admit_cards",
                "reference_id": inserted_id,
                "short_description": f"Hall Ticket / Admit Card released by {item.get('department', source_name)}",
                "source_url": url,
                "published_at": now_iso,
                "is_active": True,
            }).execute()

            logger.info(f"🎫 [ADMIT CARD] Saved to Supabase: {title[:45]}...")
            return True

        # =========================================================
        # 3. CATEGORY: RESULTS -> Save to public.results
        # =========================================================
        elif category == "Results":
            query = supabase.table("results").select("id").eq("source_key", source_key)
            if source_id:
                query = query.eq("source_id", source_id)
            existing = query.execute()

            if existing.data and len(existing.data) > 0:
                return False

            result_data = {
                "source_id": source_id,
                "source_key": source_key,
                "title": title,
                "exam_name": title,
                "scope": scope,
                "state_id": state_id,
                "result_url": url,
                "official_website": source_url or url,
                "source_url": url,
                "status": "DECLARED",
                "result_date": today_iso,
                "is_active": True,
            }
            ins = supabase.table("results").insert(result_data).execute()
            inserted_id = ins.data[0]["id"] if ins.data else None

            supabase.table("latest_updates").insert({
                "title": title,
                "category": "RESULT",
                "scope": scope,
                "state_id": state_id,
                "reference_type": "results",
                "reference_id": inserted_id,
                "short_description": f"Final Result / Merit List declared by {item.get('department', source_name)}",
                "source_url": url,
                "published_at": now_iso,
                "is_active": True,
            }).execute()

            logger.info(f"🏆 [RESULTS] Saved to Supabase: {title[:45]}...")
            return True

        # =========================================================
        # 4. CATEGORY: ANSWER KEY -> Save to public.answer_keys
        # =========================================================
        elif category == "Answer Key":
            query = supabase.table("answer_keys").select("id").eq("source_key", source_key)
            if source_id:
                query = query.eq("source_id", source_id)
            existing = query.execute()

            if existing.data and len(existing.data) > 0:
                return False

            key_data = {
                "source_id": source_id,
                "source_key": source_key,
                "title": title,
                "exam_name": title,
                "scope": scope,
                "state_id": state_id,
                "answer_key_url": url,
                "official_website": source_url or url,
                "source_url": url,
                "status": "RELEASED",
                "release_date": today_iso,
                "is_active": True,
            }
            ins = supabase.table("answer_keys").insert(key_data).execute()
            inserted_id = ins.data[0]["id"] if ins.data else None

            supabase.table("latest_updates").insert({
                "title": title,
                "category": "ANSWER_KEY",
                "scope": scope,
                "state_id": state_id,
                "reference_type": "answer_keys",
                "reference_id": inserted_id,
                "short_description": f"Official Exam Answer Key released by {item.get('department', source_name)}",
                "source_url": url,
                "published_at": now_iso,
                "is_active": True,
            }).execute()

            logger.info(f"🔑 [ANSWER KEY] Saved to Supabase: {title[:45]}...")
            return True

        # =========================================================
        # 5. OTHER NOTICES -> Save to public.notifications
        # =========================================================
        else:
            query = supabase.table("notifications").select("id").eq("source_key", source_key)
            if source_id:
                query = query.eq("source_id", source_id)
            existing = query.execute()

            if existing.data and len(existing.data) > 0:
                return False

            notif_data = {
                "source_id": source_id,
                "source_key": source_key,
                "title": title,
                "scope": scope,
                "state_id": state_id,
                "notification_type": "RECRUITMENT",
                "official_url": url,
                "source_url": url,
                "notification_date": today_iso,
                "is_active": True,
            }
            ins = supabase.table("notifications").insert(notif_data).execute()
            inserted_id = ins.data[0]["id"] if ins.data else None

            supabase.table("latest_updates").insert({
                "title": title,
                "category": "NOTIFICATION",
                "scope": scope,
                "state_id": state_id,
                "reference_type": "notifications",
                "reference_id": inserted_id,
                "short_description": f"Official notice from {item.get('department', source_name)}",
                "source_url": url,
                "published_at": now_iso,
                "is_active": True,
            }).execute()

            logger.info(f"📢 [NOTIFICATIONS] Saved to Supabase: {title[:45]}...")
            return True

    except Exception as e:
        logger.error(f"❌ Supabase insertion error for {item.get('title', '')[:30]}: {e}")
        return False


async def run_hourly_scrape_cycle():
    """Main job executed every hour."""
    cycle_start = datetime.utcnow()
    logger.info("=" * 60)
    logger.info(f"🚀 STARTING HOURLY CRAWL CYCLE AT {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Checking {len(CENTRAL_GOVT_LINKS)} Central + {len(STATE_WISE_GOVT_LINKS)} State Portals...")
    logger.info("=" * 60)

    # Scrape all configured portals
    discovered_items = await scrape_all_sources(CENTRAL_GOVT_LINKS, STATE_WISE_GOVT_LINKS)
    new_count = 0

    for item in discovered_items:
        is_new = save_to_supabase(item)
        if is_new:
            new_count += 1
            await send_telegram_alert(item)
            await asyncio.sleep(1.5)  # Telegram API rate limit protection

    logger.info(f"✅ Scraping cycle completed. {len(discovered_items)} total scanned, {new_count} new alerts saved & posted.")

    # Record crawl session in public.scraper_logs
    if supabase and FIRST_SOURCE_ID:
        try:
            supabase.table("scraper_logs").insert({
                "source_id": FIRST_SOURCE_ID,
                "started_at": cycle_start.isoformat(),
                "finished_at": datetime.utcnow().isoformat(),
                "status": "SUCCESS",
                "new_records": new_count,
                "updated_records": 0,
            }).execute()
        except Exception as err:
            logger.warning(f"⚠️ Could not record scraper_log: {err}")


def schedule_runner():
    """Configures scheduler to run every 1 hour continuously."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # Preload database lookups (states & official_sources)
    init_database_lookups()

    # Send startup confirmation ping to Admin (ID: 5165363865)
    loop.run_until_complete(send_startup_ping())

    # Run immediately once at bot startup
    loop.run_until_complete(run_hourly_scrape_cycle())

    # Schedule recurring job every hour
    schedule.every(SCRAPING_INTERVAL_HOURS).hours.do(
        lambda: loop.run_until_complete(run_hourly_scrape_cycle())
    )

    logger.info(f"⏰ Bot scheduler active: Scrapes scheduled every {SCRAPING_INTERVAL_HOURS} hour(s).")

    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║             STUDYMATE SARKARI TELEGRAM BOT               ║
    ║      Multi-Table Supabase Sync & Telegram Dispatcher     ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    try:
        schedule_runner()
    except KeyboardInterrupt:
        logger.info("🛑 Bot stopped by user (Ctrl+C). Exiting...")
