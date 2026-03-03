---
name: token-scout
description: AI-powered token scouting and scam detection system. Discovers new tokens across chains, analyzes for rug pull indicators, detects pump-and-dump schemes, and provides real-time safety alerts. Integrates with trading bots for safe execution.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
---

# TokenScout Skill

## Overview

TokenScout is an AI-powered token scouting and scam detection system that helps identify:
- **New token launches** before they go mainstream
- **Rug pull indicators** (liquidity removal, honeypots, fake volume)
- **Pump-and-dump schemes** (coordinated buying/selling patterns)
- **Safe opportunities** with genuine liquidity and organic volume

## Data Sources

### DexScreener
Real-time DEX analytics and token tracking.

```bash
bun scripts/token-scout.ts dexscreener --chain solana --pairs 50
bun scripts/token-scout.ts dexscreener --pair-address "address"
```

### GMGN AI
Smart money tracking and whale wallet detection.

```bash
bun scripts/token-scout.ts gmgn --chain base --top-wallets
bun scripts/token-scout.ts gmgn --token "address" --analysis
```

### DexView
DEX pair rankings and trending pairs.

```bash
bun scripts/token-scout.ts dexview --chain ethereum --new-pairs
bun scripts/token-scout.ts dexview --chain arbitrum --trending
```

### Token Sniffer
Automated token security audits and scam detection.

```bash
bun scripts/token-scout.ts tokensniffer --token "address"
bun scripts/token-scout.ts tokensniffer --scan-recent --chain solana
```

### RugCheck
Rug pull detection and risk scoring.

```bash
bun scripts/token-scout.ts rugcheck --token "address"
bun scripts/token-scout.ts rugcheck --batch "file.csv"
```

### Bubblemaps
Token holder distribution analysis.

```bash
bun scripts/token-scout.ts bubblemaps --token "address"
bun scripts/token-scout.ts bubblemaps --visualize
```

## Commands

### `discover`
Scan for new token opportunities across chains.

```bash
# Discover new tokens on Solana
bun scripts/token-scout.ts discover --chain solana --min-liquidity 10000

# Multi-chain discovery
bun scripts/token-scout.ts discover --chain all --min-liquidity 5000

# Fresh launches only (last 24h)
bun scripts/token-scout.ts discover --chain base --fresh --hours 24
```

### `scan`
Comprehensive security scan of a token.

```bash
# Full scan of a token
bun scripts/token-scout.ts scan --token "token_address" --chain solana

# Quick scan (faster, less detailed)
bun scripts/token-scout.ts scan --token "address" --quick

# Batch scan from file
bun scripts/token-scout.ts scan --file "tokens.csv"
```

### `analyze`
Deep analysis of token metrics and risks.

```bash
# Analyze token health
bun scripts/token-scout.ts analyze --token "address" --chain ethereum

# Compare multiple tokens
bun scripts/token-scout.ts analyze --compare "addr1,addr2,addr3"

# Volume analysis
bun scripts/token-scout.ts analyze --token "address" --volume-patterns
```

### `track`
Monitor specific tokens or wallets.

```bash
# Track a token for changes
bun scripts/token-scout.ts track --token "address" --alerts

# Track whale wallet
bun scripts/token-scout.ts track --wallet "address" --chain base

# Portfolio monitoring
bun scripts/token-scout.ts track --portfolio
```

### `alert`
Set up notifications for opportunities.

```bash
# New pair alert
bun scripts/token-scout.ts alert --type new-pair --chain solana

# Whale movement alert
bun scripts/token-scout.ts alert --type whale-buy --min-value 10000

# Safety alert (rug pull detected)
bun scripts/token-scout.ts alert --type rug-pull --notify telegram
```

### `report`
Generate comprehensive token reports.

```bash
# Generate safety report
bun scripts/token-scout.ts report --token "address" --format markdown

# Generate opportunity report
bun scripts/token-scout.ts report --type opportunities --chain base
```

## Scam Detection Features

### Rug Pull Indicators

| Indicator | Weight | Description |
|-----------|--------|-------------|
| Liquidity Pulled | Critical | >50% liquidity removed in 24h |
| Honeypot | Critical | Cannot sell, only buy |
| Fake Volume | High | Wash trading detected |
| Mint Authority | High | Owner can mint unlimited tokens |
| Freeze Authority | High | Owner can freeze assets |
| Top Holders >80% | High | Centralized ownership |
| No Contract Audit | Medium | Unverified contract code |
| New Domain | Medium | Recently created social links |

### Pump-and-Dump Detection

- **Volume Spikes**: Abnormal volume increases (>500%)
- **Concentrated Buying**: Single wallet buying >20% of volume
- **Social Coordination**: Sudden social media push
- **Price Manipulation**: Rapid price increase then dump

### Safety Score

Tokens are scored 0-100:

| Score | Risk Level | Action |
|-------|------------|--------|
| 80-100 | 🟢 Safe | Green light for trading |
| 60-79 | 🟡 Moderate | Caution, verify manually |
| 40-59 | 🟠 High Risk | Avoid or small positions |
| 0-39 | 🔴 Dangerous | DO NOT TRADE |

## Output Format

### Token Report JSON

```json
{
  "token": "EpXw1...8mK9",
  "name": "Example Token",
  "symbol": "EXM",
  "chain": "solana",
  "safety_score": 85,
  "risk_level": "safe",
  "liquidity": 125000,
  "volume24h": 450000,
  "holders": 2340,
  "price": 0.000234,
  "change24h": 12.5,
  "rug_indicators": [],
  "signals": ["whale_buy", "organic_volume", "verified_contract"],
  "recommendation": "buy",
  "position_size": "medium",
  "timestamp": "2026-02-27T04:50:00Z"
}
```

### Discovery Results

```json
{
  "opportunities": [
    {
      "token": "addr...",
      "name": "Token",
      "chain": "base",
      "safety_score": 78,
      "liquidity": 85000,
      "volume24h": 320000,
      "momentum": "rising",
      "whale_activity": true
    }
  ],
  "scanned": 150,
  "safe": 12,
  "risky": 45,
  "dangerous": 93,
  "timestamp": "2026-02-27T04:50:00Z"
}
```

## Integration with Trading Bot

TokenScout feeds directly into trading-bot:

1. **Discover** → Find new opportunities
2. **Scan** → Verify safety (score >60)
3. **Analyze** → Determine position size
4. **Execute** → Send to trading bot

```bash
# Scout and auto-execute safe opportunities
bun scripts/token-scout.ts scout --auto-trade --min-score 75 --max-position 100
```

## API Keys Required

Configure in [Settings > Advanced](/?t=settings&s=advanced):

- `DEXSCREENER_API` - Free tier available
- `COINGECKO_API_KEY` - Free tier available
- `BUBBLEMAPS_API_KEY` - For holder analysis
- `TELEGRAM_BOT_TOKEN` - For alerts

## Best Practices

1. **Always verify** the safety score before trading
2. **Check rug indicators** manually for scores 60-79
3. **Start small** on new tokens (max 1% portfolio)
4. **Set stop losses** - never ape in without protection
5. **Monitor alerts** for sudden changes