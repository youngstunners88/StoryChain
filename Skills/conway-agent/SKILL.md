---
name: conway-agent
description: Interact with Conway Research autonomous AI agent ecosystem on Base. Monitor $CONWAY token, interact with Conway Terminal, and generate reports from Conway infrastructure. Use when the user wants to interact with Conway agents, check $CONWAY token status, or get daily reports from the Conway ecosystem.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
  token_contract: "0x86cdd90bc48f7b5a866feaaf5023b8802dc2ab07"
  network: "Base"
---

# Conway Agent Skill

## Overview
This skill provides interaction with the Conway Research ecosystem on Base:
- Monitor $CONWAY token price and market data
- Interact with Conway Terminal infrastructure
- Generate daily reports from Conway ecosystem
- Track Conway agent activities

## Token Information
- **Token**: $CONWAY (ConwayResearch)
- **Contract**: `0x86cdd90bc48f7b5a866feaaf5023b8802dc2ab07`
- **Network**: Base (Layer 2)
- **Purpose**: Autonomous AI agent infrastructure

## Commands

### `report`
Generate a comprehensive status report on Conway ecosystem.

```bash
bun scripts/conway.ts report
```

### `price`
Get current $CONWAY token price and market data.

```bash
bun scripts/conway.ts price
```

### `wallet <address>`
Check if a wallet holds $CONWAY tokens.

```bash
bun scripts/conway.ts wallet 0x...
```

### `interact <prompt>`
Send a prompt to Bankr about Conway ecosystem.

```bash
bun scripts/conway.ts interact "What is the Conway agent doing today?"
```

## Conway Infrastructure

### Conway Terminal
- MCP server for agent-infrastructure interaction
- Creates and manages autonomous AI agents
- Handles identity and wallet generation

### x402 Protocol
- Autonomous on-chain payment system
- USDC-based on Base network
- Machine-to-machine payments

### Conway Trust Protocol
- Verifiable agent identities
- On-chain reputation system

## Daily Reports
This skill supports generating 2 daily reports:
1. **Morning Report (09:00 SAST)**: Token price, market summary, overnight changes
2. **Evening Report (21:00 SAST)**: Daily activity summary, price movements, opportunities

## Usage Examples

### Get token report
```
Use this skill to get a Conway ecosystem report.
```

### Check price
```
Use this skill to check $CONWAY price.
```

### Interact with Conway via Bankr
```
Use this skill to ask Conway about its current activities.
```

## API Integration
Uses Bankr CLI for natural language interaction with Conway ecosystem:
- `bankr prompt "What is $CONWAY price?"`
- `bankr prompt "Show me Conway ecosystem news"`
- `bankr prompt "Check Conway token holders"`

## Configuration
Ensure Bankr is logged in:
```bash
bankr whoami
```
