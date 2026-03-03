#!/usr/bin/env bun
/**
 * Swarm Commander CLI
 * Usage:
 *   swarm-cli.ts spawn <type> <count> <duration-hours> "<objective>"
 *   swarm-cli.ts status
 *   swarm-cli.ts health
 */

import { SwarmSpawner } from './swarm-spawner';
import { HealthMonitor } from './health-monitor';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'spawn': {
      const [, , type, countStr, durationStr, ...objectiveParts] = args;
      const count = parseInt(countStr || '1', 10);
      const duration = parseFloat(durationStr || '1');
      const objective = objectiveParts.join(' ') || 'General task';
      
      if (!type) {
        console.error('Usage: swarm-cli.ts spawn <type> <count> <duration> "<objective>"');
        console.error('Types: big-homes, scraper, researcher, retell, email');
        process.exit(1);
      }
      
      const spawner = new SwarmSpawner();
      console.log(`🚀 Spawning ${count} ${type} workers for ${duration}h...`);
      console.log(`📋 Objective: ${objective}`);
      
      const workerIds = await spawner.spawn(type, count, duration, objective);
      console.log(`✅ Spawned ${workerIds.length} workers: ${workerIds.join(', ')}`);
      break;
    }
    
    case 'status': {
      const spawner = new SwarmSpawner();
      const { workers, summary } = spawner.getStatus();
      
      console.log('\n┌─────────────┬─────────┬──────────┬─────────┬─────────┐');
      console.log('│ Worker ID   │ Status  │ Runtime  │ Items   │ Errors  │');
      console.log('├─────────────┼─────────┼──────────┼─────────┼─────────┤');
      
      for (const w of workers) {
        const runtime = w.startTime && w.endTime 
          ? `${Math.round((w.endTime.getTime() - w.startTime.getTime()) / 60000)}m`
          : w.startTime ? 'running' : '-';
        console.log(`│ ${w.id.slice(0, 11).padEnd(11)} │ ${w.status.padEnd(7)} │ ${runtime.padEnd(8)} │ ${String(w.itemsProcessed).padEnd(7)} │ ${String(w.errors).padEnd(7)} │`);
      }
      
      console.log('└─────────────┴─────────┴──────────┴─────────┴─────────┘');
      console.log(`\nTotal: ${summary.total} | Running: ${summary.running} | Done: ${summary.done} | Failed: ${summary.failed}`);
      break;
    }
    
    case 'health': {
      const monitor = new HealthMonitor();
      const status = monitor.getStatus();
      
      console.log('\n🔍 Swarm Health Status');
      console.log('─────────────────────');
      console.log(`Gateway Up: ${status.gatewayUp ? '✅' : '❌'}`);
      console.log(`Consecutive Failures: ${status.consecutiveFailures}`);
      console.log(`API Keys Available: ${status.apiKeysAvailable}`);
      console.log(`Skills Available: ${status.skillsAvailable.join(', ')}`);
      if (status.lastRecovery) console.log(`Last Recovery: ${status.lastRecovery}`);
      break;
    }
    
    default:
      console.log(`
🐝 Swarm Commander CLI

Usage:
  swarm-cli.ts spawn <type> <count> <duration> "<objective>"
  swarm-cli.ts status
  swarm-cli.ts health

Examples:
  swarm-cli.ts spawn big-homes 5 4h "Find mobile homes under $50k"
  swarm-cli.ts spawn scraper 10 6h "Extract contact info from websites"
  swarm-cli.ts spawn researcher 3 2h "Research competitor companies"
      `);
  }
}

main().catch(console.error);