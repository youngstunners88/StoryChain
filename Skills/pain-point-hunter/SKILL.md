---
name: pain-point-hunter
description: Autonomous agent system that discovers client pain points, builds solutions, and generates revenue. Uses coordinator/worker architecture with rotating heartbeat for continuous operation. Inspired by OpenClaw's agent spawn patterns.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: 1.0.0
  references:
    - OpenClaw Runbook: https://github.com/digitalknk/openclaw-runbook
    - Agent Skills Spec: https://agentskills.io/specification
allowed-tools: Bash Read Web
---

# Pain Point Hunter

Autonomous system for discovering client pain points, building solutions, and converting leads into paying customers.

## Core Philosophy

Based on the OpenClaw architecture:
1. **Coordinator, not worker**: Main agent coordinates, specialists do the work
2. **Model tiering**: Cheap models for monitoring, balanced for research, premium for complex reasoning
3. **Spawning pattern**: Fire specialized agents for isolated tasks
4. **Visibility**: All work tracked externally for human oversight

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COORDINATOR AGENT                        │
│  (Main session - runs continuously via heartbeat)           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Heartbeat  │  │ Task Queue  │  │ Status File │         │
│  │  Router     │  │ (leads.json)│  │ (status.json)│        │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  Spawns specialized agents via /zo/ask API:                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  RESEARCHER │  │  BUILDER    │  │  OUTREACH   │         │
│  │  Agent      │  │  Agent      │  │  Agent      │         │
│  │  (Web search│  │  (Solution  │  │  (Email/    │         │
│  │   + analysis)│ │   creation) │  │   Telegram) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Initialize the system
bun scripts/init.ts

# Run a single pain point discovery cycle
bun scripts/hunt.ts --mode discover --target "small businesses in South Africa"

# Run the autonomous heartbeat (runs continuously)
bun scripts/heartbeat.ts

# Check status
cat data/status.json | jq
```

## Configuration

Edit `config.json`:

```json
{
  "heartbeat": {
    "cadenceMinutes": 30,
    "workingHours": { "start": 8, "end": 22 },
    "timezone": "Africa/Johannesburg"
  },
  "discovery": {
    "sources": [
      "google_maps_reviews",
      "reddit_complaints",
      "twitter_mentions",
      "linkedin_posts",
      "industry_forums"
    ],
    "keywords": [
      "struggling with",
      "need help with",
      "frustrated by",
      "looking for solution",
      "pain point",
      "challenge"
    ],
    "industries": [
      "small business",
      "restaurants",
      "retail",
      "professional services",
      "e-commerce"
    ],
    "locations": ["South Africa", "Johannesburg", "Cape Town"]
  },
  "solutionBuilder": {
    "capabilities": [
      "website",
      "automation",
      "integration",
      "dashboard",
      "mobile_app"
    ],
    "maxBuildTimeMinutes": 60,
    "autoDeploy": false
  },
  "outreach": {
    "channels": ["email", "telegram"],
    "templates": "templates/",
    "maxDailyOutreach": 20,
    "followUpCadence": [3, 7, 14]
  },
  "revenue": {
    "targetPerDay": 480,
    "currency": "ZAR",
    "minProjectValue": 2000,
    "pricingModel": "value-based"
  }
}
```

## Heartbeat Pattern

The heartbeat runs different checks based on cadence:

| Check | Cadence | What It Does |
|-------|---------|--------------|
| Discovery | Every 30 min | Find new pain points |
| Qualification | Every 1 hour | Score and prioritize leads |
| Building | Every 2 hours | Work on queued solutions |
| Outreach | Every 3 hours | Send/follow up with leads |
| Reconciliation | Every 6 hours | Clean up, report status |

```markdown
# HEARTBEAT.md (stored in data/heartbeat.md)

## Rotating Heartbeat System

Read `heartbeat-state.json`. Run whichever check is most overdue.

**Cadences:**
- Discovery: every 30 min (8 AM - 10 PM)
- Qualification: every 1 hour (8 AM - 10 PM)
- Building: every 2 hours (anytime)
- Outreach: every 3 hours (9 AM - 6 PM)
- Reconciliation: every 6 hours (anytime)

**Process:**
1. Load timestamps from heartbeat-state.json
2. Calculate which check is most overdue
3. Run that check via spawned agent
4. Update timestamp
5. Report if actionable, otherwise HEARTBEAT_OK
```

## Agent Types

### Coordinator Agent (Main Session)

The main Zo session runs continuously and coordinates all work.

**Responsibilities:**
- Route heartbeat checks to appropriate agents
- Maintain task queue and status
- Spawn specialized agents for heavy work
- Synthesize results and report to user

**Never does:**
- Direct web scraping (spawns researcher)
- Direct solution building (spawns builder)
- Direct outreach (spawns communicator)

### Researcher Agent (Spawned)

**Trigger:** "When spawned as 'researcher'"

**Task:** Find pain points in target market

**Process:**
1. Search configured sources for pain point keywords
2. Identify businesses/individuals expressing frustration
3. Document the pain point clearly
4. Estimate market size and urgency
5. Return structured finding

**Output format:**
```json
{
  "painPoint": "Description of the problem",
  "affectedBusiness": {
    "name": "Business name",
    "industry": "Industry",
    "location": "Location",
    "contactInfo": "Email/phone if found"
  },
  "urgency": "high|medium|low",
  "marketSize": "estimated number of similar businesses",
  "solutionHint": "What could help",
  "source": "URL where found",
  "discoveredAt": "ISO timestamp"
}
```

### Builder Agent (Spawned)

**Trigger:** "When spawned as 'builder'"

**Task:** Create a solution for a validated pain point

**Process:**
1. Analyze the pain point
2. Design solution (website, automation, tool)
3. Build MVP within time constraints
4. Test and document
5. Return deployable artifact

**Constraints:**
- Must complete within maxBuildTimeMinutes
- Must solve the stated pain point
- Must be deployable immediately
- Must include usage documentation

### Outreach Agent (Spawned)

**Trigger:** "When spawned as 'outreach'"

**Task:** Contact lead with solution offer

**Process:**
1. Load lead information
2. Generate personalized message using template
3. Reference their specific pain point
4. Offer concrete solution
5. Track response

## Workflow

### Discovery Cycle

```
1. Coordinator spawns researcher agent
   ↓
2. Researcher searches configured sources
   ↓
3. Researcher returns structured findings
   ↓
4. Coordinator adds to leads.json
   ↓
5. Coordinator spawns qualifier agent
   ↓
6. Qualifier scores and prioritizes
   ↓
7. High-value leads go to builder queue
```

### Build Cycle

```
1. Coordinator picks highest-priority lead
   ↓
2. Coordinator spawns builder agent
   ↓
3. Builder creates solution
   ↓
4. Coordinator stores solution artifact
   ↓
5. Coordinator adds to outreach queue
```

### Outreach Cycle

```
1. Coordinator picks next outreach target
   ↓
2. Coordinator spawns outreach agent
   ↓
3. Outreach agent sends message
   ↓
4. Coordinator tracks in status.json
   ↓
5. Follow-ups scheduled per cadence
```

## Data Files

### leads.json

All discovered pain points and leads:

```json
[
  {
    "id": "lead-001",
    "painPoint": "Restaurant struggling with online orders",
    "business": {
      "name": "Joe's Diner",
      "email": "joe@diner.co.za",
      "phone": "+27123456789"
    },
    "estimatedValue": 5000,
    "status": "qualified",
    "solutionReady": false,
    "discoveredAt": "2026-02-20T10:00:00Z",
    "score": 85
  }
]
```

### status.json

Current state of all work:

```json
{
  "lastHeartbeat": "2026-02-20T12:00:00Z",
  "stats": {
    "painPointsDiscovered": 47,
    "solutionsBuilt": 12,
    "outreachSent": 35,
    "responsesReceived": 8,
    "dealsClosed": 2
  },
  "activeWork": {
    "building": ["lead-003", "lead-007"],
    "outreach": ["lead-001", "lead-002"]
  },
  "revenue": {
    "target": 480,
    "today": 150,
    "thisWeek": 3200,
    "thisMonth": 12500
  }
}
```

### heartbeat-state.json

```json
{
  "lastChecks": {
    "discovery": 1703275200000,
    "qualification": 1703272000000,
    "building": 1703268000000,
    "outreach": 1703260000000,
    "reconciliation": 1703240000000
  }
}
```

## Templates

### Discovery Prompt (for Researcher Agent)

```
You are a researcher agent. Your task: discover pain points for potential clients.

Target market: {targetMarket}
Industries: {industries}
Locations: {locations}

Search for:
- Businesses expressing frustration
- People asking for help with problems you can solve
- Complaints about current solutions
- Gaps in the market

Use web_search to find:
1. Google Maps reviews mentioning problems
2. Reddit/Twitter posts expressing frustration
3. LinkedIn posts about business challenges
4. Forum threads asking for recommendations

For each finding, document:
- The specific pain point
- Who has this problem
- How urgent it seems
- What a solution might look like

Return findings as JSON array. Focus on actionable, high-value opportunities.
```

### Outreach Template

```markdown
Hi {name},

I noticed {specific observation about their business/pain point}.

I've built a solution that {how it solves their problem}:
{brief description of solution}

Would you like to see it in action? I can demo it for free - no strings attached.

{callToAction}

Best,
Kofi

P.S. {personal touch based on research}
```

## Metrics & Reporting

### Daily Report

Generated at end of each day:

```markdown
# Pain Point Hunter Report - {date}

## Discoveries
- New pain points found: X
- Top industries: ...
- Most common problems: ...

## Building
- Solutions completed: X
- In progress: Y
- Average build time: Z minutes

## Outreach
- Messages sent: X
- Response rate: Y%
- Follow-ups due: Z

## Revenue
- Target: R480
- Actual: RXXX
- Deals closed: X

## Top Opportunities
1. {highest value lead}
2. {second highest}
3. {third highest}
```

## Safety & Ethics

1. **No spam**: Maximum 20 outreach messages per day
2. **Value-first**: Always lead with how you can help
3. **Respect opt-outs**: Immediately remove anyone who declines
4. **Honest pricing**: Transparent about costs
5. **Quality over quantity**: Better to help fewer people well

## Troubleshooting

### Heartbeat not running

```bash
# Check if process is alive
ps aux | grep heartbeat

# Check logs
tail -f data/heartbeat.log

# Restart manually
bun scripts/heartbeat.ts
```

### No pain points found

1. Check discovery keywords in config
2. Verify web_search is working
3. Try different target markets
4. Expand geographic scope

### Low response rates

1. Review outreach templates
2. Ensure pain points are genuine
3. Personalize messages more
4. Check sending timing

## References

- OpenClaw Runbook: The inspiration for coordinator/worker architecture
- OpenClaw Spawning Patterns: How to spawn agents effectively
- Agent Skills Spec: How to structure skills properly
