/**
 * AUTONOMOUS TRADING ENGINE v3.0
 * With debug output and optimized signal thresholds
 */

class OptimizedTrader {
  private prices: number[] = [];
  private position = 0;
  private entryPrice = 0;
  private stopLoss = 0;
  private takeProfit = 0;
  private totalProfit = 0;
  private trades = 0;
  private wins = 0;
  private losses = 0;

  constructor() {
    console.log('🤖 Optimized Trading Engine initialized');
    console.log('📊 Strategy: Multi-Indicator with lower threshold');
    console.log('💰 Risk: 2% position, 3% SL, 5% TP');
  }

  // Calculate RSI
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    if (losses === 0) return 100;
    return 100 - (100 / (1 + gains / losses));
  }

  // Calculate EMA
  calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  // Generate signal
  generateSignal(price: number): { type: 'BUY' | 'SELL' | 'HOLD'; confidence: number; debug: string } {
    const rsi = this.calculateRSI(this.prices);
    const ema9 = this.calculateEMA(this.prices, 9);
    const ema21 = this.calculateEMA(this.prices, 21);
    
    let score = 0;
    const reasons: string[] = [];

    // RSI - more aggressive thresholds
    if (rsi < 35) { score += 1.5; reasons.push(`RSI oversold (${rsi.toFixed(1)})`); }
    else if (rsi < 45) { score += 0.5; reasons.push(`RSI low (${rsi.toFixed(1)})`); }
    else if (rsi > 65) { score -= 1.5; reasons.push(`RSI overbought (${rsi.toFixed(1)})`); }
    else if (rsi > 55) { score -= 0.5; reasons.push(`RSI high (${rsi.toFixed(1)})`); }

    // EMA crossover
    const emaDiff = (ema9 - ema21) / ema21 * 100;
    if (emaDiff > 0.1) { score += 1.5; reasons.push(`EMA bullish (${emaDiff.toFixed(2)}%)`); }
    else if (emaDiff < -0.1) { score -= 1.5; reasons.push(`EMA bearish (${emaDiff.toFixed(2)}%)`); }

    // Price momentum
    if (this.prices.length > 5) {
      const momentum = (price - this.prices[this.prices.length - 5]) / this.prices[this.prices.length - 5] * 100;
      if (momentum < -1) { score += 0.5; reasons.push(`Dip (${momentum.toFixed(2)}%)`); }
      else if (momentum > 1) { score -= 0.5; reasons.push(`Pump (${momentum.toFixed(2)}%)`); }
    }

    let type: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (score >= 1.5) type = 'BUY';
    else if (score <= -1.5) type = 'SELL';

    return { 
      type, 
      confidence: Math.min(Math.abs(score) / 3, 1), 
      debug: reasons.join(', ') 
    };
  }

  async simulate(prices: number[]) {
    console.log('\n📈 Running optimized backtest...');
    console.log('═'.repeat(60));
    
    this.prices = prices.slice(0, 30);
    
    for (let i = 30; i < prices.length; i++) {
      const price = prices[i];
      this.prices.push(price);
      if (this.prices.length > 100) this.prices.shift();

      // Check stop-loss / take-profit first
      if (this.position > 0) {
        const pnl = (price - this.entryPrice) / this.entryPrice;
        
        if (price <= this.stopLoss) {
          this.totalProfit += pnl * 100;
          this.losses++;
          console.log(`\n⚠️ STOP-LOSS @ $${price.toFixed(2)} | P&L: ${(pnl * 100).toFixed(2)}%`);
          this.position = 0;
          continue;
        }
        
        if (price >= this.takeProfit) {
          this.totalProfit += pnl * 100;
          this.wins++;
          console.log(`\n🎯 TAKE-PROFIT @ $${price.toFixed(2)} | P&L: ${(pnl * 100).toFixed(2)}%`);
          this.position = 0;
          continue;
        }
      }

      // Generate new signal
      const signal = this.generateSignal(price);
      
      // Execute trades
      if (signal.type === 'BUY' && this.position === 0) {
        this.position = 1;
        this.entryPrice = price;
        this.stopLoss = price * 0.97;
        this.takeProfit = price * 1.05;
        this.trades++;
        
        console.log(`\n🟢 BUY @ $${price.toFixed(2)} | ${signal.debug}`);
        console.log(`   SL: $${this.stopLoss.toFixed(2)} | TP: $${this.takeProfit.toFixed(2)}`);
        
      } else if (signal.type === 'SELL' && this.position > 0) {
        const pnl = (price - this.entryPrice) / this.entryPrice;
        this.totalProfit += pnl * 100;
        
        if (pnl > 0) this.wins++;
        else this.losses++;
        
        console.log(`\n🔴 SELL @ $${price.toFixed(2)} | P&L: ${(pnl * 100).toFixed(2)}%`);
        this.position = 0;
      }
    }

    // Close any remaining position
    if (this.position > 0) {
      const finalPrice = prices[prices.length - 1];
      const pnl = (finalPrice - this.entryPrice) / this.entryPrice;
      this.totalProfit += pnl * 100;
      if (pnl > 0) this.wins++;
      else this.losses++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 FINAL RESULTS');
    console.log('═'.repeat(60));
    console.log(`   Total Trades: ${this.trades}`);
    console.log(`   Wins: ${this.wins} | Losses: ${this.losses}`);
    console.log(`   Win Rate: ${this.trades > 0 ? ((this.wins / this.trades) * 100).toFixed(1) : 0}%`);
    console.log(`   Total Profit: ${this.totalProfit.toFixed(2)}%`);
    console.log('═'.repeat(60));

    return { trades: this.trades, profit: this.totalProfit, wins: this.wins, losses: this.losses };
  }
}

// Run backtest
async function main() {
  const trader = new OptimizedTrader();
  
  // Generate realistic price data
  const prices: number[] = [];
  let price = 1800;
  
  for (let i = 0; i < 500; i++) {
    const cycle = Math.sin(i / 50) * 100;
    const trend = Math.sin(i / 100) * 30;
    const volatility = (Math.random() - 0.5) * 30;
    const spike = Math.random() < 0.1 ? (Math.random() - 0.5) * 80 : 0;
    
    price = Math.max(1500, Math.min(2500, 1800 + cycle + trend + volatility + spike));
    prices.push(price);
  }
  
  await trader.simulate(prices);
}

main();
