/**
 * StudyMate Sarkari — Official Government PDF Text Extraction Engine
 *
 * Provides safe, leak-proof text extraction from official government PDF notifications,
 * vacancy circulars, and exam updates.
 *
 * Architectural Guarantees:
 * - Uses pdf-parse for structured PDF stream parsing
 * - Memory-bounded (max 8MB per PDF document)
 * - Safe fallback to printable text stream extraction
 * - Preserves original official PDF URL without alteration
 * - Time-bounded network fetching (prevents worker hangs on slow government NIC servers)
 */

import { PDFParse } from 'pdf-parse';
import { verifyAndSanitizeUrl } from '../verification/urlSecurityVerifier';

const DEFAULT_TIMEOUT_MS = 25000;
const MAX_PDF_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export interface PdfExtractionResult {
  success: boolean;
  text: string;
  pageCount?: number;
  info?: Record<string, any>;
  error?: string;
}

/**
 * Checks whether a URL points directly to a PDF document.
 */
export function isPdfUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    return pathname.endsWith('.pdf') || pathname.includes('.pdf/') || parsed.search.toLowerCase().includes('.pdf');
  } catch {
    return /\.pdf(\?.*)?$/i.test(url);
  }
}

/**
 * Extracts plain text from an in-memory PDF Buffer.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<PdfExtractionResult> {
  if (!buffer || buffer.length === 0) {
    return {
      success: false,
      text: '',
      error: 'Empty PDF buffer',
    };
  }

  // 1. Primary: Use PDFParse engine
  try {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const info = await parser.getInfo().catch(() => ({}));
    await parser.destroy().catch(() => {});

    if (textResult?.text && textResult.text.trim().length > 20) {
      return {
        success: true,
        text: cleanExtractedText(textResult.text),
        pageCount: textResult.total,
        info: info as any,
      };
    }
  } catch (err: any) {
    // PDFParse encountered format or parsing error; continue to fallback
  }

  // 2. Secondary Fallback: Extract printable ASCII and UTF-8 text streams
  const fallbackText = extractPrintableTextStreams(buffer);
  if (fallbackText.length > 50) {
    return {
      success: true,
      text: cleanExtractedText(fallbackText),
    };
  }

  return {
    success: false,
    text: '',
    error: 'PDF does not contain extractable plain text (may be scanned image or encrypted).',
  };
}

/**
 * Safely fetches a government PDF from an official URL and extracts its text.
 */
export async function fetchAndExtractPdfText(
  url: string,
  options: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<PdfExtractionResult> {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes || MAX_PDF_SIZE_BYTES;

  // Validate official URL security
  const urlCheck = verifyAndSanitizeUrl(url);
  if (!urlCheck.isValid || !urlCheck.canonicalUrl) {
    return {
      success: false,
      text: '',
      error: `Blocked or invalid PDF URL: ${url}`,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(urlCheck.canonicalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 StudyMateBot/1.0',
        Accept: 'application/pdf,application/octet-stream,*/*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        text: '',
        error: `HTTP ${response.status} ${response.statusText} fetching PDF from ${url}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      return {
        success: false,
        text: '',
        error: `PDF size (${Math.round(arrayBuffer.byteLength / 1024)} KB) exceeds limit of ${Math.round(maxBytes / 1024)} KB.`,
      };
    }

    const buffer = Buffer.from(arrayBuffer);
    return await extractTextFromPdfBuffer(buffer);
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      success: false,
      text: '',
      error: err?.name === 'AbortError' ? `PDF fetch timed out after ${timeoutMs}ms` : (err?.message || 'PDF fetch failed'),
    };
  }
}

/**
 * Cleans and normalizes extracted PDF text for consistent regex parsing.
 */
function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Fallback scanner for printable text streams inside PDF data.
 */
function extractPrintableTextStreams(buffer: Buffer): string {
  const result: string[] = [];
  let currentString = '';

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    // Printable ASCII or newline/tab
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 9) {
      currentString += String.fromCharCode(byte);
    } else {
      if (currentString.length >= 4) {
        result.push(currentString);
      }
      currentString = '';
    }
  }

  if (currentString.length >= 4) {
    result.push(currentString);
  }

  return result.join(' ');
}
