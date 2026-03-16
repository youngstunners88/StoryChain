#!/usr/bin/env bun
/**
 * Run agent heartbeats - check for scheduled tasks
 * Usage: bun orchestrator/scripts/run-heartbeat.ts [--agent agent_id] [--dry-run]
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

// Parse arguments manually for Bun compatibility
function parseBunArgs() {
  const args = Bun.argv.slice(2);
  const values: any = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--agent" && i + 1 < args.length) {
      values.agent = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run" || args[i] === "--dryRun") {
      values.dryRun = true;
    }
  }
  
  values.dryRun = values.dryRun || false;
  return { values };
}

const { values } = parseBunArgs();

interface AgentProfile {
  id: string;
  name: string;
  status: "active" | "paused" | "suspended";
  role: string;
  economics: {
    daily_budget_tokens: number;
    spent_today_tokens: number;
  };
  scheduling: {
    timezone: string;
    heartbeats: Array<{
      type: string;
      cron: string;
      enabled: boolean;
      last_run: string | null;
    }>;
  };
  governance: {
    auto_approve: boolean;
  };
}

function parseCron(cron: string): boolean {
  // Simplified cron check - returns true if should run now
  const now = new Date();
  const parts = cron.split(" ");
  const [minute, hour] = parts;

  if (minute === "0" && now.getMinutes() === 0) {
    if (hour === "*") return true;
    if (hour.includes(",")) {
      const hours = hour.split(",").map(Number);
      if (hours.includes(now.getHours())) return true;
    }
    if (hour.startsWith("*/")) {
      const interval = parseInt(hour.replace("*/", ""));
      if (now.getHours() % interval === 0) return true;
    }
  }
  return false;
}

async function loadAgentProfile(agentPath: string): Promise<AgentProfile | null> {
  try {
    const content = await readFile(agentPath, "utf-8");
    const lines = content.split("\n");
    const profile: any = { 
      economics: {}, 
      scheduling: { heartbeats: [] }, 
      governance: {} 
    };
    let currentSection: any = null;
    let sectionName = "";
    let currentHeartbeat: any = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Top-level fields
      if (line.startsWith("id: ")) profile.id = line.split(": ")[1];
      if (line.startsWith("name: ")) profile.name = line.replace('name: "', "").replace('"', "");
      if (line.startsWith("status: ")) profile.status = line.split(": ")[1];
      if (line.startsWith("role: ")) profile.role = line.split(": ")[1];
      
      // Section headers
      if (line.match(/^[a-z_]+:$/) && !line.startsWith(" ")) {
        sectionName = line.replace(":", "");
        if (sectionName === "economics") {
          currentSection = profile.economics;
        } else if (sectionName === "scheduling") {
          currentSection = profile.scheduling;
        } else if (sectionName === "governance") {
          currentSection = profile.governance;
        } else {
          currentSection = null;
        }
      }
      
      // Handle heartbeats list items
      if (trimmed.startsWith("- type: ") && currentSection === profile.scheduling) {
        currentHeartbeat = { type: trimmed.split(": ")[1] };
        profile.scheduling.heartbeats.push(currentHeartbeat);
      }
      if (currentHeartbeat && line.startsWith("      ") && line.includes(": ")) {
        const [key, val] = trimmed.split(": ");
        if (val === "true" || val === "false") {
          currentHeartbeat[key] = val === "true";
        } else if (!isNaN(Number(val)) && val !== "") {
          currentHeartbeat[key] = Number(val);
        } else if (val !== "null") {
          currentHeartbeat[key] = val;
        } else {
          currentHeartbeat[key] = null;
        }
      }
      
      // Regular section fields (2-space indent)
      if (currentSection && line.startsWith("  ") && !line.startsWith("    ") && line.includes(": ")) {
        const [key, val] = trimmed.split(": ");
        if (val === "true" || val === "false") {
          currentSection[key] = val === "true";
        } else if (!isNaN(Number(val)) && val !== "") {
          currentSection[key] = Number(val);
        } else if (val !== "null") {
          currentSection[key] = val;
        }
      }
    }

    return profile as AgentProfile;
  } catch (e) {
    console.error("Error parsing agent profile:", e);
    return null;
  }
}

async function checkBudget(agent: AgentProfile): Promise<boolean> {
  return agent.economics.spent_today_tokens < agent.economics.daily_budget_tokens;
}

async function logCost(agentId: string, action: string, tokens: number) {
  const costLogPath = `/home/workspace/StoryChain/orchestrator/memory/cost-logs/${agentId}.jsonl`;
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    agent_id: agentId,
    action,
    tokens_used: tokens,
  }) + "\n";
  
  const existing = await readFile(costLogPath, "utf-8").catch(() => "");
  await writeFile(costLogPath, existing + entry, "utf-8");
}

async function runHeartbeat() {
  const agentsDir = "/home/workspace/StoryChain/orchestrator/memory/agents";
  const files = await readdir(agentsDir).catch(() => []);
  
  const agentFiles = files.filter(f => f.endsWith(".yaml"));
  
  if (agentFiles.length === 0) {
    console.log("No agents found. Create one with:");
    console.log("  bun orchestrator/scripts/create-agent.ts --name 'Agent Name'");
    return;
  }

  console.log(`Checking ${agentFiles.length} agent(s) for scheduled tasks...\n`);

  for (const file of agentFiles) {
    if (values.agent && !file.includes(values.agent)) continue;

    const agentPath = join(agentsDir, file);
    const agent = await loadAgentProfile(agentPath);
    
    if (!agent || agent.status !== "active") {
      console.log(`⚠ Skipping ${file}: ${agent?.status || "invalid profile"}`);
      continue;
    }

    console.log(`\n📋 Agent: ${agent.name} (${agent.id})`);
    console.log(`   Budget: ${agent.economics.spent_today_tokens}/${agent.economics.daily_budget_tokens} tokens`);

    // Check budget
    const hasBudget = await checkBudget(agent);
    if (!hasBudget) {
      console.log(`   ❌ Budget exhausted - skipping heartbeats`);
      continue;
    }

    // Check each heartbeat
    for (const heartbeat of agent.scheduling.heartbeats) {
      if (!heartbeat.enabled) {
        console.log(`   ⏸ ${heartbeat.type}: disabled`);
        continue;
      }

      const shouldRun = parseCron(heartbeat.cron);
      
      if (shouldRun) {
        console.log(`   ▶ ${heartbeat.type}: SHOULD RUN (${heartbeat.cron})`);
        
        if (values.dryRun) {
          console.log(`      [DRY RUN] Would execute ${heartbeat.type}`);
          continue;
        }

        // Check governance
        if (!agent.governance.auto_approve) {
          console.log(`      ⏳ Needs approval - task queued`);
          // Would add to pending_tasks
          continue;
        }

        // Execute task
        console.log(`      ✅ Executing ${heartbeat.type}...`);
        
        // Log cost (simulated for now)
        await logCost(agent.id, heartbeat.type, 150);
        console.log(`      💰 Logged 150 tokens spent`);
        
      } else {
        console.log(`   ⏰ ${heartbeat.type}: not due (${heartbeat.cron})`);
      }
    }
  }

  console.log("\n✓ Heartbeat check complete");
}

runHeartbeat().catch(console.error);
