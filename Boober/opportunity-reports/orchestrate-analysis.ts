import { execSync } from "child_process";
import * as fs from "fs";

const MODEL = "openrouter:z-ai/glm-5";
const API_URL = "https://api.zo.computer/zo/ask";
const TOKEN = process.env.ZO_CLIENT_IDENTITY_TOKEN;

interface AgentResult {
  agent: string;
  timestamp: string;
  output: string;
}

async function spawnAgent(prompt: string, agentName: string): Promise<AgentResult> {
  const payload = {
    input: prompt,
    model_name: MODEL,
    output_format: {
      type: "object",
      properties: {
        findings: { type: "string" },
        recommendations: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        opportunities: { type: "array", items: { type: "string" } }
      },
      required: ["findings", "recommendations", "risks", "opportunities"]
    }
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "authorization": TOKEN!,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return {
    agent: agentName,
    timestamp: new Date().toISOString(),
    output: JSON.stringify(data.output, null, 2)
  };
}

async function main() {
  console.log("🚀 SPAWNING OPPORTUNITY TEAM ANALYSIS\n");
  console.log("═".repeat(60));

  const agents = [
    {
      name: "SA-CRYPTO-REGULATIONS",
      prompt: `You are analyzing South African cryptocurrency regulations for a taxi-safety app called iHhashi.

TASK: Research and analyze South African crypto regulations that would apply to:
1. A mobile app that embeds cryptocurrency payments/wallets
2. Taxi industry workers receiving crypto payments
3. Peer-to-peer crypto transactions within South Africa

SEARCH FOR:
- FSCA (Financial Sector Conduct Authority) crypto regulations
- SARB (South African Reserve Bank) stance on crypto
- CASP (Crypto Asset Service Provider) licensing requirements
- Recent regulatory updates (2024-2026)
- Compliance requirements for fintech apps
- KYC/AML requirements for crypto in South Africa

OUTPUT FORMAT:
Return a JSON object with:
- findings: Summary of key regulatory framework
- recommendations: Array of compliance steps
- risks: Array of regulatory risks
- opportunities: Array of regulatory opportunities`
    },
    {
      name: "IHHASHI-CRYPTO-INTEGRATION",
      prompt: `You are analyzing how to embed cryptocurrency into iHhashi - a taxi safety app for South Africa.

CONTEXT: iHhashi (Boober) is a taxi safety app with:
- Driver verification system
- Safety marshals
- Community trust features
- Mobile payments integration

TASK: Analyze creative ways to integrate crypto that would:
1. Add value to taxi drivers and passengers
2. Comply with South African regulations
3. Solve real problems in the taxi industry
4. Be accessible to unbanked users

CONSIDER:
- Stablecoins for payments (USDC, cUSD)
- Low-fee networks (Celo, Base, Polygon)
- SMS/USSD-based crypto access
- Reward tokens for safety behaviors
- Micro-transactions for trip insurance
- Cross-border remittances for workers

OUTPUT FORMAT:
Return a JSON object with:
- findings: Summary of integration possibilities
- recommendations: Array of implementation approaches
- risks: Array of technical/business risks
- opportunities: Array of value-add opportunities`
    },
    {
      name: "MOLT-ID-INTEGRATION",
      prompt: `You are analyzing how molt.id can integrate with iHhashi for identity and reputation in South Africa's taxi industry.

CONTEXT:
- molt.id is a Web3 identity/reputation platform
- iHhashi needs driver verification and trust scoring
- South Africa has many unbanked users who need accessible identity

TASK: Research molt.id capabilities and analyze:
1. How molt.id's identity verification works
2. Integration possibilities with iHhashi's driver verification
3. Wallet-less onboarding for non-crypto users
4. Reputation portability for taxi drivers

SEARCH FOR:
- molt.id official documentation and features
- Web3 identity use cases in emerging markets
- Identity verification for gig economy workers
- Integration APIs and SDKs

OUTPUT FORMAT:
Return a JSON object with:
- findings: Summary of molt.id capabilities
- recommendations: Array of integration approaches
- risks: Array of integration risks
- opportunities: Array of synergy opportunities`
    },
    {
      name: "TAXI-INDUSTRY-CRYPTO-USE-CASES",
      prompt: `You are analyzing real-world crypto use cases for South Africa's taxi industry.

CONTEXT:
- South Africa's minibus taxi industry is huge (15M+ daily commuters)
- Many drivers and operators are unbanked or underbanked
- Cash is dominant, leading to safety risks (robberies)
- Industry has association structures (SANTACO, etc.)

TASK: Research and analyze crypto use cases that would:
1. Solve real problems taxi operators face daily
2. Be practical for low-tech users
3. Create new revenue streams for the app
4. Improve safety and trust

SEARCH FOR:
- Successful crypto adoption in African markets
- Mobile money to crypto bridges (M-Pesa, etc.)
- Gig economy crypto payments
- African stablecoin adoption (cUSD on Celo, etc.)
- Taxi industry payment innovations

OUTPUT FORMAT:
Return a JSON object with:
- findings: Summary of viable use cases
- recommendations: Array of priority implementations
- risks: Array of adoption risks
- opportunities: Array of market opportunities`
    }
  ];

  const results: AgentResult[] = [];
  const startTime = Date.now();

  // Spawn agents in parallel
  const promises = agents.map(agent => spawnAgent(agent.prompt, agent.name));
  const responses = await Promise.all(promises);
  results.push(...responses);

  const duration = Math.round((Date.now() - startTime) / 1000);

  // Save combined report
  const report = {
    generatedAt: new Date().toISOString(),
    durationSeconds: duration,
    agents: results
  };

  const filename = `/home/workspace/Boober/opportunity-reports/analysis-${new Date().toISOString().split('T')[0]}-${new Date().getHours()}${new Date().getMinutes().toString().padStart(2, '0')}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));

  // Print summary
  console.log(`\n✅ ANALYSIS COMPLETE (${duration}s)\n`);
  console.log("═".repeat(60));
  
  for (const r of results) {
    console.log(`\n📊 ${r.agent}`);
    console.log("-".repeat(40));
    try {
      const parsed = JSON.parse(r.output);
      console.log(parsed.findings?.substring(0, 300) || "No findings");
    } catch {
      console.log(r.output.substring(0, 300));
    }
  }

  console.log(`\n\n📁 Full report saved: ${filename}`);
}

main().catch(console.error);
