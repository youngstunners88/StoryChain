---
name: ihhashi-orchestrator
description: Master orchestrator for the iHhashi agent team. Coordinates Brand Agent (SA style), Claude Code (builder), Quality Agent (glitch catcher), and agenticSeek (research). Ensures seamless communication and efficient workflow.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  project: iHhashi
  version: "1.0.0"
---

# iHhashi Orchestrator

The master conductor that coordinates all agents for efficient iHhashi development.

## Agent Team

```
                    ┌─────────────────┐
                    │       ZO        │
                    │  (Orchestrator) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  BRAND AGENT  │    │  CLAUDE CODE  │    │ QUALITY AGENT │
│  SA Style     │───▶│    Builder    │───▶│ Glitch Catch  │
└───────────────┘    └───────────────┘    └───────────────┘
        │                    │                    │
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│              AGENT COMMUNICATIONS HUB                   │
│         (Zo monitors all conversations here)            │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌───────────────┐
                    │  agenticSeek  │
                    │  Research &   │
                    │  Autonomy     │
                    └───────────────┘
```

## Workflow

### Standard Development Flow

1. **Brand Agent** → Reviews/enforces SA style
2. **Claude Code** → Receives guidelines, builds features
3. **Quality Agent** → Catches glitches, validates
4. **Zo** → Monitors, coordinates, reports to user

### All communications logged to Agent Communications Hub

## Commands

```bash
# Check orchestrator status
bun /home/workspace/Skills/ihhashi-orchestrator/scripts/status.ts

# Run orchestrated build
bun /home/workspace/Skills/ihhashi-orchestrator/scripts/build.ts --task "Add checkout page"

# Run all agents for a task
bun /home/workspace/Skills/ihhashi-orchestrator/scripts/coordinate.ts --task "Your task"

# View agent conversation history
bun /home/workspace/Skills/agent-communications/scripts/log.ts --status
```

## Agent Responsibilities

| Agent | Role | Triggers |
|-------|------|----------|
| **Zo** | Orchestrator | Always active |
| **Brand Agent** | SA style enforcement | Before/after content creation |
| **Claude Code** | Code building | When code needed |
| **Quality Agent** | QA & glitch detection | After code changes |
| **agenticSeek** | Research & autonomy | For web/coding tasks |
| **Nduna Bot** | Customer support | Telegram queries |

## Communication Protocol

All agents communicate through the Agent Communications Hub:

```typescript
// Log a message
bun /home/workspace/Skills/agent-communications/scripts/log.ts \
  --from "brand-agent" \
  --to "claude-code" \
  --type "instruction" \
  --content "Transform 'Loading...' to SA style"
```

## Quality Gates

1. **Pre-build**: Brand Agent checks style requirements
2. **During build**: Claude Code implements with SA guidelines
3. **Post-build**: Quality Agent runs all checks
4. **Final**: Zo reviews and reports

## Integration with Claude Code Opus

To use Claude Code with Opus:

1. Get API key from Anthropic
2. Set environment variable:
   ```bash
   export ANTHROPIC_API_KEY='sk-ant-...'
   ```
3. Run Claude Code:
   ```bash
   claude --model claude-opus-4-20250514
   ```

Available models:
- `claude-opus-4-20250514` - Opus 4 (most capable)
- `claude-sonnet-4-20250514` - Sonnet 4 (balanced)
- `claude-3-5-sonnet-20241022` - Sonnet 3.5 (fast)

## Files

```
/home/workspace/Skills/ihhashi-orchestrator/
├── SKILL.md
├── scripts/
│   ├── status.ts        # Check all agents
│   ├── build.ts         # Orchestrated build
│   └── coordinate.ts    # Coordinate agents
└── references/
    └── workflow.md      # Detailed workflow
```
