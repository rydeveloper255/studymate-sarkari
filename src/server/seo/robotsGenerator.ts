/**
 * StudyMate Sarkari — Robots.txt Generator
 * Directs search engines to crawl public content while disallowing internal scrapers, APIs, and search queries.
 */

const BASE_URL = 'https://sarkari.studymate.in';

export function generateRobotsTxt(): string {
  return `# StudyMate Sarkari — Robots Configuration
User-agent: *
Allow: /
Allow: /jobs
Allow: /jobs/*
Allow: /admit-card
Allow: /results
Allow: /answer-key
Allow: /updates
Allow: /updates/*
Allow: /about
Allow: /contact

# Disallow Internal Automation & API Routes
Disallow: /api/
Disallow: /api/internal/
Disallow: /search?*
Disallow: /search

# Crawl Delay for aggressive scrapers
Crawl-delay: 1

# Sitemaps
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-jobs.xml
Sitemap: ${BASE_URL}/sitemap-updates.xml
Sitemap: ${BASE_URL}/sitemap-states.xml
Sitemap: ${BASE_URL}/sitemap-static.xml
`.trim();
}
