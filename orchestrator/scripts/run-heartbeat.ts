#!/usr/bin/env bun
/**
 * Standalone heartbeat runner
 * Usage: bun orchestrator/scripts/run-heartbeat.ts [--once] [--dry-run]
 *
 * --once    Run a single heartbeat cycle and exit (default)
 * --loop    Run continuously on the same schedule as the server
 */

import { runHeartbeat, startHeartbeatLoop } from '../../src/services/heartbeatService.js';

const args = Bun.argv.slice(2);
const runLoop = args.includes('--loop');
const dryRun = args.includes('--dry-run');

if (dryRun) {
  console.log('[HEARTBEAT] Dry-run mode: would process active stories needing segments');
  console.log('[HEARTBEAT] Set OPENROUTER_API_KEY to enable real generation');
  process.exit(0);
}

if (runLoop) {
  console.log('[HEARTBEAT] Starting continuous loop...');
  startHeartbeatLoop();
} else {
  console.log('[HEARTBEAT] Running single cycle...');
  runHeartbeat()
    .then(() => {
      console.log('[HEARTBEAT] Cycle complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('[HEARTBEAT] Fatal error:', err);
      process.exit(1);
    });
}
