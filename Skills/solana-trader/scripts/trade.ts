#!/usr/bin/env bun
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

function getKeypair(): Keypair {
  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  if (!privateKey) {
    console.error("ERROR: SOLANA_PRIVATE_KEY not set");
    console.error("Add it in Settings > Advanced > Secrets");
    process.exit(1);
  }
  try {
    const decoded = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decoded);
  } catch (e) {
    console.error("ERROR: Invalid private key format");
    process.exit(1);
  }
}

async function getConnection(): Promise<Connection> {
  return new Connection(RPC_URL, "confirmed");
}

async function getBalance(walletAddress: string): Promise<void> {
  const conn = await getConnection();
  const pubkey = new PublicKey(walletAddress);
  
  // Get SOL balance
  const solBalance = await conn.getBalance(pubkey);
  console.log(`SOL: ${(solBalance / LAMPORTS_PER_SOL).toFixed(6)}`);
  
  // Get SPL token accounts
  const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pubkey, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  });
  
  if (tokenAccounts.value.length > 0) {
    console.log("\nToken Balances:");
    for (const account of tokenAccounts.value) {
      const info = account.account.data.parsed.info;
      const mint = info.mint;
      const amount = info.tokenAmount.uiAmount;
      if (amount > 0) {
        console.log(`  ${mint}: ${amount}`);
      }
    }
  }
}

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

async function executeSwap(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<void> {
  const keypair = getKeypair();
  const conn = await getConnection();
  
  console.log(`\nWallet: ${keypair.publicKey.toBase58()}`);
  console.log(`Swapping ${amount} of ${inputMint} -> ${outputMint}`);
  
  // Get quote
  console.log("\nFetching quote...");
  const quote = await getQuote(inputMint, outputMint, amount, slippageBps);
  
  if (quote.error) {
    console.error("Quote error:", quote.error);
    process.exit(1);
  }
  
  const inAmount = quote.inAmount;
  const outAmount = quote.outAmount;
  const priceImpact = quote.priceImpactPct;
  
  console.log(`Input: ${inAmount}`);
  console.log(`Output: ${outAmount}`);
  console.log(`Price Impact: ${priceImpact}%`);
  
  // Get swap transaction
  console.log("\nBuilding swap transaction...");
  const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: keypair.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });
  
  const swapData = await swapResponse.json();
  
  if (swapData.error) {
    console.error("Swap error:", swapData.error);
    process.exit(1);
  }
  
  // Decode and sign transaction
  const swapTransactionBuf = Buffer.from(swapData.swapTransaction, "base64");
  const { VersionedTransaction } = await import("@solana/web3.js");
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  
  // Sign
  transaction.sign([keypair]);
  
  // Send
  console.log("\nSending transaction...");
  const rawTransaction = transaction.serialize();
  const txid = await conn.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    maxRetries: 2,
  });
  
  console.log(`\nTransaction sent: ${txid}`);
  console.log(`View on Solscan: https://solscan.io/tx/${txid}`);
  
  // Confirm
  console.log("\nConfirming...");
  const latestBlockHash = await conn.getLatestBlockhash();
  const confirmation = await conn.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txid,
  }, "confirmed");
  
  if (confirmation.value.err) {
    console.error("Transaction failed:", confirmation.value.err);
    process.exit(1);
  }
  
  console.log("\n✓ Transaction confirmed!");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log("Solana Trader - Jupiter Swap Bot");
    console.log("\nCommands:");
    console.log("  balance              - Show wallet balances");
    console.log("  quote <in> <out> <amt> [slippage] - Get swap quote");
    console.log("  swap <in> <out> <amt> [slippage] - Execute swap");
    console.log("  info <mint>          - Get token info");
    process.exit(0);
  }
  
  const keypair = getKeypair();
  
  switch (command) {
    case "balance":
      await getBalance(keypair.publicKey.toBase58());
      break;
      
    case "quote":
      if (args.length < 4) {
        console.error("Usage: quote <inputMint> <outputMint> <amount> [slippageBps]");
        process.exit(1);
      }
      const quoteResult = await getQuote(args[1], args[2], parseFloat(args[3]), parseInt(args[4]) || 50);
      console.log(JSON.stringify(quoteResult, null, 2));
      break;
      
    case "swap":
      if (args.length < 4) {
        console.error("Usage: swap <inputMint> <outputMint> <amount> [slippageBps]");
        process.exit(1);
      }
      await executeSwap(args[1], args[2], parseFloat(args[3]), parseInt(args[4]) || 50);
      break;
      
    case "info":
      console.log(`Token mint: ${args[1]}`);
      console.log(`View on Solscan: https://solscan.io/token/${args[1]}`);
      console.log(`View on DEX Screener: https://dexscreener.com/solana/${args[1]}`);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
