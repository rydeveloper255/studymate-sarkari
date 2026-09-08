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

# Try to import CrawlerHealthMonitor and PdfMetadataParser from smart_features
try:
    from smart_features import CrawlerHealthMonitor, PdfMetadataParser
except ImportError:
    class CrawlerHealthMonitor:
        @classmethod
        def record_scrape_result(cls, *args, **kwargs): pass
    class PdfMetadataParser:
        @classmethod
        def extract_metadata(cls, text, source_url=""): return {}

# Pool of realistic modern browser user-agents across Windows, Mac, Linux, Android, iOS
ROTATING_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36",
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
    Accepts all active, current, and upcoming notices across 2024, 2025, 2026, and 2027 cycles.
    Filters out only ancient, obsolete archives (2015-2022) when no recent context is present.
    """
    combined = f"{title} {href}".lower()

    # Reject ancient archives (2015-2022) only if no ongoing cycle (2024, 2025, 2026, 2027) is referenced
    ancient_years = ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"]
    has_recent = any(yr in combined for yr in ["2024", "2025", "2026", "2027"])
    for yr in ancient_years:
        if yr in combined and not has_recent:
            return False

    return True


def categorize_title(title: str) -> str:
    """
    Classifies notification into:
    1. Admit Card (Hall tickets, City slips, e-Admit cards)
    2. Results (Cutoffs, Merit lists, Scorecards, Selection lists)
    3. Answer Key (Tentative/Final keys, Response sheets, Objections)
    4. Pre-Vacancy / Notification (Short notices, Upcoming vacancies, Exam calendars, Corrigendums)
    5. Jobs (Direct vacancies, online applications, recruitment advertisements)
    """
    title_lower = title.lower()

    # Priority 1: Admit Card
    for kw in KEYWORD_MAPPINGS.get("Admit Card", []):
        if kw in title_lower:
            return "Admit Card"

    # Priority 2: Results
    for kw in KEYWORD_MAPPINGS.get("Results", []):
        if kw in title_lower:
            return "Results"

    # Priority 3: Answer Key
    for kw in KEYWORD_MAPPINGS.get("Answer Key", []):
        if kw in title_lower:
            return "Answer Key"

    # Priority 4: Pre-Vacancy / Upcoming Notification
    for kw in KEYWORD_MAPPINGS.get("Pre-Vacancy / Notification", []):
        if kw in title_lower:
            return "Pre-Vacancy / Notification"

    # Priority 5: Jobs
    for kw in KEYWORD_MAPPINGS.get("Jobs", []):
        if kw in title_lower:
            return "Jobs"

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
            selectors = [
                "table tr td a", "table a", "ul.notices a", "div.news a", ".whats-new a", 
                "div.marquee a", ".views-table a", "ul.latest-news a",
                "div#notice-board a", ".notification-list a", ".card-body a", ".content a"
            ]

            collected_links = []
            seen_hrefs = set()

            for selector in selectors:
                for a_tag in soup.select(selector):
                    href = a_tag.get("href", "").strip()
                    if href and href not in seen_hrefs:
                        seen_hrefs.add(href)
                        collected_links.append(a_tag)

            # If specific selectors didn't match, fallback to general 'a' tags
            if len(collected_links) < 3:
                for a_tag in soup.find_all("a"):
                    href = a_tag.get("href", "").strip()
                    if href and href not in seen_hrefs:
                        seen_hrefs.add(href)
                        collected_links.append(a_tag)

            # Process up to 35 candidates per portal
            for a_tag in collected_links[:35]:
                text = a_tag.get_text(strip=True)
                href = a_tag.get("href", "")

                # Skip empty or non-functional links
                if not text or len(text) < 8 or not href or href.startswith("#") or href.startswith("javascript:"):
                    continue

                # Clean title
                clean_title = re.sub(r'\s+', ' ', text).strip()
                
                # Filter out irrelevant header/footer navigation
                irrelevant = ["contact us", "privacy policy", "terms", "sitemap", "home", "about us", "skip to content", "feedback", "screen reader"]
                if any(irr in clean_title.lower() for irr in irrelevant):
                    continue

                # Filter out obsolete archives
                if not is_notice_after_cutoff(clean_title, href):
                    logger.debug(f"⏩ [CUTOFF FILTER] Skipped obsolete notice: {clean_title}")
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
                    "direct_login_url": full_url,
                    "server2_url": source.get("url", full_url),
                    "official_notice_pdf_url": full_url if full_url.lower().endswith(".pdf") else "",
                    "merit_list_pdf_url": full_url if full_url.lower().endswith(".pdf") else "",
                    "challenge_portal_url": full_url,
                }
                items.append(item)

            logger.info(f"✅ Scraped [{source['name']}]: Found {len(items)} notices")
            CrawlerHealthMonitor.record_scrape_result(source.get("name", "Unknown"), True, len(items))
            return items

    except Exception as e:
        logger.warning(f"⚠️ Failed to scrape [{source['name']}]: {e}")
        CrawlerHealthMonitor.record_scrape_result(source.get("name", "Unknown"), False, 0, str(e))
        return items


async def resolve_deep_links_for_item(session: aiohttp.ClientSession, item: dict) -> dict:
    """
    DEEP LINK & AUTOMATED METADATA RESOLVER SYSTEM:
    Transforms intermediate/homepage notices into direct candidate action URLs & parsed parameters:
    - Direct Candidate Login form (Server 1)
    - Direct PDF Roll Number List / Notification circular
    - Automated parsed vacancies, qualification, fee, and dates via PdfMetadataParser
    - Server 2 backup mirror
    - Direct Objection Portal URL
    """
    category = item.get("category", "")
    url = item.get("url", "")
    
    # If the URL is already a PDF document, mark it directly
    if url.lower().endswith(".pdf"):
        item["official_notice_pdf_url"] = url
        item["merit_list_pdf_url"] = url
        return item
    
    # For high-priority action categories, inspect intermediate page for real direct forms
    if category in ["Admit Card", "Results", "Answer Key", "Jobs"]:
        try:
            headers = get_browser_headers()
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=7)) as resp:
                if resp.status == 200:
                    page_html = await resp.text()
                    sub_soup = BeautifulSoup(page_html, "html.parser")
                    
                    # Extract page text for metadata parsing (vacancies, qualifications, dates, fee)
                    page_text = sub_soup.get_text(separator=" ", strip=True)
                    meta = PdfMetadataParser.extract_metadata(page_text, url)
                    if meta.get("vacancies") and not item.get("vacancies"):
                        item["vacancies"] = meta["vacancies"]
                    if meta.get("qualification"):
                        item["qualification"] = meta["qualification"]
                    if meta.get("age_limit"):
                        item["age_limit"] = meta["age_limit"]
                    if meta.get("fee"):
                        item["fee"] = meta["fee"]
                    if meta.get("last_date"):
                        item["last_date"] = meta["last_date"]

                    login_keywords = ["login", "download", "hall ticket", "admit card", "scorecard", "response sheet", "candidate", "click here", "roll number", "objection", "apply online"]
                    pdf_links = []
                    action_links = []
                    
                    for a_elem in sub_soup.find_all("a", href=True):
                        href = a_elem.get("href", "").strip()
                        txt = a_elem.get_text(strip=True).lower()
                        if not href or href.startswith("#") or href.startswith("javascript:"):
                            continue
                        
                        full_sub_url = urllib.parse.urljoin(url, href)
                        
                        if href.lower().endswith(".pdf"):
                            pdf_links.append(full_sub_url)
                        
                        if any(kw in txt for kw in login_keywords) or any(kw in href.lower() for kw in ["digialm", "login", "download", "online", "roll", "marksheet", "admit", "result", "answer", "apply"]):
                            action_links.append((txt, full_sub_url))
                    
                    if action_links:
                        # Pick best action link (prioritize digialm or login)
                        best_action = action_links[0][1]
                        for txt, link in action_links:
                            if any(k in link.lower() for k in ["digialm", "candidate-login", "eadmit", "onlinebpsc", "ibpsonline"]):
                                best_action = link
                                break
                        item["direct_login_url"] = best_action
                        if len(action_links) > 1:
                            item["server2_url"] = action_links[1][1]
                    
                    if pdf_links:
                        item["official_notice_pdf_url"] = pdf_links[0]
                        item["merit_list_pdf_url"] = pdf_links[0]
        except Exception as err:
            logger.debug(f"Deep link resolve non-blocking pass for {url}: {err}")

    return item


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

            # Human-like Anti-Bot Delay: Randomized jitter pause before next batch
            if batch_index < total_batches - 1:
                jitter_delay = round(delay_sec + random.uniform(0.3, 1.4), 2)
                logger.info(f"⏳ [ANTI-BOT JITTER] Pausing {jitter_delay}s before next batch of {batch_size} websites to avoid firewall/rate blocks...")
                await asyncio.sleep(jitter_delay)

    # Deduplicate items by title
    seen_titles = set()
    unique_items = []
    for item in all_results:
        title_key = item["title"].lower().strip()
        if title_key not in seen_titles:
            seen_titles.add(title_key)
            unique_items.append(item)

    # Resolve Deep Links for actionable items (Admit Cards, Results, Answer Keys)
    logger.info("🔗 [DEEP LINK RESOLVER] Processing direct candidate login forms & PDF circulars...")
    deep_resolve_connector = aiohttp.TCPConnector(limit=10, ssl=False)
    async with aiohttp.ClientSession(connector=deep_resolve_connector) as deep_session:
        resolve_tasks = []
        for itm in unique_items:
            if itm.get("category") in ["Admit Card", "Results", "Answer Key"]:
                resolve_tasks.append(resolve_deep_links_for_item(deep_session, itm))
        if resolve_tasks:
            await asyncio.gather(*resolve_tasks, return_exceptions=True)

    logger.info(f"🎯 [ALL BATCHES COMPLETE] Scraped all {total_sources} portals with Deep Links. Total unique notices found: {len(unique_items)}")
    return unique_items
