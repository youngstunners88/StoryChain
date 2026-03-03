#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

const VERIFY_DIR = join(homedir(), ".z", "verification");
const CHECKPOINTS_FILE = join(VERIFY_DIR, "checkpoints.json");

interface Check {
  name: string;
  type: "command" | "file_exists" | "file_contains" | "json_valid" | "custom";
  target: string;
  expected?: string;
  critical: boolean;
}

interface Checkpoint {
  id: string;
  name: string;
  checks: Check[];
  created: string;
  last_run?: string;
  pass_count: number;
  fail_count: number;
}

interface VerifyResult {
  check: Check;
  passed: boolean;
  output: string;
  error?: string;
}

function ensureDir() {
  if (!existsSync(VERIFY_DIR)) {
    mkdirSync(VERIFY_DIR, { recursive: true });
  }
}

function loadCheckpoints(): Checkpoint[] {
  ensureDir();
  if (!existsSync(CHECKPOINTS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(CHECKPOINTS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveCheckpoints(checkpoints: Checkpoint[]) {
  ensureDir();
  writeFileSync(CHECKPOINTS_FILE, JSON.stringify(checkpoints, null, 2));
}

function generateId(): string {
  return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function runCheck(check: Check): VerifyResult {
  let passed = false;
  let output = "";
  let error: string | undefined;

  try {
    switch (check.type) {
      case "command":
        try {
          const result = execSync(check.target, {
            encoding: "utf-8",
            timeout: 10000,
            stdio: ["pipe", "pipe", "pipe"],
          });
          output = result.trim();
          if (check.expected) {
            passed = output.includes(check.expected);
            if (!passed) {
              error = `Output did not contain: ${check.expected}`;
            }
          } else {
            passed = true;
          }
        } catch (e: any) {
          output = e.stdout?.toString() || "";
          error = e.stderr?.toString() || e.message;
          passed = false;
        }
        break;

      case "file_exists":
        passed = existsSync(check.target);
        output = passed ? `File exists: ${check.target}` : `File not found: ${check.target}`;
        if (!passed) error = "File does not exist";
        break;

      case "file_contains":
        if (existsSync(check.target)) {
          const content = readFileSync(check.target, "utf-8");
          if (check.expected) {
            passed = content.includes(check.expected);
            output = passed
              ? `Found: ${check.expected}`
              : `Not found in file: ${check.expected}`;
            if (!passed) error = "Pattern not found in file";
          }
        } else {
          output = `File not found: ${check.target}`;
          error = "File does not exist";
        }
        break;

      case "json_valid":
        if (existsSync(check.target)) {
          try {
            const content = readFileSync(check.target, "utf-8");
            JSON.parse(content);
            passed = true;
            output = "Valid JSON";
          } catch (e: any) {
            error = `Invalid JSON: ${e.message}`;
            output = "Parse failed";
          }
        } else {
          error = "File does not exist";
        }
        break;

      case "custom":
        // Custom checks use command but with special handling
        try {
          const result = execSync(check.target, { encoding: "utf-8", timeout: 30000 });
          output = result.trim();
          passed = output.toLowerCase().includes("pass") || result.includes("✓") || result.includes("success");
          if (!passed && !output.toLowerCase().includes("fail")) {
            // If no explicit pass/fail, check exit code
            passed = true;
          }
        } catch (e: any) {
          error = e.message;
          passed = false;
        }
        break;
    }
  } catch (e: any) {
    error = e.message;
    passed = false;
  }

  return { check, passed, output, error };
}

function createCheckpoint(
  name: string,
  checks: Array<{ name: string; type: Check["type"]; target: string; expected?: string; critical?: boolean }>
): void {
  const checkpoints = loadCheckpoints();
  
  const newCheckpoint: Checkpoint = {
    id: generateId(),
    name,
    checks: checks.map((c) => ({
      ...c,
      critical: c.critical ?? true,
    })),
    created: new Date().toISOString(),
    pass_count: 0,
    fail_count: 0,
  };
  
  checkpoints.push(newCheckpoint);
  saveCheckpoints(checkpoints);
  
  console.log(`✓ Created checkpoint: ${name}`);
  console.log(`  ID: ${newCheckpoint.id}`);
  console.log(`  Checks: ${checks.length}`);
}

function runCheckpoint(idOrName: string): boolean {
  const checkpoints = loadCheckpoints();
  const checkpoint = checkpoints.find(
    (c) => c.id === idOrName || c.name === idOrName || c.id.includes(idOrName)
  );
  
  if (!checkpoint) {
    console.error(`✗ Checkpoint not found: ${idOrName}`);
    return false;
  }
  
  console.log(`\n=== RUNNING: ${checkpoint.name} ===\n`);
  
  let allPassed = true;
  let criticalFailed = false;
  const results: VerifyResult[] = [];
  
  for (const check of checkpoint.checks) {
    const result = runCheck(check);
    results.push(result);
    
    const icon = result.passed ? "✓" : "✗";
    const critical = check.critical ? " [CRITICAL]" : "";
    console.log(`${icon} ${check.name}${critical}`);
    if (result.output) console.log(`   ${result.output}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    
    if (!result.passed) {
      allPassed = false;
      if (check.critical) criticalFailed = true;
    }
  }
  
  // Update stats
  checkpoint.last_run = new Date().toISOString();
  checkpoint.pass_count = results.filter((r) => r.passed).length;
  checkpoint.fail_count = results.filter((r) => !r.passed).length;
  saveCheckpoints(checkpoints);
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Passed: ${checkpoint.pass_count}/${results.length}`);
  
  if (criticalFailed) {
    console.log(`\n⚠️  CRITICAL CHECK FAILED - Do not proceed`);
    return false;
  } else if (!allPassed) {
    console.log(`\n⚠️  Some checks failed - Review before proceeding`);
    return false;
  } else {
    console.log(`\n✓ All checks passed`);
    return true;
  }
}

function listCheckpoints(): void {
  const checkpoints = loadCheckpoints();
  
  if (checkpoints.length === 0) {
    console.log("No checkpoints defined.");
    console.log("\nCreate one with:");
    console.log(`  verify --create "name" --checks '...'`);
    return;
  }
  
  console.log(`\n=== CHECKPOINTS ===\n`);
  checkpoints.forEach((c, i) => {
    console.log(`[${i + 1}] ${c.name}`);
    console.log(`    ID: ${c.id}`);
    console.log(`    Checks: ${c.checks.length} | Created: ${c.created.split("T")[0]}`);
    if (c.last_run) {
      console.log(`    Last run: ${c.pass_count}/${c.checks.length} passed`);
    }
    console.log("");
  });
}

function quickVerify(checks: string): boolean {
  // Parse quick checks: "type:target, type:target:expected"
  const checkList: Check[] = checks.split(",").map((c, i) => {
    const parts = c.trim().split(":");
    const type = parts[0] as Check["type"];
    const target = parts[1] || "";
    const expected = parts[2];
    
    return {
      name: `Check ${i + 1}`,
      type,
      target,
      expected,
      critical: true,
    };
  });
  
  console.log(`\n=== QUICK VERIFY ===\n`);
  
  let allPassed = true;
  for (const check of checkList) {
    const result = runCheck(check);
    const icon = result.passed ? "✓" : "✗";
    console.log(`${icon} ${check.type}: ${check.target}`);
    if (result.error) console.log(`   ${result.error}`);
    if (!result.passed) allPassed = false;
  }
  
  return allPassed;
}

const { values } = parseArgs({
  options: {
    create: { type: "string", short: "c" },
    checks: { type: "string", short: "C" },
    run: { type: "string", short: "r" },
    list: { type: "boolean", short: "l" },
    quick: { type: "string", short: "q" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Verify - Verification checkpoints for quality assurance

Usage:
  verify --create "name" --checks 'JSON array'
  verify --run <id|name>
  verify --list
  verify --quick "type:target,type:target:expected"

Options:
  -c, --create <name>    Create a new checkpoint
  -C, --checks <json>    JSON array of checks
  -r, --run <id|name>    Run a checkpoint
  -l, --list             List all checkpoints
  -q, --quick <checks>   Quick verification without saving
  -h, --help             Show this help

Check Types:
  command         Run a shell command (pass if exit 0)
  file_exists     Check if file exists
  file_contains   Check if file contains pattern
  json_valid      Validate JSON file syntax
  custom          Custom command with pass/fail detection

Check Format (for --checks):
  [{"name":"Check name","type":"command","target":"npm test","critical":true}]

Quick Format:
  command:npm test
  file_exists:/path/to/file
  file_contains:/path/to/file:expected text
  json_valid:/path/to/file.json

Examples:
  verify --create "pre-commit" --checks '[{"name":"Tests pass","type":"command","target":"npm test"}]'
  verify --run pre-commit
  verify --quick "file_exists:package.json,command:npm run lint"
`);
  process.exit(0);
}

if (values.list) {
  listCheckpoints();
} else if (values.quick) {
  const passed = quickVerify(values.quick);
  process.exit(passed ? 0 : 1);
} else if (values.create && values.checks) {
  try {
    const checks = JSON.parse(values.checks);
    createCheckpoint(values.create, checks);
  } catch (e: any) {
    console.error(`Invalid JSON: ${e.message}`);
    process.exit(1);
  }
} else if (values.run) {
  const passed = runCheckpoint(values.run);
  process.exit(passed ? 0 : 1);
} else {
  console.log("Use --help for usage information");
}
