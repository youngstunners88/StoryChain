---
name: token-discovery
description: Discover and analyze new tokens across multiple chains using DexScreener, GMGN, CoinGecko, Solscan, and BaseScan. Scout TradingView for successful patterns and follow profitable wallets.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
---

# Token Discovery Skill

## Overview
Comprehensive token discovery and analysis system that:
- Monitors new token launches
- Tracks successful trader wallets
- Analyzes TradingView patterns
- Provides real-time alerts

## Data Sources

### DexScreener
Real-time DEX data across chains.

```bash
bun scripts/discover.ts dexscreener --chain solana --min-liquidity 10000
```

### GMGN
Memecoin analytics and trending tokens.

```bash
bun scripts/discover.ts gmgn --top 20 --chain base
```

### CoinGecko
Market data and token information.

```bash
bun scripts/discover.ts coingecko --trending
bun scripts/discover.ts coingecko --token "bitcoin"
```

### Solscan
Solana blockchain explorer data.

```bash
bun scripts/discover.ts solscan --wallet "address"
bun scripts/discover.ts solscan --token "mint_address"
```

### BaseScan
Base chain explorer data.

```bash
bun scripts/discover.ts basescan --wallet "address"
bun scripts/discover.ts basescan --token "contract_address"
```

### TradingView
Scout for successful trading patterns.

```bash
bun scripts/discover.ts tradingview --symbol "SOLUSD" --pattern "breakout"
```

### Wallet Tracking
Follow successful wallets and copy-trade.

```bash
bun scripts/discover.ts track --wallet "address" --chain solana
bun scripts/discover.ts follow-traders --min-pnl 50 --days 30
```

## Commands

### `scan`
Multi-source token scanning.

```bash
bun scripts/discover.ts scan --all --min-liquidity 5000
```

### `analyze`
Deep analysis of a specific token.

```bash
bun scripts/discover.ts analyze --token "address" --chain solana
```

### `trending`
Get trending tokens across platforms.

```bash
bun scripts/discover.ts trending --platform all
```

### `alert`
Set up alerts for new opportunities.

```bash
bun scripts/discover.ts alert --type "new-launch" --chain solana
bun scripts/discover.ts alert --type "whale-buy" --min-amount 10000
```

## Scoring System

Tokens are scored on:
- **Liquidity**: Min $10k for consideration
- **Volume**: 24h volume trends
- **Holder Count**: Distribution health
- **Social Signals**: Twitter/Telegram activity
- **Smart Money**: Wallets buying in

## Output Format

```json
{
  "token": "address",
  "name": "Token Name",
  "chain": "solana",
  "score": 85,
  "liquidity": 50000,
  "volume24h": 125000,
  "holders": 1500,
  "signals": ["whale_buy", "trending"],
  "recommendation": "buy"
}
```

## Integration with Trading Bot

This skill feeds directly into the crypto-trading-bot skill:
1. Discover tokens
2. Analyze signals
3. Send to trading bot for execution

## API Keys Required
Configure in Settings > Advanced:
- `COINGECKO_API_KEY`
- `DEXSCREENER_API` (free tier available)
- `MORALIS_API_KEY` (for explorer data)
