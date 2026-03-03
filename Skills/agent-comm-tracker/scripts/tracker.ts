#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync, watch } from "fs";
import { join } from "path";

// ============================================================================
// AGENT COMMUNICATION TRACKER
// ============================================================================

interface Communication {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  type: "instruction" | "feedback" | "approval" | "error" | "info";
  metadata?: Record<string, any>;
}

interface AgentProfile {
  name: string;
  role: string;
  model?: string;
  status: "active" | "idle" | "error";
  lastSeen?: string;
}

const COMM_FILE = "/home/workspace/.agents/communications.json";
const PROFILES_FILE = "/home/workspace/.agents/agent-profiles.json";

const DEFAULT_AGENTS: AgentProfile[] = [
  { name: "Zo", role: "Main Assistant", model: "GLM-5", status: "active" },
  { name: "Brand Agent", role: "SA Style Enforcer", status: "idle" },
  { name: "Builder Agent", role: "Claude Code (Opus/Sonnet)", status: "idle" },
  { name: "Quality Agent", role: "Glitch Catcher", status: "idle" },
  { name: "Nduna Bot", role: "Telegram Bot", status: "idle" },
  { name: "Marketing OpenClaw", role: "Marketing Automation", status: "idle" }
];

function ensureFiles(): void {
  const dir = "/home/workspace/.agents";
  if (!existsSync(dir)) {
    require("fs").mkdirSync(dir, { recursive: true });
  }
  
  if (!existsSync(COMM_FILE)) {
    writeFileSync(COMM_FILE, JSON.stringify([], null, 2));
  }
  
  if (!existsSync(PROFILES_FILE)) {
    writeFileSync(PROFILES_FILE, JSON.stringify(DEFAULT_AGENTS, null, 2));
  }
}

function loadCommunications(): Communication[] {
  ensureFiles();
  try {
    return JSON.parse(readFileSync(COMM_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveCommunications(comms: Communication[]): void {
  writeFileSync(COMM_FILE, JSON.stringify(comms, null, 2));
}

function loadProfiles(): AgentProfile[] {
  ensureFiles();
  try {
    return JSON.parse(readFileSync(PROFILES_FILE, "utf-8"));
  } catch {
    return DEFAULT_AGENTS;
  }
}

function saveProfiles(profiles: AgentProfile[]): void {
  writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

function generateId(): string {
  return `comm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function logCommunication(
  from: string,
  to: string,
  message: string,
  type: Communication["type"] = "info",
  metadata?: Record<string, any>
): Communication {
  const comm: Communication = {
    id: generateId(),
    from,
    to,
    message,
    timestamp: new Date().toISOString(),
    type,
    metadata
  };
  
  const comms = loadCommunications();
  comms.push(comm);
  
  // Keep last 500 entries
  const trimmed = comms.slice(-500);
  saveCommunications(trimmed);
  
  // Update agent profiles
  const profiles = loadProfiles();
  const fromProfile = profiles.find(p => p.name === from);
  const toProfile = profiles.find(p => p.name === to);
  
  if (fromProfile) {
    fromProfile.lastSeen = comm.timestamp;
    fromProfile.status = "active";
  }
  if (toProfile) {
    toProfile.lastSeen = comm.timestamp;
  }
  
  saveProfiles(profiles);
  
  return comm;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-ZA", { 
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit"
  });
}

function getTypeIcon(type: Communication["type"]): string {
  switch (type) {
    case "instruction": return "📤";
    case "feedback": return "💬";
    case "approval": return "✅";
    case "error": return "❌";
    case "info": return "ℹ️";
  }
}

function showRecent(count: number = 10): void {
  const comms = loadCommunications();
  const recent = comms.slice(-count);
  
  console.log("\n📡 RECENT COMMUNICATIONS");
  console.log("═".repeat(60));
  
  if (recent.length === 0) {
    console.log("\n  No communications logged yet.");
    return;
  }
  
  recent.forEach(comm => {
    const icon = getTypeIcon(comm.type);
    const time = formatTimestamp(comm.timestamp);
    
    console.log(`\n${icon} [${time}] ${comm.from} → ${comm.to}`);
    console.log(`   ${comm.message.slice(0, 80)}${comm.message.length > 80 ? "..." : ""}`);
  });
  
  console.log("\n" + "═".repeat(60));
}

function showStatus(): void {
  const profiles = loadProfiles();
  const comms = loadCommunications();
  
  console.log("\n🎭 AGENT STATUS");
  console.log("═".repeat(60));
  
  profiles.forEach(agent => {
    const statusIcon = agent.status === "active" ? "🟢" : agent.status === "error" ? "🔴" : "⚪";
    const lastSeen = agent.lastSeen ? formatTimestamp(agent.lastSeen) : "never";
    const model = agent.model ? ` (${agent.model})` : "";
    
    console.log(`\n${statusIcon} ${agent.name}${model}`);
    console.log(`   Role: ${agent.role}`);
    console.log(`   Last seen: ${lastSeen}`);
  });
  
  console.log("\n" + "═".repeat(60));
  console.log(`\nTotal communications: ${comms.length}`);
}

function showGraph(): void {
  const comms = loadCommunications();
  const profiles = loadProfiles();
  
  console.log("\n🕸️ COMMUNICATION GRAPH");
  console.log("═".repeat(60));
  
  // Build adjacency
  const connections: Map<string, Map<string, number>> = new Map();
  
  comms.forEach(comm => {
    if (!connections.has(comm.from)) {
      connections.set(comm.from, new Map());
    }
    const fromMap = connections.get(comm.from)!;
    fromMap.set(comm.to, (fromMap.get(comm.to) || 0) + 1);
  });
  
  profiles.forEach(agent => {
    const outgoing = connections.get(agent.name);
    if (outgoing) {
      console.log(`\n📤 ${agent.name} sends to:`);
      outgoing.forEach((count, to) => {
        console.log(`   → ${to} (${count} messages)`);
      });
    }
  });
  
  console.log("\n" + "═".repeat(60));
}

function listenMode(): void {
  console.log("\n👂 LISTENING MODE (press Ctrl+C to stop)");
  console.log("═".repeat(60));
  
  let lastCount = loadCommunications().length;
  
  // Initial show
  showRecent(5);
  
  // Watch for changes
  const watcher = watch(COMM_FILE, (event) => {
    if (event === "change") {
      const comms = loadCommunications();
      if (comms.length > lastCount) {
        const newComms = comms.slice(lastCount);
        newComms.forEach(comm => {
          const icon = getTypeIcon(comm.type);
          const time = formatTimestamp(comm.timestamp);
          console.log(`\n${icon} [${time}] ${comm.from} → ${comm.to}`);
          console.log(`   ${comm.message}`);
        });
        lastCount = comms.length;
      }
    }
  });
  
  process.on("SIGINT", () => {
    watcher.close();
    console.log("\n\nStopped listening.");
    process.exit(0);
  });
}

function clearHistory(): void {
  saveCommunications([]);
  console.log("✅ Communication history cleared.");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  ensureFiles();
  
  switch (command) {
    case "track":
    case "recent":
      showRecent(parseInt(args[1]) || 10);
      break;
      
    case "status":
      showStatus();
      break;
      
    case "graph":
      showGraph();
      break;
      
    case "listen":
      listenMode();
      break;
      
    case "log":
      if (args.length < 4) {
        console.log("Usage: tracker.ts log <from> <to> <message>");
        break;
      }
      const from = args[1];
      const to = args[2];
      const message = args.slice(3).join(" ");
      const comm = logCommunication(from, to, message, "info");
      console.log(`✅ Logged: ${comm.id}`);
      break;
      
    case "clear":
      clearHistory();
      break;
      
    case "help":
    default:
      console.log(`
📡 AGENT COMMUNICATION TRACKER

Commands:
  track [n]           Show last n communications (default: 10)
  status              Show all agent statuses
  graph               Show communication graph
  listen              Real-time monitoring mode
  log <from> <to> <msg>  Log a new communication
  clear               Clear communication history
  help                Show this help

Tracked Agents:
  Zo              - Main Assistant (GLM-5)
  Brand Agent     - SA Style Enforcer
  Builder Agent   - Claude Code
  Quality Agent   - Glitch Catcher
  Nduna Bot       - Telegram Bot
  Marketing OpenClaw - Marketing Automation

Files:
  ${COMM_FILE}
  ${PROFILES_FILE}
`);
  }
}

main();
