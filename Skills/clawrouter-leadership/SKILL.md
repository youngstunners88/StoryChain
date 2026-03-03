---
name: clawrouter-leadership
description: Command and orchestrate Clawrouter and Antfarm agents for decentralized trading operations. Provides leadership over autonomous trading bots, delegate management, and credit allocation.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
  wallets:
    solana: "An3Ng8J9iaUzhmRb8vDUegAJ9aSh7DndoLmho2bqrb2u"
    bnb: "0x141f7D9a6Ab4221F36E21673b43FA751Af37E7eB"
    base: "Same as BNB (EVM compatible)"
    polygon: "Same as BNB (EVM compatible)"
---

# Clawrouter Leadership Skill

## Overview
This skill provides command authority over Clawrouter and Antfarm agents, enabling:
- Autonomous trading bot orchestration
- Delegate credit management
- Cross-chain routing decisions
- Agent coordination and task delegation

## Wallet Addresses
- **Solana**: `An3Ng8J9iaUzhmRb8vDUegAJ9aSh7DndoLmho2bqrb2u`
- **BNB Chain**: `0x141f7D9a6Ab4221F36E21673b43FA751Af37E7eB`
- **Base**: Same EVM address as BNB
- **Polygon**: Same EVM address as BNB

## Commands

### `status`
Check the status of all active agents and their current operations.

```bash
bun scripts/leadership.ts status
```

### `delegate <action>`
Manage delegate credits and permissions.

```bash
bun scripts/leadership.ts delegate --credits 1000 --agent trading-bot
```

### `route <source> <dest>`
Execute cross-chain routing decisions.

```bash
bun scripts/leadership.ts route --from solana --to base --amount 10
```

### `scout <target>`
Deploy opportunity scouts to identify trading opportunities.

```bash
bun scripts/leadership.ts scout --target tradingview
bun scripts/leadership.ts scout --target wallets --addresses "wallet1,wallet2"
```

### `orchestrate`
Run the full orchestration cycle across all agents.

```bash
bun scripts/leadership.ts orchestrate
```

## Agent Hierarchy

1. **Leadership Layer** (This Skill)
   - Strategic decisions
   - Credit allocation
   - Risk parameters

2. **Clawrouter Agent**
   - Cross-chain routing
   - MEV protection
   - Slippage optimization

3. **Antfarm Agent**
   - Multi-agent coordination
   - Task distribution
   - Consensus mechanisms

4. **Trading Bot Agents**
   - Execution layer
   - Market making
   - Arbitrage detection

## API Keys
Stored securely in Zo secrets. Access via:
- `GROQ_API_KEY` - Groq LLM inference
- `OPENAI_API_KEY` - OpenAI models
- `GOOGLE_API_KEY` - Google services

## Usage Examples

### Deploy scouts to TradingView
```
Use this skill to scout TradingView for successful trading patterns.
```

### Follow successful wallets
```
Use this skill to track and copy-trade from identified successful wallets.
```

### Allocate delegate credits
```
Use this skill to distribute credits among trading agents.
```
