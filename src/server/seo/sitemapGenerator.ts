/**
 * StudyMate Sarkari — Dynamic XML Sitemap Generator
 * Produces valid sitemaps conforming to standard sitemaps.org XML schema.
 */

import { getAllActiveJobs, getAllActiveUpdates, getAllRegisteredSources } from '../../lib/server/supabaseAdmin';
import { ALL_STATES_AND_UTS } from '../../data/statesData';
import { serverCache } from '../../lib/server/cache/publicCache';

const BASE_URL = 'https://sarkari.studymate.in';
const CACHE_TTL_SECONDS = 900; // 15 minutes cache

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Builds the Main Unified Sitemap / Sitemap Index
 */
export async function generateSitemapIndex(): Promise<string> {
  const cached = serverCache.get<string>('sitemap_index');
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-jobs.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-updates.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-states.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`.trim();

  serverCache.set('sitemap_index', xml, CACHE_TTL_SECONDS, ['sitemap']);
  return xml;
}

/**
 * Generates Static Routes Sitemap
 */
export function generateStaticSitemap(): string {
  const cached = serverCache.get<string>('sitemap_static');
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    { path: '/', priority: '1.0', changefreq: 'hourly' },
    { path: '/jobs', priority: '0.9', changefreq: 'hourly' },
    { path: '/jobs/central', priority: '0.8', changefreq: 'daily' },
    { path: '/jobs/states', priority: '0.8', changefreq: 'daily' },
    { path: '/admit-card', priority: '0.9', changefreq: 'hourly' },
    { path: '/results', priority: '0.9', changefreq: 'hourly' },
    { path: '/answer-key', priority: '0.8', changefreq: 'daily' },
    { path: '/updates', priority: '0.9', changefreq: 'hourly' },
    { path: '/about', priority: '0.4', changefreq: 'monthly' },
    { path: '/contact', priority: '0.4', changefreq: 'monthly' },
  ];

  const urlsXml = staticRoutes
    .map(
      (r) => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`.trim();

  serverCache.set('sitemap_static', xml, CACHE_TTL_SECONDS, ['sitemap']);
  return xml;
}

/**
 * Generates Dynamic Job Postings Sitemap
 */
export async function generateJobsSitemap(): Promise<string> {
  const cached = serverCache.get<string>('sitemap_jobs');
  if (cached) return cached;

  const jobs = await getAllActiveJobs();

  const urlsXml = jobs
    .map((job) => {
      const slugOrId = job.slug || job.id;
      const lastmod = formatDate(job.published_date || (job as any).publishedDate);
      return `  <url>
    <loc>${BASE_URL}/jobs/${escapeXml(slugOrId)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`.trim();

  serverCache.set('sitemap_jobs', xml, CACHE_TTL_SECONDS, ['sitemap', 'jobs']);
  return xml;
}

/**
 * Generates Dynamic Updates Sitemap
 */
export async function generateUpdatesSitemap(): Promise<string> {
  const cached = serverCache.get<string>('sitemap_updates');
  if (cached) return cached;

  const updates = await getAllActiveUpdates();

  const urlsXml = updates
    .map((item) => {
      const lastmod = formatDate(item.update_date || (item as any).date);
      return `  <url>
    <loc>${BASE_URL}/updates/${escapeXml(item.id)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`.trim();

  serverCache.set('sitemap_updates', xml, CACHE_TTL_SECONDS, ['sitemap', 'updates']);
  return xml;
}

/**
 * Generates 36 States & UTs Sitemaps
 */
export function generateStatesSitemap(): string {
  const cached = serverCache.get<string>('sitemap_states');
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];

  const urlsXml = ALL_STATES_AND_UTS.map((state) => {
    return `  <url>
    <loc>${BASE_URL}/jobs/states/${escapeXml(state.slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`.trim();

  serverCache.set('sitemap_states', xml, CACHE_TTL_SECONDS, ['sitemap']);
  return xml;
}

/**
 * Generates Full Unified Sitemap (for single-file sitemap readers)
 */
export async function generateFullSitemap(): Promise<string> {
  const cached = serverCache.get<string>('sitemap_full');
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];
  const jobs = await getAllActiveJobs();
  const updates = await getAllActiveUpdates();

  const staticUrls = [
    { path: '/', priority: '1.0', changefreq: 'hourly' },
    { path: '/jobs', priority: '0.9', changefreq: 'hourly' },
    { path: '/jobs/central', priority: '0.8', changefreq: 'daily' },
    { path: '/jobs/states', priority: '0.8', changefreq: 'daily' },
    { path: '/admit-card', priority: '0.9', changefreq: 'hourly' },
    { path: '/results', priority: '0.9', changefreq: 'hourly' },
    { path: '/answer-key', priority: '0.8', changefreq: 'daily' },
    { path: '/updates', priority: '0.9', changefreq: 'hourly' },
    { path: '/about', priority: '0.4', changefreq: 'monthly' },
    { path: '/contact', priority: '0.4', changefreq: 'monthly' },
  ].map(
    (r) => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  );

  const stateUrls = ALL_STATES_AND_UTS.map((state) => {
    return `  <url>
    <loc>${BASE_URL}/jobs/states/${escapeXml(state.slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  const jobUrls = jobs.map((job) => {
    const slugOrId = job.slug || job.id;
    const lastmod = formatDate(job.published_date || (job as any).publishedDate);
    return `  <url>
    <loc>${BASE_URL}/jobs/${escapeXml(slugOrId)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  const updateUrls = updates.map((item) => {
    const lastmod = formatDate(item.update_date || (item as any).date);
    return `  <url>
    <loc>${BASE_URL}/updates/${escapeXml(item.id)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  const allUrls = [...staticUrls, ...stateUrls, ...jobUrls, ...updateUrls].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls}
</urlset>`.trim();

  serverCache.set('sitemap_full', xml, CACHE_TTL_SECONDS, ['sitemap', 'jobs', 'updates']);
  return xml;
}
