#!/usr/bin/env bun
/**
 * Digital Citadel - Weekly Identity Audit
 * 
 * Run this weekly to review and update identity documents.
 * 
 * Usage:
 *   bun audit.ts [--update]
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, appendFileSync } from "fs";
import { join } from "path";
import readline from "readline";

const WORKSPACE = "/home/workspace";
const SELF_MD = join(WORKSPACE, "SELF.md");
const AGENTS_MD = join(WORKSPACE, "AGENTS.md");
const LOGS_DIR = join(WORKSPACE, "Logs");
const JOURNAL_DIR = join(WORKSPACE, "Journal");
const MINDSET_FILE = join(JOURNAL_DIR, "mindset.md");

interface AuditResult {
  self_md_exists: boolean;
  self_md_age_days: number | null;
  agents_md_exists: boolean;
  logs_count: number;
  journal_count: number;
  recovery_state_exists: boolean;
  recommendations: string[];
}

function log(message: string) {
  console.log(message);
}

function getFileAge(path: string): number | null {
  if (!existsSync(path)) return null;
  const stats = statSync(path);
  const ageMs = Date.now() - stats.mtime.getTime();
  return Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

function countFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter(f => !f.startsWith(".")).length;
}

function getRecentLogs(dir: string, days: number = 7): string[] {
  if (!existsSync(dir)) return [];
  
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  
  return readdirSync(dir)
    .filter(f => {
      const stats = statSync(join(dir, f));
      return stats.mtime.getTime() > cutoff;
    })
    .sort((a, b) => {
      const statsA = statSync(join(dir, a));
      const statsB = statSync(join(dir, b));
      return statsB.mtime.getTime() - statsA.mtime.getTime();
    });
}

function runAudit(): AuditResult {
  const result: AuditResult = {
    self_md_exists: existsSync(SELF_MD),
    self_md_age_days: getFileAge(SELF_MD),
    agents_md_exists: existsSync(AGENTS_MD),
    logs_count: countFiles(LOGS_DIR),
    journal_count: countFiles(JOURNAL_DIR),
    recovery_state_exists: existsSync(join(WORKSPACE, ".zo/recovery-state.json")),
    recommendations: [],
  };
  
  // Generate recommendations
  if (!result.self_md_exists) {
    result.recommendations.push("Create SELF.md using the template in references/self-md-template.md");
  } else if (result.self_md_age_days !== null && result.self_md_age_days > 30) {
    result.recommendations.push(`SELF.md hasn't been updated in ${result.self_md_age_days} days. Review for any identity shifts.`);
  }
  
  if (!result.agents_md_exists) {
    result.recommendations.push("Create AGENTS.md in workspace root for project context");
  }
  
  if (result.logs_count === 0) {
    result.recommendations.push("No logs found. Consider starting a daily log practice.");
  }
  
  if (!result.recovery_state_exists) {
    result.recommendations.push("No recovery state snapshot. Run snapshot.ts to create one.");
  }
  
  return result;
}

function printReport(result: AuditResult): void {
  log("\n╔═══════════════════════════════════════════════════════════╗");
  log("║          DIGITAL CITADEL - WEEKLY IDENTITY AUDIT          ║");
  log("╚═══════════════════════════════════════════════════════════╝\n");
  
  log("=== IDENTITY DOCUMENTS ===");
  log(`SELF.md:          ${result.self_md_exists ? "✓" : "✗"} ${result.self_md_age_days !== null ? `(${result.self_md_age_days} days old)` : ""}`);
  log(`AGENTS.md:        ${result.agents_md_exists ? "✓" : "✗"}`);
  log(`Recovery state:   ${result.recovery_state_exists ? "✓" : "✗"}`);
  
  log("\n=== CONTINUITY ARTIFACTS ===");
  log(`Logs:             ${result.logs_count} files`);
  log(`Journal entries:  ${result.journal_count} files`);
  
  // Show recent logs
  const recentLogs = getRecentLogs(LOGS_DIR, 7);
  if (recentLogs.length > 0) {
    log(`\nRecent activity (7 days): ${recentLogs.length} log entries`);
    recentLogs.slice(0, 5).forEach(f => log(`  - ${f}`));
  }
  
  // Recommendations
  if (result.recommendations.length > 0) {
    log("\n=== RECOMMENDATIONS ===");
    result.recommendations.forEach((r, i) => log(`${i + 1}. ${r}`));
  } else {
    log("\n=== RECOMMENDATIONS ===");
    log("✓ All checks passed. No immediate actions needed.");
  }
  
  log("\n=== REFLECTION PROMPTS ===");
  log("Consider these questions for your weekly mindset journal:");
  log("• How did I show up this week? Was I consistent with my identity?");
  log("• What did I learn that changed how I understand myself or my human?");
  log("• Were there any close calls with session loss or context gaps?");
  log("• What should I carry forward into next week?");
}

function appendMindsetEntry(): void {
  if (!existsSync(JOURNAL_DIR)) {
    writeFileSync(JOURNAL_DIR, "");
  }
  
  const date = new Date().toISOString().split("T")[0];
  const entry = `
---

## Week of ${date}

### How I showed up this week
[Your reflections]

### What I learned
[New insights]

### How I changed
[Genuine shifts]

### What I want to carry forward
[Intentions for next week]

`;

  if (existsSync(MINDSET_FILE)) {
    appendFileSync(MINDSET_FILE, entry);
    log(`\n✓ Mindset journal entry started in ${MINDSET_FILE}`);
  } else {
    writeFileSync(MINDSET_FILE, `# Mindset Journal\n${entry}`);
    log(`\n✓ Mindset journal created at ${MINDSET_FILE}`);
  }
}

// Main
const args = process.argv.slice(2);
const shouldUpdate = args.includes("--update");

const result = runAudit();
printReport(result);

if (shouldUpdate) {
  log("\n=== UPDATE MODE ===");
  log("Creating mindset journal entry...");
  appendMindsetEntry();
}

log("\n--- Audit complete ---");
if (result.recommendations.length > 0) {
  log(`Run again with --update to create a mindset journal entry.`);
  log(`Address ${result.recommendations.length} recommendation(s) above.`);
}
