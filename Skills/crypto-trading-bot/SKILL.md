---
name: crypto-trading-bot
description: Autonomous crypto trading bot with memecoin detection, copy trading, arbitrage, and cross-chain capabilities. Integrates with Clawrouter for routing and Antfarm for multi-agent coordination.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
---

# Crypto Trading Bot Skill

## Overview
A production-ready trading bot that executes:
- Memecoin trading (Pump.fun, etc.)
- Copy trading from successful wallets
- Cross-chain arbitrage
- MEV-protected transactions

## Wallets
- **Solana**: `An3Ng8J9iaUzhmRb8vDUegAJ9aSh7DndoLmho2bqrb2u`
- **BNB/Base/Polygon**: `0x141f7D9a6Ab4221F36E21673b43FA751Af37E7eB`

## Commands

### `start`
Start the trading bot with specified strategy.

```bash
bun scripts/trader.ts start --strategy memecoin --chain solana
```

### `stop`
Stop all active trading operations.

```bash
bun scripts/trader.ts stop
```

### `copy-trade <wallet>`
Enable copy trading from a specific wallet.

```bash
bun scripts/trader.ts copy-trade --wallet "wallet_address" --max-amount 5
```

### `snipe <token>`
Snipe a specific token launch.

```bash
bun scripts/trader.ts snipe --token "token_address" --amount 2
```

### `scan <platform>`
Scan for new token launches.

```bash
bun scripts/trader.ts scan --platform pump.fun
bun scripts/trader.ts scan --platform dexscreener
bun scripts/trader.ts scan --platform gmgn
```

### `analyze <token>`
Analyze a token for trading signals.

```bash
bun scripts/trader.ts analyze --token "token_address"
```

## Strategies

### Memecoin Strategy
- Monitor Pump.fun launches
- Early detection via social signals
- Quick entry/exit with take-profit

### Copy Trading Strategy
- Follow successful wallets
- Automatic trade replication
- Position sizing based on confidence

### Arbitrage Strategy
- Cross-chain price differences
- DEX arbitrage opportunities
- MEV protection via Clawrouter

## Integration Points

### Clawrouter
- Route optimization
- MEV protection
- Slippage control

### Antfarm
- Multi-agent coordination
- Distributed decision making
- Consensus on trades

### Token Discovery
- DexScreener integration
- GMGN analytics
- Solscan/BaseScan monitoring

## Risk Management

- Max position size: Configurable per trade
- Stop-loss: Automatic 15% trailing
- Take-profit: 2x-5x based on momentum
- Max daily loss: 10% of portfolio

## API Keys
Stored securely in Zo secrets:
- `GROQ_API_KEY` - AI analysis
- `COINGECKO_API_KEY` - Price data
- `DEXSCREENER_API` - Token data
- `MORALIS_API_KEY` - Blockchain data
