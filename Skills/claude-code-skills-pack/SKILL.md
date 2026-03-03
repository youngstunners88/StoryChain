---
name: claude-code-skills-pack
description: Complete skills pack for Claude Code with Antfarm multi-agent integration and Agent Lightning learning loops. Use when setting up Claude Code for autonomous development, creating self-improving agent teams, or building the symbiotic WorkFrame.
---

# Claude Code Skills Pack

Complete skills pack integrating Claude Code with Antfarm workflows and Agent Lightning learning.

## What This Pack Includes

1. **Antfarm Integration** - Multi-agent workflow orchestration
2. **Agent Lightning Integration** - RL-based learning from outcomes
3. **Symbiotic WorkFrame** - Self-improving development cycle

## Installation

```bash
# Ensure Antfarm is installed
cd /home/workspace/antfarm && npm install && npm run build && npm link

# Initialize Agent Lightning
cd /home/workspace/autonomous-revenue && python3 agent_lightning_integration.py

# Verify installation
antfarm workflow list
python3 -c "from agent_lightning_integration import get_total_rewards; print(f'Total rewards: {get_total_rewards()}')"
```

## Available Workflows

### feature-dev (7 agents)
```
plan → setup → implement → verify → test → PR → review
```

### security-audit (7 agents)
```
scan → prioritize → setup → fix → verify → test → PR
```

### bug-fix (6 agents)
```
triage → investigate → setup → fix → verify → PR
```

## Quick Commands

### Start a Feature
```bash
antfarm workflow run feature-dev "Add user authentication with OAuth"
```

### Fix a Bug
```bash
antfarm workflow run bug-fix "Users cannot login with correct password"
```

### Security Audit
```bash
antfarm workflow run security-audit "Scan for vulnerabilities in /home/workspace/my-app"
```

### Check Status
```bash
antfarm workflow status "authentication"
antfarm workflow runs
```

### View Dashboard
```bash
antfarm dashboard
```

## Agent Lightning Integration

### Emit Rewards from Code
```python
from agent_lightning_integration import (
    emit_trade_reward,
    emit_outreach_reward,
    emit_deal_closed,
    AutonomousAgentRunner
)

# Create custom agent runner
dev_runner = AutonomousAgentRunner("developer_agent")

# Record outcomes
dev_runner.record_success(100.0, {
    "task": "feature_complete",
    "workflow": "feature-dev",
    "story": "user-auth"
})

dev_runner.record_failure(25.0, {
    "task": "test_failed",
    "reason": "integration_test_timeout"
})
```

### Reward Values Reference

| Action | Reward | Notes |
|--------|--------|-------|
| Feature complete | +100 | Fully implemented and verified |
| Test passed | +25 | All tests green |
| Code review approved | +50 | Peer approved |
| Bug introduced | -50 | Regression found |
| Test failed | -25 | Tests red |
| Review rejected | -30 | Needs rework |

## Symbiotic WorkFrame

The symbiotic WorkFrame is the integration pattern:

```
┌────────────────────────────────────────────────────────────────┐
│                    SYMBIOTIC WORKFRAME                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  CLAUDE CODE │───►│   ANTFARM    │───►│    AGENT     │     │
│  │   (Driver)   │    │ (Orchestr.)  │    │  LIGHTNING   │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                   │                    │             │
│         │    ┌──────────────┴──────────────┐     │             │
│         │    │        WORKFLOW RUN         │     │             │
│         │    │  plan → code → test → PR    │     │             │
│         │    └──────────────┬──────────────┘     │             │
│         │                   │                    │             │
│         │                   ▼                    │             │
│         │         ┌─────────────────┐           │             │
│         │         │    OUTCOMES     │           │             │
│         │         │  success/fail   │           │             │
│         │         └────────┬────────┘           │             │
│         │                  │                    │             │
│         │                  ▼                    │             │
│         │         ┌─────────────────┐           │             │
│         └─────────│    REWARDS      │◄──────────┘             │
│                   │  +100 / -50     │                         │
│                   └────────┬────────┘                         │
│                            │                                  │
│                            ▼                                  │
│                   ┌─────────────────┐                         │
│                   │   LEARNINGS     │                         │
│                   │  (prompts)      │                         │
│                   └────────┬────────┘                         │
│                            │                                  │
│                            ▼                                  │
│                   ┌─────────────────┐                         │
│                   │ NEXT RUN BETTER │                         │
│                   └─────────────────┘                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Running the Full Team

### 1. Start with Claude Code
```bash
claude-code
# In Claude Code, reference this skill:
# "Use the claude-code-skills-pack to run a feature-dev workflow for..."
```

### 2. Execute Workflow
```bash
# The workflow will:
# - Planner decomposes task
# - Developer implements each story
# - Verifier checks each story
# - Tester writes tests
# - PR created automatically
# - Reviewer approves
```

### 3. Record Outcomes
```python
# After workflow completes:
from agent_lightning_integration import AutonomousAgentRunner

runner = AutonomousAgentRunner("feature-dev-workflow")
runner.record_success(200.0, {
    "workflow": "feature-dev",
    "stories_completed": 5,
    "tests_passed": 12,
    "review_approved": True
})
```

### 4. Learn and Improve
The system learns from every run:
- Successful patterns are reinforced
- Failed approaches are deprioritized
- Prompts are updated with learnings

## Key Files Reference

| Path | Purpose |
|------|---------|
| `/home/workspace/antfarm/` | Antfarm installation |
| `/home/workspace/antfarm/workflows/` | Workflow definitions |
| `/home/workspace/antfarm/src/cli/cli.ts` | CLI entry point |
| `/home/workspace/autonomous-revenue/agent_lightning_integration.py` | Agent Lightning |
| `/tmp/agent_rewards.jsonl` | Reward log |
| `/home/workspace/Skills/agent-lightning-antfarm-infusion/` | Infusion skill |

## Environment Variables

```bash
# For Antfarm
export ANTFARM_HOME=/home/workspace/antfarm

# For Agent Lightning
export AGENT_REWARDS_LOG=/tmp/agent_rewards.jsonl

# For Claude Code
export CLAUDE_CODE_SKILLS=/home/workspace/Skills/claude-code-skills-pack
```

## Troubleshooting

### Antfarm not found
```bash
cd /home/workspace/antfarm && npm link
```

### Node sqlite error
```bash
# Ensure real Node.js 22+, not Bun's wrapper
node -e "require('node:sqlite')"
```

### Rewards not logging
```bash
touch /tmp/agent_rewards.jsonl
chmod 666 /tmp/agent_rewards.jsonl
```

---

*This skills pack creates the foundation for autonomous, self-improving development with Claude Code, Antfarm, and Agent Lightning working in symbiotic harmony.*
