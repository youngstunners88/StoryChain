---
name: trading-bot
description: Autonomous cryptocurrency trading bot with technical analysis (RSI, MACD, Bollinger Bands, EMA). Supports Base chain DEX trading with configurable risk controls and profit targets.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: 1.0.0
allowed-tools: Bash Read
---

# Trading Bot Skill

Automated trading bot that executes cryptocurrency trades based on technical analysis indicators.

## Quick Start

```bash
bun scripts/trading-bot.ts --help
```

## Configuration

Edit `config.json` to adjust:

### Risk Controls
- `minProfitPercent`: Minimum profit target (default: 1.5%)
- `maxLossPercent`: Maximum loss tolerance (default: 2%)
- `positionSizePercent`: Port of portfolio per trade (default: 5%)

### Technical Indicators
- `rsiPeriod`: RSI calculation period (default: 14)
- `rsiOversold`: RSI oversold threshold (default: 30)
- `rsiOverbought`: RSI overbought threshold (default: 70)
- `emaFast`: Fast EMA period (default: 12)
- `emaSlow`: Slow EMA period (default: 26)
- `bollingerPeriod`: Bollinger Bands period (default: 20)
- `bollingerStdDev`: Bollinger standard deviations (default: 2)

### Trading Pairs
- `tradingPairs`: Array of pairs to monitor (default: ['ETH/USDC'])
- `checkIntervalMs`: Price check interval in ms (default: 60000)

## Strategies

### 1. RSI (Relative Strength Index)
- BUY when RSI < 30 (oversold)
- SELL when RSI > 70 (overbought)

### 2. MACD (Moving Average Convergence Divergence)
- BUY on bullish crossover (MACD > Signal)
- SELL on bearish crossover (MACD < Signal)

### 3. Bollinger Bands
- BUY when price < lower band
- SELL when price > upper band

### 4. EMA Trend
- BUY when EMA(20) > EMA(50)
- SELL when EMA(20) < EMA(50)

## Signal Confidence

The bot combines all indicators to generate a confidence score:
- Score >= 50: Strong BUY signal
- Score <= -50: Strong SELL signal
- Otherwise: HOLD

## Risk Management

- Never risk more than `maxLossPercent` per trade
- Position sizing based on `positionSizePercent`
- Automatic stop-loss at `maxLossPercent` below entry
- Take-profit at `minProfitPercent` above entry

## Production Setup

For live trading on Base chain:

1. Set environment variable: `PRIVATE_KEY=your_wallet_private_key`
2. Ensure wallet has USDC for trading
3. Run: `bun scripts/trading-bot.ts --live`

## Logs

Trading activity is logged to:
- `/dev/shm/trading-bot.log` - Main activity log
- `trades.jsonl` - Trade history in the skill directory

## Safety

- NEVER share your private key
- Start with small amounts
- Monitor the bot for the first few hours
- Use `--dry-run` mode to test without real trades
