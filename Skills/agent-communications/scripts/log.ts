#!/usr/bin/env bun
import { parseArgs } from "util";
import fs from "fs";
import path from "path";

const LOG_DIR = "/home/.z/agent-communications";
const LOG_FILE = path.join(LOG_DIR, "communications.jsonl");

interface Message {
  timestamp: string;
  from: string;
  to: string;
  type: "instruction" | "query" | "response" | "alert" | "status" | "handoff";
  content: string;
  context?: string;
  priority?: "urgent" | "high" | "normal" | "low";
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function logMessage(msg: Message) {
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, JSON.stringify(msg) + "\n");
}

function getRecentMessages(count: number): Message[] {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, "utf-8").trim().split("\n");
  return lines.slice(-count).map((l) => JSON.parse(l));
}

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    from: { type: "string", short: "f" },
    to: { type: "string", short: "t" },
    type: { type: "string" },
    content: { type: "string", short: "c" },
    context: { type: "string" },
    priority: { type: "string", short: "p" },
    recent: { type: "string", short: "r" },
    between: { type: "string", short: "b" },
    status: { type: "boolean", short: "s" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Agent Communications - Track agent conversations

Usage:
  Log a message:
    bun log.ts --from "brand-agent" --to "claude-code" --type "instruction" --content "Use SA spelling"

  View recent messages:
    bun log.ts --recent 10

  View conversation between agents:
    bun log.ts --between "brand-agent,claude-code"

  View context-specific messages:
    bun log.ts --context "ihhashi"

  Show status:
    bun log.ts --status
`);
  process.exit(0);
}

if (values.status) {
  const messages = getRecentMessages(50);
  const now = new Date().toISOString();
  
  console.log("\n=== Agent Communications Status ===");
  console.log(`Timestamp: ${now}\n`);
  
  // Count messages by agent
  const agentActivity: Record<string, number> = {};
  messages.forEach((m) => {
    agentActivity[m.from] = (agentActivity[m.from] || 0) + 1;
    agentActivity[m.to] = (agentActivity[m.to] || 0) + 1;
  });
  
  console.log("Agent Activity (last 50 messages):");
  Object.entries(agentActivity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([agent, count]) => {
      console.log(`  • ${agent}: ${count} messages`);
    });
  
  console.log("\nRecent Messages (last 5):");
  messages.slice(-5).forEach((m, i) => {
    console.log(`  ${i + 1}. [${m.from} → ${m.to}] ${m.content.slice(0, 50)}...`);
  });
  
  process.exit(0);
}

if (values.recent) {
  const count = parseInt(values.recent as string) || 10;
  const messages = getRecentMessages(count);
  console.log(`\n=== Last ${count} Messages ===\n`);
  messages.forEach((m, i) => {
    const time = new Date(m.timestamp).toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg" });
    console.log(`${i + 1}. [${time}] ${m.from} → ${m.to} (${m.type})`);
    console.log(`   ${m.content}`);
    console.log("");
  });
  process.exit(0);
}

if (values.between) {
  const agents = (values.between as string).split(",").map((a) => a.trim());
  const messages = getRecentMessages(100);
  const filtered = messages.filter(
    (m) => agents.includes(m.from) || agents.includes(m.to)
  );
  console.log(`\n=== Conversation: ${agents.join(" ↔ ")} ===\n`);
  filtered.slice(-20).forEach((m) => {
    const time = new Date(m.timestamp).toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg" });
    console.log(`[${time}] ${m.from} → ${m.to}`);
    console.log(`  ${m.content}\n`);
  });
  process.exit(0);
}

// Log a message
if (values.from && values.to && values.content) {
  const msg: Message = {
    timestamp: new Date().toISOString(),
    from: values.from as string,
    to: values.to as string,
    type: (values.type as Message["type"]) || "status",
    content: values.content as string,
    context: values.context as string,
    priority: (values.priority as Message["priority"]) || "normal",
  };
  logMessage(msg);
  console.log(`✓ Logged: [${msg.from} → ${msg.to}] ${msg.type}`);
} else if (!values.recent && !values.between && !values.status) {
  console.log("Error: Missing required fields. Use --from, --to, --content, --type");
  console.log("Use --help for usage information");
  process.exit(1);
}
