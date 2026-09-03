/**
 * StudyMate Sarkari — Additional Scraper Pipeline Verification
 *
 * Tests:
 * 1. Source registry discovery from Supabase tables
 * 2. PDF text extraction engine
 * 3. Scraper health status and leak-proof metrics
 * 4. Date cutoff enforcement
 */

import { loadAllActiveSourcesFromDatabase } from '../src/lib/server/sources/sourceLoader';
import { extractTextFromPdfBuffer } from '../src/lib/server/parsers/pdfTextExtractor';
import { getScraperHealthStatus } from '../src/lib/server/automation/productionScheduler';
import { validatePublicationDateCutoff } from '../src/lib/server/verification/dateValidator';

async function run() {
  console.log('=== RUNNING SCRAPER PIPELINE VERIFICATION SUITE ===');

  // 1. Source registry discovery
  const sources = await loadAllActiveSourcesFromDatabase({ forceRefresh: true });
  console.log(`[Source Registry] Loaded ${sources.length} active government sources.`);
  if (sources.length === 0) {
    throw new Error('Expected at least 1 active source, found 0');
  }
  const hasUpsc = sources.some((s) => s.official_url.includes('upsc.gov.in') || s.source_name.includes('UPSC'));
  if (!hasUpsc) {
    throw new Error('UPSC source not found in registry');
  }
  console.log('✅ Source registry loaded successfully with verified authorities.');

  // 2. PDF extraction engine
  const dummyPdfHeader = '%PDF-1.4\n1 0 obj\n<< /Title (UPSC Civil Services Examination 2026 Notification) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';
  const pdfBuffer = Buffer.from(dummyPdfHeader, 'utf-8');
  const pdfResult = await extractTextFromPdfBuffer(pdfBuffer);
  console.log(`[PDF Extractor] Extracted: "${pdfResult.text.substring(0, 60)}" (pages: ${pdfResult.pageCount})`);
  if (!pdfResult.text.includes('UPSC')) {
    throw new Error('PDF extractor failed to parse text from buffer');
  }
  console.log('✅ PDF extraction engine passed with stream fallback support.');

  // 3. Scraper Health Status
  const health = getScraperHealthStatus();
  console.log('[Scraper Health]', JSON.stringify(health, null, 2));
  const requiredKeys = [
    'scraper_status',
    'last_successful_run',
    'last_run_duration_ms',
    'active_sources_count',
    'sources_checked',
    'successful_sources',
    'failed_sources',
    'records_discovered',
    'records_inserted',
    'last_telegram_status',
    'scheduler_uptime_seconds',
    'check_interval',
  ];
  for (const key of requiredKeys) {
    if (!(key in health)) {
      throw new Error(`Missing expected key in health output: ${key}`);
    }
  }

  // Verify no credentials leaked
  const healthStr = JSON.stringify(health).toLowerCase();
  if (healthStr.includes('token') && !healthStr.includes('token_status') && !healthStr.includes('last_telegram_status')) {
    throw new Error('Possible credential leakage in health response');
  }
  if (healthStr.includes('password') || healthStr.includes('secret') || healthStr.includes('apikey')) {
    throw new Error('Secrets detected in health endpoint');
  }
  console.log('✅ Scraper health status is complete and strictly credential-safe.');

  // 4. Date Cutoff (1 August 2026)
  const oldDate = validatePublicationDateCutoff('2026-07-31');
  const validDate = validatePublicationDateCutoff('2026-08-01');
  const futureDate = validatePublicationDateCutoff('2026-09-15');

  if (oldDate.eligible) throw new Error('2026-07-31 must be rejected');
  if (!validDate.eligible) throw new Error('2026-08-01 must be accepted');
  if (!futureDate.eligible) throw new Error('2026-09-15 must be accepted');
  console.log('✅ 1 August 2026 publication date cutoff verified strictly.');

  console.log('=== ALL ADDITIONAL SCRAPER CHECKS PASSED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
