#!/usr/bin/env bun
/**
 * Stress Test for StoryChain APIs
 * Tests performance under load
 */

import { Database } from "bun:sqlite";

const BASE_URL = "http://localhost:3000";
const CONCURRENT_REQUESTS = 50;
const TOTAL_REQUESTS = 500;

interface TestResult {
  endpoint: string;
  requests: number;
  successes: number;
  failures: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  errors: string[];
}

const results: TestResult[] = [];

console.log("🔥 STORYCHAIN STRESS TEST\n");
console.log("=" .repeat(60));
console.log(`Concurrent: ${CONCURRENT_REQUESTS} | Total: ${TOTAL_REQUESTS}\n`);

// Check if server is running
async function checkServer() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) {
      console.log("✅ Server is running\n");
      return true;
    }
  } catch {
    console.log("❌ Server not running. Start with: bun run src/server.ts\n");
    return false;
  }
  return false;
}

// Simulate request with latency tracking
async function makeRequest(endpoint: string, method: string = "GET", body?: object): Promise<{success: boolean; latency: number; error?: string}> {
  const start = performance.now();
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const latency = performance.now() - start;
    
    if (res.ok) {
      return { success: true, latency };
    } else {
      return { success: false, latency, error: `${res.status} ${res.statusText}` };
    }
  } catch (e) {
    const latency = performance.now() - start;
    return { success: false, latency, error: e instanceof Error ? e.message : String(e) };
  }
}

// Run stress test for an endpoint
async function stressTestEndpoint(name: string, endpoint: string, method: string = "GET", body?: object) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`   ${method} ${endpoint}`);
  
  const latencies: number[] = [];
  let successes = 0;
  let failures = 0;
  const errors: string[] = [];
  
  // Run in batches
  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - batch * CONCURRENT_REQUESTS);
    
    const promises = Array(batchSize).fill(null).map(() => makeRequest(endpoint, method, body));
    const batchResults = await Promise.all(promises);
    
    for (const r of batchResults) {
      latencies.push(r.latency);
      if (r.success) {
        successes++;
      } else {
        failures++;
        if (r.error && !errors.includes(r.error)) {
          errors.push(r.error);
        }
      }
    }
    
    process.stdout.write(`   Progress: ${Math.min((batch + 1) * CONCURRENT_REQUESTS, TOTAL_REQUESTS)}/${TOTAL_REQUESTS}\r`);
  }
  
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
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
  };
  
  results.push(result);
  
  console.log(`\n   ✅ ${successes} successes | ❌ ${failures} failures`);
  console.log(`   Latency: avg=${avgLatency.toFixed(2)}ms min=${minLatency.toFixed(2)}ms max=${maxLatency.toFixed(2)}ms`);
  
  return result;
}

// Test database under load
async function stressTestDatabase() {
  console.log("\n🗄️ Testing Database Performance...");
  
  const db = new Database(`${process.cwd()}/data/storychain.db");
  
  const latencies: number[] = [];
  
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    
    // Run complex query
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
  
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  console.log(`   100 queries: avg=${avg.toFixed(2)}ms`);
  
  db.close();
}

// Generate load report
function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 STRESS TEST SUMMARY\n");
  
  const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
  const totalSuccesses = results.reduce((sum, r) => sum + r.successes, 0);
  const totalFailures = results.reduce((sum, r) => sum + r.failures, 0);
  const avgLatency = results.reduce((sum, r) => sum + r.avgLatency, 0) / results.length;
  
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Success Rate: ${((totalSuccesses / totalRequests) * 100).toFixed(1)}%`);
  console.log(`Failure Rate: ${((totalFailures / totalRequests) * 100).toFixed(1)}%`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms\n`);
  
  // Grade
  const successRate = totalSuccesses / totalRequests;
  let grade = "F";
  if (successRate >= 0.99 && avgLatency < 100) grade = "A+";
  else if (successRate >= 0.99 && avgLatency < 200) grade = "A";
  else if (successRate >= 0.95 && avgLatency < 300) grade = "B";
  else if (successRate >= 0.90) grade = "C";
  else if (successRate >= 0.80) grade = "D";
  
  console.log(`Performance Grade: ${grade}`);
  
  // Recommendations
  console.log("\n📋 Recommendations:");
  if (successRate < 0.95) {
    console.log("  ⚠️ High failure rate - check error handling and rate limiting");
  }
  if (avgLatency > 200) {
    console.log("  ⚠️ High latency - consider adding caching layer");
  }
  if (successRate >= 0.99 && avgLatency < 100) {
    console.log("  ✅ Excellent performance!");
  }
  
  // Save detailed report
  const reportPath = `${process.cwd()}/logs/stress-test.jsonl";
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRequests,
      successRate,
      avgLatency,
      grade,
    },
    results,
  };
  Bun.write(reportPath, JSON.stringify(reportData) + "\n");
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Run all tests
async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  // Test public endpoints (no auth required)
  await stressTestEndpoint("Get Stories (Feed)", "/api/stories");
  await stressTestEndpoint("Get Trending", "/api/trending");
  
  // Test database
  await stressTestDatabase();
  
  // More tests would require auth
  console.log("\n⚠️ Skipping authenticated endpoints (require bearer token)");
  console.log("   To test full API, use: bun tests/stress/authenticated-test.ts");
  
  generateReport();
}

main().catch(console.error);
