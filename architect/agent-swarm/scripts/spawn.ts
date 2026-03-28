#!/usr/bin/env bun
/**
 * Spawn Agent Team
 * 
 * Spawns a coordinated team of agents based on a task template.
 * Usage: bun scripts/spawn.ts --task create-story --params '{"persona": "mystery"}'
 */

import { parseArgs } from "util";
import { parse as parseTOML } from "smol-toml";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    task: { type: "string", short: "t" },
    params: { type: "string", short: "p" },
    "dry-run": { type: "boolean", short: "d" },
  },
  strict: true,
  allowPositionals: true,
});

const SWARM_ROOT = `${process.cwd()}/architect/agent-swarm";
const MEMORY_ROOT = `${SWARM_ROOT}/memory`;

interface Agent {
  name: string;
  type: string;
  model: string;
  prompt?: string;
  output: string;
  depends_on?: string[];
  condition?: string;
  action?: string;
}

interface Task {
  task: {
    name: string;
    description: string;
    timeout: number;
  };
  agents: Agent[];
}

function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function interpolateTemplate(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] || `{{${key}}}`);
}

async function spawnAgent(agent: Agent, taskDir: string, params: Record<string, string>) {
  const agentDir = join(taskDir, "agents", agent.name);
  mkdirSync(agentDir, { recursive: true });

  // Write agent config
  const config = {
    name: agent.name,
    type: agent.type,
    model: agent.model,
    output_path: agent.output,
    depends_on: agent.depends_on || [],
    condition: agent.condition,
    action: agent.action,
  };
  writeFileSync(join(agentDir, "config.yaml"), JSON.stringify(config, null, 2));

  // Write prompt with interpolated params
  if (agent.prompt) {
    const prompt = interpolateTemplate(agent.prompt, params);
    writeFileSync(join(agentDir, "prompt.md"), prompt);
  }

  // Create output placeholder
  writeFileSync(join(agentDir, "status.yaml"), "status: pending\n");

  return { agentDir, config };
}

async function main() {
  const taskName = values.task;
  const paramsJson = values.params || "{}";
  const dryRun = values["dry-run"] || false;

  if (!taskName) {
    console.error("Usage: bun scripts/spawn.ts --task <name> [--params '{...}']");
    process.exit(1);
  }

  // Parse params
  let params: Record<string, string>;
  try {
    params = JSON.parse(paramsJson);
  } catch {
    console.error("Invalid JSON in --params");
    process.exit(1);
  }

  // Load task template
  const taskPath = join(SWARM_ROOT, "tasks", `${taskName}.toml`);
  if (!existsSync(taskPath)) {
    console.error(`Task not found: ${taskPath}`);
    console.error("Available tasks:", 
      Bun.file(join(SWARM_ROOT, "tasks")).stream()
        .toString()
        .split("\n")
        .filter(f => f.endsWith(".toml"))
        .map(f => f.replace(".toml", ""))
        .join(", ")
    );
    process.exit(1);
  }

  const taskContent = readFileSync(taskPath, "utf-8");
  const task = parseTOML(taskContent) as unknown as Task;

  // Generate task ID
  const taskId = generateTaskId();
  const taskDir = join(MEMORY_ROOT, "pending", taskId);

  if (dryRun) {
    console.log("DRY RUN - Would create task:");
    console.log(`  Task ID: ${taskId}`);
    console.log(`  Task: ${task.task.name}`);
    console.log(`  Description: ${task.task.description}`);
    console.log(`  Agents: ${task.agents.length}`);
    for (const agent of task.agents) {
      console.log(`    - ${agent.name} (${agent.type})`);
      if (agent.depends_on?.length) {
        console.log(`      depends_on: ${agent.depends_on.join(", ")}`);
      }
    }
    console.log(`  Params:`, params);
    return;
  }

  // Create task directory
  mkdirSync(taskDir, { recursive: true });

  // Write task metadata
  const metadata = {
    id: taskId,
    name: task.task.name,
    description: task.task.description,
    timeout: task.task.timeout,
    params,
    created_at: new Date().toISOString(),
    status: "pending",
  };
  writeFileSync(join(taskDir, "task.yaml"), JSON.stringify(metadata, null, 2));

  // Spawn agents
  console.log(`Spawning task ${taskId}...`);
  for (const agent of task.agents) {
    await spawnAgent(agent, taskDir, { ...params, "task-id": taskId });
    console.log(`  Spawned: ${agent.name} (${agent.type})`);
  }

  // Write dependency graph
  const deps = task.agents.reduce((acc, a) => {
    acc[a.name] = a.depends_on || [];
    return acc;
  }, {} as Record<string, string[]>);
  writeFileSync(join(taskDir, "dependencies.yaml"), JSON.stringify(deps, null, 2));

  console.log(`\nTask ready for dispatch`);
  console.log(`Run: bun scripts/dispatch.ts --task-id ${taskId}`);
}

main().catch(console.error);
