/**
 * StudyMate Sarkari — Base Content Fetch Adapter
 *
 * Implements resilient, respectful HTTP fetching:
 * - Polite User-Agent identifying the verified educational engine
 * - Automatic SHA-256 content hashing for change detection
 * - Conditional GET (ETag / If-Modified-Since) to save government server bandwidth
 * - Robust AbortController timeout guards
 * - Safe response size limits to prevent out-of-memory errors
 */

import crypto from 'crypto';
import { ContentFetchAdapter, FetchAdapterOptions, FetchResult, JobSourceRecord } from '../types';

export abstract class BaseFetchAdapter implements ContentFetchAdapter {
  abstract readonly name: string;
  abstract readonly supportedTypes: string[];

  protected defaultTimeoutMs = 20000;
  protected maxBytesLimit = 10 * 1024 * 1024; // 10 MB

  protected defaultHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (StudyMate Sarkari Official Verification Engine; info@studymatesarkari.in)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,application/json;q=0.8,*/*;q=0.7',
    'Accept-Language': 'en-IN,en-GB,en;q=0.9,hi;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Connection': 'keep-alive',
  };

  abstract canHandle(source: JobSourceRecord): boolean;

  /**
   * Primary fetch execution
   */
  async fetch(source: JobSourceRecord, options: FetchAdapterOptions = {}): Promise<FetchResult> {
    const targetUrl = source.recruitment_url || source.official_url;
    const startMs = Date.now();
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const maxBytes = options.maxBytes || this.maxBytesLimit;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        ...this.defaultHeaders,
        ...(options.headers || {}),
      };

      if (options.userAgent) {
        headers['User-Agent'] = options.userAgent;
      }

      // Conditional GET headers if known
      const etag = options.conditionalEtag || source.etag;
      if (etag) {
        headers['If-None-Match'] = etag;
      }

      const lastMod = options.conditionalLastModified || source.last_modified;
      if (lastMod) {
        headers['If-Modified-Since'] = lastMod;
      }

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      const durationMs = Date.now() - startMs;
      const respEtag = response.headers.get('etag');
      const respLastMod = response.headers.get('last-modified');
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // 304 Not Modified check
      if (response.status === 304) {
        return {
          success: true,
          url: targetUrl,
          statusCode: 304,
          contentType,
          content: '',
          contentHash: source.content_hash || '',
          unchanged: true,
          etag: respEtag || etag,
          lastModified: respLastMod || lastMod,
          durationMs,
          adapterName: this.name,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          url: targetUrl,
          statusCode: response.status,
          contentType,
          content: '',
          contentHash: '',
          durationMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
          adapterName: this.name,
        };
      }

      // Check Content-Length if present
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > maxBytes) {
        return {
          success: false,
          url: targetUrl,
          statusCode: response.status,
          contentType,
          content: '',
          contentHash: '',
          durationMs,
          error: `Content length ${contentLengthHeader} bytes exceeds maximum limit of ${maxBytes} bytes`,
          adapterName: this.name,
        };
      }

      // Read array buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > maxBytes) {
        return {
          success: false,
          url: targetUrl,
          statusCode: response.status,
          contentType,
          content: '',
          contentHash: '',
          durationMs,
          error: `Response payload (${buffer.length} bytes) exceeds limit of ${maxBytes} bytes`,
          adapterName: this.name,
        };
      }

      // Compute content hash
      const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');
      const unchanged = Boolean(source.content_hash && source.content_hash === contentHash);

      // Process payload into string representation
      const textContent = await this.processPayload(buffer, contentType, targetUrl);

      return {
        success: true,
        url: response.url || targetUrl,
        statusCode: response.status,
        contentType,
        content: textContent,
        buffer,
        contentHash,
        unchanged,
        etag: respEtag,
        lastModified: respLastMod,
        durationMs,
        adapterName: this.name,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startMs;
      const isAbort = err.name === 'AbortError';

      return {
        success: false,
        url: targetUrl,
        statusCode: 0,
        contentType: '',
        content: '',
        contentHash: '',
        durationMs,
        error: isAbort ? `Request timed out after ${timeoutMs}ms` : (err?.message || 'Network request failed'),
        adapterName: this.name,
      };
    }
  }

  /**
   * Transforms raw bytes into text representation. Can be overridden by subclasses.
   */
  protected async processPayload(buffer: Buffer, contentType: string, _url: string): Promise<string> {
    // Default UTF-8 string conversion
    return buffer.toString('utf-8');
  }
}
