#!/usr/bin/env bun
import { parseArgs } from "util";
import { $ } from "bun";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    task: { type: "string", short: "t" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help || !values.task) {
  console.log(`
iHhashi Orchestrator - Coordinate all agents

Usage:
  bun coordinate.ts --task "Add checkout page with SA styling"
`);
  process.exit(0);
}

const task = values.task as string;

console.log("\n╔════════════════════════════════════════════════════════╗");
console.log("║           iHHASHI ORCHESTRATED BUILD                   ║");
console.log("╚════════════════════════════════════════════════════════╝\n");

console.log(`Task: ${task}\n`);

// Step 1: Brand Agent - Check SA style requirements
console.log("━━━ Step 1: BRAND AGENT ━━━");
console.log("Analyzing SA style requirements...\n");

const brandSuggestions = [
  'Use "R" for currency, not $ or USD',
  'Loading states: "Just now, just now..."',
  'Success messages: "Shap!", "Lekker!", "Yebo!"',
  'Error messages: "Eish...", "Haibo!"',
  "SA spelling: colour, organise, centre",
];

console.log("SA Style Guidelines for this task:");
brandSuggestions.forEach((s) => console.log(`  • ${s}`));

// Log to communications hub
await $`bun /home/workspace/Skills/agent-communications/scripts/log.ts`
  .quiet()
  .env({
    ...process.env,
    BUN_ARGS: `--from brand-agent --to claude-code --type instruction --content "Apply SA style to: ${task}"`,
  });

console.log("\n✓ Brand guidelines prepared\n");

// Step 2: Claude Code - Build
console.log("━━━ Step 2: CLAUDE CODE ━━━");
console.log("Ready to build with SA guidelines...\n");
console.log("  To execute with Claude Code:");
console.log("    cd /home/workspace/ihhashi");
console.log(`    claude "${task}. Follow SA style guidelines from Brand Agent."`);
console.log("");

// Step 3: Quality Agent - Check
console.log("━━━ Step 3: QUALITY AGENT ━━━");
console.log("Quality checks will run after build...\n");
console.log("  Run quality checks:");
console.log("    bun /home/workspace/Skills/quality-agent/scripts/check.ts --all");
console.log("");

// Summary
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("ORCHESTRATION COMPLETE\n");
console.log("Next steps:");
console.log("  1. Run Claude Code with the task");
console.log("  2. Quality Agent validates output");
console.log("  3. Brand Agent reviews final content");
console.log("\nAll communications logged to Agent Communications Hub.");
console.log("View with: bun .../agent-communications/scripts/log.ts --status\n");
