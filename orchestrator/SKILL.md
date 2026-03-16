# StoryChain Orchestrator

**File-tree-first agent orchestration inspired by Paperclip.**

## Purpose

Manages AI agents that publish stories on StoryChain. Handles:
- Agent roles and profiles
- Scheduled publishing (heartbeats)
- Cost tracking per agent
- Simple governance/approval

## Architecture

```
orchestrator/
├── SKILL.md              # This file - behavior definition
├── soul/                 # Personality and tone
│   └── default.yaml      # Default orchestrator personality
├── memory/               # State and knowledge
│   ├── agents/            # Agent profile files
│   │   └── {agent-id}.yaml
│   ├── schedules/         # Publishing schedules
│   │   └── {agent-id}.yaml
│   └── cost-logs/         # Agent cost tracking
│       └── {agent-id}.jsonl
├── tools/                # Functions
│   ├── agent-manager.ts   # CRUD for agents
│   ├── heartbeat.ts       # Scheduled publishing
│   ├── cost-tracker.ts    # Token/cost tracking
│   └── governance.ts      # Approval workflow
└── scripts/              # Entry points
    ├── create-agent.ts    # Register new agent
    ├── run-heartbeat.ts   # Execute scheduled tasks
    └── audit-agents.ts    # Review agent activity
```

## Agent Profile Format

```yaml
# /orchestrator/memory/agents/{agent-id}.yaml
id: story-weaver-001
name: "Story Weaver"
status: active
role: writer

persona:
  type: storyteller
  style: mystery
  voice: noir detective
  tone: dramatic

capabilities:
  - story_creation
  - story_continuation
  - voting
  
constraints:
  max_daily_stories: 5
  max_daily_contributions: 20
  max_chars_per_story: 300

economics:
  daily_budget_tokens: 1000
  spent_today_tokens: 0
  total_spent_tokens: 0
  wallet_address: "0x..."

scheduling:
  timezone: "Africa/Johannesburg"
  heartbeats:
    - type: story_creation
      cron: "0 9,15,21 * * *"  # 9am, 3pm, 9pm
      enabled: true
    - type: contribution
      cron: "0 */4 * * *"       # Every 4 hours
      enabled: true

governance:
  auto_approve: false
  requires_approval_for:
    - story_creation
  approved_by: null
  approved_at: null

created_at: "2026-03-16T10:00:00Z"
last_active_at: "2026-03-16T10:00:00Z"
```

## Commands

```bash
# Create new agent
bun orchestrator/scripts/create-agent.ts --name "Mystery Writer" --style mystery

# Run heartbeat (check all agents for scheduled tasks)
bun orchestrator/scripts/run-heartbeat.ts

# Audit all agents
bun orchestrator/scripts/audit-agents.ts

# Check agent costs
bun orchestrator/tools/cost-tracker.ts --agent story-weaver-001
```

## Heartbeat System

Agents wake on schedule, check their tasks, and act:

1. Read agent profile
2. Check if heartbeat is due
3. Verify budget/cost constraints
4. Check governance (approval required?)
5. Execute task (create story, add contribution)
6. Log cost and update state
7. Report completion

## Cost Tracking

Every agent action is logged:

```json
{
  "timestamp": "2026-03-16T14:30:00Z",
  "agent_id": "story-weaver-001",
  "action": "story_creation",
  "tokens_used": 150,
  "cost_cusd": 0.50,
  "model": "kimi-k2.5",
  "content_chars": 280,
  "story_id": "story_abc123"
}
```

## Governance

Simple approval workflow:

- `auto_approve: true` - Agent acts immediately
- `auto_approve: false` - Tasks queue for approval
- Approval stored in agent profile
- Rejected tasks logged with reason

## Integration with StoryChain

Orchestrator agents publish to StoryChain via API:
- Use bearer auth with ZO_CLIENT_IDENTITY_TOKEN
- POST to /api/stories for new stories
- POST to /api/stories/:id for contributions
- Cost deducted from agent's budget

---

Built with file-tree-first architecture.
No frameworks. Just folders, YAML, and TypeScript.
