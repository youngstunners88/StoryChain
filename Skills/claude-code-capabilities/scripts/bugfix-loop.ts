#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execSync, spawn } from "node:child_process";

const BUGFIX_DIR = join(homedir(), ".z", "bugfix");
const SESSIONS_FILE = join(BUGFIX_DIR, "sessions.json");
const LOG_FILE = join(BUGFIX_DIR, "bugfix.log");

interface FixAttempt {
  attempt: number;
  error: string;
  analysis: string;
  fix_applied: string;
  result: "success" | "failed" | "partial";
  timestamp: string;
}

interface Session {
  id: string;
  command: string;
  max_attempts: number;
  attempts: FixAttempt[];
  status: "running" | "fixed" | "exhausted" | "manual_needed";
  started: string;
  ended?: string;
  total_time_ms?: number;
}

function ensureDir() {
  if (!existsSync(BUGFIX_DIR)) {
    mkdirSync(BUGFIX_DIR, { recursive: true });
  }
}

function log(message: string) {
  ensureDir();
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

function loadSessions(): Session[] {
  ensureDir();
  if (!existsSync(SESSIONS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(SESSIONS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  ensureDir();
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function generateId(): string {
  return `fix_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function analyzeError(stderr: string, stdout: string): { type: string; hints: string[] } {
  const errorText = stderr + stdout;
  const hints: string[] = [];
  let type = "unknown";
  
  // Common error patterns
  const patterns: Array<{ pattern: RegExp; type: string; hint: string }> = [
    { pattern: /Cannot find module ['"](.+)['"]/, type: "missing_module", hint: "Install missing module or check import path" },
    { pattern: /SyntaxError: (.+)/, type: "syntax", hint: "Check syntax in indicated file/line" },
    { pattern: /TypeError: (.+) is not a function/, type: "type", hint: "Verify function exists and is callable" },
    { pattern: /ENOENT: no such file or directory, open ['"](.+)['"]/, type: "file_not_found", hint: "Create missing file or check path" },
    { pattern: /ECONNREFUSED/, type: "connection", hint: "Check if service is running on specified port" },
    { pattern: /ETIMEDOUT/, type: "timeout", hint: "Increase timeout or check network connectivity" },
    { pattern: /Permission denied/, type: "permission", hint: "Check file permissions or run with appropriate privileges" },
    { pattern: /out of memory/i, type: "memory", hint: "Reduce data size or increase memory limit" },
    { pattern: /rate limit/i, type: "rate_limit", hint: "Add delays between requests or implement backoff" },
    { pattern: /authentication failed|unauthorized|401|403/i, type: "auth", hint: "Check credentials and API keys" },
    { pattern: /port \d+ is already in use/, type: "port_in_use", hint: "Kill existing process or use different port" },
    { pattern: /sh: (.+): command not found/, type: "command_not_found", hint: "Install missing command or check PATH" },
    { pattern: /npm ERR! (.+)/, type: "npm", hint: "Check package.json and npm configuration" },
    { pattern: /ts\(\d+\)/, type: "typescript", hint: "Fix TypeScript type error" },
    { pattern: /Failed to compile/, type: "compile", hint: "Fix compilation errors" },
  ];
  
  for (const { pattern, type: t, hint } of patterns) {
    if (pattern.test(errorText)) {
      type = t;
      hints.push(hint);
    }
  }
  
  // Extract specific error line if available
  const lineMatch = errorText.match(/:(\d+):(\d+)/);
  if (lineMatch) {
    hints.push(`Error at line ${lineMatch[1]}, column ${lineMatch[2]}`);
  }
  
  // Check for common fixes in file system
  if (type === "missing_module") {
    const moduleMatch = errorText.match(/Cannot find module ['"]([^'"]+)['"]/);
    if (moduleMatch) {
      const moduleName = moduleMatch[1];
      hints.push(`Try: npm install ${moduleName} or bun add ${moduleName}`);
    }
  }
  
  if (type === "command_not_found") {
    const cmdMatch = errorText.match(/sh: (.+): command not found/);
    if (cmdMatch) {
      hints.push(`Try: apt install ${cmdMatch[1]} or check if command is in PATH`);
    }
  }
  
  return { type, hints };
}

function suggestFix(errorType: string, errorText: string): string[] {
  const suggestions: string[] = [];
  
  switch (errorType) {
    case "missing_module":
      const modMatch = errorText.match(/Cannot find module ['"]([^'"]+)['"]/);
      if (modMatch) {
        suggestions.push(`bun add ${modMatch[1]}`);
        suggestions.push(`npm install ${modMatch[1]}`);
      }
      break;
      
    case "file_not_found":
      const fileMatch = errorText.match(/open ['"]([^'"]+)['"]/);
      if (fileMatch) {
        suggestions.push(`touch ${fileMatch[1]}`);
        suggestions.push(`Check if path is correct: ${fileMatch[1]}`);
      }
      break;
      
    case "port_in_use":
      const portMatch = errorText.match(/port (\d+)/);
      if (portMatch) {
        suggestions.push(`lsof -ti:${portMatch[1]} | xargs kill -9`);
        suggestions.push(`Use different port`);
      }
      break;
      
    case "permission":
      suggestions.push("chmod +x <file>");
      suggestions.push("Run with appropriate user/privileges");
      break;
      
    case "syntax":
    case "typescript":
      suggestions.push("Review syntax at indicated line");
      suggestions.push("Check for missing brackets, quotes, or semicolons");
      break;
      
    case "connection":
    case "timeout":
      suggestions.push("Check if service is running");
      suggestions.push("Verify network connectivity");
      suggestions.push("Increase timeout value");
      break;
  }
  
  return suggestions;
}

function runCommand(command: string, timeout: number = 30000): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(command, {
      encoding: "utf-8",
      timeout,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (e: any) {
    return {
      stdout: e.stdout?.toString() || "",
      stderr: e.stderr?.toString() || e.message,
      exitCode: e.status || 1,
    };
  }
}

async function runBugfixLoop(
  command: string,
  maxAttempts: number = 5,
  autoFix: boolean = false,
  onFix?: (attempt: FixAttempt) => Promise<string | null>
): Promise<Session> {
  const session: Session = {
    id: generateId(),
    command,
    max_attempts: maxAttempts,
    attempts: [],
    status: "running",
    started: new Date().toISOString(),
  };
  
  log(`Starting bugfix session: ${session.id}`);
  log(`Command: ${command}`);
  log(`Max attempts: ${maxAttempts}`);
  
  console.log(`\n=== BUGFIX LOOP STARTED ===`);
  console.log(`Session: ${session.id}`);
  console.log(`Command: ${command}`);
  console.log(`Max attempts: ${maxAttempts}`);
  console.log("");
  
  let lastError = "";
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n--- Attempt ${attempt}/${maxAttempts} ---`);
    
    const startTime = Date.now();
    const result = runCommand(command);
    const elapsed = Date.now() - startTime;
    
    if (result.exitCode === 0) {
      session.status = "fixed";
      session.ended = new Date().toISOString();
      session.total_time_ms = elapsed;
      
      session.attempts.push({
        attempt,
        error: "",
        analysis: "Command succeeded",
        fix_applied: attempt === 1 ? "none needed" : "previous fix worked",
        result: "success",
        timestamp: new Date().toISOString(),
      });
      
      console.log(`\n✓ SUCCESS on attempt ${attempt}`);
      console.log(`  Time: ${elapsed}ms`);
      if (attempt > 1) {
        console.log(`  Previous fix resolved the issue`);
      }
      
      log(`SUCCESS on attempt ${attempt}`);
      break;
    }
    
    // Analyze error
    const analysis = analyzeError(result.stderr, result.stdout);
    const suggestions = suggestFix(analysis.type, result.stderr + result.stdout);
    
    console.log(`\n✗ FAILED`);
    console.log(`  Error type: ${analysis.type}`);
    console.log(`  Hints:`);
    analysis.hints.forEach((h) => console.log(`    • ${h}`));
    
    if (suggestions.length > 0) {
      console.log(`  Suggested fixes:`);
      suggestions.forEach((s) => console.log(`    • ${s}`));
    }
    
    const fixAttempt: FixAttempt = {
      attempt,
      error: result.stderr || result.stdout,
      analysis: `${analysis.type}: ${analysis.hints.join("; ")}`,
      fix_applied: "",
      result: "failed",
      timestamp: new Date().toISOString(),
    };
    
    // Try auto-fix if enabled
    if (autoFix && suggestions.length > 0) {
      console.log(`\n  Attempting auto-fix...`);
      const fixCommand = suggestions[0];
      
      if (fixCommand.startsWith("bun add") || fixCommand.startsWith("npm install")) {
        console.log(`  Running: ${fixCommand}`);
        const fixResult = runCommand(fixCommand, 60000);
        
        if (fixResult.exitCode === 0) {
          fixAttempt.fix_applied = fixCommand;
          fixAttempt.result = "partial";
          console.log(`  ✓ Fix applied, will retry...`);
        } else {
          console.log(`  ✗ Fix failed: ${fixResult.stderr}`);
        }
      }
    }
    
    // Call custom fix handler if provided
    if (onFix) {
      const customFix = await onFix(fixAttempt);
      if (customFix) {
        fixAttempt.fix_applied = customFix;
        fixAttempt.result = "partial";
      }
    }
    
    session.attempts.push(fixAttempt);
    lastError = result.stderr || result.stdout;
    
    // If we're out of attempts
    if (attempt === maxAttempts) {
      session.status = "exhausted";
      session.ended = new Date().toISOString();
      console.log(`\n✗ EXHAUSTED all ${maxAttempts} attempts`);
      console.log(`  Manual intervention needed`);
      log(`EXHAUSTED after ${maxAttempts} attempts`);
    }
  }
  
  saveSessions([...loadSessions(), session]);
  return session;
}

function listSessions(limit: number = 10): void {
  const sessions = loadSessions();
  
  if (sessions.length === 0) {
    console.log("No bugfix sessions found.");
    return;
  }
  
  console.log(`\n=== RECENT BUGFIX SESSIONS ===\n`);
  sessions
    .slice(-limit)
    .reverse()
    .forEach((s, i) => {
      const statusIcon = {
        fixed: "✓",
        exhausted: "✗",
        manual_needed: "⚠",
        running: "◐",
      }[s.status];
      
      console.log(`${statusIcon} ${s.id}`);
      console.log(`  Command: ${s.command}`);
      console.log(`  Attempts: ${s.attempts.length}/${s.max_attempts}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  Started: ${s.started}`);
      console.log("");
    });
}

function showSession(id: string): void {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === id || s.id.includes(id));
  
  if (!session) {
    console.error(`Session not found: ${id}`);
    return;
  }
  
  console.log(`\n=== SESSION: ${session.id} ===\n`);
  console.log(`Command: ${session.command}`);
  console.log(`Status: ${session.status}`);
  console.log(`Started: ${session.started}`);
  if (session.ended) {
    console.log(`Ended: ${session.ended}`);
    console.log(`Total time: ${session.total_time_ms}ms`);
  }
  
  console.log(`\n--- Attempts ---\n`);
  session.attempts.forEach((a) => {
    const icon = a.result === "success" ? "✓" : a.result === "partial" ? "◐" : "✗";
    console.log(`${icon} Attempt ${a.attempt}`);
    console.log(`   Analysis: ${a.analysis}`);
    if (a.fix_applied) {
      console.log(`   Fix applied: ${a.fix_applied}`);
    }
    if (a.error) {
      console.log(`   Error: ${a.error.slice(0, 200)}...`);
    }
    console.log("");
  });
}

const { values } = parseArgs({
  options: {
    run: { type: "string", short: "r" },
    "max-attempts": { type: "string", short: "m", default: "5" },
    auto: { type: "boolean", short: "a" },
    list: { type: "boolean", short: "l" },
    show: { type: "string", short: "s" },
    analyze: { type: "string", short: "A" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Bugfix-Loop - Autonomous bug fixing with retry loops

Usage:
  bugfix-loop --run "command" [--max-attempts N] [--auto]
  bugfix-loop --list
  bugfix-loop --show <session-id>
  bugfix-loop --analyze "error text"

Options:
  -r, --run <command>       Command to run and fix
  -m, --max-attempts <n>    Maximum fix attempts (default: 5)
  -a, --auto                Enable automatic fixes
  -l, --list                List recent sessions
  -s, --show <id>           Show session details
  -A, --analyze <text>      Analyze error without running
  -h, --help                Show this help

Error Types Detected:
  missing_module    - Module not found (auto: npm/bun install)
  file_not_found    - File doesn't exist
  syntax            - Syntax errors
  typescript        - TypeScript errors
  connection        - Network/connection errors
  timeout           - Timeout errors
  permission        - Permission denied
  port_in_use       - Port already in use
  command_not_found - Command not installed
  auth              - Authentication errors
  rate_limit        - Rate limiting
  memory            - Out of memory
  npm               - npm-specific errors
  compile           - Compilation errors

Examples:
  bugfix-loop -r "npm test" -m 3 -a
  bugfix-loop -r "bun run build" --auto
  bugfix-loop --analyze "Cannot find module 'lodash'"
  bugfix-loop --list
  bugfix-loop --show fix_1234567890
`);
  process.exit(0);
}

if (values.list) {
  listSessions();
} else if (values.show) {
  showSession(values.show);
} else if (values.analyze) {
  const analysis = analyzeError(values.analyze, "");
  console.log(`\nError type: ${analysis.type}`);
  console.log(`\nHints:`);
  analysis.hints.forEach((h) => console.log(`  • ${h}`));
  
  const suggestions = suggestFix(analysis.type, values.analyze);
  if (suggestions.length > 0) {
    console.log(`\nSuggested fixes:`);
    suggestions.forEach((s) => console.log(`  • ${s}`));
  }
} else if (values.run) {
  const maxAttempts = parseInt(values["max-attempts"] || "5", 10);
  const session = await runBugfixLoop(values.run, maxAttempts, values.auto || false);
  process.exit(session.status === "fixed" ? 0 : 1);
} else {
  console.log("Use --help for usage information");
}
