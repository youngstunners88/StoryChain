---
name: agent-comm-tracker
description: Tracks all agent communications in real-time, showing who is speaking to whom and what is being said. Essential for orchestration efficiency.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
---

# Agent Communication Tracker

Real-time visibility into all agent communications for orchestration efficiency.

## Purpose

Know exactly who is speaking to whom and what is being said at all times.

## Agents Tracked

- **Zo** (GLM-5) - Main assistant (you)
- **Brand Agent** - SA style enforcer
- **Builder Agent** - Claude Code (Opus/Sonnet)
- **Quality Agent** - Glitch catcher
- **Nduna Bot** - Telegram bot
- **Marketing OpenClaw** - Marketing automation

## Commands

### `track`
Show recent communications.

```bash
bun scripts/tracker.ts track
```

### `listen`
Real-time monitoring mode.

```bash
bun scripts/tracker.ts listen
```

### `log <from> <to> <message>`
Log a new communication.

```bash
bun scripts/tracker.ts log "Brand Agent" "Builder Agent" "Guidelines transmitted"
```

### `clear`
Clear communication history.

```bash
bun scripts/tracker.ts clear
```

## Communication Types

- `instruction` - Direction from one agent to another
- `feedback` - Response or critique
- `approval` - Sign-off on work
- `error` - Problem notification

## Integration

This skill is automatically used by the ihhashi-orchestra skill to maintain visibility across all agent interactions.
