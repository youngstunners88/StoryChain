#!/usr/bin/env tsx
/**
 * Live Trading Bot - Autonomous Trading Engine
 * 
 * Runs continuous market analysis and executes trades based on:
 * - RSI (Relative Strength Index)
 * - MACD (Moving Average Convergence Divergence)
 * - Bollinger Bands
 * 
 * Risk Management:
 * - 2% max loss per trade
 * - 3% stop-loss
 * - 5% take-profit
 */

import { config } from 'dotenv';
config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xe3b770f13153f0a55a0c76588ca9ba02a26c820efce1ed16906ff8514ff2d29b';
const TRADING_PAIR = process.env.TRADING_PAIR || 'ETH/USDC';

interface Trade {
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  timestamp: Date;
  pnl?: number;
}

interface MarketData {
  price: number;
  rsi: number;
  macd: { signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
}

class AutonomousTrader {
  private balance: number = 0;
  private position: number = 0;
  private trades: Trade[] = [];
  private entryPrice: number = 0;
  
  constructor(initialBalance: number = 100) {
    this.balance = initialBalance;
  }

  async analyzeMarket(): Promise<MarketData> {
    // Simulate market data (in production, fetch from DEX/CEX API)
    const basePrice = 1800 + Math.random() * 200; // ETH price range
    const volatility = Math.random() * 50;
    
    return {
      price: basePrice,
      rsi: 30 + Math.random() * 40, // RSI between 30-70
      macd: {
        signal: Math.random() * 10 - 5,
        histogram: Math.random() * 5 - 2.5
      },
      bollinger: {
        upper: basePrice + volatility * 2,
        middle: basePrice,
        lower: basePrice - volatility * 2
      }
    };
  }

  generateSignal(market: MarketData): 'BUY' | 'SELL' | 'HOLD' {
    let buySignals = 0;
    let sellSignals = 0;

    // RSI Strategy
    if (market.rsi < 35) buySignals++;
    if (market.rsi > 65) sellSignals++;

    // MACD Strategy
    if (market.macd.histogram > 0 && market.macd.signal > 0) buySignals++;
    if (market.macd.histogram < 0 && market.macd.signal < 0) sellSignals++;

    // Bollinger Bands Strategy
    if (market.price < market.bollinger.lower) buySignals++;
    if (market.price > market.bollinger.upper) sellSignals++;

    if (buySignals >= 2) return 'BUY';
    if (sellSignals >= 2) return 'SELL';
    return 'HOLD';
  }

  async executeTrade(signal: 'BUY' | 'SELL', price: number): Promise<void> {
    const tradeAmount = this.balance * 0.1; // 10% of balance per trade

    if (signal === 'BUY' && this.position === 0) {
      // Open position
      this.position = tradeAmount / price;
      this.entryPrice = price;
      this.balance -= tradeAmount;
      
      const trade: Trade = {
        type: 'BUY',
        price,
        amount: this.position,
        timestamp: new Date()
      };
      this.trades.push(trade);
      
      console.log(`🟢 BUY: ${this.position.toFixed(6)} ETH @ $${price.toFixed(2)}`);
      console.log(`   Balance: $${this.balance.toFixed(2)} | Position: ${this.position.toFixed(6)} ETH`);
    } 
    else if (signal === 'SELL' && this.position > 0) {
      // Close position
      const sellValue = this.position * price;
      const pnl = ((price - this.entryPrice) / this.entryPrice) * 100;
      
      const trade: Trade = {
        type: 'SELL',
        price,
        amount: this.position,
        timestamp: new Date(),
        pnl
      };
      this.trades.push(trade);
      
      this.balance += sellValue;
      console.log(`🔴 SELL: ${this.position.toFixed(6)} ETH @ $${price.toFixed(2)}`);
      console.log(`   PnL: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}%`);
      console.log(`   Balance: $${this.balance.toFixed(2)}`);
      
      this.position = 0;
      this.entryPrice = 0;
    }
  }

  async checkStopLossTakeProfit(currentPrice: number): Promise<void> {
    if (this.position === 0) return;

    const pnlPercent = ((currentPrice - this.entryPrice) / this.entryPrice) * 100;

    // Stop Loss: -3%
    if (pnlPercent <= -3) {
      console.log(`⚠️ STOP LOSS TRIGGERED @ ${pnlPercent.toFixed(2)}%`);
      await this.executeTrade('SELL', currentPrice);
    }
    // Take Profit: +5%
    else if (pnlPercent >= 5) {
      console.log(`🎯 TAKE PROFIT TRIGGERED @ +${pnlPercent.toFixed(2)}%`);
      await this.executeTrade('SELL', currentPrice);
    }
  }

  async runTradingCycle(): Promise<void> {
    console.log('\n═══════════════════════════════════════');
    console.log(`⏰ ${new Date().toLocaleTimeString()} - Trading Cycle`);
    console.log('═══════════════════════════════════════');

    const market = await this.analyzeMarket();
    
    console.log(`📊 Market Data:`);
    console.log(`   Price: $${market.price.toFixed(2)}`);
    console.log(`   RSI: ${market.rsi.toFixed(1)}`);
    console.log(`   MACD Histogram: ${market.macd.histogram.toFixed(2)}`);
    console.log(`   BB: $${market.bollinger.lower.toFixed(2)} - $${market.bollinger.upper.toFixed(2)}`);

    // Check stop loss / take profit
    await this.checkStopLossTakeProfit(market.price);

    // Generate signal
    const signal = this.generateSignal(market);
    console.log(`\n🎯 Signal: ${signal}`);

    // Execute if HOLD and we have a signal
    if (signal !== 'HOLD') {
      await this.executeTrade(signal, market.price);
    }

    // Summary
    const totalPnL = this.balance - 100;
    console.log(`\n📈 Portfolio Summary:`);
    console.log(`   Balance: $${this.balance.toFixed(2)}`);
    console.log(`   Position: ${this.position.toFixed(6)} ETH`);
    console.log(`   Total PnL: ${totalPnL > 0 ? '+' : ''}$${totalPnL.toFixed(2)} (${((totalPnL/100)*100).toFixed(1)}%)`);
    console.log(`   Total Trades: ${this.trades.length}`);
  }

  async start(): Promise<void> {
    console.log('🤖 Autonomous Trading Bot Started');
    console.log(`💱 Trading Pair: ${TRADING_PAIR}`);
    console.log(`💰 Initial Balance: $${this.balance.toFixed(2)}`);
    console.log(`🔧 Risk Management:`);
    console.log(`   - Stop Loss: 3%`);
    console.log(`   - Take Profit: 5%`);
    console.log(`   - Position Size: 10% of balance`);
    console.log('═══════════════════════════════════════\n');

    // Run trading cycles
    for (let i = 0; i < 3; i++) {
      await this.runTradingCycle();
      if (i < 2) await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\n✅ Trading session complete. Ready for next cycle.');
  }
}

// Start autonomous trading
const trader = new AutonomousTrader(100);
trader.start().catch(console.error);
