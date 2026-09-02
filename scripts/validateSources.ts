import { validateSourceRegistry } from '../src/lib/data/validateSources';

console.log('====================================================');
console.log('  STUDYMATE SARKARI — OFFICIAL SOURCE REGISTRY AUDIT');
console.log('====================================================');

const report = validateSourceRegistry();

console.log(`\nTotal Official Sources Registered: ${report.totalChecked}`);
console.log(`- Central Government Sources:       ${report.stats.central}`);
console.log(`- State Government Sources:         ${report.stats.state}`);
console.log(`- Union Territory Sources:          ${report.stats.unionTerritory}`);
console.log(`- National Autonomous Institutions: ${report.stats.institution}`);
console.log(`- Active Sources:                   ${report.stats.activeCount}`);
console.log(`- Priority (High / Med / Low):      ${report.stats.highPriority} / ${report.stats.mediumPriority} / ${report.stats.lowPriority}`);

console.log(`\nState & UT Coverage:`);
console.log(`- Covered States: ${report.stateCoverageCheck.coveredStatesCount} / 28`);
console.log(`- Covered UTs:    ${report.stateCoverageCheck.coveredUTsCount} / 8`);

if (report.stateCoverageCheck.missingStates.length > 0) {
  console.log(`⚠️ Missing States:`, report.stateCoverageCheck.missingStates);
}
if (report.stateCoverageCheck.missingUTs.length > 0) {
  console.log(`⚠️ Missing UTs:`, report.stateCoverageCheck.missingUTs);
}

console.log(`\nValidation Status: ${report.isValid ? '✅ PASSED (0 ERRORS)' : '❌ FAILED'}`);
if (report.errors.length > 0) {
  console.log(`\nErrors (${report.errors.length}):`);
  report.errors.forEach((e) => console.log(`  - [${e.sourceId}] ${e.sourceName}: ${e.message}`));
}

if (report.warnings.length > 0) {
  console.log(`\nWarnings (${report.warnings.length}):`);
  report.warnings.forEach((w) => console.log(`  - [${w.sourceId}] ${w.sourceName}: ${w.message}`));
}

console.log('====================================================');
