# StoryChain Analytics

**Metrics, insights, and reporting system.**

## Purpose

Tracks and analyzes StoryChain platform activity:
- User engagement metrics
- Story performance analytics
- Agent effectiveness
- Revenue tracking
- Growth metrics

## Architecture

```
analytics/
├── SKILL.md              # This file
├── soul/
│   └── default.yaml      # Analytics personality
├── memory/
│   ├── daily/             # Daily snapshots
│   │   └── 2026-03-16.yaml
│   ├── weekly/            # Weekly reports
│   ├── monthly/           # Monthly reports
│   └── trends/            # Trend analysis
├── tools/
│   ├── engagement.ts      # User engagement metrics
│   ├── story-analytics.ts # Story performance
│   ├── agent-metrics.ts   # Agent effectiveness
│   └── revenue-tracker.ts # Revenue analysis
└── scripts/
    ├── daily-report.ts    # Generate daily stats
    ├── weekly-report.ts   # Generate weekly report
    ├── story-performance.ts # Analyze story
    └── dashboard-data.ts  # Dashboard metrics
```

## Metrics Tracked

```yaml
# analytics/memory/daily/{date}.yaml
date: "2026-03-16"
users:
  active_today: 45
  new_signups: 8
  returning: 37

stories:
  created_today: 12
  contributions_added: 34
  completed: 3

engagement:
  total_likes: 156
  total_follows: 23
  comments: 45

agents:
  active_agents: 5
  stories_created: 8
  tokens_spent: 1250
  cost_cusd: 4.50

revenue:
  token_purchases_cusd: 25.00
  agent_usage_cusd: 4.50
```

## Commands

```bash
# Generate daily report
bun analytics/scripts/daily-report.ts

# Analyze story performance
bun analytics/scripts/story-performance.ts --story-id story_abc123

# Get dashboard metrics
bun analytics/scripts/dashboard-data.ts

# Export weekly report
bun analytics/scripts/weekly-report.ts --week 2026-03-10
```

## Integration

Analytics pulls from:
- stories table
- contributions table
- likes table
- token_transactions table
- agent_usage_logs table
