"""
=============================================================================
StudyMate Sarkari - Automated 24/7 Government Notification & Telegram Bot
=============================================================================
Author: StudyMate Sarkari Tech Team
Description:
  Automatically crawls central and state government recruitment websites
  every 1 hour, extracts new Sarkari Jobs, Admit Cards, Results & Answer Keys,
  saves deduplicated entries into your Supabase database, and instantly broadcasts
  formatted alert bulletins to your Telegram Channel and subscribers.
=============================================================================
"""

import os
import sys
import time
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv

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
        logger.info("✅ Supabase client connected successfully!")
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
        f"💾 *Supabase Sync:* {'Connected ✅' if supabase else 'Standalone / Direct Mode ⚠️'}\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "⚡ _Automated crawler active. All breaking sarkari jobs will be dispatched here!_"
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
    
    # Fallback to default user ID 5165363865
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
    Saves item to Supabase database with deduplication.
    Returns True if new item inserted, False if already exists.
    """
    if not supabase:
        return True

    try:
        # Check if notification already exists by unique title and url hash
        existing = (
            supabase.table("sarkari_notifications")
            .select("id")
            .eq("title", item["title"])
            .execute()
        )
        
        if existing.data and len(existing.data) > 0:
            return False  # Already exists

        # Insert new notification
        record = {
            "title": item["title"],
            "department": item.get("department", "Government Board"),
            "category": item.get("category", "Jobs"),
            "state": item.get("state", "All India"),
            "url": item.get("url", ""),
            "vacancies": item.get("vacancies", ""),
            "last_date": item.get("last_date", ""),
            "source_site": item.get("source_site", ""),
            "created_at": datetime.utcnow().isoformat(),
        }
        
        supabase.table("sarkari_notifications").insert(record).execute()
        logger.info(f"💾 Saved to Supabase: {item['title'][:40]}...")
        return True
    except Exception as e:
        logger.error(f"❌ Supabase insertion error: {e}")
        return False


async def run_hourly_scrape_cycle():
    """Main job executed every hour."""
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

    logger.info(f"✅ Scraping cycle completed. {len(discovered_items)} total scanned, {new_count} new alerts posted.")


def schedule_runner():
    """Configures scheduler to run every 1 hour continuously."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

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
    ║        Auto-Scraper & Supabase Real-time Dispatcher      ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    try:
        schedule_runner()
    except KeyboardInterrupt:
        logger.info("🛑 Bot stopped by user (Ctrl+C). Exiting...")
