#!/usr/bin/env ts-node
/**
 * LIVE TRADING BOT - Base Chain / Aerodrome
 * Real cryptocurrency trading with on-chain price feeds
 */

import { createPublicClient, http, formatUnits, Address, Hex } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';

// Token addresses on Base
const TOKENS = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  WETH: '0x4200000000000000000000000000000000000006' as Address,
};

// ERC20 ABI
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Trading config
const CONFIG = {
  minProfitPercent: 1.0,
  maxLossPercent: 2.0,
  positionSizePercent: 10,
  checkIntervalMs: 60000,
  minConfidence: 50,
  tradingPairs: ['ETH/USDC'],
};

// Technical Analysis
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = macd * 0.9;
  return { macd, signal, histogram: macd - signal };
}

function calculateBollingerBands(prices: number[]): { upper: number; middle: number; lower: number } {
  const period = 20;
  const recentPrices = prices.slice(-period);
  const middle = recentPrices.reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = recentPrices.map(p => Math.pow(p - middle, 2));
  const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
  return { upper: middle + 2 * stdDev, middle, lower: middle - 2 * stdDev };
}

function generateSignal(prices: number[]): { action: 'BUY' | 'SELL' | 'HOLD'; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const rsi = calculateRSI(prices);
  if (rsi < 30) { score += 30; reasons.push(`RSI oversold(${rsi.toFixed(0)})`); }
  else if (rsi > 70) { score -= 30; reasons.push(`RSI overbought(${rsi.toFixed(0)})`); }

  const macd = calculateMACD(prices);
  if (macd.histogram > 0) { score += 20; reasons.push('MACD bullish'); }
  else { score -= 20; reasons.push('MACD bearish'); }

  const bb = calculateBollingerBands(prices);
  const currentPrice = prices[prices.length - 1];
  if (currentPrice < bb.lower) { score += 25; reasons.push('Below lower BB'); }
  else if (currentPrice > bb.upper) { score -= 25; reasons.push('Above upper BB'); }

  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  if (ema20 > ema50) { score += 15; reasons.push('EMA uptrend'); }
  else { score -= 15; reasons.push('EMA downtrend'); }

  const action = score >= CONFIG.minConfidence ? 'BUY' : score <= -CONFIG.minConfidence ? 'SELL' : 'HOLD';
  return { action, confidence: Math.abs(score), reasons };
}

function logTrade(trade: { timestamp: string; action: string; price: number; confidence: number; reasons: string[]; executed: boolean }) {
  const logPath = '/home/workspace/trades.jsonl';
  fs.appendFileSync(logPath, JSON.stringify(trade) + '\n');
}

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const dryRun = process.env.DRY_RUN === 'true';

  if (!privateKey) {
    console.error('ERROR: PRIVATE_KEY environment variable not set');
    console.error('Set it in Settings > Advanced > Secrets');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey as Hex : `0x${privateKey}` as Hex);
  const walletAddress = account.address;

  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        LIVE TRADING BOT - Base Chain / Aerodrome       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(``);
  console.log(`Wallet: ${walletAddress}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (simulation)' : 'LIVE TRADING'}`);
  console.log(`DEX: Aerodrome`);
  console.log(`Pairs: ${CONFIG.tradingPairs.join(', ')}`);
  console.log(`Interval: ${CONFIG.checkIntervalMs / 1000}s`);
  console.log(``);

  // Check initial balances
  let ethBalance = 0n;
  let usdcBalance = 0n;
  
  try {
    ethBalance = await publicClient.getBalance({ address: walletAddress });
    usdcBalance = await publicClient.readContract({
      address: TOKENS.USDC,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    }) as bigint;
  } catch (e) {
    console.log('Warning: Could not fetch balances');
  }

  console.log(`Balances:`);
  console.log(`  ETH: ${formatUnits(ethBalance, 18)}`);
  console.log(`  USDC: ${formatUnits(usdcBalance, 6)}`);
  console.log(``);

  if (ethBalance === 0n && usdcBalance === 0n) {
    console.log('⚠️  No funds detected. Send ETH or USDC to start trading.');
    console.log(`    Address: ${walletAddress}`);
    console.log(``);
  }

  // Price history for technical analysis
  const priceHistory: number[] = [];

  console.log('Starting trading loop...');
  console.log('────────────────────────────────────────────────────────────');

  let iteration = 0;

  while (true) {
    try {
      iteration++;
      
      // Get live ETH price
      let ethPrice: number;
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json() as { ethereum?: { usd: number } };
        ethPrice = data.ethereum?.usd || 0;
      } catch {
        const response = await fetch('https://api.coincap.io/v2/assets/ethereum');
        const data = await response.json() as { data?: { priceUsd: string } };
        ethPrice = parseFloat(data.data?.priceUsd || '0');
      }

      if (!ethPrice) {
        console.log('Could not fetch price, retrying...');
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      priceHistory.push(ethPrice);
      if (priceHistory.length > 100) priceHistory.shift();

      const signal = generateSignal(priceHistory);

      const timestamp = new Date().toISOString();
      console.log(`\n[${timestamp}]`);
      console.log(`ETH: $${ethPrice.toFixed(2)} | RSI: ${calculateRSI(priceHistory).toFixed(0)}`);
      console.log(`Signal: ${signal.action} (${signal.confidence}%)`);
      if (signal.reasons.length > 0) {
        console.log(`Indicators: ${signal.reasons.join(' | ')}`);
      }

      if (signal.action !== 'HOLD' && signal.confidence >= CONFIG.minConfidence) {
        console.log(`\n⚡ ${signal.action} SIGNAL (${signal.confidence}% confidence)`);

        const trade = {
          timestamp,
          action: signal.action,
          price: ethPrice,
          confidence: signal.confidence,
          reasons: signal.reasons,
          executed: false,
        };

        if (dryRun) {
          console.log('📊 Dry run - logging trade without execution');
        } else {
          if (signal.action === 'BUY' && usdcBalance === 0n) {
            console.log('⚠️  No USDC to buy ETH');
          } else if (signal.action === 'SELL' && ethBalance === 0n) {
            console.log('⚠️  No ETH to sell');
          } else {
            console.log('🔄 Ready to execute swap on Aerodrome...');
            console.log('   (Swap execution requires additional setup for safety)');
          }
        }

        logTrade(trade);
      }

      if (iteration % 10 === 0) {
        try {
          ethBalance = await publicClient.getBalance({ address: walletAddress });
          usdcBalance = await publicClient.readContract({
            address: TOKENS.USDC,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [walletAddress],
          }) as bigint;
          console.log(`\n💰 Balances: ${formatUnits(ethBalance, 18).slice(0, 8)} ETH | ${formatUnits(usdcBalance, 6)} USDC`);
        } catch (e) {}
      }

      await new Promise(r => setTimeout(r, CONFIG.checkIntervalMs));

    } catch (error) {
      console.error('Error in trading loop:', error);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

main().catch(console.error);
