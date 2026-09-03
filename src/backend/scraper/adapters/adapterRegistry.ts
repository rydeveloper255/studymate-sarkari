/**
 * StudyMate Sarkari — Modular Adapter Registry
 *
 * Coordinates and selects the appropriate content fetch adapter for any government job source:
 * - PDF Adapter for circulars/gazettes
 * - RSS Adapter for XML/Atom feeds
 * - JSON Adapter for REST APIs
 * - HTML Adapter for standard web noticeboards & portals
 */

import { ContentFetchAdapter, JobSourceRecord } from '../types';
import { HtmlFetchAdapter } from './htmlAdapter';
import { PdfFetchAdapter } from './pdfAdapter';
import { RssFetchAdapter } from './rssAdapter';
import { JsonFetchAdapter } from './jsonAdapter';

export class AdapterRegistry {
  private static instance: AdapterRegistry;
  private adapters: ContentFetchAdapter[] = [];
  private fallbackAdapter: ContentFetchAdapter;

  private constructor() {
    this.fallbackAdapter = new HtmlFetchAdapter();

    // Default adapters in descending specialization order
    this.adapters = [
      new PdfFetchAdapter(),
      new RssFetchAdapter(),
      new JsonFetchAdapter(),
      this.fallbackAdapter,
    ];
  }

  public static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }

  /**
   * Registers a new custom fetch adapter (inserted at beginning for higher priority)
   */
  public registerAdapter(adapter: ContentFetchAdapter): void {
    const existingIndex = this.adapters.findIndex((a) => a.name === adapter.name);
    if (existingIndex >= 0) {
      this.adapters[existingIndex] = adapter;
    } else {
      this.adapters.unshift(adapter);
    }
  }

  /**
   * Selects the best adapter for the given job source record
   */
  public getAdapterForSource(source: JobSourceRecord): ContentFetchAdapter {
    for (const adapter of this.adapters) {
      if (adapter.canHandle(source)) {
        return adapter;
      }
    }
    return this.fallbackAdapter;
  }

  /**
   * Returns list of all registered adapter names
   */
  public getRegisteredAdapterNames(): string[] {
    return this.adapters.map((a) => a.name);
  }
}
