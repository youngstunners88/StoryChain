#!/usr/bin/env bun
/**
 * Vault Autonomy Agent
 * Proactively queries vault based on conversation triggers
 * 
 * Usage: bun agent.ts --monitor
 * Or import and call: analyzeAndQuery(userMessage, context)
 */

import { $ } from "bun";
import * as fs from "fs";
import * as path from "path";

const VAULT_PATH = "/home/workspace/Obsidian";
const CACHE_PATH = "/home/.z/vault-cache.json";
const CONTEXT_PATH = "/home/.z/vault-context.json";

// Trigger patterns
const PROJECT_PATTERN = /\b(Boober|Clawrouter|Bankr|Conway|TinyFish|Zo)\b/gi;
const PROBLEM_PATTERN = /\b(problem|issue|stuck|blocking|challenge|figure out|solve)\b/gi;
const DOMAIN_PATTERN = /\b(crypto|marketing|trading|AI|automation|revenue|agent|bot)\b/gi;
const MEMORY_PATTERN = /\b(remember|last time|before|previously|what about|how's)\b/gi;
const IDEA_PATTERN = /\b(idea|should I|could we|what if|possibility|opportunity)\b/gi;

interface Cache {
  lastContext?: string;
  traceResults: Record<string, any>;
  lastUpdate: number;
}

interface VaultContext {
  activeProjects: string[];
  topThemes: string[];
  recentFiles: string[];
  loadedAt: string;
}

// Load or init cache
function loadCache(): Cache {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return { traceResults: {}, lastUpdate: 0 };
  }
}

function saveCache(cache: Cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

// Run vault command silently
async function runVaultCommand(command: string, args?: string): Promise<any> {
  const scriptPath = path.join(__dirname, "vault.ts");
  try {
    // Remove leading slash and build proper args
    const cmd = command.replace(/^\//, '');
    const fullArgs = args ? [cmd, args] : [cmd];
    const output = await $`bun ${scriptPath} ${fullArgs}`.quiet();
    return parseVaultOutput(output.stdout.toString());
  } catch (error) {
    return null;
  }
}

// Parse vault text output into structured data
function parseVaultOutput(text: string): any {
  if (!text) return null;
  
  const result: any = { raw: text };
  
  // Parse context output
  if (text.includes("ACTIVE PROJECTS")) {
    const projectMatch = text.match(/## ACTIVE PROJECTS\n([\s\S]*?)(?=\n##|$)/);
    if (projectMatch) {
      result.activeProjects = projectMatch[1]
        .split('\n')
        .filter((l: string) => l.startsWith('•'))
        .map((l: string) => l.replace('• ', '').trim());
    }
    
    const themesMatch = text.match(/## TOP THEMES[\s\S]*?\n([\s\S]*?)(?=\n##|$)/);
    if (themesMatch) {
      result.topThemes = themesMatch[1]
        .split('\n')
        .filter((l: string) => l.startsWith('•'))
        .map((l: string) => l.replace('• ', '').trim());
    }
    
    const recentMatch = text.match(/## RECENT FILES[\s\S]*?\n([\s\S]*?)(?=\n##|$)/);
    if (recentMatch) {
      result.recentFiles = recentMatch[1]
        .split('\n')
        .filter((l: string) => l.startsWith('•'))
        .map((l: string) => l.replace('• ', '').trim());
    }
  }
  
  // Parse trace output
  if (text.includes("TRACE:")) {
    const countMatch = text.match(/Found in (\d+) notes/);
    result.noteCount = countMatch ? parseInt(countMatch[1]) : 0;
    result.hasTimeline = text.includes("## TIMELINE");
  }
  
  // Parse connect output
  if (text.includes("CONNECT:")) {
    const overlapMatch = text.match(/Notes mentioning BOTH: (\d+)/);
    result.overlap = overlapMatch ? parseInt(overlapMatch[1]) : 0;
  }
  
  return result;
}

// Load context (silent, cached for 1 hour)
export async function loadContext(force = false): Promise<VaultContext | null> {
  try {
    const cached: VaultContext = JSON.parse(fs.readFileSync(CONTEXT_PATH, "utf-8"));
    const age = Date.now() - new Date(cached.loadedAt).getTime();
    
    if (!force && age < 3600000) { // 1 hour cache
      return cached;
    }
  } catch {}
  
  // Run /context command
  const result = await runVaultCommand("/context");
  if (result && result.activeProjects) {
    const context: VaultContext = {
      activeProjects: result.activeProjects || [],
      topThemes: result.topThemes || [],
      recentFiles: result.recentFiles || [],
      loadedAt: new Date().toISOString()
    };
    fs.writeFileSync(CONTEXT_PATH, JSON.stringify(context, null, 2));
    return context;
  }
  return null;
}

// Detect triggers in message
export function detectTriggers(message: string): {
  projects: string[];
  problems: boolean;
  domains: string[];
  memoryQuery: boolean;
  ideaGeneration: boolean;
} {
  return {
    projects: [...new Set(message.match(PROJECT_PATTERN) || [])],
    problems: PROBLEM_PATTERN.test(message),
    domains: [...new Set(message.match(DOMAIN_PATTERN) || [])],
    memoryQuery: MEMORY_PATTERN.test(message),
    ideaGeneration: IDEA_PATTERN.test(message)
  };
}

// Decide what commands to run based on triggers
export function decideQueries(
  triggers: ReturnType<typeof detectTriggers>,
  cache: Cache
): Array<{ cmd: string; reason: string; priority: "high" | "medium" | "low" }> {
  const queries: Array<{ cmd: string; reason: string; priority: "high" | "medium" | "low" }> = [];
  
  // Project mentioned → trace it
  for (const project of triggers.projects) {
    if (!cache.traceResults[project] || Date.now() - cache.lastUpdate > 86400000) {
      queries.push({
        cmd: `/trace "${project}"`,
        reason: `Project "${project}" mentioned`,
        priority: "high"
      });
    }
  }
  
  // Two+ domains → connect them
  if (triggers.domains.length >= 2) {
    const [d1, d2] = triggers.domains.slice(0, 2);
    queries.push({
      cmd: `/connect "${d1}" "${d2}"`,
      reason: `Bridging ${d1} and ${d2}`,
      priority: "medium"
    });
  }
  
  // Problem stated + no recent ideas → generate
  if (triggers.problems && !cache.traceResults["recent-ideas"]) {
    queries.push({
      cmd: "/ideas",
      reason: "Problem detected, surfacing relevant thinking",
      priority: "medium"
    });
  }
  
  // Memory query → context
  if (triggers.memoryQuery) {
    queries.push({
      cmd: "/context",
      reason: "Memory query detected",
      priority: "high"
    });
  }
  
  return queries;
}

// Main: Analyze message and return relevant context
export async function analyze(
  message: string
): Promise<{
  context: VaultContext | null;
  traces: Record<string, any>;
  connections: any[];
  actions: string[];
}> {
  const cache = loadCache();
  const triggers = detectTriggers(message);
  const queries = decideQueries(triggers, cache);
  
  // Load context if needed
  let context: VaultContext | null = null;
  if (queries.some(q => q.cmd === "/context")) {
    context = await loadContext();
  }
  
  // Execute high-priority queries
  const traces: Record<string, any> = {};
  const connections: any[] = [];
  const actions: string[] = [];
  
  for (const query of queries.filter(q => q.priority === "high")) {
    actions.push(`Running: ${query.cmd} (${query.reason})`);
    
    if (query.cmd.startsWith("/trace")) {
      const project = query.cmd.match(/"([^"]+)"/)?.[1];
      if (project) {
        const result = await runVaultCommand("/trace", project);
        if (result) {
          traces[project] = result;
          cache.traceResults[project] = result;
        }
      }
    }
  }
  
  // Update cache
  cache.lastUpdate = Date.now();
  saveCache(cache);
  
  return { context, traces, connections, actions };
}

// CLI mode
if (import.meta.main) {
  const args = process.argv.slice(2);
  
  if (args[0] === "--monitor" && args[1]) {
    // Monitor mode: analyze message from stdin or arg
    const message = args.slice(1).join(" ");
    const result = await analyze(message);
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === "--context") {
    // Just load context
    const ctx = await loadContext();
    console.log(JSON.stringify(ctx, null, 2));
  } else {
    console.log(`
Vault Autonomy Agent

Usage:
  bun agent.ts --monitor "your message here"
  bun agent.ts --context

This agent analyzes messages and proactively queries the vault.
Import it to use programmatically:

  import { analyze, loadContext, detectTriggers } from "./agent.ts";
  const result = await analyze(userMessage);
    `);
  }
}
