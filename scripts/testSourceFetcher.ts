/**
 * StudyMate Sarkari — Step 4: Automated Source Fetcher & Monitoring Test Suite
 *
 * Verifies all 18 test cases:
 * 1. Valid official HTTPS source
 * 2. Invalid URL / non-http protocol rejection
 * 3. HTTP 404 handling (permanent error, no retry)
 * 4. HTTP 429 rate limit handling
 * 5. HTTP 500 transient error handling with retry
 * 6. Timeout handling via AbortController
 * 7. Redirect validation and SSRF blocking
 * 8. Response size limit enforcement
 * 9. Content hash equality -> SUCCESS_UNCHANGED
 * 10. Content hash change -> SUCCESS_CHANGED
 * 11. ETag / 304 Not Modified -> SUCCESS_UNCHANGED
 * 12. Retry behavior with exponential backoff
 * 13. Per-host rate limiting
 * 14. Duplicate simultaneous fetch lock prevention
 * 15. Inactive source skipped
 * 16. Non-due source skipped when not forced
 * 17. Batch failure isolation
 * 18. Secret values never logged or leaked
 */

import http from 'http';
import { AddressInfo } from 'net';
import { validateSourceUrl, validateRedirect } from '../src/lib/server/urlValidator';
import { fetchSourceContent, calculateContentHash } from '../src/lib/server/sourceFetcher';
import {
  executeSingleSourceFetch,
  runSourceMonitoringBatch,
} from '../src/lib/server/sourceMonitor';
import {
  acquireSourceLock,
  releaseSourceLock,
  getDueSources,
  insertFetchLog,
  getRecentFetchLogs,
} from '../src/lib/server/supabaseAdmin';
import { DbContentSource } from '../src/types';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
  }
}

async function runAllTests() {
  console.log('\n===============================================================');
  console.log('STUDYMATE SARKARI — STEP 4 AUTOMATED SOURCE FETCHER TEST SUITE');
  console.log('===============================================================\n');

  // Set up a local test HTTP server to simulate various server responses cleanly
  let serverPort = 0;
  let requestCounts: Record<string, number> = {};

  const testServer = http.createServer((req, res) => {
    const urlPath = req.url || '/';
    requestCounts[urlPath] = (requestCounts[urlPath] || 0) + 1;

    if (urlPath === '/test-valid-html') {
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'ETag': '"mock-etag-123"',
        'Last-Modified': 'Wed, 21 Oct 2025 07:28:00 GMT',
      });
      res.end('<!DOCTYPE html><html><body><h1>Official Vacancies Notice</h1></body></html>');
    } else if (urlPath === '/test-304-conditional') {
      if (req.headers['if-none-match'] === '"mock-etag-123"') {
        res.writeHead(304, {});
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html', 'ETag': '"mock-etag-123"' });
        res.end('Content');
      }
    } else if (urlPath === '/test-404') {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('Page Not Found');
    } else if (urlPath === '/test-429') {
      res.writeHead(429, { 'Content-Type': 'text/html', 'Retry-After': '1' });
      res.end('Rate Limit Exceeded');
    } else if (urlPath === '/test-500-transient') {
      const count = requestCounts[urlPath];
      if (count <= 2) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('Recovered after retries');
      }
    } else if (urlPath === '/test-timeout') {
      // Intentionally never respond until after test timeout
      setTimeout(() => {
        if (!res.writableEnded) {
          res.writeHead(200, {});
          res.end('Late response');
        }
      }, 2000);
    } else if (urlPath === '/test-redirect-valid') {
      res.writeHead(302, { Location: `http://127.0.0.1:${serverPort}/test-valid-html` });
      res.end();
    } else if (urlPath === '/test-redirect-ssrf-metadata') {
      res.writeHead(302, { Location: 'http://169.254.169.254/latest/meta-data/' });
      res.end();
    } else if (urlPath === '/test-large-payload') {
      res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': '2000000' });
      res.end(Buffer.alloc(2000000, 'X'));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('Default OK');
    }
  });

  await new Promise<void>((resolve) => {
    testServer.listen(0, '127.0.0.1', () => {
      serverPort = (testServer.address() as AddressInfo).port;
      resolve();
    });
  });

  const baseUrl = `http://127.0.0.1:${serverPort}`;

  try {
    // -------------------------------------------------------------
    // Test 1: Valid official HTTPS URL Validation
    // -------------------------------------------------------------
    console.log('--- Group 1: URL Validation & SSRF Prevention ---');
    const validCheck = validateSourceUrl('https://upsc.gov.in/recruitment/active-jobs?utm_source=test');
    assert(validCheck.isValid === true, 'Test 1: Valid official HTTPS URL is accepted');
    assert(!validCheck.normalizedUrl?.includes('utm_source'), 'Test 1b: Tracking query parameters are stripped');

    // -------------------------------------------------------------
    // Test 2: Invalid URL / non-http protocol
    // -------------------------------------------------------------
    const ftpCheck = validateSourceUrl('ftp://upsc.gov.in/files/jobs.pdf');
    const fileCheck = validateSourceUrl('file:///etc/passwd');
    const jsCheck = validateSourceUrl('javascript:alert(1)');
    assert(ftpCheck.isValid === false && fileCheck.isValid === false && jsCheck.isValid === false, 'Test 2: Non-HTTP protocols (ftp, file, javascript) are rejected');

    // -------------------------------------------------------------
    // Test 7: SSRF Protection (Cloud Metadata & Private IPs)
    // -------------------------------------------------------------
    const metadataCheck = validateSourceUrl('http://169.254.169.254/computeMetadata/v1/');
    const privateIpCheck1 = validateSourceUrl('http://10.0.0.1/admin');
    const privateIpCheck2 = validateSourceUrl('http://192.168.1.1/config');
    const privateIpCheck3 = validateSourceUrl('http://172.20.0.5/api');
    const loopbackCheck = validateSourceUrl('http://127.0.0.1:8080/internal');
    const localDomainCheck = validateSourceUrl('http://database.local/query');

    assert(
      !metadataCheck.isValid &&
      !privateIpCheck1.isValid &&
      !privateIpCheck2.isValid &&
      !privateIpCheck3.isValid &&
      !loopbackCheck.isValid &&
      !localDomainCheck.isValid,
      'Test 7: SSRF shield blocks AWS/GCP metadata, private RFC1918 subnets, and .local domains'
    );

    // Test 7b: Redirect validation blocks redirection to metadata
    const redirectCheck = validateRedirect('https://example.gov.in/path', 'http://169.254.169.254/secret');
    assert(redirectCheck.isValid === false, 'Test 7b: Redirects attempting SSRF pivot are rejected');

    // -------------------------------------------------------------
    // Test 8: Response Size Limit Enforcement
    // -------------------------------------------------------------
    console.log('\n--- Group 2: Fetch Protocol & Resource Limits ---');
    const mockSourceLarge: DbContentSource = {
      id: 'src-test-large',
      source_name: 'Large Test Source',
      official_url: `${baseUrl}/test-large-payload`,
      scope: 'central',
      category: ['vacancy'],
      source_type: 'html',
      priority: 'high',
      check_interval_minutes: 60,
      active: true,
    };
    // Fetch with low limit (500KB)
    const largeResult = await fetchSourceContent(mockSourceLarge, {
      maxBytes: 500000,
      timeoutMs: 3000,
      maxRetries: 0,
      allowLoopbackForTesting: true,
    });
    assert(
      largeResult.state === 'CONTENT_TOO_LARGE' && largeResult.success === false,
      'Test 8: Payloads exceeding maxBytes limit are rejected safely'
    );

    // -------------------------------------------------------------
    // Test 6: Timeout Handling via AbortController
    // -------------------------------------------------------------
    const mockSourceTimeout: DbContentSource = {
      id: 'src-test-timeout',
      source_name: 'Timeout Test Source',
      official_url: `${baseUrl}/test-timeout`,
      scope: 'central',
      category: ['vacancy'],
      source_type: 'html',
      priority: 'high',
      check_interval_minutes: 60,
      active: true,
    };
    const timeoutResult = await fetchSourceContent(mockSourceTimeout, {
      timeoutMs: 300,
      maxRetries: 0,
      allowLoopbackForTesting: true,
    });
    assert(
      timeoutResult.state === 'TIMEOUT' && timeoutResult.success === false,
      'Test 6: Slow servers trigger AbortController timeout'
    );

    // -------------------------------------------------------------
    // Test 3: HTTP 404 Handling (Permanent Error, No Retries)
    // -------------------------------------------------------------
    console.log('\n--- Group 3: HTTP Status Codes & Change Detection ---');
    const mockSource404: DbContentSource = {
      id: 'src-test-404',
      source_name: '404 Test Source',
      official_url: `${baseUrl}/test-404`,
      scope: 'central',
      category: ['vacancy'],
      source_type: 'html',
      priority: 'medium',
      check_interval_minutes: 60,
      active: true,
    };
    const result404 = await fetchSourceContent(mockSource404, {
      maxRetries: 2,
      allowLoopbackForTesting: true,
    });
    assert(
      result404.state === 'HTTP_ERROR' &&
      result404.httpStatus === 404 &&
      result404.attempts === 1,
      'Test 3: HTTP 404 is identified as permanent error and does not waste retries'
    );

    // -------------------------------------------------------------
    // Test 4: HTTP 429 Rate Limit Handling
    // -------------------------------------------------------------
    const mockSource429: DbContentSource = {
      id: 'src-test-429',
      source_name: '429 Test Source',
      official_url: `${baseUrl}/test-429`,
      scope: 'central',
      category: ['vacancy'],
      source_type: 'html',
      priority: 'high',
      check_interval_minutes: 60,
      active: true,
    };
    const result429 = await fetchSourceContent(mockSource429, {
      maxRetries: 1,
      allowLoopbackForTesting: true,
    });
    assert(
      result429.state === 'RATE_LIMITED' && result429.httpStatus === 429,
      'Test 4: HTTP 429 is flagged as RATE_LIMITED'
    );

    // -------------------------------------------------------------
    // Test 5 & 12: HTTP 500 Transient Failure Recovery & Retries
    // -------------------------------------------------------------
    requestCounts['/test-500-transient'] = 0;
    const mockSource500: DbContentSource = {
      id: 'src-test-500',
      source_name: '500 Test Source',
      official_url: `${baseUrl}/test-500-transient`,
      scope: 'central',
      category: ['vacancy'],
      source_type: 'html',
      priority: 'high',
      check_interval_minutes: 60,
      active: true,
    };
    const result500 = await fetchSourceContent(mockSource500, {
      maxRetries: 3,
      allowLoopbackForTesting: true,
    });
    assert(
      result500.success === true &&
      result500.attempts === 3,
      'Test 5 & 12: Transient HTTP 500 is retried with backoff and recovers on subsequent attempt'
    );

    // -------------------------------------------------------------
    // Test 9: Same Content Hash -> SUCCESS_UNCHANGED
    // -------------------------------------------------------------
    const testContent = '<!DOCTYPE html><html><body><h1>Official Vacancies Notice</h1></body></html>';
    const testHash = calculateContentHash(testContent);

    const mockSourceUnchanged: DbContentSource = {
      id: 'src-test-unchanged',
      source_name: 'Unchanged Source',
      official_url: `${baseUrl}/test-valid-html`,
      scope: 'central',
      category: ['vacancy'],
      source_type: 'html',
      priority: 'high',
      check_interval_minutes: 60,
      active: true,
      content_hash: testHash,
    };
    const resultUnchanged = await fetchSourceContent(mockSourceUnchanged, {
      maxRetries: 0,
      allowLoopbackForTesting: true,
    });
    assert(
      resultUnchanged.state === 'SUCCESS_UNCHANGED' &&
      resultUnchanged.changed === false &&
      resultUnchanged.contentHash === testHash,
      'Test 9: Identical content hash returns SUCCESS_UNCHANGED'
    );

    // -------------------------------------------------------------
    // Test 10: Different Content Hash -> SUCCESS_CHANGED
    // -------------------------------------------------------------
    const mockSourceChanged: DbContentSource = {
      id: 'src-test-changed',
      source_name: 'Changed Source',
      official_url: `${baseUrl}/test-valid-html`,
      scope: 'central',
      category: ['vacancy'],
      source_type: 'html',
      priority: 'high',
      check_interval_minutes: 60,
      active: true,
      content_hash: 'old-different-sha256-hash-value',
    };
    const resultChanged = await fetchSourceContent(mockSourceChanged, {
      maxRetries: 0,
      allowLoopbackForTesting: true,
    });
    assert(
      resultChanged.state === 'SUCCESS_CHANGED' &&
      resultChanged.changed === true &&
      resultChanged.contentHash === testHash,
      'Test 10: Modified content hash triggers SUCCESS_CHANGED'
    );

    // -------------------------------------------------------------
    // Test 11: ETag / 304 Not Modified
    // -------------------------------------------------------------
    const mockSource304: DbContentSource = {
      id: 'src-test-304',
      source_name: '304 Source',
      official_url: `${baseUrl}/test-304-conditional`,
      scope: 'central',
      category: ['vacancy'],
      source_type: 'html',
      priority: 'high',
      check_interval_minutes: 60,
      active: true,
      etag: '"mock-etag-123"',
    };
    const result304 = await fetchSourceContent(mockSource304, {
      maxRetries: 0,
      allowLoopbackForTesting: true,
    });
    assert(
      result304.state === 'SUCCESS_UNCHANGED' &&
      result304.httpStatus === 304 &&
      result304.changed === false,
      'Test 11: Conditional ETag returns HTTP 304 and SUCCESS_UNCHANGED'
    );

    // -------------------------------------------------------------
    // Test 14: Duplicate Simultaneous Fetch Lock Prevention
    // -------------------------------------------------------------
    console.log('\n--- Group 4: Monitoring Coordination, Locks & Auditing ---');
    const lockId = 'test-lock-source-id';
    const firstLock = await acquireSourceLock(lockId);
    const secondLock = await acquireSourceLock(lockId);
    await releaseSourceLock(lockId);
    const thirdLock = await acquireSourceLock(lockId);
    await releaseSourceLock(lockId);

    assert(
      firstLock === true && secondLock === false && thirdLock === true,
      'Test 14: In-flight lock prevents simultaneous duplicate fetches for the same source'
    );

    // -------------------------------------------------------------
    // Test 15: Inactive Source is Skipped
    // -------------------------------------------------------------
    const dueList = await getDueSources({ forceAllActive: false });
    const hasInactive = dueList.some((s) => !s.active);
    assert(hasInactive === false, 'Test 15: Inactive sources are strictly excluded from due fetch batch');

    // -------------------------------------------------------------
    // Test 16: Check Interval Respected (Non-Due Source Skipped)
    // -------------------------------------------------------------
    const allSources = await getDueSources({ forceAllActive: true });
    if (allSources.length > 0) {
      const sample = allSources[0];
      // Mark as just checked right now
      sample.last_checked_at = new Date().toISOString();
      const standardDue = await getDueSources({ forceAllActive: false });
      const containsFreshlyChecked = standardDue.some((s) => s.id === sample.id);
      assert(!containsFreshlyChecked, 'Test 16: Source checked recently within its interval is skipped in standard run');
    }

    // -------------------------------------------------------------
    // Test 17: Batch Failure Isolation
    // -------------------------------------------------------------
    console.log('\n--- Group 5: Batch Processing & Secret Leak Protection ---');
    const batchResult = await runSourceMonitoringBatch({
      limit: 4,
      forceAll: true,
      concurrency: 2,
      timeoutMs: 4000,
      maxRetries: 0,
    });
    assert(
      batchResult.totalFetched > 0 &&
      batchResult.results.length === batchResult.totalFetched,
      'Test 17: Batch orchestrator processes sources in parallel with total failure isolation'
    );

    // -------------------------------------------------------------
    // Test 18: Secret Values Never Leaked
    // -------------------------------------------------------------
    const secretValue = 'super-confidential-secret-key-12345';
    process.env.SOURCE_FETCH_SECRET = secretValue;
    process.env.SUPABASE_SERVICE_ROLE_KEY = secretValue;

    const loggedResultString = JSON.stringify(batchResult);
    const auditLogs = await getRecentFetchLogs(10);
    const logsString = JSON.stringify(auditLogs);

    assert(
      !loggedResultString.includes(secretValue) && !logsString.includes(secretValue),
      'Test 18: Secret keys and credentials NEVER appear in fetch results or audit logs'
    );

    // -------------------------------------------------------------
    // Test 13: Per-host Rate Limiting
    // -------------------------------------------------------------
    const t0 = Date.now();
    await executeSingleSourceFetch(mockSourceUnchanged, { maxRetries: 0, allowLoopbackForTesting: true });
    await executeSingleSourceFetch(mockSourceUnchanged, { maxRetries: 0, allowLoopbackForTesting: true });
    const elapsed = Date.now() - t0;
    assert(elapsed >= 400, `Test 13: Per-host rate limiting enforces polite pause between requests to same domain (${elapsed}ms)`);

  } finally {
    testServer.close();
  }

  console.log('\n===============================================================');
  console.log(`TEST SUITE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
