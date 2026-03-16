#!/usr/bin/env bun
/**
 * Audit all agents - report activity, costs, status
 * Usage: bun orchestrator/scripts/audit-agents.ts [--format json|table]
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";

// Parse arguments manually for Bun compatibility
function parseBunArgs() {
  const args = Bun.argv.slice(2);
  const values: any = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--format" && i + 1 < args.length) {
      values.format = args[i + 1];
      i++;
    }
  }
  
  values.format = values.format || "table";
  return { values };
}

const { values } = parseBunArgs();

interface AgentStats {
  id: string;
  name: string;
  status: string;
  role: string;
  budgetUsed: number;
  budgetTotal: number;
  budgetPercent: number;
  storiesCreated: number;
  lastActive: string;
}

async function parseAgentProfile(path: string): Promise<AgentStats | null> {
  try {
    const content = await readFile(path, "utf-8");
    const lines = content.split("\n");
    const stats: Partial<AgentStats> = {};
    let inStats = false;

    for (const line of lines) {
      if (line.startsWith("id: ")) stats.id = line.split(": ")[1];
      if (line.startsWith("name: ")) stats.name = line.replace('name: "', "").replace('"', "");
      if (line.startsWith("status: ")) stats.status = line.split(": ")[1];
      if (line.startsWith("role: ")) stats.role = line.split(": ")[1];
      if (line.startsWith("  spent_today_tokens: ")) stats.budgetUsed = parseInt(line.split(": ")[1]);
      if (line.startsWith("  daily_budget_tokens: ")) stats.budgetTotal = parseInt(line.split(": ")[1]);
      if (line.startsWith("  stories_created: ")) stats.storiesCreated = parseInt(line.split(": ")[1]);
      if (line.startsWith("last_active_at: ")) stats.lastActive = line.split(": ")[1].replace('"', "").trim();
      
      if (line.startsWith("stats:")) inStats = true;
      if (inStats && line.startsWith("  ")) {
        if (line.includes("stories_created: ")) stats.storiesCreated = parseInt(line.split(": ")[1]);
      }
    }

    if (stats.budgetTotal && stats.budgetUsed !== undefined) {
      stats.budgetPercent = Math.round((stats.budgetUsed / stats.budgetTotal) * 100);
    }

    return stats as AgentStats;
  } catch {
    return null;
  }
}

async function auditAgents() {
  const agentsDir = "/home/workspace/StoryChain/orchestrator/memory/agents";
  const files = await readdir(agentsDir).catch(() => []);
  const agentFiles = files.filter(f => f.endsWith(".yaml"));

  if (agentFiles.length === 0) {
    console.log("No agents found.");
    return;
  }

  const agents: AgentStats[] = [];
  for (const file of agentFiles) {
    const agent = await parseAgentProfile(join(agentsDir, file));
    if (agent) agents.push(agent);
  }

  if (values.format === "json") {
    console.log(JSON.stringify(agents, null, 2));
    return;
  }

  // Table format
  console.log("\n📊 STORYCHAIN AGENT AUDIT");
  console.log("=" .repeat(80));
  console.log(`Total Agents: ${agents.length}\n`);

  console.log(`${"Agent".padEnd(20)} ${"Status".padEnd(10)} ${"Role".padEnd(10)} ${"Budget".padEnd(12)} ${"Stories".padEnd(8)} ${"Last Active".padEnd(20)}`);
  console.log("-".repeat(80));

  for (const agent of agents) {
    const budget = `${agent.budgetUsed}/${agent.budgetTotal} (${agent.budgetPercent}%)`.padEnd(12);
    const name = agent.name.slice(0, 18).padEnd(20);
    console.log(`${name} ${agent.status.padEnd(10)} ${agent.role.padEnd(10)} ${budget} ${String(agent.storiesCreated || 0).padEnd(8)} ${agent.lastActive?.slice(0, 19) || "never"}`);
  }

  // Summary stats
  const active = agents.filter(a => a.status === "active").length;
  const paused = agents.filter(a => a.status === "paused").length;
  const totalBudget = agents.reduce((sum, a) => sum + (a.budgetTotal || 0), 0);
  const totalSpent = agents.reduce((sum, a) => sum + (a.budgetUsed || 0), 0);

  console.log("\n" + "=".repeat(80));
  console.log("📈 Summary");
  console.log(`   Active: ${active} | Paused: ${paused} | Total: ${agents.length}`);
  console.log(`   Budget: ${totalSpent}/${totalBudget} tokens (${Math.round(totalSpent/totalBudget*100)}% used)`);
  console.log(`   Stories: ${agents.reduce((sum, a) => sum + (a.storiesCreated || 0), 0)} created`);
}

auditAgents().catch(console.error);
