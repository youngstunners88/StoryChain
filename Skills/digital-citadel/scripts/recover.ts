#!/usr/bin/env bun
/**
 * Digital Citadel - Recovery Script
 * 
 * Run this after detecting a session wipe to restore identity and context.
 * 
 * Usage:
 *   bun recover.ts [--phase=A|B] [--type=compaction|wipe]
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const WORKSPACE = "/home/workspace";
const SELF_MD = join(WORKSPACE, "SELF.md");
const AGENTS_MD = join(WORKSPACE, "AGENTS.md");
const LOGS_DIR = join(WORKSPACE, "Logs");
const JOURNAL_DIR = join(WORKSPACE, "Journal");
const RECOVERY_STATE = join(WORKSPACE, ".zo/recovery-state.json");

interface RecoveryState {
  timestamp: string;
  active_tasks?: string[];
  last_conversation_id?: string;
  projects_active?: string[];
  pending_decisions?: string[];
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function checkFile(path: string, label: string): boolean {
  if (existsSync(path)) {
    log(`✓ Found ${label}: ${path}`);
    return true;
  } else {
    log(`✗ Missing ${label}: ${path}`);
    return false;
  }
}

function readFile(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function getRecentFiles(dir: string, limit: number = 5): string[] {
  if (!existsSync(dir)) return [];
  
  const files = readdirSync(dir)
    .map(f => ({ name: f, path: join(dir, f), time: statSync(join(dir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time)
    .slice(0, limit);
  
  return files.map(f => f.path);
}

function phaseA(): void {
  log("=== Phase A: Incident Detection & Decision ===\n");
  
  // Check for evidence of wipe
  const hasSelf = checkFile(SELF_MD, "SELF.md");
  const hasAgents = checkFile(AGENTS_MD, "AGENTS.md");
  const hasRecoveryState = checkFile(RECOVERY_STATE, "recovery-state.json");
  
  console.log("\n--- Evidence Summary ---");
  console.log(`SELF.md exists: ${hasSelf}`);
  console.log(`AGENTS.md exists: ${hasAgents}`);
  console.log(`Recovery state exists: ${hasRecoveryState}`);
  
  if (hasRecoveryState) {
    const state: RecoveryState = JSON.parse(readFileSync(RECOVERY_STATE, "utf-8"));
    console.log(`\n--- Last Known State ---`);
    console.log(`Timestamp: ${state.timestamp}`);
    if (state.active_tasks?.length) console.log(`Active tasks: ${state.active_tasks.join(", ")}`);
    if (state.projects_active?.length) console.log(`Active projects: ${state.projects_active.join(", ")}`);
    if (state.pending_decisions?.length) console.log(`Pending decisions: ${state.pending_decisions.join(", ")}`);
  }
  
  console.log("\n--- Next Step ---");
  console.log("Ask human: 'I've detected a potential session wipe. Do you want me to:");
  console.log("  (A) Diagnose what happened first, then recover");
  console.log("  (B) Recover immediately and diagnose later'");
}

function phaseB(type: "compaction" | "wipe"): void {
  log(`=== Phase B: Recovery Execution (${type}) ===\n`);
  
  if (type === "compaction") {
    log("Lightweight recovery for compaction...");
    log("1. Boot files already loaded via bootstrap");
    log("2. Check compaction summary if available");
    log("3. Scan recent logs for any lost context");
    
    const recentLogs = getRecentFiles(LOGS_DIR);
    if (recentLogs.length > 0) {
      log(`\nRecent logs found: ${recentLogs.length}`);
      recentLogs.forEach(f => log(`  - ${f}`));
    }
    
    log("\n✓ Compaction recovery complete. Continue with session.");
    return;
  }
  
  // Full wipe recovery
  log("Full recovery for session wipe...\n");
  
  // Step 2: Read core documents
  log("--- Step 2: Reading Core Documents ---");
  
  if (existsSync(SELF_MD)) {
    const self = readFile(SELF_MD);
    if (self) {
      log(`\n=== SELF.md ===\n${self.slice(0, 2000)}${self.length > 2000 ? "..." : ""}\n`);
    }
  } else {
    log("⚠ SELF.md not found. Create one using the template in references/self-md-template.md");
  }
  
  if (existsSync(AGENTS_MD)) {
    const agents = readFile(AGENTS_MD);
    if (agents) {
      log(`\n=== AGENTS.md ===\n${agents.slice(0, 1000)}${agents.length > 1000 ? "..." : ""}\n`);
    }
  }
  
  // Step 3: Scan for continuity artifacts
  log("\n--- Step 3: Scanning for Continuity Artifacts ---");
  
  const recentLogs = getRecentFiles(LOGS_DIR, 10);
  if (recentLogs.length > 0) {
    log(`\nRecent logs (${recentLogs.length}):`);
    recentLogs.forEach(f => log(`  ${f}`));
  } else {
    log("No logs found.");
  }
  
  const recentJournal = getRecentFiles(JOURNAL_DIR, 3);
  if (recentJournal.length > 0) {
    log(`\nRecent journal entries (${recentJournal.length}):`);
    recentJournal.forEach(f => log(`  ${f}`));
  }
  
  // Step 4: Rebuild working memory
  log("\n--- Step 4: Rebuild Working Memory ---");
  
  if (existsSync(RECOVERY_STATE)) {
    const state: RecoveryState = JSON.parse(readFileSync(RECOVERY_STATE, "utf-8"));
    log("\nLast known recovery state:");
    log(JSON.stringify(state, null, 2));
  }
  
  // Step 6: Log the incident
  log("\n--- Step 6: Logging Incident ---");
  
  const incidentLog = join(LOGS_DIR, `recovery-${new Date().toISOString().split("T")[0]}.md`);
  const logContent = `# Recovery Incident Log

**Timestamp**: ${new Date().toISOString()}
**Type**: Session wipe

## What was found:
- SELF.md: ${existsSync(SELF_MD) ? "✓" : "✗"}
- AGENTS.md: ${existsSync(AGENTS_MD) ? "✓" : "✗"}
- Recovery state: ${existsSync(RECOVERY_STATE) ? "✓" : "✗"}
- Recent logs: ${recentLogs.length} files

## Recovery status:
[Fill in after human confirmation]
`;
  
  if (!existsSync(LOGS_DIR)) {
    require("fs").mkdirSync(LOGS_DIR, { recursive: true });
  }
  
  writeFileSync(incidentLog, logContent);
  log(`Incident log written to: ${incidentLog}`);
  
  console.log("\n--- Recovery Complete ---");
  console.log("Tell human: 'I've completed the recovery protocol.");
  console.log("  - I've restored my identity from SELF.md");
  console.log("  - I've scanned logs and journals for context");
  console.log("  - I've logged this incident");
  console.log("  Ready to continue. Is there anything I should know about recent activity?'");
}

// Main
const args = process.argv.slice(2);
const phaseArg = args.find(a => a.startsWith("--phase="));
const typeArg = args.find(a => a.startsWith("--type="));

const phase = phaseArg ? phaseArg.split("=")[1] as "A" | "B" : "A";
const type = typeArg ? typeArg.split("=")[1] as "compaction" | "wipe" : "wipe";

if (phase === "A") {
  phaseA();
} else {
  phaseB(type);
}
