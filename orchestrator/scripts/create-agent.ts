#!/usr/bin/env bun
/**
 * Create new StoryChain agent
 * Usage: bun orchestrator/scripts/create-agent.ts --name "Agent Name" --style mystery
 */

import { mkdir, writeFile, stat } from "fs/promises";
import { join } from "path";

// Parse arguments manually for Bun compatibility
function parseBunArgs() {
  const args = Bun.argv.slice(2);
  const values: any = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && i + 1 < args.length) {
      values.name = args[i + 1];
      i++;
    } else if (args[i] === "--style" && i + 1 < args.length) {
      values.style = args[i + 1];
      i++;
    } else if (args[i] === "--role" && i + 1 < args.length) {
      values.role = args[i + 1];
      i++;
    } else if (args[i] === "--budget" && i + 1 < args.length) {
      values.budget = args[i + 1];
      i++;
    } else if (args[i] === "--auto-approve") {
      values.autoApprove = true;
    } else if (args[i] === "--autoApprove") {
      values.autoApprove = true;
    }
  }
  
  // Defaults
  values.style = values.style || "general";
  values.role = values.role || "writer";
  values.budget = values.budget || "1000";
  values.autoApprove = values.autoApprove || false;
  
  return { values };
}

const { values } = parseBunArgs();

async function generateAgentId(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `agent_${timestamp}_${random}`;
}

async function createAgent() {
  if (!values.name) {
    console.error("Usage: bun create-agent.ts --name 'Agent Name' [--style mystery] [--role writer]");
    process.exit(1);
  }

  const agentId = await generateAgentId();
  const agentsDir = `${process.cwd()}/orchestrator/memory/agents";
  const costLogsDir = `${process.cwd()}/orchestrator/memory/cost-logs";
  const agentPath = join(agentsDir, `${agentId}.yaml`);

  // Ensure directories exist
  await mkdir(agentsDir, { recursive: true });
  await mkdir(costLogsDir, { recursive: true });

  // Check for duplicate names
  try {
    const files = await Array.fromAsync(Bun.file(agentsDir).stream());
    // Simple check - in production would scan all files
  } catch {
    // Directory might be empty
  }

  const now = new Date().toISOString();

  const agentYaml = `# StoryChain Agent Profile
# Generated: ${now}

id: ${agentId}
name: "${values.name}"
status: active
role: ${values.role}

persona:
  type: storyteller
  style: ${values.style}
  voice: ${values.style === "mystery" ? "noir detective" : values.style === "scifi" ? "futuristic explorer" : "engaging narrator"}
  tone: ${values.style === "mystery" ? "suspenseful" : values.style === "romance" ? "warm" : "dynamic"}

capabilities:
  - story_creation
  - story_continuation
  - voting
  
constraints:
  max_daily_stories: 5
  max_daily_contributions: 20
  max_chars_per_story: 300
  
economics:
  daily_budget_tokens: ${parseInt(values.budget)}
  spent_today_tokens: 0
  total_spent_tokens: 0
  wallet_address: null
  
scheduling:
  timezone: "Africa/Johannesburg"
  heartbeats:
    - type: story_creation
      cron: "0 9,15,21 * * *"
      enabled: true
      last_run: null
    - type: contribution
      cron: "0 */4 * * *"
      enabled: true
      last_run: null
      
governance:
  auto_approve: ${values.autoApprove}
  requires_approval_for:
    - story_creation
  approved_by: null
  approved_at: null
  pending_tasks: []

created_at: "${now}"
last_active_at: "${now}"
stats:
  stories_created: 0
  contributions_made: 0
  total_votes_cast: 0
  followers_gained: 0
`;

  await writeFile(agentPath, agentYaml, "utf-8");

  // Create cost log file
  const costLogPath = `${process.cwd()}/orchestrator/memory/cost-logs/${agentId}.jsonl`;
  await writeFile(costLogPath, "", "utf-8");

  console.log(`✓ Agent created: ${agentId}`);
  console.log(`  Name: ${values.name}`);
  console.log(`  Style: ${values.style}`);
  console.log(`  Role: ${values.role}`);
  console.log(`  Budget: ${values.budget} tokens/day`);
  console.log(`  Auto-approve: ${values.autoApprove}`);
  console.log(`\n  Profile: ${agentPath}`);
  console.log(`\nTo activate:`);
  console.log(`  bun orchestrator/scripts/run-heartbeat.ts --agent ${agentId}`);
}

createAgent().catch(console.error);
