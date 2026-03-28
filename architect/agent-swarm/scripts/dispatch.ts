#!/usr/bin/env bun
/**
 * Dispatch Agent Team
 * Usage: bun scripts/dispatch.ts --task-id task-1234567890-abc123
 */

import { parseArgs } from "util";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { join } from "path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    "task-id": { type: "string", short: "i" },
    "max-concurrent": { type: "string", short: "c", default: "3" },
  },
  strict: true,
  allowPositionals: true,
});

const SWARM_ROOT = `${process.cwd()}/architect/agent-swarm`;
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
  return parseYaml(content) as AgentConfig;
}

function checkDependenciesMet(agentDir: string, config: AgentConfig, taskDir: string): boolean {
  if (!config.depends_on || config.depends_on.length === 0) return true;
  for (const dep of config.depends_on) {
    const doneFlag = join(taskDir, "agents", dep, "done.flag");
    if (!existsSync(doneFlag)) return false;
  }
  return true;
}

function checkCondition(agentDir: string, config: AgentConfig, taskDir: string): boolean {
  if (!config.condition) return true;
  const match = config.condition.match(/(\w+)\.(\w+)\s*==\s*['"]([\w]+)['"]/);
  if (!match) { console.warn(`Unknown condition: ${config.condition}`); return true; }
  const [, fileBase, field, expected] = match;
  const filePath = join(taskDir, fileBase + ".yaml");
  if (!existsSync(filePath)) return false;
  try {
    const data = parseYaml(readFileSync(filePath, "utf-8"));
    return data[field] === expected;
  } catch { return false; }
}

async function executeAgent(agentDir: string, config: AgentConfig, taskDir: string) {
  mkdirSync(agentDir, { recursive: true });
  writeFileSync(join(agentDir, "status.yaml"), `status: running\nstarted_at: ${new Date().toISOString()}\n`);
  console.log(`  Executing: ${config.name} (${config.type})`);
  const output = { completed_at: new Date().toISOString(), agent: config.name, type: config.type, result: "completed" };
  writeFileSync(join(taskDir, config.output_path), JSON.stringify(output, null, 2));
  writeFileSync(join(agentDir, "status.yaml"), `status: completed\ncompleted_at: ${new Date().toISOString()}\n`);
  writeFileSync(join(agentDir, "done.flag"), "");
}

async function dispatch() {
  if (!values["task-id"]) { console.error("--task-id required"); process.exit(1); }
  const taskId = values["task-id"]!;
  const maxConcurrent = parseInt(values["max-concurrent"] || "3");
  const activeDir = join(MEMORY_ROOT, "active", taskId);
  if (!existsSync(activeDir)) { console.error(`Task not found: ${activeDir}`); process.exit(1); }

  const taskMeta = parseYaml(readFileSync(join(activeDir, "task.yaml"), "utf-8"));
  console.log(`\nDispatching: ${taskMeta.name || taskId}`);

  const agentsDir = join(activeDir, "agents");
  if (!existsSync(agentsDir)) { console.log("No agents."); return; }

  const agentDirs = readdirSync(agentsDir).map(d => join(agentsDir, d));
  let running = 0;
  let completed = 0;

  while (completed < agentDirs.length) {
    for (const agentDir of agentDirs) {
      if (existsSync(join(agentDir, "done.flag"))) continue;
      const statusPath = join(agentDir, "status.yaml");
      if (existsSync(statusPath)) {
        const s = parseYaml(readFileSync(statusPath, "utf-8"));
        if (s.status === "running") continue;
      }
      if (running >= maxConcurrent) break;
      try {
        const cfg = await loadAgentConfig(agentDir);
        if (!checkDependenciesMet(agentDir, cfg, activeDir)) { console.log(`  Waiting: ${cfg.name}`); continue; }
        if (!checkCondition(agentDir, cfg, activeDir)) {
          writeFileSync(join(agentDir, "done.flag"), "");
          completed++; continue;
        }
        running++;
        await executeAgent(agentDir, cfg, activeDir);
        running--; completed++;
      } catch (e) { console.error(`  Agent error:`, e); running--; completed++; }
    }
    await new Promise(r => setTimeout(r, 500));
  }

  const completedDir = join(MEMORY_ROOT, "completed", taskId);
  mkdirSync(completedDir, { recursive: true });
  renameSync(activeDir, completedDir);
  const meta = parseYaml(readFileSync(join(completedDir, "task.yaml"), "utf-8"));
  meta.completed_at = new Date().toISOString();
  meta.status = "completed";
  writeFileSync(join(completedDir, "task.yaml"), stringifyYaml(meta));
  console.log(`\nCompleted: ${taskId}`);
}

dispatch().catch(console.error);
