---
name: swarm-commander
description: "Orchestrate 10+ autonomous agents in parallel for extended durations with self-healing"
auto-activate: true
---

# Swarm Commander Skill

## Purpose
Transform single AI into orchestrator that spawns 10+ autonomous workers for extended task execution.

## Commands

### Spawn Workers
```
/swarm spawn <worker-type> <count> <duration> <objective>

Examples:
  /swarm spawn big-homes 5 4h "Find mobile home listings under $50k"
  /swarm spawn retell 3 2h "Call 100 leads about solar installation"
  /swarm spawn scraper 10 6h "Extract contact info from 1000 websites"
```

### Monitor Swarm
```
/swarm status           - View all active workers
/swarm logs <id>        - View worker logs
/swarm results          - Aggregate all results
/swarm kill <id>        - Stop a worker
```

## Self-Healing Protocol (Every 15 minutes)

### Single Failure
1. Check gateway status → restart if down
2. If skill missing → search ClawHub for alternative
3. If API error → switch to backup API key
4. Log recovery action to memory

### 3+ Consecutive Failures
1. Spawn fresh session
2. Clear context window
3. Retry with minimal prompt
4. Escalate to user only if still failing

## Infrastructure Options

| Method | Cost | Reliability | Speed |
|--------|------|-------------|-------|
| Zo /zo/ask API | $0.002/req | Highest | Instant |
| Docker containers | $0.10/hr | High | Fast |
| Vultr VPS | $2.50/mo | High | Medium |
| DigitalOcean | $4.00/mo | High | Medium |

## Worker Types

### big-homes
Search Facebook Marketplace, Craigslist, Zillow for mobile home listings under $50k. Extract price, location, contact, photos. Score quality 1-10.

### retell
Load leads from shared memory, call via Retell AI, qualify interest, schedule follow-ups, update CRM.

### scraper
Extract structured data from websites. Handle captchas, rate limits, pagination. Save to JSONL.

### email
Send personalized cold emails. Track opens, clicks, replies. Follow up automatically.

### researcher
Deep web research on companies/people. Compile dossiers with sources.

## Memory Structure
```
~/.swarm/
├── workers/
│   ├── worker-001/
│   │   ├── task.md         # Assigned objective
│   │   ├── progress.json   # Current state
│   │   └── results.jsonl   # Completed items
│   └── ...
├── shared/
│   ├── knowledge.md        # Cross-worker learning
│   ├── templates/          # Reusable prompts
│   └── leads.jsonl        # Aggregated leads
├── health.log             # Self-healing log
└── config.json            # Swarm settings
```

## Safety Limits
- Max workers: 20
- Max duration: 24h
- Max memory per worker: 512MB
- Auto-kill on 5 consecutive failures

## Implementation Notes

### Using Zo /zo/ask API
```typescript
const workers = [];
for (let i = 0; i < count; i++) {
  workers.push(
    fetch('https://api.zo.computer/zo/ask', {
      method: 'POST',
      headers: {
        'authorization': process.env.ZO_CLIENT_IDENTITY_TOKEN,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        input: `Work autonomously for ${duration}h on: ${objective}`,
        model_name: 'openrouter:z-ai/glm-5'
      })
    })
  );
}
const results = await Promise.all(workers);
```

### Health Monitor Integration
```bash
# Add to crontab
*/15 * * * * /home/workspace/swarm-commander/health-check.sh
```

## Status Output
```
┌─────────────┬─────────┬──────────┬─────────┬─────────┐
│ Worker ID   │ Status  │ Runtime  │ Items   │ Errors  │
├─────────────┼─────────┼──────────┼─────────┼─────────┤
│ worker-001  │ running │ 2h 15m   │ 45      │ 0       │
│ worker-002  │ running │ 2h 15m   │ 38      │ 2       │
│ worker-003  │ done    │ 2h 10m   │ 52      │ 1       │
│ worker-004  │ failed  │ 1h 30m   │ 12      │ 5       │
│ worker-005  │ running │ 2h 15m   │ 41      │ 0       │
└─────────────┴─────────┴──────────┴─────────┴─────────┘

Total items processed: 188
Total runtime: 10h 5m
Consecutive failures: 0
