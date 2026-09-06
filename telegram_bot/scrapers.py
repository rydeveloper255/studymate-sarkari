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
from bs4 import BeautifulSoup
from config import KEYWORD_MAPPINGS

logger = logging.getLogger(__name__)

# Standard browser user-agent to prevent blocking by government firewalls
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
}


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
        async with session.get(target_url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=15)) as response:
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
                }
                items.append(item)

            logger.info(f"✅ Scraped [{source['name']}]: Found {len(items)} notices")
            return items

    except Exception as e:
        logger.warning(f"⚠️ Failed to scrape [{source['name']}]: {e}")
        return items


async def scrape_all_sources(central_links: list, state_links: list) -> list:
    """Asynchronously scrapes all central and state portals concurrently."""
    all_sources = central_links + state_links
    all_results = []

    connector = aiohttp.TCPConnector(limit=10, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [scrape_portal(session, src) for src in all_sources]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for res in results:
            if isinstance(res, list):
                all_results.extend(res)

    # Deduplicate items by title
    seen_titles = set()
    unique_items = []
    for item in all_results:
        title_key = item["title"].lower().strip()
        if title_key not in seen_titles:
            seen_titles.add(title_key)
            unique_items.append(item)

    return unique_items
