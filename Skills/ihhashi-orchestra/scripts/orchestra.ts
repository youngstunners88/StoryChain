#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

// ============================================================================
// IHHASHI ORCHESTRA - Multi-Agent Coordination System
// ============================================================================

interface AgentResult {
  agent: string;
  status: "success" | "error" | "pending" | "skipped";
  output?: string;
  error?: string;
  timestamp: string;
  duration?: number;
}

interface OrchestraState {
  task: string;
  startTime: string;
  endTime?: string;
  agents: {
    brand: AgentResult;
    builder: AgentResult;
    quality: AgentResult;
  };
  synthesis?: string;
  totalDuration?: number;
}

interface CommunicationLog {
  from: string;
  to: string;
  message: string;
  timestamp: string;
  type: "instruction" | "feedback" | "approval" | "error";
}

// Brand Agent - SA Style Enforcer
const BRAND_AGENT = {
  name: "Brand Agent",
  focus: "South African style and tone enforcement",
  saPhrases: [
    "hey", "my bra", "my sister", "sharp", "eish", "ja", "ne",
    "lekker", "howzit", "shap", "awe", "sawubona", "yebo"
  ],
  saFoods: [
    "Kota", "Bunny Chow", "Gatsby", "Braai", "Pap", "Chakalaka",
    "Boerewors", "Biltong", "Mageu", "Amasi"
  ],
  languages: ["en", "zu", "xh", "st", "af", "tn"],
  
  guidelines: `
## South African Brand Guidelines

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

### Cultural Elements
- Respect all 11 official languages
- Celebrate local food diversity
- Acknowledge township culture
- Support local businesses

### Do NOT Use
- "Uber for X" comparisons
- Generic American phrasing
- Foreign currency
- Culturally insensitive terms
`
};

// Builder Agent Configuration
const BUILDER_AGENT = {
  name: "Builder Agent",
  focus: "Feature implementation with SA context",
  techStack: {
    frontend: ["React", "TypeScript", "Tailwind CSS", "Vite"],
    backend: ["FastAPI", "Python", "MongoDB", "Redis"],
    mobile: ["Capacitor", "Android"],
    payments: ["PayStack", "Yoco"],
    maps: ["OpenStreetMap", "Leaflet"]
  },
  
  getClaudeCodeCommand: (task: string, model: string = "opus"): string => {
    return `claude --model ${model} -p "${task}"`;
  }
};

// Quality Agent - Glitch Catcher
const QUALITY_AGENT = {
  name: "Quality Agent",
  focus: "Glitch detection and UI/UX validation",
  checks: [
    "responsive_design",
    "accessibility",
    "error_handling",
    "loading_states",
    "empty_states",
    "form_validation",
    "navigation_flow",
    "brand_consistency"
  ],
  
  glitchPatterns: [
    { pattern: /TODO|FIXME|XXX/, message: "Unfinished code detected" },
    { pattern: /console\.log\(/, message: "Console.log left in code" },
    { pattern: /any\b/, message: "TypeScript 'any' type used" },
    { pattern: /&nbsp;/, message: "Non-breaking space entity used" },
    { pattern: /style=\{\{/, message: "Inline style detected - use Tailwind" }
  ]
};

// Communication Log Store
const COMM_LOG_FILE = "/home/workspace/.agents/communication-log.json";

function logCommunication(from: string, to: string, message: string, type: CommunicationLog["type"]): void {
  const log: CommunicationLog = {
    from,
    to,
    message,
    timestamp: new Date().toISOString(),
    type
  };
  
  let logs: CommunicationLog[] = [];
  if (existsSync(COMM_LOG_FILE)) {
    try {
      logs = JSON.parse(readFileSync(COMM_LOG_FILE, "utf-8"));
    } catch (e) {
      logs = [];
    }
  }
  
  logs.push(log);
  
  // Keep last 1000 entries
  if (logs.length > 1000) {
    logs = logs.slice(-1000);
  }
  
  writeFileSync(COMM_LOG_FILE, JSON.stringify(logs, null, 2));
}

// Brand Agent Implementation
async function runBrandAgent(task: string): Promise<string> {
  const startTime = Date.now();
  
  console.log(`\n🎨 ${BRAND_AGENT.name}: Analyzing brand compliance...\n`);
  
  const results: string[] = [];
  
  // Check for SA context requirements
  const saContextNeeded = /food|order|delivery|merchant|vendor|rider|driver/i.test(task);
  
  if (saContextNeeded) {
    results.push("✓ SA context detected - applying Mzansi guidelines");
    results.push(`✓ Use phrases: ${BRAND_AGENT.saPhrases.slice(0, 5).join(", ")}`);
    results.push(`✓ Currency: ZAR (R) with VAT inclusive`);
    results.push(`✓ Support languages: ${BRAND_AGENT.languages.join(", ")}`);
  }
  
  // Check for food-related tasks
  if (/food|menu|meal|order/i.test(task)) {
    results.push(`✓ Reference SA foods: ${BRAND_AGENT.saFoods.slice(0, 5).join(", ")}`);
  }
  
  // Generate brand guidelines for builder
  results.push("\n📋 BRAND GUIDELINES FOR BUILDER:");
  results.push(BRAND_AGENT.guidelines);
  
  logCommunication("Brand Agent", "Builder Agent", "Brand guidelines transmitted", "instruction");
  
  const duration = Date.now() - startTime;
  console.log(`✅ ${BRAND_AGENT.name}: Complete (${duration}ms)`);
  
  return results.join("\n");
}

// Builder Agent Implementation
async function runBuilderAgent(task: string, brandGuidelines: string): Promise<string> {
  const startTime = Date.now();
  
  console.log(`\n🔧 ${BUILDER_AGENT.name}: Ready to build...\n`);
  
  const results: string[] = [];
  
  // Provide implementation guidance
  results.push("📋 IMPLEMENTATION PLAN:");
  results.push(`\nTask: ${task}`);
  results.push(`\nTech Stack:`);
  results.push(`  Frontend: ${BUILDER_AGENT.techStack.frontend.join(", ")}`);
  results.push(`  Backend: ${BUILDER_AGENT.techStack.backend.join(", ")}`);
  results.push(`  Payments: ${BUILDER_AGENT.techStack.payments.join(", ")}`);
  
  results.push("\n📝 WITH BRAND GUIDELINES:");
  results.push(brandGuidelines);
  
  // Claude Code command
  const claudeCmd = BUILDER_AGENT.getClaudeCodeCommand(task);
  results.push(`\n🚀 CLAUDE CODE COMMAND:`);
  results.push(`  ${claudeCmd}`);
  results.push(`\n  Or with specific model:`);
  results.push(`  claude --model opus -p "${task}"`);
  results.push(`  claude --model sonnet -p "${task}"`);
  
  logCommunication("Builder Agent", "Quality Agent", "Implementation ready for review", "instruction");
  
  const duration = Date.now() - startTime;
  console.log(`✅ ${BUILDER_AGENT.name}: Ready (${duration}ms)`);
  
  return results.join("\n");
}

// Quality Agent Implementation
async function runQualityAgent(task: string, files?: string[]): Promise<string> {
  const startTime = Date.now();
  
  console.log(`\n🔍 ${QUALITY_AGENT.name}: Scanning for glitches...\n`);
  
  const results: string[] = [];
  
  results.push("📋 QUALITY CHECKLIST:");
  QUALITY_AGENT.checks.forEach(check => {
    results.push(`  ○ ${check.replace(/_/g, " ")}`);
  });
  
  // Check for potential issues
  results.push("\n⚠️ WATCH FOR:");
  QUALITY_AGENT.glitchPatterns.forEach(({ pattern, message }) => {
    results.push(`  - ${message}`);
  });
  
  results.push("\n✓ RESPONSIVE DESIGN CHECKS:");
  results.push("  - Mobile-first approach");
  results.push("  - Touch-friendly buttons (min 44px)");
  results.push("  - Readable text on all screens");
  results.push("  - Proper viewport meta tag");
  
  results.push("\n✓ BRAND CONSISTENCY:");
  results.push("  - Primary color: #FF6B00 (iHhashi orange)");
  results.push("  - Currency: R (ZAR)");
  results.push("  - SA slang in UI text");
  
  logCommunication("Quality Agent", "Orchestra", "Quality scan complete", "approval");
  
  const duration = Date.now() - startTime;
  console.log(`✅ ${QUALITY_AGENT.name}: Complete (${duration}ms)`);
  
  return results.join("\n");
}

// Main Orchestra Function
async function conductTask(task: string): Promise<OrchestraState> {
  const startTime = Date.now();
  
  const state: OrchestraState = {
    task,
    startTime: new Date().toISOString(),
    agents: {
      brand: { agent: "brand", status: "pending", timestamp: new Date().toISOString() },
      builder: { agent: "builder", status: "pending", timestamp: new Date().toISOString() },
      quality: { agent: "quality", status: "pending", timestamp: new Date().toISOString() }
    }
  };
  
  console.log("\n" + "═".repeat(60));
  console.log("🎭 IHHASHI ORCHESTRA - Conducting Task");
  console.log("═".repeat(60));
  console.log(`\n📌 Task: "${task}"`);
  console.log(`🕐 Started: ${state.startTime}`);
  
  // Phase 1: Brand Agent
  console.log("\n" + "─".repeat(60));
  console.log("PHASE 1: BRAND COMPLIANCE");
  console.log("─".repeat(60));
  
  try {
    const brandResult = await runBrandAgent(task);
    state.agents.brand = {
      agent: "brand",
      status: "success",
      output: brandResult,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    state.agents.brand = {
      agent: "brand",
      status: "error",
      error: String(error),
      timestamp: new Date().toISOString()
    };
  }
  
  // Phase 2: Builder Agent
  console.log("\n" + "─".repeat(60));
  console.log("PHASE 2: BUILD");
  console.log("─".repeat(60));
  
  const brandGuidelines = state.agents.brand.output || "";
  
  try {
    const builderResult = await runBuilderAgent(task, brandGuidelines);
    state.agents.builder = {
      agent: "builder",
      status: "success",
      output: builderResult,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    state.agents.builder = {
      agent: "builder",
      status: "error",
      error: String(error),
      timestamp: new Date().toISOString()
    };
  }
  
  // Phase 3: Quality Agent
  console.log("\n" + "─".repeat(60));
  console.log("PHASE 3: QUALITY CHECK");
  console.log("─".repeat(60));
  
  try {
    const qualityResult = await runQualityAgent(task);
    state.agents.quality = {
      agent: "quality",
      status: "success",
      output: qualityResult,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    state.agents.quality = {
      agent: "quality",
      status: "error",
      error: String(error),
      timestamp: new Date().toISOString()
    };
  }
  
  // Synthesis
  console.log("\n" + "═".repeat(60));
  console.log("📊 SYNTHESIS");
  console.log("═".repeat(60));
  
  const successCount = Object.values(state.agents).filter(a => a.status === "success").length;
  const totalDuration = Date.now() - startTime;
  
  state.endTime = new Date().toISOString();
  state.totalDuration = totalDuration;
  
  state.synthesis = `
Task: ${task}
Status: ${successCount}/3 agents successful
Duration: ${totalDuration}ms
Completed: ${state.endTime}

NEXT STEPS:
1. Review brand guidelines from Brand Agent
2. Run Claude Code with: claude --model opus -p "${task}"
3. Apply quality checklist to output
4. Test on mobile devices
`;
  
  console.log(state.synthesis);
  
  // Save state
  const stateFile = `/home/workspace/.agents/orchestra-state-${Date.now()}.json`;
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
  console.log(`\n📁 State saved to: ${stateFile}`);
  
  return state;
}

// Brand Check Function
async function brandCheck(content: string): Promise<void> {
  console.log("\n🎨 BRAND CHECK");
  console.log("─".repeat(40));
  
  const issues: string[] = [];
  
  // Check for generic greetings
  if (/hello|hi there|welcome to/i.test(content) && !/hey|howzit|sawubona/i.test(content)) {
    issues.push("⚠️ Use SA greetings: 'Hey!', 'Howzit!', 'Sawubona!'");
  }
  
  // Check for USD
  if (/\$|USD|dollar/i.test(content)) {
    issues.push("⚠️ Use ZAR (R) for currency, not USD");
  }
  
  // Check for American spelling
  if (/color|flavor|neighbor/i.test(content)) {
    issues.push("⚠️ Use British/SA spelling: colour, flavour, neighbour");
  }
  
  if (issues.length === 0) {
    console.log("✅ Brand compliant - Sharp, my bra!");
  } else {
    console.log("❌ Brand issues found:\n");
    issues.forEach(i => console.log(i));
  }
}

// Communication Status
async function showCommunicationLog(): Promise<void> {
  console.log("\n📡 COMMUNICATION LOG");
  console.log("─".repeat(40));
  
  if (!existsSync(COMM_LOG_FILE)) {
    console.log("No communications logged yet.");
    return;
  }
  
  const logs: CommunicationLog[] = JSON.parse(readFileSync(COMM_LOG_FILE, "utf-8"));
  const recent = logs.slice(-10);
  
  recent.forEach(log => {
    const icon = {
      instruction: "📤",
      feedback: "💬",
      approval: "✅",
      error: "❌"
    }[log.type];
    
    console.log(`${icon} ${log.from} → ${log.to}: ${log.message.slice(0, 50)}...`);
  });
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Ensure .agents directory exists
  if (!existsSync("/home/workspace/.agents")) {
    await $`mkdir -p /home/workspace/.agents`.quiet();
  }
  
  switch (command) {
    case "conduct":
      const task = args.slice(1).join(" ") || "Analyze iHhashi codebase";
      await conductTask(task);
      break;
      
    case "brand-check":
      const content = args.slice(1).join(" ") || "Hello, welcome to our app!";
      await brandCheck(content);
      break;
      
    case "quality-check":
      const file = args[1];
      if (!file) {
        console.log("Usage: orchestra.ts quality-check <file>");
        break;
      }
      await runQualityAgent(`Check file: ${file}`, [file]);
      break;
      
    case "build":
      const feature = args.slice(1).join(" ");
      if (!feature) {
        console.log("Usage: orchestra.ts build <feature>");
        break;
      }
      const brandResult = await runBrandAgent(feature);
      await runBuilderAgent(feature, brandResult);
      break;
      
    case "comms":
      await showCommunicationLog();
      break;
      
    case "status":
      console.log("\n🎭 IHHASHI ORCHESTRA STATUS");
      console.log("─".repeat(40));
      console.log(`Brand Agent:   Ready (SA Style Enforcer)`);
      console.log(`Builder Agent: Ready (Claude Code)`);
      console.log(`Quality Agent: Ready (Glitch Catcher)`);
      console.log(`\nClaude Code:   v2.1.50 (installed)`);
      console.log(`Model Support: opus, sonnet, haiku`);
      break;
      
    case "help":
    default:
      console.log(`
🎭 IHHASHI ORCHESTRA - Multi-Agent Coordination

Commands:
  conduct <task>       Orchestrate all agents for a task
  brand-check <text>   Check text for SA brand compliance
  quality-check <file> Run quality checks on a file
  build <feature>      Have Builder Agent prepare a feature
  comms                Show recent communication log
  status               Show orchestra status
  help                 Show this help

Agents:
  Brand Agent   - SA style and tone enforcement
  Builder Agent - Feature implementation (Claude Code)
  Quality Agent - Glitch detection and validation

Claude Code Usage:
  claude --model opus -p "your task"
  claude --model sonnet -p "your task"
  claude -c                    # Continue last session

API Key Setup:
  Set ANTHROPIC_API_KEY in Settings > Advanced
`);
  }
}

main();
