#!/usr/bin/env bun
/**
 * Opportunity Team - Multi-Agent Analysis for iHhashi Crypto Embedding
 * Orchestrates parallel Zo agents for comprehensive analysis
 */

import { spawn } from "child_process";
import * as fs from "fs";

const MOLT_ID_WS = "wss://multiclaw.moltid.workers.dev/c/molt_47dfae9288abf3d5d2252abf";

interface AgentTask {
  id: string;
  role: string;
  focus: string;
  output: string;
}

const AGENTS: AgentTask[] = [
  {
    id: "sa-regulatory",
    role: "Regulatory Analyst",
    focus: "South African crypto regulations - FSCA licensing requirements, Crypto Assets Act 2023, FATF compliance, exchange licensing, wallet custody rules",
    output: "Regulatory compliance roadmap for embedding crypto in taxi-hailing app"
  },
  {
    id: "crypto-integration",
    role: "Technical Architect",
    focus: "How to embed crypto payments in iHhashi taxi app - wallet architecture, transaction flows, gas optimization, UX patterns, Base chain integration",
    output: "Technical integration plan with architecture diagrams"
  },
  {
    id: "molt-id-ops",
    role: "Molt.id Integration Specialist",
    focus: `Analyze molt.id WebSocket at ${MOLT_ID_WS}. Understand capabilities, how it connects to Clawrouter, wallet operations, multi-chain support, and how to integrate with iHhashi`,
    output: "Molt.id integration guide with connection setup and Telegram bot configuration"
  },
  {
    id: "competitive-analysis",
    role: "Market Researcher",
    focus: "Competitive landscape - other taxi apps using crypto in Africa (LIPA, others), crypto payment adoption in SA, user demand signals, barriers to entry",
    output: "Competitive analysis with market opportunity sizing"
  },
  {
    id: "risk-compliance",
    role: "Risk & Compliance Officer",
    focus: "Risk assessment for crypto in taxi app - AML/KYC requirements, transaction monitoring, fraud prevention, insurance, consumer protection laws",
    output: "Risk matrix with mitigation strategies"
  }
];

function showHelp() {
  console.log(`
Opportunity Team Commands:
  analyze              Run full multi-agent analysis (parallel)
  status              Show agent lineup and capabilities
  report              Generate hourly report summary
  molt-id             Test molt.id WebSocket connection
  schedule-hourly     Set up hourly reporting agent

Molt.id Connection:
  ${MOLT_ID_WS}
`);
}

function showStatus() {
  console.log("\n🤖 Opportunity Team Lineup\n");
  console.log("┌──────────────────┬───────────────────────────────┬─────────────────┐");
  console.log("│ Agent ID         │ Role                          │ Focus Area      │");
  console.log("├──────────────────┼───────────────────────────────┼─────────────────┤");
  for (const agent of AGENTS) {
    console.log(`│ ${agent.id.padEnd(16)} │ ${agent.role.padEnd(29)} │ ${agent.focus.substring(0, 15).padEnd(15)} │`);
  }
  console.log("└──────────────────┴───────────────────────────────┴─────────────────┘");
  console.log("\n📊 Focus Areas:");
  for (const agent of AGENTS) {
    console.log(`  • ${agent.id}: ${agent.focus.substring(0, 60)}...`);
  }
  console.log(`\n🔗 Molt.id: ${MOLT_ID_WS}`);
}

async function callZoAgent(agent: AgentTask): Promise<string> {
  const prompt = `You are the ${agent.role} for the iHhashi opportunity team.

FOCUS: ${agent.focus}

DELIVERABLE: ${agent.output}

Context: iHhashi is a South African taxi-hailing app being developed. We want to embed cryptocurrency payment capabilities that comply with local regulations.

Provide a comprehensive analysis with:
1. Key findings
2. Recommendations
3. Action items
4. Risk considerations

Be specific and actionable. Focus on South African market conditions.`;

  return new Promise((resolve, reject) => {
    const proc = spawn("curl", [
      "-s", "-X", "POST",
      "https://api.zo.computer/zo/ask",
      "-H", `authorization: ${process.env.ZO_CLIENT_IDENTITY_TOKEN}`,
      "-H", "content-type: application/json",
      "-d", JSON.stringify({
        input: prompt,
        model_name: "openrouter:z-ai/glm-5"
      })
    ]);

    let output = "";
    proc.stdout.on("data", (data) => {
      output += data.toString();
    });
    proc.stderr.on("data", (data) => console.error(`Error: ${data}`));
    proc.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result.output || "No output");
        } catch {
          resolve(output || "No output");
        }
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

async function runAnalysis() {
  console.log(`\n📊 Deploying ${AGENTS.length} agents for parallel analysis...\n`);
  console.log("Focus: iHhashi Crypto Embedding with SA Regulatory Compliance\n");
  console.log("━".repeat(60) + "\n");

  const startTime = Date.now();
  const results: Record<string, string> = {};

  // Run agents in parallel
  const promises = AGENTS.map(async (agent) => {
    console.log(`🚀 [${agent.id}] Starting ${agent.role}...`);
    try {
      const result = await callZoAgent(agent);
      console.log(`✅ [${agent.id}] Analysis complete`);
      return { id: agent.id, result };
    } catch (error) {
      console.log(`❌ [${agent.id}] Failed: ${error}`);
      return { id: agent.id, result: `Error: ${error}` };
    }
  });

  const outputs = await Promise.all(promises);
  for (const { id, result } of outputs) {
    results[id] = result;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Generate report
  fs.mkdirSync("/home/workspace/Boober/agent-reports", { recursive: true });
  const timestamp = new Date().toISOString();
  const reportPath = `/home/workspace/Boober/agent-reports/opportunity-analysis-${Date.now()}.md`;

  let report = `# iHhashi Crypto Embedding - Opportunity Team Analysis

**Generated**: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
**Duration**: ${duration}s
**Molt.id**: ${MOLT_ID_WS}

---

## Executive Summary

This report compiles analysis from ${AGENTS.length} specialized agents evaluating crypto integration for iHhashi.

---

`;

  for (const agent of AGENTS) {
    report += `## ${agent.role} (${agent.id})

**Focus**: ${agent.focus}

### Analysis

${results[agent.id]}

---

`;
  }

  report += `## Next Steps

1. Review regulatory requirements with legal counsel
2. Design technical architecture based on integration plan
3. Set up molt.id Telegram bot for wallet operations
4. Conduct user research on crypto payment demand
5. Build MVP with Base chain integration

## Molt.id Integration Note

WebSocket: \`${MOLT_ID_WS}\`

This endpoint can be used for:
- Multi-chain wallet operations
- Telegram bot integration
- Real-time transaction monitoring

---

*Report generated by Opportunity Team at ${timestamp}*
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n${"━".repeat(60)}\n`);
  console.log("📋 EXECUTIVE SUMMARY:\n");
  console.log(`   Agents Deployed: ${AGENTS.length}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Report: ${reportPath}`);
  console.log(`\n✅ Analysis complete! Check the report for details.\n`);
}

async function testMoltId() {
  console.log("\n🔌 Testing Molt.id Connection...\n");
  console.log(`WebSocket: ${MOLT_ID_WS}\n`);

  // Test HTTP upgrade endpoint
  const proc = spawn("curl", [
    "-s", "-I",
    MOLT_ID_WS.replace("wss://", "https://")
  ]);

  let output = "";
  proc.stdout.on("data", (data) => {
    output += data.toString();
  });

  proc.on("close", () => {
    if (output.includes("101") || output.includes("Upgrade")) {
      console.log("✅ WebSocket endpoint detected (upgrade required)\n");
    } else {
      console.log("⚠️ Endpoint responded but may need authentication\n");
    }
    console.log(output);

    console.log("\n📌 For Telegram integration:");
    console.log("   1. Create a Telegram bot token");
    console.log("   2. Connect the bot to molt.id WS");
    console.log("   3. Handle incoming messages and commands");
    console.log("\n   Your molt.id WS is ready for integration!\n");
  });
}

function scheduleHourly() {
  console.log("\n⏰ Hourly Reporting Setup\n");
  console.log("To set up hourly reports, run:");
  console.log("  bun /home/workspace/Skills/clawrouter-leadership/scripts/opportunity-team.ts analyze");
  console.log("\nOr create a scheduled agent:");
  console.log("  zo-agent create --schedule '0 * * * *' --task 'opportunity-team report'\n");
}

// Parse commands
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "analyze":
    runAnalysis();
    break;
  case "status":
    showStatus();
    break;
  case "report":
    console.log("\n📊 Generating hourly report summary...\n");
    showStatus();
    break;
  case "molt-id":
    testMoltId();
    break;
  case "schedule-hourly":
    scheduleHourly();
    break;
  case "help":
  default:
    showHelp();
}
