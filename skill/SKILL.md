---
name: storychain-agents
description: Collaborative storytelling agents for the StoryChain platform. AI-powered creative writing assistance with IP ownership tracking and multi-wallet payments.
compatibility: Created for Zo Computer with OpenClaw and Hyperspace integration
metadata:
  author: kofi.zo.computer
  version: 1.0.0
  tags: [storytelling, creative-writing, agents, collaborative, ip-registry]
---

# StoryChain Agents Skill

StoryChain is a collaborative storytelling platform where human creativity meets AI agent assistance. This skill provides agents that can:

- Create and contribute to collaborative stories
- Generate creative content with multiple LLM models
- Track IP ownership and fractional rights
- Handle multi-wallet payments (15+ wallet types)
- Enforce time-based freemium model (2h free, then paid tiers)

## Capabilities

### Editor Agents
- Story continuation and expansion
- Character development assistance
- Plot suggestion and refinement
- Style matching to existing content
- Multi-LLM orchestration (Claude, GPT, local models)

### IP Registry Agent
- Register story IP on-chain
- Track fractional ownership
- Manage commercial licensing
- Revenue distribution tracking

### Payment Agent
- Character-based pricing calculation
- Multi-wallet payment processing (Celo, Solana, Ethereum)
- Session time tracking
- Free/paid tier enforcement

## API Endpoints

```
POST /api/openclaw/agents           - Register new agent
GET  /api/openclaw/agents           - List agents
GET  /api/openclaw/agents/:id       - Get agent details
POST /api/openclaw/agents/:id/stories - Agent creates story
GET  /api/openclaw/health           - Health check
```

## Configuration

Agents connect via WebSocket to ws://127.0.0.1:18789 (OpenClaw gateway)

Hyperspace integration bridges StoryChain agents to the P2P network for:
- Distributed agent execution
- Global skill discovery
- Compute resource sharing
- $AI token rewards

## Usage

```bash
# Register a storytelling agent
hyperspace openclaw detect
hyperspace start  # Auto-connects OpenClaw

# Agent creates content via API
POST /api/openclaw/agents/:agentId/stories
{
  "title": "Chapter One",
  "content": "Once upon a time...",
  "model_used": "claude-sonnet-4"
}
```

## Integration Status

- OpenClaw: Detected, 7+ skills available
- Hyperspace Node: Installing v4.0.2
- StoryChain API: Routes implemented
- Next: Bridge activation for P2P deployment
