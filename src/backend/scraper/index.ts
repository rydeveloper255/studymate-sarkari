/**
 * StudyMate Sarkari — Core Scraper Engine Module Entrypoint
 *
 * Public API for backend scraping operations:
 * - CoreScraperEngine
 * - Supabase integration and source loader
 * - Modular Fetch Adapters (Html, Pdf, Rss, Json)
 * - AdapterRegistry
 * - Cutoff Validator (August 1, 2026 enforcement)
 * - Full type definitions
 */

export * from './types';
export * from './cutoffValidator';
export * from './supabaseClient';
export * from './adapters/adapterInterface';
export * from './adapters/baseAdapter';
export * from './adapters/htmlAdapter';
export * from './adapters/pdfAdapter';
export * from './adapters/rssAdapter';
export * from './adapters/jsonAdapter';
export * from './adapters/adapterRegistry';
export * from './coreScraperEngine';
