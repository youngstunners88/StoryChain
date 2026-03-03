#!/usr/bin/env ts-node
/**
 * AUTONOMOUS TRADING BOT
 * Based on: "Technical Analysis in Cryptocurrency Trading" by Kristian Ratia
 * 
 * Strategies implemented:
 * - RSI (Relative Strength Index)
 * - MACD (Moving Average Convergence Divergence)
 * - Bollinger Bands
 * - EMA (Exponential Moving Average)
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

// Trading configuration
const CONFIG = {
  minProfitPercent: 1.5,
  maxLossPercent: 2,
  rsiOversold: 30,
  rsiOverbought: 70,
  tradingPairs: ['ETH/USDC', 'USDC/ETH'],
  checkIntervalMs: 60000, // 1 minute
};

// Technical Analysis Functions

/**
 * Calculate RSI (Relative Strength Index)
 * RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // Neutral if not enough data
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate EMA (Exponential Moving Average)
 * EMA = (Close - Previous EMA) * multiplier + Previous EMA
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * MACD = EMA(12) - EMA(26)
 * Signal = EMA(9) of MACD
 */
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  
  // For signal, we'd need MACD history - simplified here
  const signal = macd * 0.9; // Approximation
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 * Middle = SMA(20)
 * Upper = Middle + (2 * StdDev)
 * Lower = Middle - (2 * StdDev)
 */
function calculateBollingerBands(prices: number[]): { upper: number; middle: number; lower: number } {
  const period = 20;
  const recentPrices = prices.slice(-period);
  
  const middle = recentPrices.reduce((a, b) => a + b, 0) / period;
  
  const squaredDiffs = recentPrices.map(p => Math.pow(p - middle, 2));
  const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
  
  return {
    upper: middle + (2 * stdDev),
    middle,
    lower: middle - (2 * stdDev),
  };
}

/**
 * Generate Trading Signal
 * Combines all indicators for a confidence score
 */
function generateSignal(prices: number[]): { action: 'BUY' | 'SELL' | 'HOLD'; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  // RSI Analysis
  const rsi = calculateRSI(prices);
  if (rsi < CONFIG.rsiOversold) {
    score += 30;
    reasons.push(`RSI oversold (${rsi.toFixed(1)}) - BUY signal`);
  } else if (rsi > CONFIG.rsiOverbought) {
    score -= 30;
    reasons.push(`RSI overbought (${rsi.toFixed(1)}) - SELL signal`);
  }
  
  // MACD Analysis
  const macd = calculateMACD(prices);
  if (macd.histogram > 0 && macd.macd > macd.signal) {
    score += 20;
    reasons.push('MACD bullish crossover - BUY signal');
  } else if (macd.histogram < 0 && macd.macd < macd.signal) {
    score -= 20;
    reasons.push('MACD bearish crossover - SELL signal');
  }
  
  // Bollinger Bands Analysis
  const bb = calculateBollingerBands(prices);
  const currentPrice = prices[prices.length - 1];
  
  if (currentPrice < bb.lower) {
    score += 25;
    reasons.push('Price below lower Bollinger Band - BUY signal');
  } else if (currentPrice > bb.upper) {
    score -= 25;
    reasons.push('Price above upper Bollinger Band - SELL signal');
  }
  
  // EMA Trend Analysis
  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  
  if (ema20 > ema50) {
    score += 15;
    reasons.push('EMA uptrend - BUY bias');
  } else {
    score -= 15;
    reasons.push('EMA downtrend - SELL bias');
  }
  
  // Determine action
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  
  if (score >= 50) action = 'BUY';
  else if (score <= -50) action = 'SELL';
  
  return {
    action,
    confidence: Math.abs(score),
    reasons,
  };
}

/**
 * Main Trading Bot Loop
 */
async function runTradingBot() {
  console.log('=== AUTONOMOUS TRADING BOT ===');
  console.log('Based on: Technical Analysis in Cryptocurrency Trading (Ratia 2023)');
  console.log('Strategies: RSI, MACD, Bollinger Bands, EMA');
  console.log('');
  
  // Simulated price history (in production, fetch from DEX APIs)
  const priceHistory: number[] = [];
  
  // Initial price data
  const initialPrices = [1800, 1810, 1805, 1820, 1815, 1830, 1825, 1840, 1835, 1850];
  priceHistory.push(...initialPrices);
  
  let tradeCount = 0;
  let totalProfit = 0;
  
  console.log('Starting trading loop...');
  console.log(`Check interval: ${CONFIG.checkIntervalMs / 1000}s`);
  console.log('');
  
  while (true) {
    try {
      // Get current price (simulated - would use DEX price in production)
      const currentPrice = priceHistory[priceHistory.length - 1] + (Math.random() - 0.5) * 10;
      priceHistory.push(currentPrice);
      
      // Keep only last 100 prices
      if (priceHistory.length > 100) priceHistory.shift();
      
      // Generate signal
      const signal = generateSignal(priceHistory);
      
      console.log(`[${new Date().toISOString()}]`);
      console.log(`Price: $${currentPrice.toFixed(2)}`);
      console.log(`Signal: ${signal.action} (confidence: ${signal.confidence}%)`);
      
      if (signal.action !== 'HOLD') {
        console.log('Reasons:');
        signal.reasons.forEach(r => console.log(`  - ${r}`));
        
        if (signal.action === 'BUY' && signal.confidence >= 50) {
          tradeCount++;
          console.log(`>>> EXECUTING BUY ORDER <<<`);
        } else if (signal.action === 'SELL' && signal.confidence >= 50) {
          tradeCount++;
          console.log(`>>> EXECUTING SELL ORDER <<<`);
        }
      }
      
      console.log(`Trades: ${tradeCount} | Est. Profit: $${totalProfit.toFixed(2)}`);
      console.log('---');
      
      // Wait for next check
      await new Promise(resolve => setTimeout(resolve, CONFIG.checkIntervalMs));
      
    } catch (error) {
      console.error('Error in trading loop:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Start the bot
runTradingBot().catch(console.error);
