#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const LOOP_DIR = join(homedir(), ".z", "bug-loops");
const LOG_FILE = join(LOOP_DIR, "bug-fixes.jsonl");
const STATE_FILE = join(LOOP_DIR, "current-loop.json");

interface BugFixAttempt {
  attempt: number;
  timestamp: string;
  action: string;
  result: "success" | "failed" | "partial";
  output: string;
  error?: string;
}

interface BugLoop {
  id: string;
  bug: string;
  context: string;
  strategy: string;
  maxAttempts: number;
  attempts: BugFixAttempt[];
  status: "in_progress" | "fixed" | "escalated" | "abandoned";
  startTime: string;
  endTime?: string;
  solution?: string;
}

function ensureDir() {
  if (!existsSync(LOOP_DIR)) {
    mkdirSync(LOOP_DIR, { recursive: true });
  }
}

function loadCurrentLoop(): BugLoop | null {
  ensureDir();
  if (!existsSync(STATE_FILE)) return null;
  return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
}

function saveCurrentLoop(loop: BugLoop): void {
  ensureDir();
  writeFileSync(STATE_FILE, JSON.stringify(loop, null, 2));
}

function logBugFix(loop: BugLoop): void {
  ensureDir();
  appendFileSync(LOG_FILE, JSON.stringify({
    id: loop.id,
    bug: loop.bug,
    attempts: loop.attempts.length,
    status: loop.status,
    solution: loop.solution,
    timestamp: new Date().toISOString(),
  }) + "\n");
}

function generateId(): string {
  return `bug_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function startLoop(bug: string, context: string, strategy: string, maxAttempts: number = 5): BugLoop {
  const loop: BugLoop = {
    id: generateId(),
    bug,
    context,
    strategy,
    maxAttempts,
    attempts: [],
    status: "in_progress",
    startTime: new Date().toISOString(),
  };
  saveCurrentLoop(loop);
  console.log(`✓ Bug loop started: ${bug.substring(0, 50)}...`);
  console.log(`  ID: ${loop.id}`);
  console.log(`  Max attempts: ${maxAttempts}`);
  console.log(`  Strategy: ${strategy}`);
  return loop;
}

function recordAttempt(action: string, result: "success" | "failed" | "partial", output: string, error?: string): void {
  const loop = loadCurrentLoop();
  if (!loop) {
    console.error("✗ No active bug loop. Start one with --start first.");
    process.exit(1);
  }

  const attempt: BugFixAttempt = {
    attempt: loop.attempts.length + 1,
    timestamp: new Date().toISOString(),
    action,
    result,
    output,
    error,
  };

  loop.attempts.push(attempt);

  console.log(`\n=== Attempt ${attempt.attempt}/${loop.maxAttempts} ===`);
  console.log(`Action: ${action}`);
  console.log(`Result: ${result.toUpperCase()}`);
  if (error) console.log(`Error: ${error}`);

  if (result === "success") {
    loop.status = "fixed";
    loop.endTime = new Date().toISOString();
    loop.solution = action;
    console.log(`\n✓ BUG FIXED!`);
    console.log(`Solution: ${action}`);
  } else if (attempt.attempt >= loop.maxAttempts) {
    loop.status = "escalated";
    loop.endTime = new Date().toISOString();
    console.log(`\n⚠️ Max attempts reached. Escalating...`);
  }

  saveCurrentLoop(loop);
  logBugFix(loop);
}

function showStatus(): void {
  const loop = loadCurrentLoop();
  if (!loop) {
    console.log("No active bug loop.");
    return;
  }

  console.log(`\n=== Bug Loop Status ===`);
  console.log(`ID: ${loop.id}`);
  console.log(`Bug: ${loop.bug}`);
  console.log(`Status: ${loop.status.toUpperCase()}`);
  console.log(`Attempts: ${loop.attempts.length}/${loop.maxAttempts}`);
  console.log(`\nAttempt History:`);

  loop.attempts.forEach((a) => {
    const icon = { success: "✓", failed: "✗", partial: "◐" }[a.result];
    console.log(`  ${icon} #${a.attempt}: ${a.action.substring(0, 40)}...`);
  });
}

function showSuggestedActions(): void {
  const loop = loadCurrentLoop();
  if (!loop) {
    console.log("No active bug loop.");
    return;
  }

  const failedActions = loop.attempts.filter((a) => a.result === "failed").map((a) => a.action);
  const strategies: Record<string, string[]> = {
    dependency: [
      "Clear node_modules and reinstall",
      "Update package to latest version",
      "Check for peer dependency conflicts",
      "Try alternative package",
      "Pin to specific working version",
    ],
    runtime: [
      "Check environment variables",
      "Verify file permissions",
      "Check port availability",
      "Clear caches",
      "Restart service",
    ],
    code: [
      "Add error handling",
      "Add input validation",
      "Check for null/undefined",
      "Add logging for debugging",
      "Simplify the logic",
    ],
    network: [
      "Check connectivity",
      "Verify API credentials",
      "Check rate limits",
      "Use fallback endpoint",
      "Add retry logic",
    ],
  };

  console.log(`\n=== Suggested Actions ===`);
  console.log(`Strategy: ${loop.strategy}`);
  console.log(`Failed attempts: ${failedActions.length}\n`);

  const suggestions = strategies[loop.strategy] || strategies.code;
  const remainingSuggestions = suggestions.filter((s) => !failedActions.some((f) => f.includes(s.split(" ")[0])));

  console.log("Try these next:");
  remainingSuggestions.slice(0, 3).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s}`);
  });

  // Add fallback strategies
  if (remainingSuggestions.length === 0) {
    console.log("\n⚠️ All primary strategies exhausted. Consider:");
    console.log("  - Switching to a different approach");
    console.log("  - Asking for more context");
    console.log("  - Checking documentation");
    console.log("  - Using the smart-solver skill");
  }
}

async function runAutoFix(command: string, timeout: number = 30000): Promise<void> {
  const loop = loadCurrentLoop();
  if (!loop) {
    console.error("✗ No active bug loop.");
    process.exit(1);
  }

  console.log(`\n=== Auto-fix Running ===`);
  console.log(`Command: ${command}`);
  console.log(`Timeout: ${timeout}ms\n`);

  try {
    const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Command timed out"));
      }, timeout);

      const proc = spawn("bash", ["-c", command], {
        cwd: "/home/workspace",
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data) => {
        stdout += data.toString();
        process.stdout.write(data);
      });

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });

      proc.on("close", (code) => {
        clearTimeout(timeoutId);
        resolve({ stdout, stderr, code: code || 0 });
      });

      proc.on("error", (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });

    const isSuccess = result.code === 0 && !result.stderr.toLowerCase().includes("error");
    recordAttempt(
      `Auto: ${command}`,
      isSuccess ? "success" : result.code === 0 ? "partial" : "failed",
      result.stdout.slice(0, 500),
      result.stderr.slice(0, 500) || undefined
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    recordAttempt(`Auto: ${command}`, "failed", "", errorMessage);
  }
}

function escalate(reason: string): void {
  const loop = loadCurrentLoop();
  if (!loop) {
    console.error("✗ No active bug loop.");
    process.exit(1);
  }

  loop.status = "escalated";
  loop.endTime = new Date().toISOString();
  saveCurrentLoop(loop);
  logBugFix(loop);

  console.log(`\n=== Escalated ===`);
  console.log(`Bug: ${loop.bug}`);
  console.log(`Reason: ${reason}`);
  console.log(`Attempts made: ${loop.attempts.length}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Use smart-solver skill for advanced troubleshooting`);
  console.log(`  2. Search for similar issues online`);
  console.log(`  3. Check documentation or ask for help`);
}

function abandon(reason: string): void {
  const loop = loadCurrentLoop();
  if (!loop) {
    console.error("✗ No active bug loop.");
    process.exit(1);
  }

  loop.status = "abandoned";
  loop.endTime = new Date().toISOString();
  saveCurrentLoop(loop);
  logBugFix(loop);

  console.log(`\n=== Abandoned ===`);
  console.log(`Bug: ${loop.bug}`);
  console.log(`Reason: ${reason}`);
}

function showHistory(limit: number = 10): void {
  ensureDir();
  if (!existsSync(LOG_FILE)) {
    console.log("No bug fix history.");
    return;
  }

  const lines = readFileSync(LOG_FILE, "utf-8").trim().split("\n").slice(-limit);
  console.log(`\n=== Bug Fix History (last ${lines.length}) ===\n`);

  lines.forEach((line) => {
    const entry = JSON.parse(line);
    const icon = { fixed: "✓", escalated: "⚠", abandoned: "✗", in_progress: "◐" }[entry.status];
    console.log(`${icon} ${entry.bug.substring(0, 50)}...`);
    console.log(`   Attempts: ${entry.attempts} | Status: ${entry.status}`);
    if (entry.solution) console.log(`   Solution: ${entry.solution}`);
  });
}

const { values } = parseArgs({
  options: {
    start: { type: "boolean", short: "s" },
    attempt: { type: "boolean", short: "a" },
    "auto-fix": { type: "string" },
    status: { type: "boolean" },
    suggest: { type: "boolean" },
    escalate: { type: "boolean", short: "e" },
    abandon: { type: "boolean" },
    history: { type: "boolean", short: "h" },
    bug: { type: "string" },
    context: { type: "string" },
    strategy: { type: "string" },
    "max-attempts": { type: "string" },
    action: { type: "string" },
    result: { type: "string" },
    output: { type: "string" },
    error: { type: "string" },
    reason: { type: "string" },
    timeout: { type: "string" },
    limit: { type: "string" },
    help: { type: "boolean" },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Bug Loop - Automated bug fix loop with retry logic

Usage:
  bug-loop --start --bug "Error message" --context "Context" --strategy "dependency|runtime|code|network"
  bug-loop --attempt --action "Fixed X" --result "success|failed|partial" --output "Output"
  bug-loop --auto-fix "npm install"
  bug-loop --status
  bug-loop --suggest
  bug-loop --escalate --reason "Need more context"
  bug-loop --abandon --reason "Not critical"
  bug-loop --history

Options:
  -s, --start           Start a new bug fix loop
  -a, --attempt         Record an attempt manually
  --auto-fix <cmd>      Run auto-fix command
  --status              Show current loop status
  --suggest             Show suggested next actions
  -e, --escalate        Escalate to advanced troubleshooting
  --abandon             Abandon this bug fix
  -h, --history         Show bug fix history
  --bug <text>          Bug description
  --context <text>      Bug context
  --strategy <type>     Fix strategy: dependency|runtime|code|network
  --max-attempts <n>    Maximum attempts (default: 5)
  --action <text>       Action taken
  --result <status>     Result: success|failed|partial
  --output <text>       Output/result
  --error <text>        Error message
  --reason <text>       Reason for escalate/abandon
  --timeout <ms>        Timeout for auto-fix (default: 30000)
  --limit <n>           History limit (default: 10)
  --help                Show this help
`);
  process.exit(0);
}

if (values.start) {
  if (!values.bug) {
    console.error("Error: --bug required");
    process.exit(1);
  }
  startLoop(
    values.bug,
    values.context || "",
    values.strategy || "code",
    parseInt(values["max-attempts"] || "5")
  );
} else if (values.attempt) {
  if (!values.action || !values.result) {
    console.error("Error: --action and --result required");
    process.exit(1);
  }
  recordAttempt(values.action, values.result as "success" | "failed" | "partial", values.output || "", values.error);
} else if (values["auto-fix"]) {
  runAutoFix(values["auto-fix"], parseInt(values.timeout || "30000"));
} else if (values.status) {
  showStatus();
} else if (values.suggest) {
  showSuggestedActions();
} else if (values.escalate) {
  escalate(values.reason || "Unknown");
} else if (values.abandon) {
  abandon(values.reason || "Unknown");
} else if (values.history) {
  showHistory(parseInt(values.limit || "10"));
} else {
  showStatus();
}
