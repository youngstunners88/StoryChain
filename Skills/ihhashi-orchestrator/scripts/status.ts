#!/usr/bin/env bun
import { $ } from "bun";
import fs from "fs";

console.log("\n╔════════════════════════════════════════════════════════╗");
console.log("║           iHHASHI ORCHESTRATOR STATUS                  ║");
console.log("╚════════════════════════════════════════════════════════╝\n");

const agents = [
  { name: "Zo (Orchestrator)", skill: "/home/workspace/Skills/agent-communications/SKILL.md", role: "Conductor" },
  { name: "Brand Agent", skill: "/home/workspace/Skills/sa-brand-agent/SKILL.md", role: "SA Style Enforcement" },
  { name: "Claude Code", binary: "/usr/bin/claude", role: "Builder" },
  { name: "Quality Agent", skill: "/home/workspace/Skills/quality-agent/SKILL.md", role: "Glitch Catcher" },
  { name: "agenticSeek", dir: "/home/workspace/agenticSeek", role: "Research & Autonomy" },
];

console.log("AGENT STATUS:\n");

for (const agent of agents) {
  let status = "🔴 Offline";
  
  if (agent.binary) {
    const exists = fs.existsSync(agent.binary);
    status = exists ? "🟢 Ready" : "🔴 Not installed";
  } else if (agent.skill) {
    const exists = fs.existsSync(agent.skill);
    status = exists ? "🟢 Ready" : "🔴 Not installed";
  } else if (agent.dir) {
    const exists = fs.existsSync(agent.dir);
    status = exists ? "🟡 Installed (needs config)" : "🔴 Not installed";
  }
  
  console.log(`  ${status}  ${agent.name}`);
  console.log(`           Role: ${agent.role}`);
  console.log("");
}

// Check Claude Code version
try {
  const version = await $`claude --version`.quiet();
  console.log(`Claude Code Version: ${version.stdout.toString().trim()}\n`);
} catch {
  console.log("Claude Code: Not available\n");
}

// Check iHhashi project
const ihhashiExists = fs.existsSync("/home/workspace/ihhashi");
console.log(`iHhashi Project: ${ihhashiExists ? "🟢 Present" : "🔴 Not found"}`);

if (ihhashiExists) {
  const backendExists = fs.existsSync("/home/workspace/ihhashi/backend");
  const frontendExists = fs.existsSync("/home/workspace/ihhashi/frontend");
  console.log(`  Backend: ${backendExists ? "✅" : "❌"}`);
  console.log(`  Frontend: ${frontendExists ? "✅" : "❌"}`);
}

// Check agent communications
const commsLog = "/home/.z/agent-communications/communications.jsonl";
const commsExist = fs.existsSync(commsLog);
console.log(`\nCommunications Hub: ${commsExist ? "🟢 Active" : "⚪ No messages yet"}`);

console.log("\n════════════════════════════════════════════════════════");
console.log("QUICK COMMANDS:\n");
console.log("  Run orchestrated build:");
console.log("    bun /home/workspace/Skills/ihhashi-orchestrator/scripts/build.ts");
console.log("\n  View agent communications:");
console.log("    bun /home/workspace/Skills/agent-communications/scripts/log.ts --status");
console.log("\n  Start agenticSeek:");
console.log("    cd /home/workspace/agenticSeek && ./start_services.sh full");
console.log("════════════════════════════════════════════════════════\n");
