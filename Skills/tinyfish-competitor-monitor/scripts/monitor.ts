#!/usr/bin/env bun
/**
 * Competitor Price Monitor
 * 
 * Usage: bun run monitor.ts config.json
 */

import { readFileSync } from "fs";

const TINYFISH_API_URL = "https://agent.tinyfish.ai/v1/automation/run-sse";

interface Competitor {
  name: string;
  url: string;
  goal: string;
  extract_fields?: string[];
}

interface Config {
  competitors: Competitor[];
  interval_minutes?: number;
  webhook_url?: string;
}

async function monitorCompetitor(competitor: Competitor): Promise<any> {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) throw new Error("TINYFISH_API_KEY not set");

  const response = await fetch(TINYFISH_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      url: competitor.url,
      goal: competitor.goal,
      proxy_config: { enabled: false },
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  // Parse final result
  const lines = result.split("\n");
  for (const line of lines) {
    if (line.includes("\"type\":\"COMPLETE\"")) {
      const data = JSON.parse(line.replace("data: ", ""));
      return data.resultJson;
    }
  }

  return null;
}

async function main() {
  const configFile = process.argv[2];
  if (!configFile) {
    console.error("Usage: bun run monitor.ts <config.json>");
    process.exit(1);
  }

  const config: Config = JSON.parse(readFileSync(configFile, "utf-8"));
  
  console.log(`Monitoring ${config.competitors.length} competitors...`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  const results = [];
  
  for (const competitor of config.competitors) {
    console.log(`Checking: ${competitor.name}`);
    try {
      const data = await monitorCompetitor(competitor);
      results.push({
        competitor: competitor.name,
        data,
        timestamp: new Date().toISOString(),
        status: "success"
      });
      console.log(`  ✓ Success`);
    } catch (error: any) {
      results.push({
        competitor: competitor.name,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: "error"
      });
      console.log(`  ✗ Error: ${error.message}`);
    }
  }

  console.log("\n=== RESULTS ===");
  console.log(JSON.stringify(results, null, 2));

  // TODO: Send to webhook if configured
  if (config.webhook_url) {
    await fetch(config.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(results)
    });
    console.log("\nResults sent to webhook");
  }
}

main().catch(console.error);
