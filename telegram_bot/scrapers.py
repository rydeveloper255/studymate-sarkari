"""
HTML Web Scrapers and Notice Extractors for Official Indian Government Portals.
Uses aiohttp and BeautifulSoup to safely parse latest recruitment notices,
results, admit cards, and PDF circulars with browser spoofing headers.
"""

import re
import urllib.parse
import aiohttp
import asyncio
import logging
import random
from bs4 import BeautifulSoup
from config import (
    KEYWORD_MAPPINGS,
    MIN_SCRAPE_DATE_STR,
    MIN_SCRAPE_YEAR,
    MIN_SCRAPE_MONTH,
    MIN_SCRAPE_DAY,
    SCRAPING_BATCH_SIZE,
    SCRAPING_BATCH_DELAY_SECONDS,
)

logger = logging.getLogger(__name__)

# List of realistic modern browser user-agents to simulate natural human browsing
ROTATING_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.80",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]

def get_browser_headers() -> dict:
    """Generates authentic browser headers to avoid anti-bot firewalls."""
    ua = random.choice(ROTATING_USER_AGENTS)
    return {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }


def is_notice_after_cutoff(title: str, href: str = "") -> bool:
    """
    STRICT MANDATE: Must only scrape data dated on or after 1 August 2026.
    Rejects older circulars (e.g. from 2021, 2022, 2023, 2024, 2025, or early 2026 prior to August).
    """
    combined = f"{title} {href}".lower()

    # 1. Reject explicit past years if no 2026/2027 context is present
    past_years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"]
    for yr in past_years:
        if yr in combined and "2026" not in combined and "2027" not in combined:
            return False

    # 2. Check for early 2026 months prior to August (Jan-July 2026)
    early_2026_patterns = [
        "jan 2026", "january 2026", "feb 2026", "february 2026",
        "mar 2026", "march 2026", "apr 2026", "april 2026",
        "may 2026", "jun 2026", "june 2026", "jul 2026", "july 2026",
        "-01-2026", "/01/2026", "-02-2026", "/02/2026",
        "-03-2026", "/03/2026", "-04-2026", "/04/2026",
        "-05-2026", "/05/2026", "-06-2026", "/06/2026",
        "-07-2026", "/07/2026"
    ]
    for pattern in early_2026_patterns:
        if pattern in combined:
            return False

    # 3. Parse explicit date patterns if present: DD-MM-YYYY or DD/MM/YYYY
    date_match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](20\d{2})', combined)
    if date_match:
        try:
            d = int(date_match.group(1))
            m = int(date_match.group(2))
            y = int(date_match.group(3))
            if y < 2026 or (y == 2026 and m < 8):
                return False
        except Exception:
            pass

    return True


def categorize_title(title: str) -> str:
    """Classifies a notification text into Jobs, Admit Card, Results, or Answer Key."""
    title_lower = title.lower()
    for category, keywords in KEYWORD_MAPPINGS.items():
        for kw in keywords:
            if kw in title_lower:
                return category
    return "Jobs"


def extract_vacancies(title: str) -> str:
    """Attempts to extract post count from notice string like (17,727 Posts)."""
    match = re.search(r'(\d[\d,]+)\s*(?:posts?|vacanc(?:y|ies)|openings?)', title, re.IGNORECASE)
    if match:
        return match.group(1)
    return ""


async def scrape_portal(session: aiohttp.ClientSession, source: dict) -> list:
    """Scrapes a single government portal and returns list of parsed notification items."""
    target_url = source.get("notices_url") or source.get("url")
    items = []

    try:
        headers = get_browser_headers()
        async with session.get(target_url, headers=headers, timeout=aiohttp.ClientTimeout(total=18)) as response:
            if response.status != 200:
                logger.warning(f"⚠️ [{source['name']}] HTTP status {response.status}")
                return items

            html = await response.text()
            soup = BeautifulSoup(html, "html.parser")

            # Look for common government portal notice structures
            links = []

            # Strategy 1: Look inside tables, marquees, news lists, and notice containers
            selectors = [
                "table a", "ul.notices a", "div.news a", ".whats-new a", 
                "div.marquee a", ".views-table a", "ul.latest-news a",
                "div#notice-board a", ".notification-list a", "a"
            ]

            for selector in selectors:
                found = soup.select(selector)
                if len(found) > 3:
                    links = found[:20]  # Take top 20 latest links
                    break

            for a_tag in links:
                text = a_tag.get_text(strip=True)
                href = a_tag.get("href", "")

                # Skip empty or navigational links
                if not text or len(text) < 10 or not href or href.startswith("#") or href.startswith("javascript:"):
                    continue

                # Clean title
                clean_title = re.sub(r'\s+', ' ', text).strip()
                
                # Filter out irrelevant header/footer text
                irrelevant = ["contact us", "privacy policy", "terms", "sitemap", "home", "about us", "skip to content"]
                if any(irr in clean_title.lower() for irr in irrelevant):
                    continue

                # STRICT MANDATE: Ignore data before 1 August 2026
                if not is_notice_after_cutoff(clean_title, href):
                    logger.debug(f"⏩ [CUTOFF FILTER] Skipped pre-August 2026 notice: {clean_title}")
                    continue

                # Make absolute URL
                full_url = urllib.parse.urljoin(target_url, href)
                category = categorize_title(clean_title)
                vacancies = extract_vacancies(clean_title)

                item = {
                    "title": clean_title,
                    "department": source.get("department", source.get("name")),
                    "category": category,
                    "state": source.get("state", "All India"),
                    "url": full_url,
                    "vacancies": vacancies,
                    "source_site": source.get("name"),
                    "source_url": source.get("url"),
                }
                items.append(item)

            logger.info(f"✅ Scraped [{source['name']}]: Found {len(items)} notices")
            return items

    except Exception as e:
        logger.warning(f"⚠️ Failed to scrape [{source['name']}]: {e}")
        return items


async def scrape_all_sources(central_links: list, state_links: list) -> list:
    """
    Intelligent Human-Simulated Batch Scraper:
    1. Divides the 250+ portals into batches of 15 websites.
    2. Scrapes each batch of 15 portals.
    3. Pauses for 2 seconds between batches to mimic human browsing and prevent IP blocking.
    """
    all_sources = central_links + state_links
    all_results = []
    total_sources = len(all_sources)
    batch_size = max(1, SCRAPING_BATCH_SIZE)
    delay_sec = max(0.5, SCRAPING_BATCH_DELAY_SECONDS)

    total_batches = (total_sources + batch_size - 1) // batch_size
    logger.info(f"🌐 [BATCH SCRAPER] Commencing crawl of {total_sources} portals across {total_batches} batches (Batch Size: {batch_size}, Delay: {delay_sec}s)")

    connector = aiohttp.TCPConnector(limit=15, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        for batch_index in range(total_batches):
            start_idx = batch_index * batch_size
            end_idx = min(start_idx + batch_size, total_sources)
            current_batch = all_sources[start_idx:end_idx]

            logger.info(f"🚀 [BATCH {batch_index + 1}/{total_batches}] Scraping websites {start_idx + 1} to {end_idx} ({len(current_batch)} portals)...")

            # Scrape this batch of 15 websites
            tasks = [scrape_portal(session, src) for src in current_batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            batch_found_count = 0
            for res in results:
                if isinstance(res, list):
                    all_results.extend(res)
                    batch_found_count += len(res)

            logger.info(f"✅ [BATCH {batch_index + 1}/{total_batches} DONE] Discovered {batch_found_count} notices from {len(current_batch)} websites.")

            # Human-like Anti-Bot Delay: 2 seconds pause before next batch
            if batch_index < total_batches - 1:
                logger.info(f"⏳ [ANTI-BOT HUMAN DELAY] Pausing {delay_sec}s before next batch of {batch_size} websites to avoid firewall blocks...")
                await asyncio.sleep(delay_sec)

    # Deduplicate items by title
    seen_titles = set()
    unique_items = []
    for item in all_results:
        title_key = item["title"].lower().strip()
        if title_key not in seen_titles:
            seen_titles.add(title_key)
            unique_items.append(item)

    logger.info(f"🎯 [ALL BATCHES COMPLETE] Scraped all {total_sources} portals. Total unique notices found: {len(unique_items)}")
    return unique_items
