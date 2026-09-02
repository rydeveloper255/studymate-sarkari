/**
 * StudyMate Sarkari — Step 5: Text & String Sanitizer and Slug Generator
 */

/**
 * Unescapes standard and numeric HTML entities.
 */
export function unescapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '—')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Strips HTML tags, comments, script/style blocks, and trims excess whitespace.
 */
export function stripHtmlAndSanitize(htmlOrText: string): string {
  if (!htmlOrText || typeof htmlOrText !== 'string') return '';

  let cleaned = htmlOrText
    // Remove script and style tags along with content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Replace block tags with newline/space
    .replace(/<\/(p|div|tr|h[1-6]|li|br)>/gi, ' ')
    .replace(/<br\s*[\/]?>/gi, ' ')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, ' ');

  cleaned = unescapeHtml(cleaned);

  // Normalize Unicode spaces, newlines, zero-width spaces
  return cleaned
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Generates an SEO-friendly URL slug.
 */
export function generateSlug(text: string, fallbackSuffix = ''): string {
  const sanitized = stripHtmlAndSanitize(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  const base = sanitized.length > 0 ? sanitized.slice(0, 80) : 'recruitment-notice';
  return fallbackSuffix ? `${base}-${fallbackSuffix}` : base;
}

/**
 * Cleans and formats titles consistently.
 */
export function normalizeTitle(title: string): string {
  let cleaned = stripHtmlAndSanitize(title);
  // Remove leading numbers or bullet markers (e.g., "1. ", "• ", "- ")
  cleaned = cleaned.replace(/^[\d+.)\-•\s]+/, '').trim();
  // Remove trailing dots, dashes
  cleaned = cleaned.replace(/[\s\-\.:]+$/, '').trim();
  return cleaned;
}
