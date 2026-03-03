#!/usr/bin/env bun
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const SOL_MINT = "So11111111111111111111111111111111111111112";

async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<any> {
  // Convert amount to lamports if SOL
  const inputAmount = inputMint === SOL_MINT 
    ? Math.floor(amount * LAMPORTS_PER_SOL)
    : Math.floor(amount * 1e6); // Assume 6 decimals for tokens

  const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${inputAmount}&slippageBps=${slippageBps}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Quote API error: ${response.status}`);
  }
  
  return response.json();
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log("Usage: quote.ts <inputMint> <outputMint> <amount> [slippageBps]");
    console.log("\nExamples:");
    console.log("  bun quote.ts So11111111111111111111111111111111111111112 NV2RYH954cTJ3ckFUpvfqaQXU4ARqqDH3562nFSpump 0.1");
    process.exit(0);
  }
  
  const inputMint = args[0];
  const outputMint = args[1];
  const amount = parseFloat(args[2]);
  const slippage = parseInt(args[3]) || 100;
  
  console.log(`\nFetching quote...`);
  console.log(`Input: ${inputMint}`);
  console.log(`Output: ${outputMint}`);
  console.log(`Amount: ${amount}`);
  console.log(`Slippage: ${slippage/100}%`);
  
  const quote = await getQuote(inputMint, outputMint, amount, slippage);
  
  if (quote.error) {
    console.error("Quote error:", quote.error);
    process.exit(1);
  }
  
  console.log("\n=== QUOTE ===");
  console.log(`Input Amount: ${quote.inAmount}`);
  console.log(`Output Amount: ${quote.outAmount}`);
  console.log(`Price Impact: ${quote.priceImpactPct}%`);
  console.log(`Route: ${quote.routePlan?.map((r: any) => r.swapInfo?.label).join(" -> ") || "Direct"}`);
  console.log(`\nView on Jupiter: https://jup.ag/swap/${inputMint}-${outputMint}`);
}

main().catch(console.error);
