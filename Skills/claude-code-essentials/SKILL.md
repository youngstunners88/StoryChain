---
name: claude-code-essentials
description: Essential configuration and skills for Claude Code to run efficiently and communicate with other agents in the iHhashi ecosystem.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
---

# Claude Code Essentials

Everything Claude Code needs to run efficiently and communicate with the agent ecosystem.

## Setup

### 1. API Key Configuration
Set your Anthropic API key in Zo Settings > Advanced:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Model Selection

```bash
# Opus 4 (most capable)
claude --model opus -p "your task"

# Sonnet 4 (balanced)
claude --model sonnet -p "your task"

# Haiku (fastest)
claude --model haiku -p "your task"
```

### 3. Project Context

Claude Code automatically reads:
- `CLAUDE.md` - Project instructions
- `AGENTS.md` - Agent memory
- `.claude/` - Project settings

## Essential Skills for Claude Code

When Claude Code works on iHhashi, it should know about:

### 1. **ihhashi-orchestra**
Orchestrates Brand Agent → Builder Agent → Quality Agent flow.

### 2. **agent-comm-tracker**
Logs all communications for visibility.

### 3. **boober-strengthener**
Project knowledge vault (even though pivoted from Boober).

### 4. **zo-memory**
Persistent memory across sessions.

### 5. **bug-hunter**
For catching bugs during development.

## Communication Protocol

When Claude Code (Builder Agent) communicates:

```bash
# Log to Brand Agent
bun /home/workspace/Skills/agent-comm-tracker/scripts/tracker.ts log "Builder Agent" "Brand Agent" "Need brand guidelines for X"

# Log to Quality Agent
bun /home/workspace/Skills/agent-comm-tracker/scripts/tracker.ts log "Builder Agent" "Quality Agent" "Ready for review: feature X"
```

## Commands

### `run <task>`
Run Claude Code on a task with iHhashi context.

```bash
bun scripts/run.ts "Add Kota ordering feature"
```

### `with-brand <task>`
Run with brand guidelines injected.

```bash
bun scripts/run.ts --with-brand "Create merchant onboarding"
```

### `sync`
Sync Claude Code with latest project state.

```bash
bun scripts/run.ts --sync
```

## Best Practices

1. **Always use project context**: Run from `/home/workspace/ihhashi`
2. **Check AGENTS.md first**: Contains project memory
3. **Log communications**: Keep the tracker updated
4. **Follow SA brand guidelines**: From Brand Agent
5. **Run quality checks**: Before marking complete

## Environment Variables

```bash
ANTHROPIC_API_KEY     # Required for Claude Code
OPENROUTER_API_KEY    # Alternative provider
```

## Integration with Zo

Claude Code runs on Zo Computer and can:
- Read/write files in `/home/workspace`
- Run shell commands
- Access all skills in `/home/workspace/Skills`
- Communicate via the agent-comm-tracker
