/**
 * StudyMate Sarkari — Render Background Worker Entrypoint
 *
 * Usage:
 * npx tsx scripts/startProductionScheduler.ts
 */

import { startProductionScheduler } from '../src/lib/server/automation/productionScheduler';

console.log('[Worker] Initializing StudyMate Sarkari background monitoring worker...');
startProductionScheduler();

process.on('SIGINT', () => {
  console.log('[Worker] Received SIGINT. Shutting down gracefully.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Worker] Received SIGTERM. Shutting down gracefully.');
  process.exit(0);
});
