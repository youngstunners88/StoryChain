#!/usr/bin/env bun
/**
 * Pain Point Hunter - Solution Builder
 * Spawns a builder agent to create a solution for a pain point
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const SKILL_DIR = join(process.env.HOME!, "workspace/Skills/pain-point-hunter");
const DATA_DIR = join(SKILL_DIR, "data");
const SOLUTIONS_DIR = join(SKILL_DIR, "solutions");

const ZO_API = "https://api.zo.computer/zo/ask";
const MODEL_NAME = "openrouter:z-ai/glm-5";

interface Lead {
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
  status: string;
  solutionReady?: boolean;
}

async function spawnBuilder(lead: Lead): Promise<{ success: boolean; solutionPath?: string; error?: string }> {
  console.log(`\n🔧 Spawning builder agent for: ${lead.business.name || "Unknown business"}\n`);

  const prompt = `You are a builder agent. Your mission: create a working solution for a client's pain point.

PAIN POINT:
${lead.painPoint}

BUSINESS CONTEXT:
- Name: ${lead.business.name || "Unknown"}
- Industry: ${lead.business.industry || "Unknown"}
- Location: ${lead.business.location || "Unknown"}
- Contact: ${lead.business.contactInfo || "Not available"}

SOLUTION HINT:
${lead.solutionHint}

YOUR TASK:
1. Analyze the pain point carefully
2. Design the simplest solution that solves this problem
3. Build a working MVP

POSSIBLE SOLUTION TYPES:
- Website/Landing page (HTML/CSS/JS)
- Automation script (Python/Bun)
- Dashboard (React + API)
- Integration (API glue)
- Mobile-responsive web app

CONSTRAINTS:
- Solution must be complete and runnable
- Include clear usage instructions
- Target completion: under 60 minutes of work
- Prefer simpler solutions that work

OUTPUT FORMAT:
1. First, explain your approach (2-3 sentences)
2. Then provide the complete solution code
3. Include usage instructions

The solution should be immediately useful. Do not over-engineer.

Start building now.`;

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

    console.log("📝 Builder response received\n");

    // Save the solution
    await mkdir(SOLUTIONS_DIR, { recursive: true });
    const solutionPath = join(SOLUTIONS_DIR, `${lead.id}.md`);

    const solutionContent = `# Solution for ${lead.business.name || "Unknown Business"}

## Pain Point
${lead.painPoint}

## Business Context
- Industry: ${lead.business.industry || "Unknown"}
- Location: ${lead.business.location || "Unknown"}
- Urgency: ${lead.urgency}

## Solution

${output}

---
*Generated: ${new Date().toISOString()}*
*Lead ID: ${lead.id}*
`;

    await writeFile(solutionPath, solutionContent);
    console.log(`✓ Solution saved to: ${solutionPath}`);

    return { success: true, solutionPath };
  } catch (error) {
    console.error("❌ Error spawning builder:", error);
    return { success: false, error: String(error) };
  }
}

async function getNextQualifiedLead(): Promise<Lead | null> {
  try {
    const leadsPath = join(DATA_DIR, "leads.json");
    const leads: Lead[] = JSON.parse(await readFile(leadsPath, "utf-8"));

    // Find first qualified lead without a solution
    return leads.find(l => l.status === "qualified" && !l.solutionReady) || null;
  } catch {
    return null;
  }
}

async function updateLeadStatus(leadId: string, updates: Partial<Lead>): Promise<void> {
  try {
    const leadsPath = join(DATA_DIR, "leads.json");
    const leads: Lead[] = JSON.parse(await readFile(leadsPath, "utf-8"));

    const index = leads.findIndex(l => l.id === leadId);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...updates };
      await writeFile(leadsPath, JSON.stringify(leads, null, 2));
    }
  } catch (error) {
    console.error("Error updating lead:", error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let leadId: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lead" && args[i + 1]) {
      leadId = args[i + 1];
      i++;
    } else if (args[i] === "--help") {
      console.log(`
Pain Point Hunter - Solution Builder

Usage:
  bun scripts/build.ts [options]

Options:
  --lead <id>    Build solution for specific lead ID
  --help         Show this help

If no lead ID specified, builds for the next qualified lead in queue.
`);
      return;
    }
  }

  console.log("🔧 Pain Point Hunter - Solution Builder\n");

  // Get the lead
  let lead: Lead | null = null;

  if (leadId) {
    try {
      const leadsPath = join(DATA_DIR, "leads.json");
      const leads: Lead[] = JSON.parse(await readFile(leadsPath, "utf-8"));
      lead = leads.find(l => l.id === leadId) || null;
    } catch {
      console.error("Could not load leads file");
      return;
    }
  } else {
    lead = await getNextQualifiedLead();
  }

  if (!lead) {
    console.log("⚠ No qualified leads to build solutions for.");
    console.log("  Run 'bun scripts/hunt.ts' to discover pain points first.");
    return;
  }

  console.log(`Building solution for:`);
  console.log(`  Lead ID: ${lead.id}`);
  console.log(`  Business: ${lead.business.name || "Unknown"}`);
  console.log(`  Pain point: ${lead.painPoint.substring(0, 100)}...`);

  // Spawn the builder
  const result = await spawnBuilder(lead);

  if (result.success) {
    // Update lead status
    await updateLeadStatus(lead.id, { solutionReady: true, status: "solution-ready" });

    // Update status file
    try {
      const statusPath = join(DATA_DIR, "status.json");
      const status = JSON.parse(await readFile(statusPath, "utf-8"));
      status.stats.solutionsBuilt += 1;
      if (!status.activeWork.building.includes(lead.id)) {
        status.activeWork.building.push(lead.id);
      }
      await writeFile(statusPath, JSON.stringify(status, null, 2));
    } catch {
      // Ignore
    }

    console.log("\n✅ Solution built successfully!");
    console.log(`   Saved to: ${result.solutionPath}`);
  } else {
    console.log("\n❌ Failed to build solution");
    console.log(`   Error: ${result.error}`);
  }
}

main().catch(console.error);
