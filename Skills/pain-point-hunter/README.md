# Pain Point Hunter

Autonomous agent system for discovering client pain points, building solutions, and generating revenue.

## Quick Start

```bash
# Initialize the system
cd ~/workspace/Skills/pain-point-hunter
bun scripts/init.ts

# Run a manual discovery
bun scripts/hunt.ts --mode discover --target "restaurants in Johannesburg"

# Build a solution for the next qualified lead
bun scripts/build.ts

# Generate outreach (dry run)
bun scripts/outreach.ts --dry-run

# Run the autonomous heartbeat
bun scripts/heartbeat.ts
```

## Architecture

This skill follows the OpenClaw coordinator/worker pattern:

```
Coordinator (main session)
├── Heartbeat Router (every 30 min)
├── Task Queue (leads.json)
└── Spawns specialized agents:
    ├── Researcher (finds pain points)
    ├── Builder (creates solutions)
    └── Outreach (contacts leads)
```

## How It Works

### 1. Discovery
The researcher agent searches for businesses expressing frustration:
- Google Maps reviews with complaints
- Reddit posts about business challenges
- Twitter/X mentions of problems
- LinkedIn posts about difficulties

### 2. Qualification
Leads are scored by urgency and estimated value:
- High urgency (R8,000+ estimated value)
- Medium urgency (R4,000-R8,000)
- Low urgency (R2,000-R4,000)

### 3. Building
The builder agent creates solutions:
- Websites and landing pages
- Automation scripts
- Dashboards
- Integrations

### 4. Outreach
Personalized messages referencing:
- Their specific pain point
- The solution created for them
- A clear call to action

## Configuration

Edit `data/config.json` to customize:
- Target industries and locations
- Discovery keywords
- Pricing tiers
- Outreach cadence

## Data Files

| File | Purpose |
|------|---------|
| `leads.json` | All discovered pain points |
| `status.json` | Current system state |
| `heartbeat-state.json` | Last run timestamps |
| `discovery.log` | Discovery history |
| `outreach.log` | Outreach history |

## Revenue Model

Target: R480/day (~R14,400/month)

- Websites: R3,000 - R15,000
- Automations: R2,000 - R8,000
- Integrations: R2,500 - R10,000
- Dashboards: R4,000 - R20,000

## Safety

- Max 20 outreach messages per day
- Value-first approach
- Immediate opt-out handling
- Transparent pricing

## References

This skill is inspired by the OpenClaw architecture:
- Coordinator/worker model
- Rotating heartbeat pattern
- Agent spawning via API
- Model tiering for cost optimization
