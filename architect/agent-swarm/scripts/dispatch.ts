#!/usr/bin/env bun
/**
 * Dispatch Agent Team
 * 
 * Dispatches spawned agents in dependency order.
 * Usage: bun scripts/dispatch.ts --task-id task-1234567890-abc123
 */

import { parseArgs } from "util";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { join } from "path";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    "task-id": { type: "string", short: "i" },
    "max-concurrent": { type: "string", short: "c", default: "3" },
  },
  strict: true,
  allowPositionals: true,
});

const SWARM_ROOT = "/home/workspace/StoryChain/architect/agent-swarm";
const MEMORY_ROOT = `${SWARM_ROOT}/memory`;

interface AgentConfig {
  name: string;
  type: string;
  model: string;
  output_path: string;
  depends_on: string[];
  condition?: string;
  action?: string;
}

async function loadAgentConfig(agentDir: string): Promise<AgentConfig> {
  const configPath = join(agentDir, "config.yaml");
  const content = readFileSync(configPath, "utf-8");
  return JSON.parse(content) as AgentConfig;
}

function checkDependenciesMet(agentDir: string, config: AgentConfig, taskDir: string): boolean {
  if (!config.depends_on || config.depends_on.length === 0) {
    return true;
  }

  for (const dep of config.depends_on) {
    const depDir = join(taskDir, "agents", dep);
    const doneFlag = join(depDir, "done.flag");
    if (!existsSync(doneFlag)) {
      return false;
    }
  }

  return true;
}

function checkCondition(agentDir: string, config: AgentConfig, taskDir: string): boolean {
  if (!config.condition) {
    return true;
  }

  // Simple condition evaluator
  // Format: "file.status == 'pass'" or "verdict.status == 'pass'"
  const match = config.condition.match(/(\w+)\.(\w+)\s*==\s*['"](\w+)['"]/);
  if (!match) {
    console.warn(`  Unknown condition format: ${config.condition}`);
    return true;
  }

  const [, fileBase, field, expected] = match;
  const filePath = join(taskDir, fileBase + ".yaml");
  
  if (!existsSync(filePath)) {
    return false;
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    return data[field] === expected || data[fileBase]?.[field] === expected;
  } catch {
    return false;
  }
}

async function executeAgent(agentDir: string, config: AgentConfig, taskDir: string) {
  const toolPath = join(SWARM_ROOT, "tools", `${config.type}.yaml`);
  const promptPath = join(agentDir, "prompt.md");
  
  // Update status to running
  writeFileSync(join(agentDir, "status.yaml"), `status: running\nstarted_at: ${new Date().toISOString()}\n`);

  console.log(`  Executing: ${config.name} (${config.type})`);

  // In a real implementation, this would:
  // 1. Call the LLM with the prompt
  // 2. Parse the output
  // 3. Write to output file
  // 4. Create done.flag
  
  // For now, simulate by writing a placeholder
  const output = {
    agent: config.name,
    type: config.type,
    executed_at: new Date().toISOString(),
    tool: toolPath,
    note: "Agent execution would happen here - integrates with LLM API",
  };

  writeFileSync(join(taskDir, config.output_path), JSON.stringify(output, null, 2));
  writeFileSync(join(agentDir, "done.flag"), new Date().toISOString());
  writeFileSync(join(agentDir, "status.yaml"), `status: completed\ncompleted_at: ${new Date().toISOString()}\n`);
}

async function dispatchTask(taskId: string, maxConcurrent: number) {
  const pendingDir = join(MEMORY_ROOT, "pending", taskId);
  const activeDir = join(MEMORY_ROOT, "active", taskId);

  if (!existsSync(pendingDir)) {
    console.error(`Task not found in pending: ${taskId}`);
    process.exit(1);
  }

  // Move to active
  console.log(`Moving task ${taskId} to active...`);
  mkdirSync(join(MEMORY_ROOT, "active"), { recursive: true });
  renameSync(pendingDir, activeDir);

  // Update task status
  const taskMetaPath = join(activeDir, "task.yaml");
  const taskMeta = JSON.parse(readFileSync(taskMetaPath, "utf-8"));
  taskMeta.status = "active";
  taskMeta.started_at = new Date().toISOString();
  writeFileSync(taskMetaPath, JSON.stringify(taskMeta, null, 2));

  // Load dependency graph
  const depsPath = join(activeDir, "dependencies.yaml");
  const deps = JSON.parse(readFileSync(depsPath, "utf-8")) as Record<string, string[]>;

  // Topological sort
  const visited = new Set<string>();
  const temp = new Set<string>();
  const order: string[] = [];

  function visit(agent: string) {
    if (temp.has(agent)) {
      throw new Error(`Circular dependency detected: ${agent}`);
    }
    if (visited.has(agent)) {
      return;
    }
    temp.add(agent);
    for (const dep of deps[agent] || []) {
      visit(dep);
    }
    temp.delete(agent);
    visited.add(agent);
    order.push(agent);
  }

  for (const agent of Object.keys(deps)) {
    if (!visited.has(agent)) {
      visit(agent);
    }
  }

  console.log(`\nExecution order: ${order.join(" → ")}`);
  console.log(`Max concurrent: ${maxConcurrent}\n`);

  // Execute in order
  const running = new Set<string>();
  const completed = new Set<string>();

  while (completed.size < order.length) {
    for (const agentName of order) {
      if (completed.has(agentName) || running.has(agentName)) {
        continue;
      }

      const agentDir = join(activeDir, "agents", agentName);
      const config = await loadAgentConfig(agentDir);

      if (!checkDependenciesMet(agentDir, config, activeDir)) {
        continue;
      }

      if (!checkCondition(agentDir, config, activeDir)) {
        console.log(`  Skipping ${agentName} (condition not met)`);
        writeFileSync(join(agentDir, "done.flag"), "skipped: condition not met");
        completed.add(agentName);
        continue;
      }

      if (running.size >= maxConcurrent) {
        break;
      }

      running.add(agentName);
      
      // Execute (in real impl, this would be async/parallel)
      await executeAgent(agentDir, config, activeDir);
      
      running.delete(agentName);
      completed.add(agentName);
    }

    // Check for completion
    if (running.size === 0 && completed.size < order.length) {
      console.log("Waiting for dependencies...");
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Move to completed
  console.log(`\nTask ${taskId} complete!`);
  const completedDir = join(MEMORY_ROOT, "completed", taskId);
  mkdirSync(join(MEMORY_ROOT, "completed"), { recursive: true });
  renameSync(activeDir, completedDir);

  // Update final status
  const finalMeta = JSON.parse(readFileSync(join(completedDir, "task.yaml"), "utf-8"));
  finalMeta.status = "completed";
  finalMeta.completed_at = new Date().toISOString();
  writeFileSync(join(completedDir, "task.yaml"), JSON.stringify(finalMeta, null, 2));

  console.log(`Results: ${completedDir}/result.yaml`);
}

async function main() {
  const taskId = values["task-id"];
  const maxConcurrent = parseInt(values["max-concurrent"] || "3", 10);

  if (!taskId) {
    console.error("Usage: bun scripts/dispatch.ts --task-id <id>");
    process.exit(1);
  }

  await dispatchTask(taskId, maxConcurrent);
}

main().catch(console.error);
