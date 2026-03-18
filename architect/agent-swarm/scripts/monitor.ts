#!/usr/bin/env bun
/**
 * Monitor Agent Team Progress
 * 
 * Shows real-time status of running agent teams.
 * Usage: bun scripts/monitor.ts --task-id task-1234567890-abc123
 *         bun scripts/monitor.ts --all
 */

import { parseArgs } from "util";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    "task-id": { type: "string", short: "i" },
    all: { type: "boolean", short: "a" },
    watch: { type: "boolean", short: "w" },
  },
  strict: true,
  allowPositionals: true,
});

const SWARM_ROOT = "/home/workspace/StoryChain/architect/agent-swarm";
const MEMORY_ROOT = `${SWARM_ROOT}/memory`;

interface TaskMeta {
  id: string;
  name: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  params: Record<string, string>;
}

interface AgentStatus {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at?: string;
  completed_at?: string;
}

function loadTaskMeta(taskDir: string): TaskMeta | null {
  const path = join(taskDir, "task.yaml");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as TaskMeta;
  } catch {
    return null;
  }
}

function loadAgentStatuses(taskDir: string): AgentStatus[] {
  const agentsDir = join(taskDir, "agents");
  if (!existsSync(agentsDir)) return [];

  return readdirSync(agentsDir)
    .filter(name => statSync(join(agentsDir, name)).isDirectory())
    .map(name => {
      const agentDir = join(agentsDir, name);
      const statusPath = join(agentDir, "status.yaml");
      const donePath = join(agentDir, "done.flag");

      let status: AgentStatus["status"] = "pending";
      let started_at: string | undefined;
      let completed_at: string | undefined;

      if (existsSync(statusPath)) {
        try {
          const content = readFileSync(statusPath, "utf-8");
          const lines = content.split("\n");
          for (const line of lines) {
            if (line.startsWith("status: ")) {
              status = line.replace("status: ", "").trim() as AgentStatus["status"];
            }
            if (line.startsWith("started_at: ")) {
              started_at = line.replace("started_at: ", "").trim();
            }
            if (line.startsWith("completed_at: ")) {
              completed_at = line.replace("completed_at: ", "").trim();
            }
          }
        } catch {}
      }

      if (existsSync(donePath)) {
        status = "completed";
        if (!completed_at) {
          try {
            completed_at = readFileSync(donePath, "utf-8").trim();
          } catch {}
        }
      }

      return { name, status, started_at, completed_at };
    });
}

function formatDuration(start?: string, end?: string): string {
  if (!start) return "pending";
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const seconds = Math.floor((endTime - startTime) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function printTaskStatus(taskDir: string, status: string) {
  const meta = loadTaskMeta(taskDir);
  if (!meta) return;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Task: ${meta.name} (${meta.id})`);
  console.log(`Status: ${meta.status} [${status}]`);
  console.log(`Created: ${meta.created_at}`);
  if (meta.started_at) {
    console.log(`Started: ${meta.started_at}`);
  }
  if (meta.completed_at) {
    console.log(`Completed: ${meta.completed_at}`);
    console.log(`Duration: ${formatDuration(meta.started_at, meta.completed_at)}`);
  }
  if (Object.keys(meta.params).length > 0) {
    console.log(`Params: ${JSON.stringify(meta.params)}`);
  }

  const agents = loadAgentStatuses(taskDir);
  if (agents.length > 0) {
    console.log(`\nAgents (${agents.length}):`);
    const completed = agents.filter(a => a.status === "completed").length;
    const running = agents.filter(a => a.status === "running").length;
    const pending = agents.filter(a => a.status === "pending").length;
    console.log(`  ✓ Completed: ${completed} | ▶ Running: ${running} | ○ Pending: ${pending}`);
    
    for (const agent of agents) {
      const symbol = agent.status === "completed" ? "✓" : agent.status === "running" ? "▶" : "○";
      const duration = agent.started_at ? formatDuration(agent.started_at, agent.completed_at) : "-";
      console.log(`  ${symbol} ${agent.name.padEnd(20)} ${agent.status.padEnd(10)} ${duration}`);
    }
  }
}

async function monitorTask(taskId: string, watch: boolean) {
  const dirs = ["pending", "active", "completed"];
  
  for (const dir of dirs) {
    const taskDir = join(MEMORY_ROOT, dir, taskId);
    if (existsSync(taskDir)) {
      do {
        console.clear();
        printTaskStatus(taskDir, dir);
        
        if (watch) {
          console.log(`\n${"-".repeat(60)}`);
          console.log("Watching... (Ctrl+C to exit)");
          await new Promise(r => setTimeout(r, 2000));
        }
      } while (watch);
      return;
    }
  }

  console.error(`Task not found: ${taskId}`);
  process.exit(1);
}

async function monitorAll() {
  const dirs = ["pending", "active", "completed"];
  let found = false;

  for (const dir of dirs) {
    const dirPath = join(MEMORY_ROOT, dir);
    if (!existsSync(dirPath)) continue;

    const tasks = readdirSync(dirPath)
      .filter(name => statSync(join(dirPath, name)).isDirectory());

    for (const task of tasks) {
      printTaskStatus(join(dirPath, task), dir);
      found = true;
    }
  }

  if (!found) {
    console.log("No tasks found.");
  }
}

async function main() {
  const taskId = values["task-id"];
  const all = values.all;
  const watch = values.watch;

  if (all) {
    await monitorAll();
  } else if (taskId) {
    await monitorTask(taskId, watch);
  } else {
    console.error("Usage:");
    console.error("  bun scripts/monitor.ts --task-id <id> [--watch]");
    console.error("  bun scripts/monitor.ts --all");
    process.exit(1);
  }
}

main().catch(console.error);
