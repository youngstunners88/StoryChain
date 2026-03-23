#!/usr/bin/env bun
/**
 * Stress Test for StoryChain APIs
 * Executes 4 rounds by default and logs system-failure-mode context.
 */

import { Database } from 'bun:sqlite';
import { join } from 'node:path';

const BASE_URL = process.env.STRESS_BASE_URL || 'http://localhost:3000';
const CONCURRENT_REQUESTS = Number.parseInt(process.env.STRESS_CONCURRENT || '30', 10);
const TOTAL_REQUESTS = Number.parseInt(process.env.STRESS_TOTAL || '240', 10);
const ROUNDS = Number.parseInt(process.env.STRESS_ROUNDS || '4', 10);
const ROOT = process.cwd();

interface TestResult {
  endpoint: string;
  requests: number;
  successes: number;
  failures: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  errors: string[];
  round: number;
}

interface SystemFailureModeContext {
  mode: 'SYSTEM_FAILURE_MODE';
  round: number;
  component: string;
  endpoint?: string;
  error: string;
  failureRate?: number;
  timestamp: string;
}

const results: TestResult[] = [];
const failureContexts: SystemFailureModeContext[] = [];

console.log('🔥 STORYCHAIN STRESS TEST\n');
console.log('='.repeat(60));
console.log(`Rounds: ${ROUNDS} | Concurrent: ${CONCURRENT_REQUESTS} | Total/endpoint: ${TOTAL_REQUESTS}\n`);

function logSystemFailureMode(context: Omit<SystemFailureModeContext, 'mode' | 'timestamp'>) {
  const entry: SystemFailureModeContext = {
    mode: 'SYSTEM_FAILURE_MODE',
    timestamp: new Date().toISOString(),
    ...context,
  };

  failureContexts.push(entry);

  const path = join(ROOT, 'logs', 'system-failure-mode.jsonl');
  Bun.write(path, `${JSON.stringify(entry)}\n`, { createPath: true, append: true });
}

async function checkServer(round: number) {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) {
      console.log(`✅ Round ${round}: server is running`);
      return true;
    }

    logSystemFailureMode({
      round,
      component: 'healthcheck',
      endpoint: '/api/health',
      error: `Unexpected health status ${res.status}`,
    });
  } catch (error) {
    logSystemFailureMode({
      round,
      component: 'healthcheck',
      endpoint: '/api/health',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  console.log(`❌ Round ${round}: server unavailable at ${BASE_URL}`);
  return false;
}

async function makeRequest(endpoint: string, method = 'GET', body?: object): Promise<{ success: boolean; latency: number; error?: string }> {
  const start = performance.now();

  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', 'x-stress-test': 'true', 'x-session-id': `stress_${Date.now()}` },
    };

    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const latency = performance.now() - start;

    if (res.ok) return { success: true, latency };
    return { success: false, latency, error: `${res.status} ${res.statusText}` };
  } catch (error) {
    const latency = performance.now() - start;
    return {
      success: false,
      latency,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function stressTestEndpoint(round: number, name: string, endpoint: string, method = 'GET', body?: object) {
  console.log(`\n🧪 [Round ${round}] ${name}`);
  console.log(`   ${method} ${endpoint}`);

  const latencies: number[] = [];
  let successes = 0;
  let failures = 0;
  const errors: string[] = [];

  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS);

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - batch * CONCURRENT_REQUESTS);
    const promises = Array(batchSize)
      .fill(null)
      .map(() => makeRequest(endpoint, method, body));

    const batchResults = await Promise.all(promises);

    for (const r of batchResults) {
      latencies.push(r.latency);
      if (r.success) successes++;
      else {
        failures++;
        if (r.error && !errors.includes(r.error)) errors.push(r.error);
      }
    }

    process.stdout.write(`   Progress: ${Math.min((batch + 1) * CONCURRENT_REQUESTS, TOTAL_REQUESTS)}/${TOTAL_REQUESTS}\r`);
  }

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / Math.max(latencies.length, 1);
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);

  const result: TestResult = {
    endpoint,
    requests: TOTAL_REQUESTS,
    successes,
    failures,
    avgLatency,
    minLatency,
    maxLatency,
    errors,
    round,
  };

  results.push(result);

  const failureRate = failures / Math.max(TOTAL_REQUESTS, 1);
  if (failureRate > 0.2) {
    logSystemFailureMode({
      round,
      component: 'stress_endpoint',
      endpoint,
      error: `High failure rate for ${name}`,
      failureRate,
    });
  }

  console.log(`\n   ✅ ${successes} successes | ❌ ${failures} failures`);
  console.log(`   Latency: avg=${avgLatency.toFixed(2)}ms min=${minLatency.toFixed(2)}ms max=${maxLatency.toFixed(2)}ms`);
}

async function stressTestDatabase(round: number) {
  console.log(`\n🗄️ [Round ${round}] Database Performance`);

  const db = new Database(join(ROOT, 'data', 'storychain.db'));
  const latencies: number[] = [];

  try {
    for (let i = 0; i < 80; i++) {
      const start = performance.now();
      db.query(`
        SELECT s.*,
          (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) as contribution_count,
          (SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) as like_count
        FROM stories s
        ORDER BY s.created_at DESC
        LIMIT 10
      `).all();
      latencies.push(performance.now() - start);
    }

    const avg = latencies.reduce((a, b) => a + b, 0) / Math.max(latencies.length, 1);
    console.log(`   80 queries: avg=${avg.toFixed(2)}ms`);
  } catch (error) {
    logSystemFailureMode({
      round,
      component: 'stress_database',
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    db.close();
  }
}

function generateReport() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 STRESS TEST SUMMARY\n');

  const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
  const totalSuccesses = results.reduce((sum, r) => sum + r.successes, 0);
  const totalFailures = results.reduce((sum, r) => sum + r.failures, 0);
  const avgLatency = results.reduce((sum, r) => sum + r.avgLatency, 0) / Math.max(results.length, 1);

  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Success Rate: ${((totalSuccesses / Math.max(totalRequests, 1)) * 100).toFixed(1)}%`);
  console.log(`Failure Rate: ${((totalFailures / Math.max(totalRequests, 1)) * 100).toFixed(1)}%`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`System failure mode events: ${failureContexts.length}\n`);

  const successRate = totalSuccesses / Math.max(totalRequests, 1);
  let grade = 'F';
  if (successRate >= 0.99 && avgLatency < 100) grade = 'A+';
  else if (successRate >= 0.99 && avgLatency < 200) grade = 'A';
  else if (successRate >= 0.95 && avgLatency < 300) grade = 'B';
  else if (successRate >= 0.9) grade = 'C';
  else if (successRate >= 0.8) grade = 'D';

  console.log(`Performance Grade: ${grade}`);

  const reportPath = join(ROOT, 'logs', 'stress-test.jsonl');
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRequests,
      successRate,
      avgLatency,
      grade,
      rounds: ROUNDS,
      systemFailureModeEvents: failureContexts.length,
    },
    results,
    failureContexts,
  };

  Bun.write(reportPath, JSON.stringify(reportData) + '\n');
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

async function runRound(round: number) {
  console.log(`\n🚀 ROUND ${round}/${ROUNDS}`);
  const serverRunning = await checkServer(round);
  if (!serverRunning) {
    return;
  }

  await stressTestEndpoint(round, 'Get Stories (Feed)', '/api/stories');
  await stressTestEndpoint(round, 'Get Trending', '/api/trending');
  await stressTestDatabase(round);
}

async function main() {
  for (let round = 1; round <= ROUNDS; round++) {
    await runRound(round);
  }

  generateReport();
}

main().catch((error) => {
  logSystemFailureMode({
    round: -1,
    component: 'stress_main',
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(error);
  process.exit(1);
});
