#!/usr/bin/env bun
/**
 * Pain Point Hunter - Manual Discovery Mode
 * Spawn a researcher agent to find pain points in a target market
 */

import { readFile, writeFile, appendFile } from "fs/promises";
import { join } from "path";

const SKILL_DIR = join(process.env.HOME!, "workspace/Skills/pain-point-hunter");
const DATA_DIR = join(SKILL_DIR, "data");

const ZO_API = "https://api.zo.computer/zo/ask";
const MODEL_NAME = "openrouter:z-ai/glm-5"; // Use current model

interface DiscoveryConfig {
  industries: string[];
  locations: string[];
  keywords: string[];
}

interface PainPoint {
  id: string;
  painPoint: string;
  business: {
    name: string;
    industry: string;
    location: string;
    contactInfo?: string;
  };
  urgency: "high" | "medium" | "low";
  solutionHint: string;
  source: string;
  discoveredAt: string;
  estimatedValue: number;
}

function generateId(): string {
  return `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function spawnResearcher(target: string, config: DiscoveryConfig): Promise<PainPoint[]> {
  console.log(`\n🔍 Spawning researcher agent for: ${target}\n`);

  const prompt = `You are a researcher agent. Your mission: discover pain points for potential clients.

TARGET: ${target}

INDUSTRIES TO FOCUS ON: ${config.industries.join(", ")}
LOCATIONS: ${config.locations.join(", ")}
KEYWORDS TO SEARCH FOR: ${config.keywords.join(", ")}

YOUR TASK:
1. Use web_search to find businesses and individuals expressing frustration or problems
2. Look for:
   - Google Maps reviews mentioning problems ("terrible", "doesn't work", "frustrated")
   - Reddit posts about business challenges in South Africa
   - Twitter/X mentions of problems in target industries
   - LinkedIn posts about difficulties
   - Industry forum threads

3. For EACH finding, document:
   - The specific pain point (what's wrong)
   - Who has this problem (business name, industry, location if found)
   - How urgent it seems (high/medium/low)
   - What a solution might look like
   - Source URL

4. Return findings as a JSON array with this structure:
[
  {
    "painPoint": "Description of the problem",
    "business": {
      "name": "Business name if found",
      "industry": "Industry",
      "location": "Location",
      "contactInfo": "Email or phone if found"
    },
    "urgency": "high|medium|low",
    "solutionHint": "What could help",
    "source": "URL where you found this"
  }
]

IMPORTANT:
- Focus on REAL pain points that could be solved with websites, automation, or software
- Be specific about the problem
- Estimate urgency based on language used
- Find at least 3-5 pain points if possible
- If you can't find enough, broaden the search slightly

Start your search now. Report findings as JSON.`;

  try {
    const response = await fetch(ZO_API, {
      method: "POST",
      headers: {
        "Authorization": process.env.ZO_CLIENT_IDENTITY_TOKEN || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: prompt,
        model_name: MODEL_NAME
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const output = data.output as string;

    console.log("📝 Researcher response received\n");

    // Try to extract JSON from the response
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const findings = JSON.parse(jsonMatch[0]);
      return findings.map((f: any) => ({
        id: generateId(),
        ...f,
        discoveredAt: new Date().toISOString(),
        estimatedValue: f.urgency === "high" ? 8000 : f.urgency === "medium" ? 4000 : 2000
      }));
    }

    console.log("⚠ Could not parse JSON from response");
    console.log("Raw output:", output.substring(0, 500) + "...");
    return [];
  } catch (error) {
    console.error("❌ Error spawning researcher:", error);
    return [];
  }
}

async function saveLeads(painPoints: PainPoint[]): Promise<void> {
  const leadsPath = join(DATA_DIR, "leads.json");

  // Load existing leads
  let existingLeads: PainPoint[] = [];
  try {
    existingLeads = JSON.parse(await readFile(leadsPath, "utf-8"));
  } catch {
    // File doesn't exist yet
  }

  // Append new leads
  const allLeads = [...existingLeads, ...painPoints];
  await writeFile(leadsPath, JSON.stringify(allLeads, null, 2));

  console.log(`✓ Saved ${painPoints.length} new leads (total: ${allLeads.length})`);
}

async function updateStatus(count: number): Promise<void> {
  const statusPath = join(DATA_DIR, "status.json");

  try {
    const status = JSON.parse(await readFile(statusPath, "utf-8"));
    status.stats.painPointsDiscovered += count;
    status.lastHeartbeat = new Date().toISOString();
    await writeFile(statusPath, JSON.stringify(status, null, 2));
  } catch {
    console.log("⚠ Could not update status file");
  }
}

async function logDiscovery(painPoints: PainPoint[], target: string): Promise<void> {
  const logPath = join(DATA_DIR, "discovery.log");
  const timestamp = new Date().toISOString();

  const logEntry = `
[${timestamp}] DISCOVERY: ${target}
Found ${painPoints.length} pain points:
${painPoints.map(p => `  - ${p.painPoint.substring(0, 100)}... (${p.urgency})`).join("\n")}
`;

  await appendFile(logPath, logEntry);
}

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let target = "small businesses in South Africa";
  let mode = "discover";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mode" && args[i + 1]) {
      mode = args[i + 1];
      i++;
    } else if (args[i] === "--target" && args[i + 1]) {
      target = args[i + 1];
      i++;
    } else if (args[i] === "--help") {
      console.log(`
Pain Point Hunter - Manual Discovery

Usage:
  bun scripts/hunt.ts [options]

Options:
  --mode <mode>     Operation mode: discover, qualify, build, outreach (default: discover)
  --target <target> Target market description (default: "small businesses in South Africa")
  --help            Show this help

Examples:
  bun scripts/hunt.ts --mode discover --target "restaurants in Johannesburg"
  bun scripts/hunt.ts --mode discover --target "e-commerce businesses struggling with payments"
`);
      return;
    }
  }

  console.log("🦁 Pain Point Hunter - Manual Mode");
  console.log(`   Mode: ${mode}`);
  console.log(`   Target: ${target}\n`);

  // Load config
  let config: DiscoveryConfig;
  try {
    const configPath = join(DATA_DIR, "config.json");
    const fullConfig = JSON.parse(await readFile(configPath, "utf-8"));
    config = fullConfig.discovery;
  } catch {
    console.log("⚠ Using default discovery config");
    config = {
      industries: ["small business", "restaurants", "retail", "professional services"],
      locations: ["South Africa", "Johannesburg", "Cape Town"],
      keywords: ["struggling with", "need help", "frustrated", "problem", "challenge"]
    };
  }

  // Run discovery
  const painPoints = await spawnResearcher(target, config);

  if (painPoints.length === 0) {
    console.log("\n⚠ No pain points discovered. Try a different target.");
    return;
  }

  // Display findings
  console.log("\n📋 PAIN POINTS DISCOVERED:\n");
  painPoints.forEach((p, i) => {
    console.log(`${i + 1}. [${p.urgency.toUpperCase()}] ${p.painPoint}`);
    console.log(`   Business: ${p.business.name || "Unknown"}`);
    console.log(`   Industry: ${p.business.industry || "Unknown"}`);
    console.log(`   Location: ${p.business.location || "Unknown"}`);
    console.log(`   Solution hint: ${p.solutionHint}`);
    console.log(`   Source: ${p.source}`);
    console.log(`   Est. value: R${p.estimatedValue}\n`);
  });

  // Save results
  await saveLeads(painPoints);
  await updateStatus(painPoints.length);
  await logDiscovery(painPoints, target);

  console.log("✅ Discovery complete!");
}

main().catch(console.error);
