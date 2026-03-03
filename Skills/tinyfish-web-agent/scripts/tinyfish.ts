#!/usr/bin/env bun
/**
 * TinyFish Web Agent CLI
 */

const TINYFISH_API_URL = "https://agent.tinyfish.ai/v1/automation/run-sse";

async function runAutomation(url: string, goal: string): Promise<void> {
  const apiKey = process.env.TINYFISH_API_KEY;
  
  if (!apiKey) {
    console.error("Error: TINYFISH_API_KEY not set");
    process.exit(1);
  }

  console.log(`Running automation...`);
  console.log(`URL: ${url}`);
  console.log(`Goal: ${goal}\n`);

  const response = await fetch(TINYFISH_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      url,
      goal,
      proxy_config: { enabled: false },
    }),
  });

  if (!response.ok) {
    console.error(`API Error: ${response.status}`);
    const text = await response.text();
    console.error(text);
    process.exit(1);
  }

  // Stream SSE response
  const reader = response.body?.getReader();
  if (!reader) {
    console.error("No response body");
    process.exit(1);
  }

  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    result += chunk;
    process.stdout.write(chunk);
  }

  console.log("\n\n✓ Automation complete!");
}

// Get args
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help") {
  console.log(`
TinyFish Web Agent

Usage:
  bun tinyfish.ts <url> <goal>

Example:
  TINYFISH_API_KEY=xxx bun tinyfish.ts "https://amazon.com" "Find the price of AirPods"
`);
  process.exit(0);
}

const url = args[0];
const goal = args.slice(1).join(" ");

if (!url || !goal) {
  console.error("Usage: bun tinyfish.ts <url> <goal>");
  process.exit(1);
}

runAutomation(url, goal);
