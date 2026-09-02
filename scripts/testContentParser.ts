/**
 * StudyMate Sarkari — Step 5 Automated Test Suite
 * Tests Parsing, Normalization, Verification & Deduplication Pipeline
 */

import { normalizeSingleDate, normalizeImportantDates, extractDateRange } from '../src/lib/server/normalizers/dateNormalizer';
import { normalizeVacancyCount } from '../src/lib/server/normalizers/vacancyNormalizer';
import { normalizeApplicationFee, normalizeAgeLimit } from '../src/lib/server/normalizers/feeNormalizer';
import { resolveOrganization } from '../src/lib/server/entityResolvers/organizationResolver';
import { resolveState } from '../src/lib/server/entityResolvers/stateResolver';
import { classifyContent } from '../src/lib/server/verification/contentClassifier';
import { verifyAndSanitizeUrl } from '../src/lib/server/verification/urlSecurityVerifier';
import { generateDeduplicationKey, compareWithExistingRecords } from '../src/lib/server/verification/deduplicator';
import { parseHtmlDocument } from '../src/lib/server/parsers/htmlTokenizer';
import { parserRegistry } from '../src/lib/server/parsers';
import { ContentParsePipeline } from '../src/lib/server/pipeline/parsePipeline';
import { DbContentSource } from '../src/types';

function runTests() {
  console.log('===============================================================');
  console.log('🚀 Running StudyMate Sarkari Step 5 Verification Test Suite');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // --- Test 1: Date Normalization ---
  console.log('--- 1. Testing Date Normalization & Chronology ---');
  const d1 = normalizeSingleDate('15/09/2026');
  assert(d1.isValid && d1.isoDate === '2026-09-15', 'Normalize DD/MM/YYYY', `Got ${d1.isoDate}`);

  const d2 = normalizeSingleDate('05-Aug-2026');
  assert(d2.isValid && d2.isoDate === '2026-08-05', 'Normalize DD-MMM-YYYY text date', `Got ${d2.isoDate}`);

  const range = extractDateRange('Applications open from 01.10.2026 to 31.10.2026');
  assert(range.startDate === '2026-10-01' && range.endDate === '2026-10-31', 'Extract date range from text', `Got ${range.startDate} to ${range.endDate}`);

  const chronology = normalizeImportantDates({
    applyStartDate: '2026-09-01',
    applyEndDate: '2026-09-30',
  });
  assert(chronology.isValidChronology, 'Valid chronology check (Start <= End)');

  const invalidChronology = normalizeImportantDates({
    applyStartDate: '2026-10-01',
    applyEndDate: '2026-09-01',
  });
  assert(!invalidChronology.isValidChronology, 'Invalid chronology detection (Start > End)');

  // --- Test 2: Vacancy Normalization & False-Positive Prevention ---
  console.log('\n--- 2. Testing Vacancy Normalization & False-Positive Rejection ---');
  const v1 = normalizeVacancyCount('Total Vacancies: 1,420 Posts');
  assert(v1.isNumeric && v1.totalVacancies === 1420, 'Extract explicit vacancy count', `Got ${v1.totalVacancies}`);

  const v2 = normalizeVacancyCount('Application Fee: Rs. 500/- for General Candidates');
  assert(!v2.isNumeric, 'Reject fee amounts from being parsed as vacancies');

  const v3 = normalizeVacancyCount('Over 50,000 candidates appeared in the examination');
  assert(!v3.isNumeric, 'Reject candidate appearance counts from vacancies');

  const v4 = normalizeVacancyCount('UR: 50, OBC: 30, SC: 20, ST: 10, EWS: 10');
  assert(v4.isNumeric && v4.totalVacancies === 120, 'Calculate sum from category breakdown', `Got ${v4.totalVacancies}`);

  // --- Test 3: Fee and Age Limit Normalization ---
  console.log('\n--- 3. Testing Fee & Age Limit Normalization ---');
  const feeRes = normalizeApplicationFee('General / OBC: Rs. 250/-, SC/ST/PH: Nil');
  assert(feeRes.fee.general === '₹250' && feeRes.fee.scStPh.includes('Exempted'), 'Parse categorized fees');

  const ageRes = normalizeAgeLimit('Candidate must be between 18 to 32 years of age');
  assert(ageRes.ageLimit.minAge === 18 && ageRes.ageLimit.maxAge === 32, 'Parse min/max age limit');

  // --- Test 4: Organization & State Entity Resolution ---
  console.log('\n--- 4. Testing Organization & State Resolvers ---');
  const org1 = resolveOrganization('Union Public Service Commission');
  assert(org1.code === 'UPSC' && org1.sector === 'central', 'Resolve UPSC by full name');

  const org2 = resolveOrganization('BPSC Combined Competitive Exam');
  assert(org2.code === 'BPSC' && org2.sector === 'state' && org2.stateCode === 'BR', 'Resolve BPSC to state BR');

  const st1 = resolveState('Uttar Pradesh');
  assert(st1?.code === 'UP' && st1.type === 'state', 'Resolve state Uttar Pradesh to UP');

  // --- Test 5: Content Classification ---
  console.log('\n--- 5. Testing Content Classifier ---');
  const c1 = classifyContent('UPSC Civil Services Examination 2026 e-Admit Card Released');
  assert(c1.detectedType === 'admit_card', 'Classify Admit Card');

  const c2 = classifyContent('SSC CGL 2026 Tier 1 Final Marks & Merit List Declared');
  assert(c2.detectedType === 'result', 'Classify Exam Result');

  const c3 = classifyContent('UGC NET December 2026 Provisional Answer Key & Response Sheet');
  assert(c3.detectedType === 'answer_key', 'Classify Answer Key');

  const c4 = classifyContent('Railway RRB NTPC 2026 Exam Date Rescheduled Notice');
  assert(c4.detectedType === 'exam_update', 'Classify Exam Update');

  const c5 = classifyContent('Bihar Public Service Commission 71st Combined Competitive Recruitment 2026');
  assert(c5.detectedType === 'vacancy', 'Classify Vacancy');

  // --- Test 6: URL Security Verifier ---
  console.log('\n--- 6. Testing URL Security Verifier ---');
  const u1 = verifyAndSanitizeUrl('https://upsc.gov.in/sites/default/files/Advt-05-2026.pdf');
  assert(u1.isValid && u1.isOfficialDomain, 'Verify valid official government URL');

  const u2 = verifyAndSanitizeUrl('javascript:alert("hacked")');
  assert(!u2.isValid, 'Reject dangerous javascript: URL');

  const u3 = verifyAndSanitizeUrl('https://sarkariresult.com/upsc-job-2026.html');
  assert(!u3.isOfficialDomain, 'Flag third-party aggregator domain');

  // --- Test 7: HTML Tokenizer & Parser Table Parsing ---
  console.log('\n--- 7. Testing HTML Tokenizer & Table Extraction ---');
  const sampleHtml = `
    <html>
      <head><title>Official Recruitment Notices</title></head>
      <body>
        <h1>Latest Vacancies</h1>
        <table border="1">
          <tr><th>Notice Title</th><th>Date</th><th>Download</th></tr>
          <tr>
            <td>Combined Graduate Level Exam 2026 Notification</td>
            <td>10/09/2026</td>
            <td><a href="/docs/cgl-2026-advt.pdf">Download PDF</a></td>
          </tr>
        </table>
      </body>
    </html>
  `;
  const doc = parseHtmlDocument(sampleHtml);
  assert(doc.tables.length === 1 && doc.tables[0].rows.length === 1, 'Tokenize HTML table structure');

  // --- Test 8: Deduplication & Version Detection ---
  console.log('\n--- 8. Testing Deduplication Engine ---');
  const dedupKey = generateDeduplicationKey({
    orgCode: 'UPSC',
    itemType: 'vacancy',
    notificationNumber: '05/2026-CSE',
    slug: 'upsc-civil-services-2026',
  });
  assert(dedupKey === 'UPSC:vacancy:notif:05_2026_CSE', 'Generate deterministic notification-based deduplication key', `Got ${dedupKey}`);

  // --- Test 9: End-to-End Pipeline Execution ---
  console.log('\n--- 9. Testing End-to-End ContentParsePipeline ---');
  const mockSource: DbContentSource = {
    id: 'src_upsc_test',
    source_name: 'Union Public Service Commission (UPSC)',
    official_url: 'https://upsc.gov.in',
    source_type: 'html',
    scope: 'central',
    category: ['vacancy', 'admit_card', 'result'],
    check_interval_minutes: 60,
    active: true,
    priority: 'high',
    parser_key: 'upsc_recruitment',
  };

  ContentParsePipeline.execute(
    mockSource,
    sampleHtml,
    'hash_sample_001'
  ).then((summary) => {
    assert(summary.success, 'Pipeline executes successfully');
    assert(summary.normalizedItemCount > 0, 'Pipeline produces normalized items', `Count: ${summary.normalizedItemCount}`);
    if (summary.items.length > 0) {
      const item = summary.items[0];
      assert(item.organizationCode === 'UPSC', 'Normalized item resolved to UPSC');
      assert(item.officialNotificationUrl.includes('upsc.gov.in'), 'Normalized item contains verified notification link');
    }

    console.log('\n===============================================================');
    console.log(`🏁 Step 5 Test Suite Completed: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  }).catch((err) => {
    console.error('Fatal pipeline test error:', err);
    process.exit(1);
  });
}

runTests();
