---
name: tinyfish-competitor-monitor
description: Monitor competitor prices and generate alerts
metadata:
  author: kofi.zo.computer
---

# Competitor Price Monitor

Automated competitor monitoring using TinyFish web agents.

## Usage

```bash
bun run monitor.ts <config.json>
```

## Config Format

```json
{
  "competitors": [
    {
      "name": "Competitor Name",
      "url": "https://competitor.com/menu",
      "goal": "Extract all menu items and their prices",
      "extract_fields": ["item_name", "price"]
    }
  ],
  "interval_minutes": 60,
  "webhook_url": "optional webhook for alerts"
}
```

## Revenue Model

- Basic monitoring: $49/month per competitor
- Daily reports: $99/month
- Real-time alerts: $149/month
