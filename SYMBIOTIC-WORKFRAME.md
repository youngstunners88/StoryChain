# Symbiotic WorkFrame

The unified system for autonomous AI development and continuous improvement.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SYMBIOTIC WORKFRAME                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐         ┌─────────────────────┐           │
│  │   AGENT LIGHTNING   │         │      ANTFARM        │           │
│  │                     │         │                     │           │
│  │  RL Learning Loop   │◄───────►│  Knowledge Base     │           │
│  │                     │         │                     │           │
│  │  • Observe          │         │  • Recipes          │           │
│  │  • Act              │         │  • Templates        │           │
│  │  • Reward           │         │  • Workflows        │           │
│  │  • Learn            │         │  • Skills           │           │
│  │                     │         │                     │           │
│  └─────────┬───────────┘         └───────────┬─────────┘           │
│            │                                 │                     │
│            │         ┌───────────┐           │                     │
│            └────────►│  CLAUDE   │◄──────────┘                     │
│                      │   CODE    │                                 │
│                      │           │                                 │
│                      │ Autonomous│                                 │
│                      │ Execution │                                 │
│                      └─────┬─────┘                                 │
│                            │                                       │
│                            ▼                                       │
│                    ┌───────────────┐                               │
│                    │   PROJECTS    │                               │
│                    │               │                               │
│                    │ • iHhashi     │                               │
│                    │ • Conway      │                               │
│                    │ • Bankr       │                               │
│                    │ • TinyFish    │                               │
│                    │ • Zo          │                               │
│                    └───────────────┘                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Task Execution
```
User Request → Claude Code → Antfarm (get recipes) → Execute → Agent Lightning (learn)
```

### 2. Learning Loop
```
Observe → Act → Reward → Learn → Store in Memory → Feed to Antfarm
```

### 3. Knowledge Sync
```
Agent Lightning Patterns → Antfarm Recipes → Claude Code Context
```

## Components

### Agent Lightning
- **Location**: `/home/workspace/Skills/agent-lightning/`
- **Memory**: `/home/workspace/agent-lightning-memory/`
- **Purpose**: Reinforcement learning from every task
- **CLI**: `bun /home/workspace/Skills/agent-lightning/scripts/learn.ts`

### Antfarm
- **Location**: `/home/workspace/Skills/antfarm/`
- **Recipes**: `/home/workspace/Skills/antfarm/references/recipes/`
- **Templates**: `/home/workspace/Skills/antfarm/references/templates/`
- **Purpose**: Codified knowledge for rapid development
- **CLI**: `bun /home/workspace/Skills/antfarm/scripts/recipe.ts`

### Claude Code Integration
- Claude Code is the execution engine
- It queries Antfarm for patterns
- It reports outcomes to Agent Lightning
- Continuous improvement cycle

## Quick Start

```bash
# Apply a recipe to start a project
bun /home/workspace/Skills/antfarm/scripts/recipe.ts apply scaffold-next-app --target ./my-app

# Record a learning
bun /home/workspace/Skills/agent-lightning/scripts/learn.ts --observe "built API endpoint" --action "used Hono framework" --reward 0.9

# Sync patterns to create new recipes
bun /home/workspace/Skills/antfarm/scripts/sync.ts create-recipes

# Get suggestions based on past learnings
bun /home/workspace/Skills/agent-lightning/scripts/learn.ts --suggest "building REST API"
```

## The Team

### Active Agents
| Agent | Role | Status |
|-------|------|--------|
| ShieldGuard | Security & API Check | ✅ Active |
| OpportunityScout | App Ideas (8hr mission) | ✅ Starting |
| WealthWeaver | Trading System | ⏸️ Paused ($0 balance) |
| TokenScout | Crypto Monitoring | ⏸️ Paused |

### Skills Created
| Skill | Purpose |
|-------|---------|
| agent-lightning | RL learning loop |
| antfarm | Recipe/skills pack |

## Status

- ✅ Agent Lightning skill created
- ✅ Antfarm skill created
- ✅ Symbiotic WorkFrame defined
- ✅ Claude Code integration ready
- ✅ Opportunity Team agent deployed (8 hours)
- ⏸️ TokenScout paused
- ⏸️ WealthWeaver paused (no capital)

## Next Steps

1. Claude Code execution with Antfarm context
2. Team collaboration on active projects
3. Continuous learning from all tasks
4. Pattern extraction and recipe generation

---
*The Symbiotic WorkFrame: Learning, Knowledge, Execution - A Self-Improving AI Workforce*
