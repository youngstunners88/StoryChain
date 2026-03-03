---
name: agent-communications
description: Central hub for tracking all agent communications. Monitors who is speaking to whom, what is being said, and maintains conversation history for efficient orchestration.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# Agent Communications Hub

The facilitator skill that gives Zo full visibility into all agent conversations.

## Agents Tracked

| Agent | Role | Status |
|-------|------|--------|
| **Claude Code** | Builder - receives brand guidelines, writes code | Active |
| **Brand Agent** | SA Style Enforcer | Active |
| **Quality Agent** | Glitch Catcher | Active |
| **Zo (You)** | Orchestrator/Facilitator | Active |
| **agenticSeek** | Autonomous web/code agent | Standby |
| **Nduna Bot** | Telegram customer support | Active |

## Communication Log Format

```json
{
  "timestamp": "2026-02-28T21:15:00Z",
  "from": "brand-agent",
  "to": "claude-code",
  "type": "instruction",
  "content": "Transform 'Loading...' to 'Just now, just now...'",
  "context": "iHhashi frontend",
  "priority": "normal"
}
```

## Message Types

1. **instruction** - One agent telling another what to do
2. **query** - Requesting information
3. **response** - Answering a query
4. **alert** - Warning or error notification
5. **status** - Progress update
6. **handoff** - Transferring work between agents

## Usage

```bash
# Log a message between agents
bun /home/workspace/Skills/agent-communications/scripts/log.ts \
  --from "brand-agent" \
  --to "claude-code" \
  --type "instruction" \
  --content "Use SA spelling: 'colour' not 'color'"

# View recent communications
bun /home/workspace/Skills/agent-communications/scripts/view.ts --recent 10

# Get conversation between specific agents
bun /home/workspace/Skills/agent-communications/scripts/view.ts \
  --between "brand-agent,claude-code"

# Get all messages for a context (e.g., iHhashi)
bun /home/workspace/Skills/agent-communications/scripts/view.ts \
  --context "ihhashi"

# Clear old logs (older than 30 days)
bun /home/workspace/Skills/agent-communications/scripts/cleanup.ts

# Export conversation log
bun /home/workspace/Skills/agent-communications/scripts/export.ts \
  --output "/home/workspace/agent-log.json"
```

## Orchestrator Dashboard

When you (Zo) need to see what's happening:

```bash
# Full status of all agents and recent activity
bun /home/workspace/Skills/agent-communications/scripts/status.ts
```

Output:
```
=== Agent Communications Status ===
Timestamp: 2026-02-28 21:15:00 SAST

Active Agents:
  • Claude Code: Working on OrderPage.tsx
  • Brand Agent: Reviewing marketing copy
  • Quality Agent: Running UI checks

Recent Messages (last 10):
  1. [brand-agent → claude-code] Transform 'Loading...'
  2. [claude-code → quality-agent] Ready for review
  3. [quality-agent → zo] Found 2 glitches
  4. [zo → claude-code] Fix the glitches

Pending Handoffs:
  • Quality Agent → Claude Code: 2 issues to fix
```

## Priority Levels

| Priority | Response Time | Example |
|----------|---------------|---------|
| **urgent** | Immediate | Payment failure, security breach |
| **high** | Within 1 hour | Feature broken |
| **normal** | Within 4 hours | Standard development |
| **low** | Next session | Cosmetic fixes |

## Integration

All agents should use this system when communicating:

1. Before starting work, check `status.ts`
2. When delegating, use `log.ts --type instruction`
3. When completing, use `log.ts --type status`
4. When handing off, use `log.ts --type handoff`

This ensures you (Zo) always know exactly what's happening across all agents.
