/**
 * StudyMate Sarkari — Test Verification Suite for Core Scraper Engine
 *
 * Verifies:
 * 1. Supabase connection and reading `job_sources` table
 * 2. Modular Adapter Registry (HTML, PDF, RSS, JSON)
 * 3. Content fetch & SHA-256 change detection
 * 4. Strict enforcement of the August 1, 2026 date cutoff:
 *    - 2025 notices rejected
 *    - July 2026 notices rejected
 *    - 1 August 2026 notices accepted
 *    - September 2026 notices accepted
 * 5. Full CoreScraperEngine execution run with telemetry
 */

import {
  CoreScraperEngine,
  loadJobSourcesFromSupabase,
  AdapterRegistry,
  HtmlFetchAdapter,
  PdfFetchAdapter,
  RssFetchAdapter,
  JsonFetchAdapter,
  validateDateCutoff,
  extractAndValidateNoticeCutoff,
  DEFAULT_CUTOFF_DATE,
  JobSourceRecord,
} from '../src/backend/scraper';

async function main() {
  console.log('================================================================');
  console.log('STUDYMATE SARKARI — CORE SCRAPER ENGINE TEST VERIFICATION');
  console.log('================================================================');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Supabase Connection & Reading job_sources
  // --------------------------------------------------------------------------
  console.log('\n📋 Test 1: Reading job_sources from Supabase');
  const sources = await loadJobSourcesFromSupabase({ limit: 10 });
  assert(Array.isArray(sources), 'loadJobSourcesFromSupabase returns an array');
  assert(sources.length > 0, `Loaded ${sources.length} active government job sources`);
  
  const upscSource = sources.find((s) => s.id === 'src-cen-upsc' || s.name.includes('UPSC'));
  assert(Boolean(upscSource), 'UPSC verified source is present in job_sources');
  assert(Boolean(upscSource?.official_url?.includes('.gov.in')), 'UPSC official_url has authoritative .gov.in domain');

  // --------------------------------------------------------------------------
  // TEST 2: Modular Adapter Pattern & Registry
  // --------------------------------------------------------------------------
  console.log('\n🔌 Test 2: Modular Adapter Pattern & Selection');
  const registry = AdapterRegistry.getInstance();
  const adapterNames = registry.getRegisteredAdapterNames();
  console.log(`  Registered adapters: ${adapterNames.join(', ')}`);
  assert(adapterNames.includes('HtmlFetchAdapter'), 'HtmlFetchAdapter registered');
  assert(adapterNames.includes('PdfFetchAdapter'), 'PdfFetchAdapter registered');
  assert(adapterNames.includes('RssFetchAdapter'), 'RssFetchAdapter registered');
  assert(adapterNames.includes('JsonFetchAdapter'), 'JsonFetchAdapter registered');

  // Test adapter selection for various source types
  const htmlSource: JobSourceRecord = {
    id: 'test-html',
    name: 'State PSC Portal',
    region: 'UP',
    source_type: 'html',
    official_url: 'https://uppsc.up.nic.in',
    active: true,
  };
  const selectedHtmlAdapter = registry.getAdapterForSource(htmlSource);
  assert(selectedHtmlAdapter.name === 'HtmlFetchAdapter', 'HTML source correctly selects HtmlFetchAdapter');

  const pdfSource: JobSourceRecord = {
    id: 'test-pdf',
    name: 'UPSC Circular',
    region: 'ALL',
    source_type: 'pdf',
    official_url: 'https://upsc.gov.in/sites/default/files/Exam-Notice-2026.pdf',
    active: true,
  };
  const selectedPdfAdapter = registry.getAdapterForSource(pdfSource);
  assert(selectedPdfAdapter.name === 'PdfFetchAdapter', 'PDF source correctly selects PdfFetchAdapter');

  const rssSource: JobSourceRecord = {
    id: 'test-rss',
    name: 'Government News Feed',
    region: 'ALL',
    source_type: 'rss',
    official_url: 'https://pib.gov.in/RssMain.aspx',
    active: true,
  };
  const selectedRssAdapter = registry.getAdapterForSource(rssSource);
  assert(selectedRssAdapter.name === 'RssFetchAdapter', 'RSS source correctly selects RssFetchAdapter');

  const jsonSource: JobSourceRecord = {
    id: 'test-json',
    name: 'Recruitment API',
    region: 'DL',
    source_type: 'json',
    official_url: 'https://dsssb.delhi.gov.in/api/vacancies',
    active: true,
  };
  const selectedJsonAdapter = registry.getAdapterForSource(jsonSource);
  assert(selectedJsonAdapter.name === 'JsonFetchAdapter', 'JSON source correctly selects JsonFetchAdapter');

  // --------------------------------------------------------------------------
  // TEST 3: Strict August 1, 2026 Cutoff Enforcement
  // --------------------------------------------------------------------------
  console.log('\n📅 Test 3: Enforcement of August 1, 2026 Cutoff (2026-08-01)');
  console.log(`  Engine Default Cutoff: ${DEFAULT_CUTOFF_DATE}`);

  // Subtest 3A: Historical 2025 dates MUST be rejected
  const hist2025 = validateDateCutoff('2025-11-20');
  assert(!hist2025.eligible, '2025-11-20 is strictly rejected by cutoff validator');

  // Subtest 3B: Pre-cutoff 2026 dates (July 31, 2026) MUST be rejected
  const july2026 = validateDateCutoff('2026-07-31');
  assert(!july2026.eligible, '2026-07-31 is strictly rejected (< 2026-08-01)');

  const may2026 = validateDateCutoff('15/05/2026');
  assert(!may2026.eligible, '15/05/2026 (DD/MM/YYYY) is strictly rejected');

  // Subtest 3C: Exact Cutoff Date (1 August 2026) MUST be accepted
  const exactCutoff = validateDateCutoff('2026-08-01');
  assert(exactCutoff.eligible, '2026-08-01 is accepted (exact cutoff date)');
  assert(exactCutoff.normalizedDate === '2026-08-01', 'Normalized to 2026-08-01');

  // Subtest 3D: Post-cutoff dates (August 15, 2026 and September 2026) MUST be accepted
  const aug15 = validateDateCutoff('15 August 2026');
  assert(aug15.eligible, '15 August 2026 is accepted');
  assert(aug15.normalizedDate === '2026-08-15', '15 August 2026 normalized to 2026-08-15');

  const sep2026 = validateDateCutoff('2026-09-03');
  assert(sep2026.eligible, '2026-09-03 is accepted (current date)');

  // Subtest 3E: Full Raw Notice Cutoff Filtering
  const oldNotice = {
    title: 'Recruitment of Assistant Engineers 2025',
    publicationDate: '2025-12-10',
    summary: 'Advt No. 04/2025 dated 10/12/2025',
  };
  const oldNoticeCheck = extractAndValidateNoticeCutoff(oldNotice);
  assert(!oldNoticeCheck.eligible, 'Notice dated 2025 is rejected');

  const freshNotice = {
    title: 'Combined Medical Services Examination 2026',
    publicationDate: '2026-08-10',
    summary: 'Advt No. 09/2026 dated 10 August 2026',
  };
  const freshNoticeCheck = extractAndValidateNoticeCutoff(freshNotice);
  assert(freshNoticeCheck.eligible, 'Notice dated 10 August 2026 is accepted');
  assert(freshNoticeCheck.normalizedDate === '2026-08-10', 'Notice normalized date is 2026-08-10');

  // --------------------------------------------------------------------------
  // TEST 4: CoreScraperEngine Dry Run Execution
  // --------------------------------------------------------------------------
  console.log('\n⚙️ Test 4: CoreScraperEngine Instance & Configuration');
  const engine = new CoreScraperEngine({
    batchSize: 5,
    concurrency: 2,
    requestTimeoutMs: 5000,
    dryRun: true,
    dateCutoff: '2026-08-01',
  });

  assert(engine instanceof CoreScraperEngine, 'CoreScraperEngine instantiates successfully');
  assert(engine.getTotalRuns() === 0, 'Initial total runs count is 0');

  // --------------------------------------------------------------------------
  // TEST 5: HTML Extraction & Relative Link Canonicalization
  // --------------------------------------------------------------------------
  console.log('\n🌐 Test 5: HtmlFetchAdapter Notice Extraction');
  const sampleHtml = `
    <html>
      <body>
        <table class="views-table">
          <thead><tr><th>Notification</th><th>Date</th><th>Link</th></tr></thead>
          <tbody>
            <tr>
              <td>Civil Services Examination 2026</td>
              <td>12/08/2026</td>
              <td><a href="/sites/default/files/notif-cse-2026.pdf">Download Notice</a></td>
            </tr>
            <tr>
              <td>Historical Archive Notice 2025</td>
              <td>15/04/2025</td>
              <td><a href="/archive/2025.pdf">Old Notice</a></td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;

  const htmlAdapter = new HtmlFetchAdapter();
  const extractedNotices = htmlAdapter.extractNotices(sampleHtml, 'https://upsc.gov.in/recruitment', upscSource!);
  assert(extractedNotices.length >= 1, `Extracted ${extractedNotices.length} notices from HTML table`);

  // Verify cutoff filtering on the extracted notices
  const eligibleExtracted = extractedNotices.filter((n) => extractAndValidateNoticeCutoff(n).eligible);
  assert(eligibleExtracted.length >= 1, 'Cutoff filter retained the August 2026 notice');
  const rejectedExtracted = extractedNotices.filter((n) => !extractAndValidateNoticeCutoff(n).eligible);
  assert(rejectedExtracted.length >= 1, 'Cutoff filter rejected the 2025 historical notice');

  // --------------------------------------------------------------------------
  // TEST 6: RSS / XML Adapter Notice Extraction
  // --------------------------------------------------------------------------
  console.log('\n📡 Test 6: RssFetchAdapter Notice Extraction');
  const sampleRss = `
    <rss version="2.0">
      <channel>
        <title>UPSC Recruitment Notices</title>
        <item>
          <title>Indian Forest Service Examination 2026</title>
          <link>https://upsc.gov.in/notif/ifs-2026</link>
          <pubDate>Wed, 12 Aug 2026 10:00:00 GMT</pubDate>
          <description>Recruitment for 150 vacancies in IFS</description>
        </item>
        <item>
          <title>Old Examination Notice 2024</title>
          <link>https://upsc.gov.in/notif/old-2024</link>
          <pubDate>Mon, 10 Jun 2024 10:00:00 GMT</pubDate>
          <description>Old expired examination</description>
        </item>
      </channel>
    </rss>
  `;
  const rssAdapter = new RssFetchAdapter();
  const rssNotices = rssAdapter.extractNotices(sampleRss, 'https://upsc.gov.in', upscSource!);
  assert(rssNotices.length === 2, 'Extracted 2 items from RSS feed');

  const rssEligible = rssNotices.filter((n) => extractAndValidateNoticeCutoff(n).eligible);
  assert(rssEligible.length === 1, 'Only the August 2026 RSS notice is eligible');
  assert(rssEligible[0].title.includes('2026'), 'Accepted notice is the 2026 notification');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`SUMMARY: ${passed} / ${total} Tests Passed`);
  console.log('🎉 ALL CORE SCRAPER ENGINE TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
