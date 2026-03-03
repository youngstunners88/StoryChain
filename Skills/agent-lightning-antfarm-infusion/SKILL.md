---
name: agent-lightning-antfarm-infusion
description: Fuses Agent Lightning (RL-based learning from traces, prompts, rewards) with Antfarm (multi-agent workflow orchestration) to create self-improving agent teams. Use when building autonomous agent systems, creating learning loops, or orchestrating multi-agent workflows with feedback.
---

# Agent Lightning + Antfarm Infusion

This skill combines two powerful systems:

## Agent Lightning
RL-based learning system that improves agents through:
- Traces (recording actions and decisions)
- Prompts (storing successful patterns)
- Rewards (optimizing from outcomes)

Located at: `/home/workspace/autonomous-revenue/agent_lightning_integration.py`

## Antfarm
Multi-agent workflow orchestration for OpenClaw:
- feature-dev workflow (7 agents)
- security-audit workflow (7 agents)
- bug-fix workflow (6 agents)
- Custom workflow support

Located at: `/home/workspace/antfarm/`

## Infusion Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SYMBIOTIC WORKFRAME                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   Agent Lightning (Learning)    Antfarm (Execution)     │
│        ┌──────────┐              ┌──────────┐           │
│        │  Traces  │◄────────────►│ Workflow │           │
│        │  Rewards │              │  Agents  │           │
│        │ Prompts  │              │  Steps   │           │
│        └────┬─────┘              └────┬─────┘           │
│             │                         │                  │
│             ▼                         ▼                  │
│   ┌─────────────────────────────────────────┐           │
│   │           FEEDBACK LOOP                  │           │
│   │  - Record every agent action             │           │
│   │  - Calculate rewards from outcomes       │           │
│   │  - Update prompts with learnings         │           │
│   │  - Improve next workflow run             │           │
│   └─────────────────────────────────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Initialize Agent Lightning
```python
from agent_lightning_integration import (
    AutonomousAgentRunner,
    emit_trade_reward,
    emit_deal_closed,
    get_total_rewards
)

# Create agent runner
runner = AutonomousAgentRunner("my_agent")

# Record success/failure
runner.record_success(100.0, {"task": "feature_complete"})
runner.record_failure(10.0, {"task": "bug_introduced"})
```

### 2. Run Antfarm Workflow
```bash
# Install workflows
antfarm install

# Run a workflow
antfarm workflow run feature-dev "Add user authentication"

# Check status
antfarm workflow status "authentication"
```

### 3. Integrate Learning with Workflows
Each workflow step can emit rewards:
- Feature completed successfully: +100
- Bug introduced: -50
- Test passed: +25
- Code review approved: +50

## Key Files

| File | Purpose |
|------|---------|
| `/home/workspace/autonomous-revenue/agent_lightning_integration.py` | Agent Lightning implementation |
| `/home/workspace/antfarm/src/cli/cli.ts` | Antfarm CLI |
| `/home/workspace/antfarm/workflows/` | Workflow definitions |
| `/tmp/agent_rewards.jsonl` | Reward log |

## Reward Types

### Trading Bot
- `trading_profit`: Profit from successful trade
- `trading_loss`: Loss from failed trade

### Outreach Bot
- `outreach_result`: Response from lead
- `deal_closed`: Deal value when closed

### Development Agents
- `feature_complete`: Feature shipped
- `bug_fixed`: Bug resolved
- `test_passed`: Tests passing
- `review_approved`: Code approved

## Creating Self-Improving Workflows

1. Define workflow in `/home/workspace/antfarm/workflows/my-workflow/`
2. Add reward emission in agent instructions
3. Configure Agent Lightning to track rewards
4. Run workflow and collect data
5. Analyze patterns and improve prompts

## Claude Code Integration

When using Claude Code with this infusion:

```bash
# Start Claude Code with context
claude-code --context /home/workspace/Skills/agent-lightning-antfarm-infusion/

# Run workflow with learning
antfarm workflow run feature-dev "Build X" && python3 -c "
from agent_lightning_integration import emit_deal_closed
emit_deal_closed(1000, 'client', 'feature')
"
```

## Symbiotic WorkFrame Principles

1. **Every action is traceable** - Record what agents do
2. **Every outcome has reward** - Calculate success/failure
3. **Learning is continuous** - Update prompts from rewards
4. **Workflows are repeatable** - Same process, better results
5. **Agents verify each other** - No self-marking

---

*This infusion creates the foundation for the symbiotic WorkFrame where agents learn, improve, and collaborate autonomously.*
