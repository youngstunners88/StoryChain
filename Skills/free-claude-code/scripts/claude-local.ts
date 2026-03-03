#!/usr/bin/env bun
/**
 * Run Claude Code with local Ollama models
 * 
 * Usage:
 *   bun claude-local.ts                          # Start with qwen2.5-coder
 *   bun claude-local.ts --model deepseek-coder   # Use specific model
 *   bun claude-local.ts --cwd /path/to/project   # Run in directory
 *   bun claude-local.ts --review                 # Start with review prompt
 */

import { $ } from "bun";

const args = process.argv.slice(2);
const opts: Record<string, string> = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const key = args[i].slice(2);
    opts[key] = args[i + 1] || "true";
    i++;
  }
}

const MODEL = opts.model || "qwen2.5-coder:7b";
const CWD = opts.cwd || process.cwd();
const REVIEW = opts.review === "true";

console.log(`
╔════════════════════════════════════════════════════════════╗
║           CLAUDE CODE - FREE LOCAL MODE                    ║
╠════════════════════════════════════════════════════════════╣
║  Model: ${MODEL.padEnd(48)}║
║  Directory: ${CWD.slice(-46).padStart(46)}║
║  Cost: $0.00 (100% local)                                  ║
╚════════════════════════════════════════════════════════════╝
`);

// Check Ollama is running
try {
  const check = await fetch("http://localhost:11434/api/version");
  if (!check.ok) throw new Error("Ollama not responding");
} catch {
  console.error("✗ Ollama is not running. Start it with: ollama serve");
  process.exit(1);
}

// Set environment for Claude Code to use Ollama
const env = {
  ...process.env,
  ANTHROPIC_BASE_URL: "http://localhost:11434",
  ANTHROPIC_API_KEY: "ollama", // Dummy key, Ollama doesn't need it
  // Force model selection
  CLAUDE_CODE_MODEL: MODEL,
};

// Build command
const cmd = ["claude"];

// Add model hint in the prompt
if (REVIEW) {
  cmd.push("--print", `You are using the local model ${MODEL}. Please review the code in this directory for potential issues, security vulnerabilities, and improvements. Focus on: 1) Security issues 2) Performance problems 3) Code quality 4) Best practices. Be thorough but concise.`);
}

console.log("Starting Claude Code...\n");
console.log("TIPS FOR LOCAL MODELS:");
console.log("• Be specific in your prompts");
console.log("• Break complex tasks into smaller steps");
console.log("• Use --model deepseek-coder for debugging");
console.log("• Review output before committing to production\n");
console.log("─".repeat(60) + "\n");

// Run Claude Code
try {
  const proc = Bun.spawn(cmd, {
    cwd: CWD,
    env: env,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const exitCode = await proc.exited;
  process.exit(exitCode);
} catch (error) {
  console.error("Failed to start Claude Code:", error);
  process.exit(1);
}
