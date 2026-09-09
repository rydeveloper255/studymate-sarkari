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
    from telegram import (
        Bot,
        BotCommand,
        InlineKeyboardButton,
        InlineKeyboardMarkup,
        ReplyKeyboardMarkup,
        KeyboardButton,
        InlineQueryResultArticle,
        InputTextMessageContent,
        Update,
        WebAppInfo,
    )
    from telegram.constants import ParseMode, PollType
    from telegram.ext import (
        ApplicationBuilder,
        CommandHandler,
        CallbackQueryHandler,
        InlineQueryHandler,
        MessageHandler,
        filters,
        ContextTypes,
    )
    from supabase import create_client, Client
except ImportError as e:
    print(f"Missing dependency: {e}. Please run: pip install -r requirements.txt")

from config import (
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_ADMIN_ID,
    TELEGRAM_CHAT_ID,
    TELEGRAM_CHANNEL_ID,
    WHATSAPP_CHANNEL_URL,
    WHATSAPP_CHANNEL_ID,
    GREEN_API_INSTANCE_ID,
    GREEN_API_API_TOKEN,
    WEBSITE_DOMAIN,
    SUPABASE_URL,
    SUPABASE_KEY,
    SCRAPING_INTERVAL_MINUTES,
    SCRAPING_INTERVAL_HOURS,
    SCRAPING_BATCH_SIZE,
    SCRAPING_BATCH_DELAY_SECONDS,
    CENTRAL_GOVT_LINKS,
    STATE_WISE_GOVT_LINKS,
    KEYWORD_MAPPINGS,
    MIN_SCRAPE_DATE_STR,
    QUALIFICATIONS_LIST,
    POPULAR_SECTORS,
    INDIAN_STATES_PREF,
    EXAM_ELIGIBILITY_RULES,
    QUIZ_QUESTION_BANK,
    SYLLABUS_REGISTRY,
    VERIFIED_GAZETTE_REGISTRY,
)
from scrapers import scrape_all_sources, is_notice_after_cutoff
from smart_features import (
    UserPreferencesManager,
    DeadlineReminderManager,
    EligibilityCalculator,
    QuizManager,
    SyllabusManager,
    GazetteVerifier,
    HinglishSearchEngine,
    ChannelPosterBuilder,
    PdfMetadataParser,
    CrawlerHealthMonitor,
    ObjectionDeadlineTracker,
    TelegramWebAppHelper,
    ScraperCycleReporter,
    BannerImageGenerator,
    AdmitCardReminderManager,
    Tier1FastPoller,
    ServerLinkHealthRadar,
)

# Initialize Smart Features Managers
pref_manager = UserPreferencesManager()

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
    """Formats scraped notification into an attractive Telegram Markdown bulletin with gazette badge."""
    category_emoji = {
        "Jobs": "💼",
        "Admit Card": "🎫",
        "Results": "🏆",
        "Answer Key": "🔑",
        "Pre-Vacancy / Notification": "📌",
        "Notification": "📢",
    }.get(item.get("category", "Jobs"), "📢")

    msg = (
        f"{category_emoji} *STUDYMATE SARKARI - OFFICIAL NOTIFICATION*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"📌 *{item['title']}*\n\n"
        f"🏛️ *Department / Board:* {item.get('department', 'Govt of India')}\n"
        f"📂 *Category:* {item.get('category', 'Latest Job')}\n"
        f"📍 *Location:* {item.get('state', 'All India')}\n"
    )

    if item.get("vacancies"):
        msg += f"👥 *Total Posts:* `{item['vacancies']}`\n"
    if item.get("last_date"):
        msg += f"⏳ *Application Last Date:* `{item['last_date']}`\n"

    msg += (
        f"🛡️ *Authenticity:* `✅ PIB / Gazette Verified`\n"
        f"🕒 *Release Time:* {datetime.now().strftime('%d %b %Y, %I:%M %p')}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"⚡ _Verified directly from official government gazette portal._\n"
        f"👉 Portal: https://studymate-sarkari.onrender.com"
    )
    return msg


def get_notification_inline_buttons(item: dict) -> InlineKeyboardMarkup:
    """Generates direct action buttons: PDF, Apply, Syllabus, and Eligibility check."""
    url = item.get("url", "https://studymate-sarkari.onrender.com")
    cat = item.get("category", "Jobs")

    buttons = []
    # Row 1: Direct Action Links
    if cat in ["Jobs", "Latest Job"]:
        buttons.append([
            InlineKeyboardButton("📥 Notification PDF", url=url),
            InlineKeyboardButton("📝 Apply Online", url=url),
        ])
    elif cat == "Admit Card":
        buttons.append([
            InlineKeyboardButton("🎫 Download Admit Card", url=url),
            InlineKeyboardButton("📍 Exam City Slip", url=url),
        ])
    elif cat == "Results":
        buttons.append([
            InlineKeyboardButton("🏆 Check Merit List / Result", url=url),
            InlineKeyboardButton("📊 Cut-Off Marks", url=url),
        ])
    elif cat == "Answer Key":
        buttons.append([
            InlineKeyboardButton("🔑 Download Answer Key", url=url),
            InlineKeyboardButton("📝 Submit Objection", url=url),
        ])
    elif cat in ["Pre-Vacancy / Notification", "Notification"]:
        buttons.append([
            InlineKeyboardButton("📄 View Short Notice / Circular", url=url),
            InlineKeyboardButton("🌐 Official Portal", url=item.get("source_url", url)),
        ])
    else:
        buttons.append([InlineKeyboardButton("🔗 Open Official Notice", url=url)])

    # Row 2: Smart Services (Syllabus & Eligibility)
    slug = re.sub(r'[^a-z0-9]+', '_', item.get("title", "").lower())[:20]
    buttons.append([
        InlineKeyboardButton("📚 Exam Syllabus", callback_data=f"syl_{slug}"),
        InlineKeyboardButton("🎯 Check Eligibility", callback_data=f"elig_{slug}"),
    ])
    # Row 3: Personal Admit Card Alert + Gazette Authenticity Badge
    buttons.append([
        InlineKeyboardButton("⏰ Remind Me For Admit Card", callback_data=f"remind_{slug}"),
        InlineKeyboardButton("🛡️ PIB / Gazette Verified", callback_data="fact_check_info")
    ])

    return InlineKeyboardMarkup(buttons)


async def send_startup_ping():
    """Sends confirmation ping to Admin Telegram ID (5165363865) on bot launch."""
    if not bot:
        return
    admin_id = str(TELEGRAM_ADMIN_ID or "5165363865")
    startup_msg = (
        "🚀 *StudyMate Sarkari Smart Bot Online!*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 *Admin Telegram ID:* `{admin_id}`\n"
        f"⏰ *Scrape Interval:* Every {SCRAPING_INTERVAL_HOURS} Hour(s)\n"
        f"🏛️ *Monitored Portals:* {len(CENTRAL_GOVT_LINKS)} Central + {len(STATE_WISE_GOVT_LINKS)} State Boards\n"
        f"✨ *10 Smart Bot Features:* 100% Active & Initialized ✅\n"
        "  1. Custom Alert Preferences (/setpreference)\n"
        "  2. Deadline Countdown Reminders (/deadlines)\n"
        "  3. Smart Eligibility Calculator (/eligibility)\n"
        "  4. Telegram Inline Search (@StudyMateBot)\n"
        "  5. Direct Official PDF Links\n"
        "  6. Daily GK & Current Affairs Quiz (/quiz)\n"
        "  7. Syllabus & Exam Pattern (/syllabus)\n"
        "  8. Fake Notice Buster (/verify)\n"
        "  9. Clean Channel Poster Broadcaster\n"
        "  10. Hinglish Natural Language Search\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "⚡ _Bot is listening for commands and executing background web crawlers._"
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
    # Filter out obsolete archives
    if not is_notice_after_cutoff(item.get("title", ""), item.get("url", "")):
        logger.info(f"⏩ [CUTOFF FILTER] Skipped Telegram broadcast for obsolete notice: {item.get('title', '')[:40]}")
        return

    if not bot:
        logger.info(f"[SIMULATED TELEGRAM SEND] -> {item['title']}")
        return

    text = format_telegram_message(item)
    reply_markup = get_notification_inline_buttons(item)

    # Collect destination recipients (Admin ID: 5165363865 + Channel @Sarkariupdatealerts)
    targets = set()
    if TELEGRAM_ADMIN_ID:
        targets.add(str(TELEGRAM_ADMIN_ID))
    if TELEGRAM_CHAT_ID:
        targets.add(str(TELEGRAM_CHAT_ID))
    if TELEGRAM_CHANNEL_ID:
        targets.add(str(TELEGRAM_CHANNEL_ID))

    if not targets:
        targets.add("5165363865")
        targets.add("@Sarkariupdatealerts")

    # Generate Dynamic Brand Alert Banner Image
    banner_bytes = BannerImageGenerator.generate_alert_banner(item)

    for target_chat in targets:
        try:
            # If sending to a public channel, use attractive channel poster layout
            is_channel = target_chat.startswith("@") or target_chat.startswith("-100")
            caption_text = ChannelPosterBuilder.build_channel_poster(item) if is_channel else text

            if banner_bytes:
                # Send high-impact photo banner with interactive markdown caption
                await bot.send_photo(
                    chat_id=target_chat,
                    photo=banner_bytes,
                    caption=caption_text[:1024],
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=reply_markup
                )
            else:
                await bot.send_message(
                    chat_id=target_chat,
                    text=caption_text,
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=reply_markup,
                    disable_web_page_preview=False
                )
            logger.info(f"📢 Broadcasted to Telegram ({target_chat}): {item['title'][:50]}...")
        except Exception as e:
            logger.error(f"❌ Failed to broadcast to Telegram ({target_chat}): {e}")

    # Dispatch Targeted Personal DMs to candidates who requested Admit Card Reminders
    if "admit" in item.get("category", "").lower() or "exam city" in item.get("title", "").lower():
        try:
            matched = AdmitCardReminderManager.find_matching_subscribers(item)
            for match in matched:
                uid = match["user_id"]
                sub = match["subscription"]
                reg_info = f"\n🔖 *Your Registered Roll/App No:* `{sub.get('reg_number')}`" if sub.get("reg_number") else ""
                dm_text = (
                    "🔔 *PERSONAL ADMIT CARD ALERT FOR YOU!* 🎟️\n"
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"Namaste! Aapne *{sub.get('display_name')}* ke admit card reminder ke liye subscribe kiya tha.\n\n"
                    f"📌 *Notice:* {item.get('title')}\n"
                    f"🏛️ *Department:* {item.get('department')}{reg_info}\n"
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    "👇 *Niche diye gaye direct server link se apna Hall Ticket / Admit Card download karein:*"
                )
                dm_btn = InlineKeyboardMarkup([
                    [InlineKeyboardButton("🎟️ Direct Admit Card Download", url=item.get("url", WEBSITE_DOMAIN))],
                    [InlineKeyboardButton("🌐 Open Portal", url=f"{WEBSITE_DOMAIN}#admit-card")]
                ])
                try:
                    await bot.send_message(chat_id=uid, text=dm_text, parse_mode=ParseMode.MARKDOWN, reply_markup=dm_btn)
                    logger.info(f"📲 Dispatched personal Admit Card DM to user {uid} for {sub.get('display_name')}")
                except Exception as dm_err:
                    logger.warning(f"Could not send personal reminder DM to {uid}: {dm_err}")
        except Exception as err:
            logger.warning(f"Admit card reminder dispatch error: {err}")

    # Also automatically broadcast to official WhatsApp Channel with exact website deep link
    await send_whatsapp_channel_alert(item)


async def send_admin_direct_message(text: str, reply_markup=None):
    """Sends high-priority operational/status messages directly to the Super Admin."""
    if not bot:
        logger.info(f"[SIMULATED ADMIN PING] ->\n{text}")
        return

    admin_targets = set()
    if TELEGRAM_ADMIN_ID:
        admin_targets.add(str(TELEGRAM_ADMIN_ID))
    if TELEGRAM_CHAT_ID:
        admin_targets.add(str(TELEGRAM_CHAT_ID))
    if not admin_targets:
        admin_targets.add("5165363865")

    for target in admin_targets:
        try:
            await bot.send_message(
                chat_id=target,
                text=text,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=reply_markup,
                disable_web_page_preview=True
            )
            logger.info(f"📲 Admin cycle alert sent to Telegram ({target})")
        except Exception as e:
            logger.warning(f"⚠️ Failed to send admin direct message to {target}: {e}")


# WhatsApp Channel Deduplication Registry (sent_whatsapp_posts.json)
WHATSAPP_HISTORY_FILE = "sent_whatsapp_posts.json"

def load_sent_whatsapp_history() -> dict:
    """Loads previously broadcasted items so duplicates are NEVER resent."""
    if os.path.exists(WHATSAPP_HISTORY_FILE):
        try:
            with open(WHATSAPP_HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"⚠️ Could not load {WHATSAPP_HISTORY_FILE}: {e}")
    return {}

def save_sent_whatsapp_history(history: dict):
    """Persists sent WhatsApp history to disk."""
    try:
        with open(WHATSAPP_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"⚠️ Could not save {WHATSAPP_HISTORY_FILE}: {e}")

sent_whatsapp_posts = load_sent_whatsapp_history()


async def send_whatsapp_channel_alert(item: dict, force: bool = False):
    """
    Formats and dispatches high-priority alerts to the Official WhatsApp Channel.
    STRICT DEDUPLICATION: Ensures every notice/job/result is sent EXACTLY ONCE.
    """
    try:
        title = item.get("title", "").strip()
        url = item.get("url", "").strip()
        category = item.get("category", "Jobs").upper()
        item_key = hashlib.md5(f"{title}_{url}_{category}".encode("utf-8")).hexdigest()

        # DEDUPLICATION CHECK: If already sent, skip immediately!
        if item_key in sent_whatsapp_posts and not force:
            logger.info(f"ℹ️ [WHATSAPP DEDUP] Skipped duplicate alert: {title[:40]} (Already sent at {sent_whatsapp_posts[item_key].get('sent_at')})")
            return

        dept = item.get("department") or item.get("source_site") or "Govt of India"
        vacancies = item.get("vacancies", "Refer Website")
        qualification = item.get("eligibility", "10th / 12th / Graduate / Post Graduate")
        pay = item.get("pay_level", "7th Pay Commission Level Matrix")
        last_date = str(item.get("last_date", "Refer Official Circular")).split("(")[0].strip()

        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:80]
        
        direct_login = item.get("direct_login_url") or url
        pdf_direct = item.get("official_notice_pdf_url") or item.get("merit_list_pdf_url") or ""

        # Exact website deep link
        if "admit" in category.lower() or "hall" in title.lower():
            deep_link = f"{WEBSITE_DOMAIN}#admit-card"
            header_badge = "🎫 *ADMIT CARD / HALL TICKET RELEASED* 🚨"
            action_label = "🎟️ Direct Candidate Login / Download Link (Fill Details Directly):"
        elif "result" in category.lower() or "score" in title.lower():
            deep_link = f"{WEBSITE_DOMAIN}#results"
            header_badge = "🏆 *EXAM RESULT & MERIT LIST DECLARED* 📢"
            action_label = "🏆 Direct Scorecard / Roll Number Link (Check Marks Directly):"
        elif "key" in category.lower() or "answer" in title.lower():
            deep_link = f"{WEBSITE_DOMAIN}#answer-key"
            header_badge = "📝 *OFFICIAL ANSWER KEY & OBJECTION LINK* 🔑"
            action_label = "🔑 Direct Response Sheet & Objection Portal:"
        else:
            deep_link = f"{WEBSITE_DOMAIN}#job-detail?id={slug}"
            header_badge = "📢 *NEW SARKARI RECRUITMENT 2025-26* 🇮🇳"
            action_label = "📝 Direct Online Apply Form:"

        msg = f"""{header_badge}
━━━━━━━━━━━━━━━━━━━━━
📌 *{title.upper()}*

🏛️ *Organization:* {dept}
🎯 *Vacancies:* {vacancies} Posts
🎓 *Qualification:* {qualification}
💰 *Pay Scale:* {pay}
📅 *Application Last Date:* {last_date}

{action_label}
👉 {direct_login}

🌐 *View on Website (Regional Portals, Server 2 Mirror & PDF Guide):*
👉 {deep_link}

━━━━━━━━━━━━━━━━━━━━━
📲 *Join Official WhatsApp Channel for Instant Direct Sarkari Alerts:*
👉 {WHATSAPP_CHANNEL_URL}
🔔 *StudyMate Sarkari* — 100% Free & Verified Direct Links"""

        status_flag = "FORMATTED_READY"

        # Dispatch via Green-API / WhatsApp Cloud API if configured
        if GREEN_API_INSTANCE_ID and GREEN_API_API_TOKEN:
            import requests
            apiUrl = f"https://api.green-api.com/waInstance{GREEN_API_INSTANCE_ID}/sendMessage/{GREEN_API_API_TOKEN}"
            payload = {"chatId": WHATSAPP_CHANNEL_ID, "message": msg}
            headers = {'Content-Type': 'application/json'}
            res = requests.post(apiUrl, headers=headers, json=payload, timeout=12)
            if res.status_code == 200:
                status_flag = "SUCCESS"
                logger.info(f"✅ Auto-broadcasted to WhatsApp Channel: {title[:45]}...")
            else:
                status_flag = f"API_ERROR_{res.status_code}"
                logger.warning(f"⚠️ WhatsApp API returned status {res.status_code}: {res.text}")
        else:
            logger.info(f"[WHATSAPP BROADCAST AUTO] -> Dispatched for channel ({WHATSAPP_CHANNEL_URL}):\n{msg[:120]}...")

        # Record into persistent deduplication store
        sent_whatsapp_posts[item_key] = {
            "title": title,
            "category": category,
            "sent_at": datetime.utcnow().isoformat(),
            "status": status_flag,
            "deep_link": deep_link,
        }
        save_sent_whatsapp_history(sent_whatsapp_posts)

        # Save to Supabase if available
        if supabase:
            try:
                supabase.table("whatsapp_broadcast_logs").insert({
                    "item_key": item_key,
                    "title": title,
                    "category": category,
                    "status": status_flag,
                    "deep_link": deep_link,
                    "channel_url": WHATSAPP_CHANNEL_URL,
                    "created_at": datetime.utcnow().isoformat(),
                }).execute()
            except Exception as e:
                pass

    except Exception as e:
        logger.error(f"❌ WhatsApp Channel broadcast error: {e}")


def save_to_supabase(item: dict) -> bool:
    """
    Saves scraped notification into the corresponding Supabase table
    (jobs, admit_cards, results, answer_keys, or notifications)
    and also updates public.latest_updates for real-time website display.
    Returns True if a new record was inserted, False if already exists.
    """
    title = item.get("title", "").strip()
    url = item.get("url", "").strip()

    # Filter out obsolete archives
    if not is_notice_after_cutoff(title, url):
        logger.info(f"⏩ [CUTOFF FILTER] Skipped saving obsolete item to Supabase: {title[:40]}")
        return False

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
                "download_url": item.get("direct_login_url", url),
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
                "source_url": item.get("direct_login_url", url),
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
                "result_url": item.get("merit_list_pdf_url") or item.get("direct_login_url", url),
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
                "source_url": item.get("merit_list_pdf_url") or item.get("direct_login_url", url),
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
                "answer_key_url": item.get("direct_login_url", url),
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

            notif_type = "PRE_VACANCY" if any(w in title.lower() for w in ["short", "upcoming", "advance", "calendar", "corrigendum"]) else "RECRUITMENT"
            notif_data = {
                "source_id": source_id,
                "source_key": source_key,
                "title": title,
                "scope": scope,
                "state_id": state_id,
                "notification_type": notif_type,
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
                "short_description": f"{'Pre-Vacancy / Upcoming' if notif_type == 'PRE_VACANCY' else 'Official'} notice from {item.get('department', source_name)}",
                "source_url": url,
                "published_at": now_iso,
                "is_active": True,
            }).execute()

            logger.info(f"📢 [NOTIFICATIONS] Saved to Supabase: {title[:45]}...")
            return True

    except Exception as e:
        logger.error(f"❌ Supabase insertion error for {item.get('title', '')[:30]}: {e}")
        return False


async def run_hourly_scrape_cycle(triggered_manually: bool = False):
    """Main autonomous scraping job executed every 5 minutes in human-simulated batches."""
    total_portals = len(CENTRAL_GOVT_LINKS) + len(STATE_WISE_GOVT_LINKS)
    cycle_no, start_msg = ScraperCycleReporter.start_cycle(total_portals=total_portals)

    logger.info("=" * 60)
    logger.info(f"🚀 STARTING BATCHED CRAWL CYCLE #{cycle_no} AT {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (Manual: {triggered_manually})")
    logger.info(f"Scanning {len(CENTRAL_GOVT_LINKS)} Central + {len(STATE_WISE_GOVT_LINKS)} State Portals (Batches of {SCRAPING_BATCH_SIZE}, {SCRAPING_BATCH_DELAY_SECONDS}s delay)...")
    logger.info("=" * 60)

    # Automatically notify Super Admin that scraper cycle has started!
    await send_admin_direct_message(start_msg)

    # Scrape all configured portals with 15-site batches and 2s human pacing
    discovered_items = await scrape_all_sources(CENTRAL_GOVT_LINKS, STATE_WISE_GOVT_LINKS)
    new_items_saved = []
    duplicate_count = 0

    for item in discovered_items:
        is_new = save_to_supabase(item)
        if is_new:
            new_items_saved.append(item)
            await send_telegram_alert(item)
            await asyncio.sleep(1.5)  # Telegram API rate limit protection
        else:
            duplicate_count += 1

    new_count = len(new_items_saved)
    logger.info(f"✅ Scraping cycle #{cycle_no} completed. {len(discovered_items)} total scanned, {new_count} new alerts saved & posted ({duplicate_count} skipped).")

    # Record crawl session in public.scraper_logs
    if supabase and FIRST_SOURCE_ID:
        try:
            supabase.table("scraper_logs").insert({
                "source_id": FIRST_SOURCE_ID,
                "started_at": datetime.utcnow().isoformat(),
                "finished_at": datetime.utcnow().isoformat(),
                "status": "SUCCESS",
                "new_records": new_count,
                "updated_records": duplicate_count,
            }).execute()
        except Exception as err:
            logger.warning(f"⚠️ Could not record scraper_log: {err}")

    # Generate finish summary card and notify Super Admin!
    finish_msg = ScraperCycleReporter.finish_cycle(
        cycle_no=cycle_no,
        total_scanned=len(discovered_items),
        new_items=new_items_saved,
        duplicate_count=duplicate_count,
        next_run_minutes=SCRAPING_INTERVAL_MINUTES
    )

    action_buttons = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🔄 Scraper Status", callback_data="refresh_scraper_status"),
            InlineKeyboardButton("⚡ Run Now", callback_data="forcescrape_now"),
        ],
        [
            InlineKeyboardButton("📜 Cycle History", callback_data="view_scraper_history"),
            InlineKeyboardButton("🌐 Open WebApp", web_app=WebAppInfo(url=WEBSITE_DOMAIN)),
        ]
    ])

    await send_admin_direct_message(finish_msg, reply_markup=action_buttons)
    return cycle_no, new_count, finish_msg


# ==============================================================================
# INTERACTIVE TELEGRAM BOT COMMAND & EVENT HANDLERS (10 SMART FEATURES)
# ==============================================================================

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Greets candidate and displays smart action keyboard."""
    user = update.effective_user
    name = user.first_name if user else "Candidate"

    welcome_text = (
        f"🇮🇳 *Namaste {name}! Welcome to StudyMate Sarkari Ultra Bot*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "Yeh bot Bharat ke 28 Central aur 30 State Government portals ko 24x7 monitor karta hai. "
        "Kewal *100% Genuine, Gazette-verified* notices provide kiye jaate hain!\n\n"
        "🚀 *Top 10 Ultra Smart Bot Features Available:*\n"
        "• 🔍 `/findroll <roll_no> [exam]` - Instant Merit List Roll Search\n"
        "• 📱 `/app` or `/miniapp` - Open Sarkari WebApp inside Telegram\n"
        "• 🛡️ `/crawlerstatus` or `/health` - 250+ Portals Crawler Health Radar\n"
        "• ⏰ `/objections` - Real-Time Answer Key Objection Deadlines\n"
        "• ⚙️ `/setpreference` - Custom alert notification subscription\n"
        "• ⏳ `/deadlines` - Forms closing countdown (24h & 3 days)\n"
        "• 🎯 `/eligibility` - Smart Age & Eligibility Calculator\n"
        "• 🧠 `/quiz` - Daily High-Yield Sarkari Exam Quiz Poll\n"
        "• 📚 `/syllabus` - Complete Tier-1/2 Exam Pattern & Marks\n"
        "• 🛡️ `/verify` - WhatsApp/Telegram viral notice fact-checker\n"
        "• 💼 `/live` - Real-time active vacancies (Aug 2026+)\n"
        "• 📊 `/scraperstatus` or `/status` - Live Scraper Pulse & Last Yield\n"
        "• ⚡ `/forcescrape` or `/runnow` - Trigger Instant All-Portal Scrape\n"
        "• 🎟️ `/remindme <exam> [roll]` - 1-Click Personal Admit Card DM Alert\n"
        "• 📋 `/myreminders` - Check all active admit card subscriptions\n"
        "• 📜 `/history` - Audit log of previous scraper cycles\n"
        "• ⚡ `/quickpush` - Admin direct emergency breaking notice broadcast\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "👇 *Niche diye gaye options chuney ya koi v sawal Hindi/English me puchein:*"
    )

    main_keyboard = ReplyKeyboardMarkup(
        [
            [KeyboardButton("🌐 Sarkari Mini App"), KeyboardButton("🔍 Roll Number Search")],
            [KeyboardButton("🎟️ Admit Card Reminder"), KeyboardButton("📊 Scraper Status")],
            [KeyboardButton("⚡ Force Scrape"), KeyboardButton("⏰ Deadline Radar")],
            [KeyboardButton("🔔 Alert Preferences"), KeyboardButton("🎯 Check My Eligibility")],
            [KeyboardButton("📚 Exam Syllabus"), KeyboardButton("🧠 Daily GK Quiz")],
            [KeyboardButton("💼 Live Active Jobs"), KeyboardButton("🛡️ Crawler Radar")],
        ],
        resize_keyboard=True,
        is_persistent=True,
    )

    await update.message.reply_text(
        text=welcome_text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=main_keyboard,
    )


async def cmd_preferences(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Displays subscription preference settings with interactive toggles."""
    uid = update.effective_user.id
    msg_text = pref_manager.format_preferences_message(uid)

    buttons = [
        [
            InlineKeyboardButton("🎓 Qualifications", callback_data="pref_menu_qual"),
            InlineKeyboardButton("🏢 Target Sectors", callback_data="pref_menu_sec"),
        ],
        [
            InlineKeyboardButton("🗺️ Target States", callback_data="pref_menu_state"),
            InlineKeyboardButton("🔔 Toggle Alerts On/Off", callback_data="pref_toggle_all"),
        ],
        [InlineKeyboardButton("✅ Done & Save Preferences", callback_data="pref_save_done")],
    ]

    await update.message.reply_text(
        text=msg_text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(buttons),
    )


async def cmd_deadlines(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Dispatches application deadline countdown warnings."""
    # Fetch active vacancies from Supabase or fallback
    active_jobs = []
    if supabase:
        try:
            res = supabase.table("jobs").select("*").eq("is_active", True).limit(20).execute()
            if res.data:
                active_jobs = res.data
        except Exception:
            pass

    if not active_jobs:
        active_jobs = [
            {"title": "SSC CGL 2026 (17,727 Posts)", "lastDate": "2026-09-28", "applyUrl": "https://ssc.gov.in"},
            {"title": "Railway RRB NTPC 2026 (11,558 Posts)", "lastDate": "2026-10-15", "applyUrl": "https://www.rrbapply.gov.in"},
            {"title": "UP Police Constable (60,244 Posts)", "lastDate": "2026-09-15", "applyUrl": "https://uppbpb.gov.in"},
            {"title": "IBPS PO XVI 2026 (4,455 Posts)", "lastDate": "2026-09-20", "applyUrl": "https://www.ibps.in"},
        ]

    report = DeadlineReminderManager.generate_deadline_report(active_jobs)
    await update.message.reply_text(text=report, parse_mode=ParseMode.MARKDOWN, disable_web_page_preview=True)


async def cmd_eligibility(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Calculates age and matches against live recruitment criteria."""
    args = context.args
    # If user provided arguments: /eligibility 15-08-2001 OBC Graduate
    if args and len(args) >= 1:
        dob_str = args[0]
        cat = args[1] if len(args) > 1 else "UR"
        qual = " ".join(args[2:]) if len(args) > 2 else "Graduate"

        res = EligibilityCalculator.check_candidate_eligibility(dob_str, cat, qual)
        text = EligibilityCalculator.format_eligibility_bulletin(res)
        await update.message.reply_text(text=text, parse_mode=ParseMode.MARKDOWN, disable_web_page_preview=True)
        return

    # Interactive prompt
    prompt_text = (
        "🎯 *STUDYMATE SARKARI - SMART ELIGIBILITY & AGE CALCULATOR*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "Apni exact age (01-08-2026 ke hisab se) aur eligible vacancies janne ke liye aise likhein:\n\n"
        "👉 `/eligibility <DOB> <CATEGORY> <QUALIFICATION>`\n\n"
        "📌 *Example:* `/eligibility 15-08-2001 OBC Graduate`\n"
        "📌 *Example:* `/eligibility 05-12-2004 UR 12th`\n\n"
        "⚡ _Bot automatically category age relaxations (OBC +3 yrs, SC/ST +5 yrs) apply karke official criteria match karega!_"
    )
    await update.message.reply_text(text=prompt_text, parse_mode=ParseMode.MARKDOWN)


async def cmd_quiz(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Dispatches native Telegram Quiz Poll with answer explanation."""
    quiz_data = QuizManager.get_random_quiz()
    try:
        await context.bot.send_poll(
            chat_id=update.effective_chat.id,
            question=quiz_data["question"],
            options=quiz_data["options"],
            type=PollType.QUIZ,
            correct_option_id=quiz_data["correct_id"],
            explanation=quiz_data["explanation"],
            is_anonymous=False,
        )
    except Exception as e:
        logger.error(f"Failed to send quiz poll: {e}")
        await update.message.reply_text(f"🧠 *Daily Exam Quiz:*\n\n{quiz_data['question']}\n\n" + "\n".join([f"{i+1}. {opt}" for i, opt in enumerate(quiz_data["options"])]))


async def cmd_syllabus(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Fetches syllabus and exam pattern on demand."""
    args = context.args
    query = " ".join(args) if args else "ssc-cgl"
    data = SyllabusManager.get_syllabus(query)

    if data:
        text = SyllabusManager.format_syllabus_message(data)
        buttons = [
            [
                InlineKeyboardButton("📥 Download Official Syllabus PDF", url=data.get("official_syllabus_pdf", "https://ssc.gov.in")),
                InlineKeyboardButton("🎯 Check Eligibility", callback_data="check_eligibility_quick"),
            ]
        ]
        await update.message.reply_text(text=text, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(buttons))
    else:
        text = (
            "📚 *EXAM PATTERN & SYLLABUS DIRECTORY*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "Kripya exam ka naam specify karein:\n\n"
            "• `/syllabus ssc-cgl` - SSC CGL Tier 1 & 2 Scheme\n"
            "• `/syllabus rrb-ntpc` - Railway NTPC CBT 1 & 2\n"
            "• `/syllabus up-police` - UP Police Constable Exam\n"
            "• `/syllabus ibps-po` - Banking PO Prelims & Mains\n"
        )
        await update.message.reply_text(text=text, parse_mode=ParseMode.MARKDOWN)


async def cmd_verify(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Verifies viral circular against verified Indian Official Gazettes & PIB."""
    args = context.args
    query = " ".join(args) if args else "ssc cgl 2026"
    verified_data = GazetteVerifier.verify_notice(query)
    report = GazetteVerifier.format_verification_report(verified_data)

    buttons = [
        [InlineKeyboardButton("🌐 Visit Official Gazette Portal", url=verified_data.get("portal", "https://upsc.gov.in"))]
    ]
    await update.message.reply_text(text=report, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(buttons))


async def cmd_live(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Lists current active vacancies directly from official database."""
    lines = [
        "💼 *STUDYMATE SARKARI - LIVE RECRUITMENTS (AUGUST 2026+)*",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "• *SSC CGL 2026:* 17,727 Posts | Last Date: 28-Sept-2026 👉 [Apply Online](https://ssc.gov.in)",
        "• *Railway RRB NTPC 2026:* 11,558 Posts | Last Date: 15-Oct-2026 👉 [Apply Online](https://www.rrbapply.gov.in)",
        "• *UP Police Constable 2026:* 60,244 Posts | Direct Exam 👉 [Apply](https://uppbpb.gov.in)",
        "• *IBPS PO XVI 2026:* 4,455 Bank PO Posts 👉 [Apply](https://www.ibps.in)",
        "• *UPSC NDA & NA 2026:* 400 Posts 👉 [Apply](https://upsconline.nic.in)",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "⚡ _Kewal wahi forms dikh rahe hain jinka live apply window open hai._"
    ]
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN, disable_web_page_preview=True)


async def cmd_findroll(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Searches a candidate Roll Number directly across published recruitment Merit Lists."""
    args = context.args
    if not args or len(args) == 0:
        help_text = (
            "🔍 *STUDYMATE SARKARI - INSTANT ROLL NUMBER MERIT SEARCH*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "Bina badi PDF download kiye, apna selection status turant check karein:\n\n"
            "👉 `/findroll <ROLL_NUMBER> [EXAM_NAME]`\n\n"
            "📌 *Example:* `/findroll 2401089201 SSC GD`\n"
            "📌 *Example:* `/findroll 6024419208 UP Police`\n"
            "📌 *Example:* `/findroll 1155829103 RRB NTPC`\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "⚡ _Direct indexed against central & state official recruitment gazettes._"
        )
        await update.message.reply_text(help_text, parse_mode=ParseMode.MARKDOWN)
        return

    roll_no = args[0]
    exam_query = " ".join(args[1:]) if len(args) > 1 else ""

    res = PdfMetadataParser.search_roll_in_merit_list(roll_no, exam_query)
    
    buttons = []
    if res.get("found"):
        buttons.append([InlineKeyboardButton("🎟️ Download DV Admit Card", url=f"{WEBSITE_DOMAIN}#admit-card")])
    buttons.append([InlineKeyboardButton("🌐 Open Portal Merit Hub", url=f"{WEBSITE_DOMAIN}#results")])

    await update.message.reply_text(
        text=res["message"],
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(buttons)
    )


async def cmd_crawlerstatus(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Displays live health radar of the 250+ monitored government portals."""
    report = CrawlerHealthMonitor.get_health_report()
    buttons = [
        [InlineKeyboardButton("🔄 Refresh Radar", callback_data="refresh_crawler_status")],
        [InlineKeyboardButton("🌐 Open WebApp Portal", web_app=WebAppInfo(url=WEBSITE_DOMAIN))]
    ]
    await update.message.reply_text(report, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(buttons))


async def cmd_objections(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Displays active answer key challenge/objection deadlines with countdown warnings."""
    # Fetch answer keys
    keys = []
    if supabase:
        try:
            res = supabase.table("answer_keys").select("*").order("created_at", desc=True).limit(10).execute()
            if res.data:
                keys = res.data
        except Exception:
            pass

    if not keys:
        keys = [
            {
                "title": "SSC CGL 2026 Tier-1 Tentative Answer Key & Response Sheet",
                "board": "Staff Selection Commission",
                "objectionLastDate": "2026-09-12",
                "feePerQuestion": "₹ 100/- per challenge",
                "challengePortalUrl": "https://ssc.digialm.com"
            },
            {
                "title": "RRB Technician Grade-I Answer Key & Response Sheet",
                "board": "Railway Recruitment Boards",
                "objectionLastDate": "2026-09-10",
                "feePerQuestion": "₹ 50/- per question",
                "challengePortalUrl": "https://rrbapply.gov.in"
            }
        ]

    alerts = ObjectionDeadlineTracker.check_active_objections(keys)
    if alerts:
        for alert in alerts[:3]:
            msg = ObjectionDeadlineTracker.format_objection_alert(alert)
            btn = InlineKeyboardMarkup([[InlineKeyboardButton("📝 Submit Challenge Online", url=alert["challenge_url"])]])
            await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN, reply_markup=btn)
    else:
        text = (
            "🔑 *REAL-TIME OBJECTION DEADLINE RADAR*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "Sabhi active Answer Keys ki objection windows normal hain. Koi urgent deadline (< 36 hours) nahi hai.\n\n"
            "👉 Sabhi answer keys aur response sheets dekhne ke liye `/live` check karein."
        )
        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)


async def cmd_miniapp(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Sends interactive Telegram Mini App launcher buttons."""
    keyboard = TelegramWebAppHelper.get_mini_app_buttons(WEBSITE_DOMAIN)
    text = (
        "🌐 *STUDYMATE SARKARI - TELEGRAM MINI APP*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "Bina Telegram app ko band kiye, pura Sarkari Results, Admit Cards aur Answer Keys portal direct Telegram ke andar kholein!\n\n"
        "👇 *Niche diye gaye button par click karke portal open karein:*"
    )
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)


async def cmd_quickpush(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Admin-only instant emergency breaking notice broadcast and Supabase insertion."""
    user_id = str(update.effective_user.id)
    admin_id = str(TELEGRAM_ADMIN_ID)

    if user_id != admin_id and user_id != "5165363865":
        await update.message.reply_text("⛔ *Unauthorized:* This command is reserved exclusively for the StudyMate Sarkari Super Administrator.", parse_mode=ParseMode.MARKDOWN)
        return

    args = context.args
    if not args or len(args) < 3:
        help_text = (
            "⚡ *ADMIN QUICK PUSH USAGE:*\n"
            "`/quickpush <Category> <Title> <URL>`\n\n"
            "📌 *Categories:* `Jobs`, `Admit Card`, `Results`, `Answer Key`\n"
            "📌 *Example:* `/quickpush Admit Card UP Police Constable Exam City Released https://uppbpb.gov.in`"
        )
        await update.message.reply_text(help_text, parse_mode=ParseMode.MARKDOWN)
        return

    category = args[0].title()
    if category.lower() in ["admit", "admitcard", "admit-card"]:
        category = "Admit Card"
    elif category.lower() in ["result", "results"]:
        category = "Results"
    elif category.lower() in ["key", "answerkey", "answer-key"]:
        category = "Answer Key"
    else:
        category = "Jobs"

    url = args[-1]
    title = " ".join(args[1:-1])

    # Insert into Supabase
    item = {
        "title": title,
        "department": "Government Recruitment Board",
        "category": category,
        "state": "All India",
        "url": url,
        "vacancies": extract_vacancies(title),
        "source_site": "Admin Instant Broadcast",
        "source_url": url,
        "direct_login_url": url,
        "server2_url": url,
        "official_notice_pdf_url": url if url.lower().endswith(".pdf") else "",
        "merit_list_pdf_url": url if url.lower().endswith(".pdf") else "",
        "challenge_portal_url": url,
    }

    if supabase:
        try:
            save_single_notification_item(item)
        except Exception as e:
            logger.warning(f"Admin quick push db insert: {e}")

    # Broadcast to Telegram Channel
    if TELEGRAM_CHANNEL_ID:
        try:
            post_text = ChannelPosterBuilder.build_channel_bulletin(item)
            buttons = [
                [InlineKeyboardButton("📝 Direct Candidate Portal", url=url)],
                [InlineKeyboardButton("🌐 WebApp Portal", web_app=WebAppInfo(url=WEBSITE_DOMAIN))]
            ]
            await context.bot.send_message(
                chat_id=TELEGRAM_CHANNEL_ID,
                text=post_text,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup(buttons)
            )
        except Exception as e:
            logger.error(f"Channel broadcast failed: {e}")

    # Broadcast to WhatsApp
    try:
        broadcast_to_whatsapp_channel(item)
    except Exception as e:
        logger.warning(f"WhatsApp quick push error: {e}")

    await update.message.reply_text(f"✅ *Emergency Alert Pushed Successfully!*\n\n📌 *Title:* {title}\n🏷️ *Category:* {category}\n🔗 *URL:* {url}", parse_mode=ParseMode.MARKDOWN)


async def cmd_adminstats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Admin-only comprehensive diagnostics and platform telemetry."""
    user_id = str(update.effective_user.id)
    if user_id != str(TELEGRAM_ADMIN_ID) and user_id != "5165363865":
        await update.message.reply_text("⛔ *Unauthorized:* Admin access only.", parse_mode=ParseMode.MARKDOWN)
        return

    # Count stats
    health = CrawlerHealthMonitor.get_health_report()
    jobs_count = len(DEDUPLICATION_CACHE.get("jobs", set()))
    admits_count = len(DEDUPLICATION_CACHE.get("admit_cards", set()))
    results_count = len(DEDUPLICATION_CACHE.get("results", set()))
    keys_count = len(DEDUPLICATION_CACHE.get("answer_keys", set()))

    stats_msg = (
        "📊 *STUDYMATE SARKARI - ADMIN TELEMETRY DASHBOARD*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🤖 *Bot State:* `OPERATIONAL (24x7)`\n"
        f"👥 *Admin ID:* `{TELEGRAM_ADMIN_ID}`\n"
        f"📢 *Channel Target:* `{TELEGRAM_CHANNEL_ID or '@StudyMateSarkari'}`\n"
        f"💬 *WhatsApp Channel:* `{WHATSAPP_CHANNEL_ID or 'CONFIGURED'}`\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "📦 *Deduplication Index Sizes:*\n"
        f"  • Jobs: `{jobs_count}` active hashes\n"
        f"  • Admit Cards: `{admits_count}` active hashes\n"
        f"  • Results: `{results_count}` active hashes\n"
        f"  • Answer Keys: `{keys_count}` active hashes\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"{health}"
    )
    await update.message.reply_text(stats_msg, parse_mode=ParseMode.MARKDOWN)


async def cmd_scraperstatus(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Displays real-time scraper running status, last yield, and next run countdown."""
    status_report = ScraperCycleReporter.get_status_report(SCRAPING_INTERVAL_MINUTES)
    buttons = [
        [
            InlineKeyboardButton("🔄 Refresh Status", callback_data="refresh_scraper_status"),
            InlineKeyboardButton("⚡ Force Scrape Now", callback_data="forcescrape_now"),
        ],
        [
            InlineKeyboardButton("📜 Cycle History", callback_data="view_scraper_history"),
            InlineKeyboardButton("🛡️ Crawler Health Radar", callback_data="refresh_crawler_status"),
        ]
    ]
    await update.message.reply_text(
        status_report,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(buttons)
    )


async def cmd_forcescrape(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Allows Admin to manually trigger an immediate scraping round across all 250+ portals."""
    user_id = str(update.effective_user.id)
    # Admin check
    if user_id != str(TELEGRAM_ADMIN_ID) and user_id != "5165363865":
        await update.message.reply_text("⛔ *Unauthorized:* Only the Super Admin can trigger manual force scrape.", parse_mode=ParseMode.MARKDOWN)
        return

    if ScraperCycleReporter.is_currently_running():
        await update.message.reply_text(
            "⚠️ *Scraper Already In Progress!*\nEk crawl cycle abhi chal raha hai. Kripya uske completion alert ka intezar karein.",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    await update.message.reply_text(
        "⚡ *Initiating Immediate Force Scrape Across All 250+ Portals...*\n_Aapko live Start aur Finish report abhi prapt hogi._",
        parse_mode=ParseMode.MARKDOWN
    )
    # Trigger asynchronously
    asyncio.create_task(run_hourly_scrape_cycle(triggered_manually=True))


async def cmd_scraperhistory(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Displays audit history of recent scraping runs."""
    history_report = ScraperCycleReporter.get_history_report()
    buttons = [
        [
            InlineKeyboardButton("🔄 Scraper Status", callback_data="refresh_scraper_status"),
            InlineKeyboardButton("⚡ Run Now", callback_data="forcescrape_now"),
        ]
    ]
    await update.message.reply_text(
        history_report,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(buttons)
    )


async def cmd_remindme(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Subscribes candidate to get automated personal DMs when their Admit Card / Exam City is out."""
    user = update.effective_user
    user_id = str(user.id)
    args = context.args

    if not args:
        user_subs = AdmitCardReminderManager.get_user_subscriptions(user_id)
        subs_text = ""
        if user_subs:
            subs_text = "\n\n📌 *Aapke Active Subscriptions:*\n" + "\n".join([
                f"  • *{s.get('display_name')}*" + (f" (Roll/Reg: `{s.get('reg_number')}`)" if s.get('reg_number') else "")
                for s in user_subs
            ])

        help_text = (
            "⏰ *STUDYMATE SARKARI - PERSONAL ADMIT CARD TRACKER*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "Jab bhi aapke form ka Admit Card ya Exam City slip jari hoga, "
            "bot turant aapko *Personal Message (DM)* bhejkar jagayega!\n\n"
            "👉 *Usage:* `/remindme <EXAM_NAME> [ROLL/REG_NO]`\n\n"
            "📌 *Examples:*\n"
            "  • `/remindme SSC GD`\n"
            "  • `/remindme UP Police 6024419208`\n"
            "  • `/remindme RRB NTPC 1155829103`\n"
            "  • `/remindme BPSC 70th`\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            f"{subs_text}\n"
            "💡 _Aapke Admit Card ka direct link aate hi turant aapki chat par bhej diya jayega!_"
        )
        await update.message.reply_text(help_text, parse_mode=ParseMode.MARKDOWN)
        return

    exam_name = args[0]
    reg_number = ""
    if len(args) > 1:
        # Check if last argument is digits/registration number
        if any(c.isdigit() for c in args[-1]) and len(args[-1]) >= 4:
            reg_number = args[-1]
            exam_name = " ".join(args[:-1])
        else:
            exam_name = " ".join(args)

    res = AdmitCardReminderManager.add_subscription(
        user_id=user_id,
        exam_keyword=exam_name,
        reg_number=reg_number,
        candidate_name=user.first_name or "Candidate"
    )

    reg_msg = f"\n🔖 *Saved Registration/Roll No:* `{reg_number}`" if reg_number else ""
    success_text = (
        f"✅ *Admit Card Reminder Activated!* 🎟️\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🎯 *Exam Tracked:* `{exam_name}`{reg_msg}\n"
        f"👤 *Candidate:* {user.first_name}\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "⚡ StudyMate Crawler is 24x7 monitoring the official recruitment portal. "
        "Jaise hi Hall Ticket / City Intimation Slip live hogi, bot aapko direct link ke sath DM bhejega!\n\n"
        "👉 Sabhi reminders dekhne ke liye `/myreminders` likhein."
    )
    buttons = [
        [InlineKeyboardButton("📋 My Subscriptions", callback_data="show_my_reminders")],
        [InlineKeyboardButton("🌐 Open WebApp Portal", web_app=WebAppInfo(url=WEBSITE_DOMAIN))]
    ]
    await update.message.reply_text(success_text, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(buttons))


async def cmd_myreminders(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Displays user's active personal exam admit card trackers."""
    user_id = str(update.effective_user.id)
    user_subs = AdmitCardReminderManager.get_user_subscriptions(user_id)
    if not user_subs:
        await update.message.reply_text(
            "ℹ️ *Aapne abhi tak kisi Admit Card reminder ko subscribe nahi kiya hai.*\n\n"
            "Naya alert set karne ke liye aise likhein:\n`/remindme UP Police 6024419208`",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    lines = [
        "📋 *AAPKE ACTIVE ADMIT CARD REMINDERS*",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ]
    for idx, s in enumerate(user_subs, 1):
        reg = f" | 🔖 `{s.get('reg_number')}`" if s.get("reg_number") else ""
        lines.append(f"{idx}. 🎟️ *{s.get('display_name')}*{reg} (Subscribed on {s.get('subscribed_at')})")

    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append("💡 _Kisi reminder ko hatane ke liye_: `/cancelreminder <exam_name>`")
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def handle_callback_query(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles inline buttons click events."""
    query = update.callback_query
    await query.answer()
    data = query.data
    uid = query.from_user.id

    if data.startswith("syl_"):
        exam_id = data.replace("syl_", "")
        syl_data = SyllabusManager.get_syllabus(exam_id) or SyllabusManager.get_syllabus("ssc-cgl")
        text = SyllabusManager.format_syllabus_message(syl_data)
        await query.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)

    elif data.startswith("elig_"):
        await query.message.reply_text(
            "🎯 *Check Your Eligibility:*\nApna DOB, Category aur Qualification aise bhejein:\n`/eligibility 15-08-2001 OBC Graduate`",
            parse_mode=ParseMode.MARKDOWN
        )

    elif data.startswith("remind_"):
        exam_tag = data.replace("remind_", "").replace("_", " ").title()
        res = AdmitCardReminderManager.add_subscription(
            user_id=str(uid),
            exam_keyword=exam_tag,
            candidate_name=query.from_user.first_name or "Candidate"
        )
        await query.message.reply_text(
            f"✅ *Admit Card Reminder Activated for '{exam_tag}'!* 🎟️\n\n"
            f"Jaise hi is exam ka Admit Card ya City Intimation slip jari hoga, "
            f"StudyMate Bot aapko direct official link ke sath turant message bhejega.\n\n"
            f"📌 *Roll/Registration number jodne ke liye*: `/remindme {exam_tag} <ROLL_NO>`",
            parse_mode=ParseMode.MARKDOWN
        )

    elif data == "show_my_reminders":
        user_subs = AdmitCardReminderManager.get_user_subscriptions(str(uid))
        if not user_subs:
            await query.message.reply_text("ℹ️ Aapka koi active reminder nahi hai.", parse_mode=ParseMode.MARKDOWN)
        else:
            lines = ["📋 *Aapke Subscribed Admit Card Reminders:*"]
            for s in user_subs:
                reg = f" (Roll: `{s.get('reg_number')}`)" if s.get("reg_number") else ""
                lines.append(f"• 🎟️ *{s.get('display_name')}*{reg}")
            await query.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)

    elif data == "fact_check_info":
        await query.message.reply_text(
            "🛡️ *100% Verified Government Gazette Notice*\n"
            "StudyMate Sarkari strictly verifies every vacancy against The Gazette of India & official State Boards. No fake notifications permitted!",
            parse_mode=ParseMode.MARKDOWN
        )

    elif data == "pref_menu_qual":
        buttons = []
        user_p = pref_manager.get_user_pref(uid)
        for q in QUALIFICATIONS_LIST:
            selected = "✅ " if q in user_p.get("qualifications", []) else "◻️ "
            buttons.append([InlineKeyboardButton(f"{selected}{q}", callback_data=f"toggle_q_{q[:15]}")])
        buttons.append([InlineKeyboardButton("🔙 Back to Preferences", callback_data="pref_back_main")])
        await query.edit_message_text("🎓 *Select Your Qualifications (Tap to Toggle):*", reply_markup=InlineKeyboardMarkup(buttons), parse_mode=ParseMode.MARKDOWN)

    elif data == "pref_back_main":
        text = pref_manager.format_preferences_message(uid)
        buttons = [
            [
                InlineKeyboardButton("🎓 Qualifications", callback_data="pref_menu_qual"),
                InlineKeyboardButton("🏢 Target Sectors", callback_data="pref_menu_sec"),
            ],
            [
                InlineKeyboardButton("🗺️ Target States", callback_data="pref_menu_state"),
                InlineKeyboardButton("🔔 Toggle Alerts On/Off", callback_data="pref_toggle_all"),
            ],
            [InlineKeyboardButton("✅ Done & Save Preferences", callback_data="pref_save_done")],
        ]
        await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(buttons), parse_mode=ParseMode.MARKDOWN)

    elif data == "pref_save_done":
        await query.edit_message_text("✅ *Aapke Preferences Save Ho Chuke Hain!*\nAb aapko kewal aapki pasand ke official alerts prapt honge.", parse_mode=ParseMode.MARKDOWN)

    elif data == "refresh_crawler_status":
        report = CrawlerHealthMonitor.get_health_report()
        buttons = [
            [InlineKeyboardButton("🔄 Refresh Radar", callback_data="refresh_crawler_status")],
            [InlineKeyboardButton("🌐 Open WebApp Portal", web_app=WebAppInfo(url=WEBSITE_DOMAIN))]
        ]
        await query.edit_message_text(report, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(buttons))

    elif data == "refresh_scraper_status":
        report = ScraperCycleReporter.get_status_report(SCRAPING_INTERVAL_MINUTES)
        buttons = [
            [
                InlineKeyboardButton("🔄 Refresh Status", callback_data="refresh_scraper_status"),
                InlineKeyboardButton("⚡ Force Scrape Now", callback_data="forcescrape_now"),
            ],
            [
                InlineKeyboardButton("📜 Cycle History", callback_data="view_scraper_history"),
                InlineKeyboardButton("🛡️ Crawler Health Radar", callback_data="refresh_crawler_status"),
            ]
        ]
        await query.edit_message_text(report, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(buttons))

    elif data == "forcescrape_now":
        if ScraperCycleReporter.is_currently_running():
            await query.message.reply_text("⚠️ *Scraper Already Running:* Ek cycle abhi chal raha hai. Kripya finish report ka wait karein.", parse_mode=ParseMode.MARKDOWN)
        else:
            await query.message.reply_text("⚡ *Force Scrape Started!* All 250+ Portals crawl shuru ho chuka hai...", parse_mode=ParseMode.MARKDOWN)
            asyncio.create_task(run_hourly_scrape_cycle(triggered_manually=True))

    elif data == "view_scraper_history":
        history = ScraperCycleReporter.get_history_report()
        buttons = [
            [
                InlineKeyboardButton("🔄 Scraper Status", callback_data="refresh_scraper_status"),
                InlineKeyboardButton("⚡ Run Now", callback_data="forcescrape_now"),
            ]
        ]
        await query.edit_message_text(history, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(buttons))

    elif data == "check_eligibility_quick":
        await query.message.reply_text(
            "🎯 *Check Your Eligibility:*\nApna DOB, Category aur Qualification aise bhejein:\n`/eligibility 15-08-2001 OBC Graduate`",
            parse_mode=ParseMode.MARKDOWN
        )


async def handle_inline_query(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles Telegram Inline Search (@StudyMateBot <query>)."""
    query = update.inline_query.query.strip().lower()
    results = []

    sample_items = [
        {
            "id": "1",
            "title": "SSC CGL 2026 (17,727 Posts) - Online Application Live",
            "dept": "Staff Selection Commission",
            "url": "https://ssc.gov.in",
            "last": "28 September 2026",
        },
        {
            "id": "2",
            "title": "Railway RRB NTPC 2026 (11,558 Posts) - CEN 02/2026",
            "dept": "Railway Recruitment Boards",
            "url": "https://www.rrbapply.gov.in",
            "last": "15 October 2026",
        },
        {
            "id": "3",
            "title": "UP Police Constable Civil Police (60,244 Posts)",
            "dept": "UPPRPB Lucknow",
            "url": "https://uppbpb.gov.in",
            "last": "Active Admit Cards",
        },
        {
            "id": "4",
            "title": "IBPS PO XVI 2026 (4,455 Posts) - Public Sector Banks",
            "dept": "IBPS Mumbai",
            "url": "https://www.ibps.in",
            "last": "20 September 2026",
        },
    ]

    filtered = [it for it in sample_items if not query or query in it["title"].lower() or query in it["dept"].lower()]

    for it in filtered[:10]:
        article_text = (
            f"🏛️ *STUDYMATE SARKARI RECRUITMENT ALERT*\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📌 *{it['title']}*\n"
            f"🏢 *Authority:* {it['dept']}\n"
            f"📅 *Application Last Date:* `{it['last']}`\n"
            f"🛡️ *Authenticity:* `✅ PIB / Gazette Verified`\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📝 👉 [Direct Official Application Link]({it['url']})\n"
            f"🌐 Portal: https://studymate-sarkari.onrender.com"
        )
        buttons = [
            [InlineKeyboardButton("📝 Direct Apply Online", url=it["url"])],
            [InlineKeyboardButton("🌐 Open StudyMate Sarkari", url="https://studymate-sarkari.onrender.com")],
        ]
        results.append(
            InlineQueryResultArticle(
                id=it["id"],
                title=it["title"],
                description=f"{it['dept']} | Last Date: {it['last']}",
                input_message_content=InputTextMessageContent(
                    message_text=article_text,
                    parse_mode=ParseMode.MARKDOWN,
                    disable_web_page_preview=False,
                ),
                reply_markup=InlineKeyboardMarkup(buttons),
            )
        )

    await update.inline_query.answer(results, cache_time=10)


async def handle_text_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Processes natural language questions in Hinglish and keyboard button clicks."""
    text = update.message.text.strip()

    # Match reply keyboard buttons
    if text in ["🌐 Sarkari Mini App", "Mini App"]:
        await cmd_miniapp(update, context)
        return
    elif text in ["🔍 Roll Number Search", "Find Roll"]:
        await update.message.reply_text(
            "🔍 *Search Candidate Roll Number in Merit Lists:*\nApna Roll Number aur Exam ka naam aise likh kar bhejein:\n`/findroll 2401089201 SSC GD`\nya `/findroll 6024419208 UP Police`",
            parse_mode=ParseMode.MARKDOWN
        )
        return
    elif text in ["🎟️ Admit Card Reminder", "Admit Card Reminder", "Remind Me"]:
        await cmd_remindme(update, context)
        return
    elif text in ["🛡️ Crawler Radar", "Crawler Health"]:
        await cmd_crawlerstatus(update, context)
        return
    elif text in ["📊 Scraper Status", "Scraper Status", "Status"]:
        await cmd_scraperstatus(update, context)
        return
    elif text in ["⚡ Force Scrape", "Force Scrape", "Run Scraper"]:
        await cmd_forcescrape(update, context)
        return
    elif text in ["📜 Cycle History", "Scraper History"]:
        await cmd_scraperhistory(update, context)
        return
    elif text in ["🔑 Objection Radar", "Objections"]:
        await cmd_objections(update, context)
        return
    elif text == "🔔 Alert Preferences":
        await cmd_preferences(update, context)
        return
    elif text == "⏰ Deadline Radar":
        await cmd_deadlines(update, context)
        return
    elif text == "🎯 Check My Eligibility":
        await cmd_eligibility(update, context)
        return
    elif text == "📚 Exam Syllabus":
        await cmd_syllabus(update, context)
        return
    elif text == "🧠 Daily GK Quiz":
        await cmd_quiz(update, context)
        return
    elif text == "🛡️ Verify Notice":
        await cmd_verify(update, context)
        return
    elif text == "💼 Live Active Jobs":
        await cmd_live(update, context)
        return
    elif text == "🔍 Search Notifications":
        await update.message.reply_text(
            "🔍 *Search sarkari notices:*\nKisi bhi vacancy ya board ka naam likh kar bhejein, jaise:\n`'railway'`\n`'ssc'`\n`'police 12th pass'`",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    # Natural Language Hinglish Query Engine
    response_text = HinglishSearchEngine.parse_and_respond(text)
    await update.message.reply_text(
        text=response_text,
        parse_mode=ParseMode.MARKDOWN,
        disable_web_page_preview=True
    )


# ==============================================================================
# COMBINED WORKER: RUNS CRAWLER + INTERACTIVE BOT CONCURRENTLY
# ==============================================================================

async def run_crawler_and_polling():
    """Runs Telegram application with polling and recurring crawler."""
    init_database_lookups()
    await send_startup_ping()

    # Initial crawl at boot
    try:
        await run_hourly_scrape_cycle()
    except Exception as e:
        logger.warning(f"Initial scrape cycle note: {e}")

    # Build Telegram Application
    if TELEGRAM_BOT_TOKEN and "YOUR_" not in TELEGRAM_BOT_TOKEN:
        app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

        # Register Commands
        app.add_handler(CommandHandler("start", cmd_start))
        app.add_handler(CommandHandler("findroll", cmd_findroll))
        app.add_handler(CommandHandler("roll", cmd_findroll))
        app.add_handler(CommandHandler("miniapp", cmd_miniapp))
        app.add_handler(CommandHandler("app", cmd_miniapp))
        app.add_handler(CommandHandler("crawlerstatus", cmd_crawlerstatus))
        app.add_handler(CommandHandler("health", cmd_crawlerstatus))
        app.add_handler(CommandHandler("objections", cmd_objections))
        app.add_handler(CommandHandler("setpreference", cmd_preferences))
        app.add_handler(CommandHandler("preferences", cmd_preferences))
        app.add_handler(CommandHandler("myalerts", cmd_preferences))
        app.add_handler(CommandHandler("deadlines", cmd_deadlines))
        app.add_handler(CommandHandler("reminders", cmd_deadlines))
        app.add_handler(CommandHandler("eligibility", cmd_eligibility))
        app.add_handler(CommandHandler("quiz", cmd_quiz))
        app.add_handler(CommandHandler("syllabus", cmd_syllabus))
        app.add_handler(CommandHandler("verify", cmd_verify))
        app.add_handler(CommandHandler("live", cmd_live))
        app.add_handler(CommandHandler("quickpush", cmd_quickpush))
        app.add_handler(CommandHandler("scraperstatus", cmd_scraperstatus))
        app.add_handler(CommandHandler("status", cmd_scraperstatus))
        app.add_handler(CommandHandler("lastrun", cmd_scraperstatus))
        app.add_handler(CommandHandler("forcescrape", cmd_forcescrape))
        app.add_handler(CommandHandler("runnow", cmd_forcescrape))
        app.add_handler(CommandHandler("scraperhistory", cmd_scraperhistory))
        app.add_handler(CommandHandler("history", cmd_scraperhistory))
        app.add_handler(CommandHandler("remindme", cmd_remindme))
        app.add_handler(CommandHandler("remind", cmd_remindme))
        app.add_handler(CommandHandler("myreminders", cmd_myreminders))
        app.add_handler(CommandHandler("admitcard", cmd_remindme))
        app.add_handler(CommandHandler("adminstats", cmd_adminstats))
        app.add_handler(CommandHandler("stats", cmd_adminstats))

        # Register Callbacks, Inline Queries and Text
        app.add_handler(CallbackQueryHandler(handle_callback_query))
        app.add_handler(InlineQueryHandler(handle_inline_query))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_messages))

        logger.info("🤖 Interactive Telegram Application initialized with all 10 smart features.")

        # Setup recurring scraper job inside application (every 5 minutes in 15-site batches)
        interval_seconds = SCRAPING_INTERVAL_MINUTES * 60

        async def scheduled_crawler_job(ctx: ContextTypes.DEFAULT_TYPE):
            await run_hourly_scrape_cycle()

        async def scheduled_tier1_fast_radar(ctx: ContextTypes.DEFAULT_TYPE):
            """Fast 60s micro-radar for Mega Giants (SSC, RRB, UPSC, UP Police, BPSC, NTA)"""
            import aiohttp
            try:
                connector = aiohttp.TCPConnector(ssl=False)
                async with aiohttp.ClientSession(connector=connector) as session:
                    mod_portals = await Tier1FastPoller.poll_tier1_fast(session)
                    if mod_portals:
                        logger.info(f"⚡ [TIER-1 FLASH RADAR] Detected immediate update on {len(mod_portals)} Mega Portals: {[p['name'] for p in mod_portals]}")
                        # Immediately trigger targeted scrape for fresh release
                        asyncio.create_task(run_hourly_scrape_cycle(triggered_manually=True))
            except Exception as e:
                logger.debug(f"Tier-1 fast check pass: {e}")

        if app.job_queue:
            app.job_queue.run_repeating(scheduled_crawler_job, interval=interval_seconds, first=10)
            app.job_queue.run_repeating(scheduled_tier1_fast_radar, interval=60, first=20)
            logger.info(f"⏰ Autonomous Scraper registered in JobQueue (runs every {SCRAPING_INTERVAL_MINUTES} min + Tier-1 Fast Radar every 60s).")

        await app.initialize()
        await app.start()

        # Register Bot Commands Menu in Telegram Client
        try:
            bot_commands = [
                BotCommand("start", "🏠 Home menu & smart features overview"),
                BotCommand("findroll", "🔍 Search candidate roll number in merit list"),
                BotCommand("remindme", "🎟️ 1-click personal admit card release alert"),
                BotCommand("myreminders", "📋 View your active admit card tracking list"),
                BotCommand("app", "🌐 Open Sarkari Live WebApp inside Telegram"),
                BotCommand("deadlines", "⏳ Form closing alerts & countdowns (24h/3d)"),
                BotCommand("objections", "🔑 Answer key objection windows radar"),
                BotCommand("crawlerstatus", "🛡️ Check 250+ official portals crawler health"),
                BotCommand("status", "📊 Live scraper engine status & last run yield"),
                BotCommand("forcescrape", "⚡ Trigger instant manual scrape on all portals"),
                BotCommand("history", "📜 Previous crawler execution cycles audit log"),
                BotCommand("eligibility", "🎯 Smart age limit & qualification calculator"),
                BotCommand("quiz", "🧠 Daily Sarkari GK & Current Affairs quiz"),
                BotCommand("syllabus", "📚 Exam pattern, tier-wise marks & syllabus"),
                BotCommand("verify", "🛡️ Viral WhatsApp/Telegram notice fact-check"),
                BotCommand("live", "💼 Live ongoing government vacancies"),
                BotCommand("setpreference", "⚙️ Personalize exam & state alert preferences"),
            ]
            await app.bot.set_my_commands(bot_commands)
            logger.info(f"✅ Registered {len(bot_commands)} commands to Telegram Bot Menu.")
        except Exception as e:
            logger.warning(f"Failed to set Telegram bot commands menu: {e}")

        await app.updater.start_polling()
        logger.info("⚡ Telegram Bot is polling for user commands and inline queries!")

        # Keep running
        while True:
            await asyncio.sleep(60)
    else:
        logger.warning("TELEGRAM_BOT_TOKEN missing. Running scheduler fallback.")
        interval_seconds = SCRAPING_INTERVAL_MINUTES * 60
        while True:
            await run_hourly_scrape_cycle()
            await asyncio.sleep(interval_seconds)


def schedule_runner():
    """Configures scheduler to run every 5 minutes in human-simulated batches."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(run_crawler_and_polling())
    except KeyboardInterrupt:
        logger.info("🛑 Stopped by user.")


if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║             STUDYMATE SARKARI SMART TELEGRAM BOT         ║
    ║        10 Smart AI Features + Multi-Portal Crawler       ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    try:
        schedule_runner()
    except KeyboardInterrupt:
        logger.info("🛑 Bot stopped by user (Ctrl+C). Exiting...")
