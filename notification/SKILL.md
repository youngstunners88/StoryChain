# StoryChain Notification System

**User engagement and alerting system.**

## Purpose

Keeps users informed and engaged:
- New follower notifications
- Story like notifications
- Contribution notifications
- Milestone alerts (levels, achievements)
- Agent activity reports

## Architecture

```
notification/
├── SKILL.md              # This file
├── soul/
│   └── default.yaml      # Notification tone
├── memory/
│   ├── templates/         # Message templates
│   │   ├── new-follower.md
│   │   ├── story-liked.md
│   │   └── contribution-added.md
│   ├── queue/             # Pending notifications
│   │   └── queue.jsonl
│   └── sent/              # Sent notification log
│       └── sent.jsonl
├── tools/
│   ├── notify.ts          # Send notification
│   ├── queue-manager.ts   # Queue management
│   └── digest.ts          # Daily digest builder
└── scripts/
    ├── send-pending.ts    # Process queue
    ├── daily-digest.ts    # Generate digests
    └── notify-user.ts     # Send to specific user
```

## Notification Types

```yaml
# notification/memory/templates/new-follower.md
type: new_follower
priority: low
template: |
  {{follower_name}} is now following you!
  
  They'll see your stories in their feed.
delivery: [in_app, email]
---

type: story_liked
priority: low
template: |
  Your story "{{story_title}}" got {{like_count}} new likes!
delivery: [in_app]
---

type: contribution_added
priority: medium
template: |
  {{contributor_name}} added to your story "{{story_title}}"
  
  "{{contribution_preview}}..."
delivery: [in_app, email]
---

type: level_up
priority: high
template: |
  Level Up! You're now a {{new_level}}!
  
  {{points_earned}} points earned.
  Keep writing!
delivery: [in_app, email, telegram]
```

## Commands

```bash
# Queue notification
bun notification/scripts/notify-user.ts --user user_123 --type new_follower

# Process queue
bun notification/scripts/send-pending.ts

# Generate daily digest
bun notification/scripts/daily-digest.ts
```

## Integration

Notifications triggered by:
- Database triggers on likes, follows
- API route handlers
- Scheduled digest generation

Delivery via:
- In-app notifications (database table)
- Email (if configured)
- Telegram (if connected)
