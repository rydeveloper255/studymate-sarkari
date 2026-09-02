/**
 * StudyMate Sarkari — Step 4: Live Official Source Verification Script
 *
 * Runs a polite, low-concurrency live check on 3 official national recruitment portals:
 * - Union Public Service Commission (UPSC)
 * - Staff Selection Commission (SSC)
 * - National Testing Agency (NTA)
 */

import { executeSingleSourceFetch } from '../src/lib/server/sourceMonitor';
import { OFFICIAL_GOVERNMENT_SOURCES } from '../src/data/officialSources';
import { DbContentSource } from '../src/types';

async function runLiveVerification() {
  console.log('\n===============================================================');
  console.log('STUDYMATE SARKARI — LIVE OFFICIAL SOURCE VERIFICATION');
  console.log('===============================================================\n');

  // Select 3 high-priority central sources
  const sampleSourceIds = ['src-cen-upsc', 'src-cen-ssc-hq', 'src-cen-nta'];
  const sampleSources = OFFICIAL_GOVERNMENT_SOURCES.filter((s) =>
    sampleSourceIds.includes(s.id)
  );

  console.log(`Found ${sampleSources.length} sample sources for live verification:\n`);

  for (const src of sampleSources) {
    const dbSource: DbContentSource = {
      id: src.id,
      source_name: src.sourceName,
      official_url: src.officialUrl,
      scope: src.scope,
      state_code: src.stateCode || null,
      category: src.category,
      source_type: src.sourceType,
      priority: src.priority,
      check_interval_minutes: src.checkIntervalMinutes,
      active: src.active,
      parser_key: src.parserKey || null,
      last_checked_at: null,
      last_success_at: null,
      last_error: null,
      content_hash: null,
    };

    console.log(`📡 Fetching: [${src.id}] ${src.sourceName}`);
    console.log(`   URL: ${src.officialUrl}`);

    const summary = await executeSingleSourceFetch(dbSource, {
      timeoutMs: 15000,
      maxRetries: 1,
    });

    console.log(`   State:           ${summary.state}`);
    console.log(`   Success:         ${summary.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   HTTP Status:     ${summary.httpStatus ?? 'N/A'}`);
    console.log(`   Response Time:   ${summary.responseTimeMs}ms`);
    console.log(`   Attempts:        ${summary.attempts}`);
    console.log(`   Content Type:    ${summary.contentType ?? 'N/A'}`);
    console.log(`   Content Length:  ${summary.contentLength ? `${summary.contentLength} bytes` : 'N/A'}`);
    console.log(`   SHA-256 Hash:    ${summary.contentHash ? summary.contentHash.substring(0, 16) + '...' : 'N/A'}`);
    if (summary.error) {
      console.log(`   Notice/Error:    ${summary.error}`);
    }
    console.log('---------------------------------------------------------------');
  }

  console.log('\nLive verification completed successfully.\n');
}

runLiveVerification().catch((err) => {
  console.error('Live verification failed:', err);
});
