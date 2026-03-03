#!/usr/bin/env bun
/**
 * Digital Citadel - Recovery State Snapshot
 * 
 * Write a snapshot of current state for recovery purposes.
 * Run this before major operations or periodically.
 * 
 * Usage:
 *   bun snapshot.ts [--reason="before major operation"]
 */

import { existsSync, writeFileSync, mkdirSync, readdirSync, statSync, readFileSync } from "fs";
import { join, basename } from "path";

const WORKSPACE = "/home/workspace";
const RECOVERY_DIR = join(WORKSPACE, ".zo");
const RECOVERY_STATE = join(RECOVERY_DIR, "recovery-state.json");
const SELF_MD = join(WORKSPACE, "SELF.md");
const AGENTS_MD = join(WORKSPACE, "AGENTS.md");

interface RecoveryState {
  timestamp: string;
  version: string;
  reason?: string;
  active_tasks: string[];
  last_conversation_id: string | null;
  projects_active: string[];
  pending_decisions: string[];
  identity_checksum: string | null;
  key_files: { path: string; exists: boolean; size: number }[];
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function getProjects(): string[] {
  const projectsDir = join(WORKSPACE, "Projects");
  if (!existsSync(projectsDir)) return [];
  
  return readdirSync(projectsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function getKeyFiles(): { path: string; exists: boolean; size: number }[] {
  const files = [
    SELF_MD,
    AGENTS_MD,
    join(WORKSPACE, "Logs"),
    join(WORKSPACE, "Journal"),
    RECOVERY_STATE,
  ];
  
  return files.map(path => ({
    path: path.replace(WORKSPACE, "~"),
    exists: existsSync(path),
    size: existsSync(path) ? statSync(path).size : 0,
  }));
}

function main() {
  const args = process.argv.slice(2);
  const reasonArg = args.find(a => a.startsWith("--reason="));
  const reason = reasonArg ? reasonArg.split("=")[1] : "periodic snapshot";
  
  log(`Creating recovery snapshot: ${reason}`);
  
  // Ensure directory exists
  if (!existsSync(RECOVERY_DIR)) {
    mkdirSync(RECOVERY_DIR, { recursive: true });
  }
  
  // Calculate identity checksum
  let identityChecksum: string | null = null;
  if (existsSync(SELF_MD)) {
    const selfContent = readFileSync(SELF_MD, "utf-8");
    identityChecksum = simpleHash(selfContent);
  }
  
  // Get conversation ID from environment if available
  const conversationId = process.env.ZO_CONVERSATION_ID || null;
  
  const state: RecoveryState = {
    timestamp: new Date().toISOString(),
    version: "0.7.2",
    reason,
    active_tasks: [], // Would need integration with task system
    last_conversation_id: conversationId,
    projects_active: getProjects(),
    pending_decisions: [], // Would need integration with decision tracking
    identity_checksum: identityChecksum,
    key_files: getKeyFiles(),
  };
  
  writeFileSync(RECOVERY_STATE, JSON.stringify(state, null, 2));
  
  log(`✓ Snapshot written to: ${RECOVERY_STATE}`);
  log("\n--- Snapshot Summary ---");
  log(`Timestamp: ${state.timestamp}`);
  log(`Identity checksum: ${state.identity_checksum || "N/A"}`);
  log(`Projects active: ${state.projects_active.length}`);
  log(`Key files checked: ${state.key_files.length}`);
  
  // Show any missing files
  const missing = state.key_files.filter(f => !f.exists);
  if (missing.length > 0) {
    log(`\n⚠ Missing key files:`);
    missing.forEach(f => log(`  - ${f.path}`));
  }
  
  return state;
}

main();
