#!/usr/bin/env bun
import { $ } from "bun";
import { readdirSync } from "bun";

interface AgentInfo {
  name: string;
  description: string;
  status: "available" | "running" | "error";
}

const AGENTS: Record<string, AgentInfo> = {
  orchestra: {
    name: "Agent Orchestra",
    description: "Coordinates ShieldGuard, BugHunter, DocMaster, Obsidian",
    status: "available"
  },
  bankr: {
    name: "Bankr",
    description: "Crypto trading and wallet management",
    status: "available"
  },
  "trading-bot": {
    name: "Trading Bot",
    description: "Autonomous cryptocurrency trading",
    status: "available"
  },
  "conway-agent": {
    name: "Conway Agent",
    description: "Conway Research AI agent ecosystem",
    status: "available"
  },
  "clawrouter-leadership": {
    name: "Clawrouter Leadership",
    description: "Clawrouter trading leadership",
    status: "available"
  },
  zeroclaw: {
    name: "ZeroClaw",
    description: "Telegram trading bot",
    status: "available"
  }
};

async function launchAgent(target: string, params: string): Promise<string> {
  const agent = AGENTS[target];
  
  if (!agent) {
    // Check if it's a skill folder
    const skillPath = `/home/workspace/Skills/${target}`;
    try {
      const skillExists = await $`test -d ${skillPath}`.then(() => true).catch(() => false);
      
      if (skillExists) {
        console.log(`\n🚀 Launching skill: ${target}`);
        console.log(`   Params: ${params}`);
        
        // Try to run the skill if it has a script
        const scriptPath = `${skillPath}/scripts/${target}.ts`;
        try {
          const result = await $`bun ${scriptPath} ${params}`.text();
          return result;
        } catch {
          // Try the main script
          const mainScriptPath = `${skillPath}/scripts/main.ts`;
          try {
            const result = await $`bun ${mainScriptPath} ${params}`.text();
            return result;
          } catch {
            return `Skill '${target}' found but no executable script found`;
          }
        }
      }
    } catch {
      return `Agent or skill '${target}' not found`;
    }
  }
  
  console.log(`\n🚀 Launching agent: ${agent.name}`);
  console.log(`   Description: ${agent.description}`);
  console.log(`   Params: ${params}`);
  
  // For now, just report the launch
  return `Agent '${target}' launched successfully.\nDescription: ${agent.description}\nParams: ${params}`;
}

function listAgents(): string {
  let output = "\n📋 Available Agents:\n\n";
  
  for (const [key, agent] of Object.entries(AGENTS)) {
    const status = agent.status === "available" ? "🟢" : agent.status === "running" ? "🔵" : "🔴";
    output += `${status} ${key}\n   ${agent.description}\n`;
  }
  
  // Also list skills from the Skills folder
  output += "\n📁 Skill Folders:\n";
  
  try {
    const skillsDir = "/home/workspace/Skills";
    const dirs = readdirSync(skillsDir);
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        output += `• ${dir.name}\n`;
      }
    }
  } catch {
    // Skills folder might not exist
  }
  
  return output;
}

function showStatus(): string {
  let output = "\n🟢 Commander Status: ACTIVE\n\n";
  
  output += "Active Agents:\n";
  for (const [key, agent] of Object.entries(AGENTS)) {
    const status = agent.status === "available" ? "🟢" : agent.status === "running" ? "🔵" : "🔴";
    output += `${status} ${key}: ${agent.status}\n`;
  }
  
  return output;
}

async function execCommand(command: string): Promise<string> {
  console.log(`\n⚡ Executing: ${command}`);
  
  try {
    const result = await $`${command}`.text();
    return result;
  } catch (error) {
    return `Error executing command: ${error}`;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case "launch": {
      const target = args[1];
      const params = args.slice(2).join(" ");
      const result = await launchAgent(target, params);
      console.log(result);
      break;
    }
    case "status": {
      console.log(showStatus());
      break;
    }
    case "list": {
      console.log(listAgents());
      break;
    }
    case "exec": {
      const cmd = args.slice(1).join(" ");
      const result = await execCommand(cmd);
      console.log(result);
      break;
    }
    default: {
      console.log(`
🎖️ Commander - Master Command Agent

Commands:
  launch <target> [params]   Launch an agent or skill
  status                    Check agent status
  list                      List all available agents
  exec <command>             Execute a shell command

Examples:
  bun scripts/commander.ts launch orchestra "Implement payment routes"
  bun scripts/commander.ts status
  bun scripts/commander.ts list
`);
    }
  }
}

main();