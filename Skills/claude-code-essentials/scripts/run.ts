#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync, readFileSync } from "fs";

// ============================================================================
// CLAUDE CODE RUNNER FOR IHHASHI
// ============================================================================

const IHHASHI_DIR = "/home/workspace/ihhashi";
const COMM_TRACKER = "/home/workspace/Skills/agent-comm-tracker/scripts/tracker.ts";

interface RunOptions {
  task: string;
  model: "opus" | "sonnet" | "haiku";
  withBrand: boolean;
  withQuality: boolean;
  continue: boolean;
  print: boolean;
}

const BRAND_CONTEXT = `
## iHhashi Brand Guidelines (South Africa)

### Tone
- Warm, friendly, welcoming
- Use SA greetings: "Hey!", "Howzit!", "Sawubona!"
- "Sharp" for confirmation
- "Eish" for empathy/apology
- "Ja, ne" for agreement
- "My bra" / "My sister" for familiarity
- "Lekker" for good/great

### Currency
- Always ZAR (R)
- Format: R150.00
- VAT inclusive (15%)

### Local Foods
- Kota - township burger
- Bunny Chow - Durban curry in bread
- Gatsby - Cape Town sandwich
- Braai - South African BBQ

### Languages
- English (primary)
- Zulu/isiZulu (zu)
- Xhosa/isiXhosa (xh)
- Sotho/Sesotho (st)
- Afrikaans (af)
- Tswana/Setswana (tn)

### Colors
- Primary: #FF6B00 (iHhashi orange)
- Secondary: #1a1a2e (dark)
- Accent: #16c79a (teal)
`;

function logComm(from: string, to: string, message: string, type: string = "info"): void {
  try {
    const cmd = `bun ${COMM_TRACKER} log "${from}" "${to}" "${message}"`;
    Bun.spawnSync(["bun", COMM_TRACKER, "log", from, to, message], { quiet: true });
  } catch (e) {
    // Ignore logging errors
  }
}

async function runClaudeCode(options: RunOptions): Promise<void> {
  const { task, model, withBrand, withQuality, continue: continueSession, print } = options;
  
  console.log("\n🚀 CLAUDE CODE RUNNER");
  console.log("═".repeat(60));
  console.log(`Model: ${model}`);
  console.log(`Task: ${task}`);
  console.log(`Brand: ${withBrand ? "Yes" : "No"}`);
  console.log(`Quality: ${withQuality ? "Yes" : "No"}`);
  console.log("═".repeat(60) + "\n");
  
  // Log start
  logComm("Zo", "Builder Agent", `Starting task: ${task.slice(0, 50)}...`, "instruction");
  
  // Build prompt
  let fullPrompt = task;
  
  if (withBrand) {
    fullPrompt = `${BRAND_CONTEXT}

${task}`;
    logComm("Brand Agent", "Builder Agent", "Brand guidelines injected", "instruction");
  }
  
  if (withQuality) {
    fullPrompt += `

After implementing, run quality checks:
- Responsive design
- Accessibility
- Error handling
- Loading states
- Brand consistency`;
    logComm("Quality Agent", "Builder Agent", "Quality checklist attached", "instruction");
  }
  
  // Build command
  const args: string[] = [];
  
  if (print) {
    args.push("-p");
  }
  
  args.push("--model", model);
  
  if (continueSession) {
    args.push("-c");
  }
  
  args.push(fullPrompt);
  
  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("❌ ANTHROPIC_API_KEY not set!");
    console.log("\nTo set it up:");
    console.log("1. Go to Zo Settings > Advanced");
    console.log("2. Add ANTHROPIC_API_KEY with your key");
    console.log("\nOr set it temporarily:");
    console.log("export ANTHROPIC_API_KEY=sk-ant-...");
    return;
  }
  
  console.log("🔄 Running Claude Code...\n");
  
  // Run Claude Code
  try {
    const result = Bun.spawnSync({
      cmd: ["claude", ...args],
      cwd: IHHASHI_DIR,
      env: { ...process.env, ANTHROPIC_API_KEY: apiKey },
      stdout: "inherit",
      stderr: "inherit"
    });
    
    if (result.exitCode === 0) {
      console.log("\n✅ Claude Code completed successfully");
      logComm("Builder Agent", "Zo", "Task completed", "approval");
    } else {
      console.log(`\n❌ Claude Code exited with code ${result.exitCode}`);
      logComm("Builder Agent", "Zo", `Task failed with code ${result.exitCode}`, "error");
    }
  } catch (e) {
    console.log(`\n❌ Error running Claude Code: ${e}`);
    logComm("Builder Agent", "Zo", `Error: ${e}`, "error");
  }
}

async function showStatus(): Promise<void> {
  console.log("\n📊 CLAUDE CODE STATUS");
  console.log("═".repeat(60));
  
  // Check Claude Code version
  const versionResult = Bun.spawnSync({
    cmd: ["claude", "--version"],
    stdout: "pipe"
  });
  
  if (versionResult.stdout) {
    console.log(`Version: ${versionResult.stdout.toString().trim()}`);
  }
  
  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log(`API Key: ${apiKey ? "✅ Set" : "❌ Not set"}`);
  
  // Check project
  console.log(`Project: ${existsSync(IHHASHI_DIR) ? "✅ iHhashi found" : "❌ iHhashi not found"}`);
  
  // Check AGENTS.md
  const agentsMd = `${IHHASHI_DIR}/AGENTS.md`;
  if (existsSync(agentsMd)) {
    const content = readFileSync(agentsMd, "utf-8");
    console.log(`AGENTS.md: ✅ ${content.length} bytes`);
  }
  
  console.log("═".repeat(60));
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse flags
  let model: "opus" | "sonnet" | "haiku" = "opus";
  let withBrand = false;
  let withQuality = false;
  let continueSession = false;
  let print = false;
  let task = "";
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case "--model":
      case "-m":
        model = args[++i] as "opus" | "sonnet" | "haiku";
        break;
      case "--brand":
      case "-b":
        withBrand = true;
        break;
      case "--quality":
      case "-q":
        withQuality = true;
        break;
      case "--continue":
      case "-c":
        continueSession = true;
        break;
      case "--print":
      case "-p":
        print = true;
        break;
      case "status":
        await showStatus();
        return;
      case "help":
        console.log(`
🚀 CLAUDE CODE RUNNER FOR IHHASHI

Usage:
  bun run.ts [options] <task>

Options:
  --model, -m <model>    Model to use (opus, sonnet, haiku)
  --brand, -b            Include brand guidelines
  --quality, -q          Include quality checklist
  --continue, -c         Continue last session
  --print, -p            Print output and exit
  status                 Show status
  help                   Show this help

Examples:
  bun run.ts "Add Kota ordering"
  bun run.ts --brand --quality "Create merchant dashboard"
  bun run.ts --model sonnet "Fix login bug"
  bun run.ts status

Setup:
  Set ANTHROPIC_API_KEY in Zo Settings > Advanced
`);
        return;
      default:
        if (!arg.startsWith("-")) {
          task = task ? `${task} ${arg}` : arg;
        }
    }
  }
  
  if (!task && !continueSession) {
    console.log("Usage: bun run.ts [options] <task>");
    console.log("Run 'bun run.ts help' for more information.");
    return;
  }
  
  await runClaudeCode({
    task,
    model,
    withBrand,
    withQuality,
    continue: continueSession,
    print
  });
}

main();
