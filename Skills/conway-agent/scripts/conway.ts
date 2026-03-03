#!/usr/bin/env bun

const CONWAY_CONTRACT = "0x86cdd90bc48f7b5a866feaaf5023b8802dc2ab07";

async function runBankrPrompt(prompt: string): Promise<string> {
  const proc = Bun.spawn(["bankr", "prompt", prompt], {
    stdout: "pipe",
    stderr: "pipe",
  });
  
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  
  if (exitCode !== 0) {
    throw new Error(`Bankr command failed: ${stderr}`);
  }
  
  return stdout;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || "report";
  const params = args.slice(1);
  return { command, params };
}

async function getPrice() {
  console.log("Fetching $CONWAY price data...\n");
  
  const result = await runBankrPrompt(
    `What is the current price of $CONWAY token on Base? Show price in USD, 24h change, market cap, volume, and liquidity. Contract: ${CONWAY_CONTRACT}`
  );
  
  console.log(result);
}

async function getReport() {
  console.log("=".repeat(60));
  console.log("CONWAY ECOSYSTEM DAILY REPORT");
  console.log(`Generated: ${new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })} SAST`);
  console.log("=".repeat(60));
  console.log();
  
  // Token Price & Market Data
  console.log("📊 TOKEN DATA");
  console.log("-".repeat(40));
  const priceResult = await runBankrPrompt(
    `Provide a brief summary of $CONWAY token on Base (contract: ${CONWAY_CONTRACT}): current price, 24h change, market cap, volume. Be concise - max 5 lines.`
  );
  console.log(priceResult);
  console.log();
  
  // Market Analysis
  console.log("📈 MARKET ANALYSIS");
  console.log("-".repeat(40));
  const analysisResult = await runBankrPrompt(
    `Analyze $CONWAY token technical outlook on Base. Support/resistance levels, trend direction, key indicators. Be concise - max 5 lines.`
  );
  console.log(analysisResult);
  console.log();
  
  // Ecosystem News
  console.log("🌐 ECOSYSTEM UPDATES");
  console.log("-".repeat(40));
  const newsResult = await runBankrPrompt(
    `What are the latest developments in the Conway Research ecosystem? Any new agents, features, or announcements? Be concise - max 5 lines.`
  );
  console.log(newsResult);
  console.log();
  
  console.log("=".repeat(60));
  console.log("End of Report");
  console.log("=".repeat(60));
}

async function checkWallet(address: string) {
  console.log(`Checking wallet ${address} for $CONWAY holdings...\n`);
  
  const result = await runBankrPrompt(
    `Check wallet ${address} on Base. Does it hold any $CONWAY tokens (contract: ${CONWAY_CONTRACT})? Show all token balances with USD values.`
  );
  
  console.log(result);
}

async function interact(prompt: string) {
  const fullPrompt = `About Conway Research ecosystem on Base: ${prompt}`;
  const result = await runBankrPrompt(fullPrompt);
  console.log(result);
}

async function main() {
  const { command, params } = parseArgs();
  
  try {
    switch (command) {
      case "price":
        await getPrice();
        break;
      case "report":
        await getReport();
        break;
      case "wallet":
        if (!params[0]) {
          console.error("Usage: conway.ts wallet <address>");
          process.exit(1);
        }
        await checkWallet(params[0]);
        break;
      case "interact":
        if (!params[0]) {
          console.error("Usage: conway.ts interact <prompt>");
          process.exit(1);
        }
        await interact(params.join(" "));
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error("Available commands: price, report, wallet, interact");
        process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
