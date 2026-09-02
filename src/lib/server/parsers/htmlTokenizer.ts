/**
 * StudyMate Sarkari — Step 5: Safe Deterministic HTML Tokenizer & DOM Extractor
 *
 * Lightweight, zero-dependency HTML parser for structured extraction of
 * tables, rows, links, headings, meta tags, and text sections from government portals.
 */

import { stripHtmlAndSanitize, unescapeHtml } from '../normalizers/textNormalizer';

export interface HtmlLink {
  href: string;
  text: string;
  title?: string;
}

export interface HtmlTableCell {
  text: string;
  html: string;
  links: HtmlLink[];
}

export interface HtmlTableRow {
  cells: HtmlTableCell[];
}

export interface HtmlTable {
  headers: string[];
  rows: HtmlTableRow[];
}

export interface ParsedHtmlDocument {
  pageTitle: string;
  metaDescription: string;
  headings: { level: number; text: string }[];
  tables: HtmlTable[];
  links: HtmlLink[];
  paragraphs: string[];
}

/**
 * Parses raw HTML into structured tables, links, headings, and paragraphs.
 */
export function parseHtmlDocument(html: string): ParsedHtmlDocument {
  if (!html || typeof html !== 'string') {
    return {
      pageTitle: '',
      metaDescription: '',
      headings: [],
      tables: [],
      links: [],
      paragraphs: [],
    };
  }

  // 1. Extract Page Title
  let pageTitle = '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    pageTitle = stripHtmlAndSanitize(titleMatch[1]);
  }

  // 2. Extract Meta Description
  let metaDescription = '';
  const metaMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (metaMatch) {
    metaDescription = unescapeHtml(metaMatch[1]).trim();
  }

  // 3. Extract Headings (H1 to H4)
  const headings: { level: number; text: string }[] = [];
  const headingRegex = /<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let hMatch;
  while ((hMatch = headingRegex.exec(html)) !== null) {
    const text = stripHtmlAndSanitize(hMatch[2]);
    if (text) {
      headings.push({ level: parseInt(hMatch[1], 10), text });
    }
  }

  // 4. Extract Tables
  const tables: HtmlTable[] = [];
  const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tMatch;
  while ((tMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tMatch[1];
    const table = parseSingleTable(tableHtml);
    if (table.rows.length > 0) {
      tables.push(table);
    }
  }

  // 5. Extract Links
  const links = extractLinksFromHtml(html);

  // 6. Extract Paragraphs
  const paragraphs: string[] = [];
  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(html)) !== null) {
    const text = stripHtmlAndSanitize(pMatch[1]);
    if (text.length > 10) {
      paragraphs.push(text);
    }
  }

  return {
    pageTitle,
    metaDescription,
    headings,
    tables,
    links,
    paragraphs,
  };
}

/**
 * Extracts links from HTML fragment.
 */
export function extractLinksFromHtml(htmlFragment: string): HtmlLink[] {
  const links: HtmlLink[] = [];
  const aRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let aMatch;

  while ((aMatch = aRegex.exec(htmlFragment)) !== null) {
    const href = aMatch[1].trim();
    const text = stripHtmlAndSanitize(aMatch[2]);
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push({ href, text });
    }
  }

  return links;
}

/**
 * Parses rows and cells of an HTML table.
 */
function parseSingleTable(tableHtml: string): HtmlTable {
  const headers: string[] = [];
  const rows: HtmlTableRow[] = [];

  // Extract <th> headers
  const thRegex = /<th\b[^>]*>([\s\S]*?)<\/th>/gi;
  let thMatch;
  while ((thMatch = thRegex.exec(tableHtml)) !== null) {
    headers.push(stripHtmlAndSanitize(thMatch[1]));
  }

  // Extract <tr> rows
  const trRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const rowHtml = trMatch[1];
    const tdRegex = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: HtmlTableCell[] = [];
    let tdMatch;

    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      const cellHtml = tdMatch[1];
      const text = stripHtmlAndSanitize(cellHtml);
      const cellLinks = extractLinksFromHtml(cellHtml);
      cells.push({
        text,
        html: cellHtml,
        links: cellLinks,
      });
    }

    if (cells.length > 0) {
      rows.push({ cells });
    }
  }

  return { headers, rows };
}
