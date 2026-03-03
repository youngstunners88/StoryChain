---
name: outreach-engine
description: Automated lead outreach system with email cadences, follow-up tracking, and value-based prioritization. Targets R480/day revenue through systematic lead generation and conversion.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: 1.0.0
allowed-tools: Bash Read
---

# Outreach Engine Skill

Automated B2B outreach system for generating leads and converting them to paying clients.

## Quick Start

```bash
bun scripts/outreach.ts --help
```

## Configuration

Edit `config.json` to adjust:

### Cadence Settings
- `initialEmailDelay`: Hours before first email (default: 0)
- `followUpCadence`: Days between follow-ups (default: [3, 7, 14])
- `maxFollowUps`: Maximum follow-up attempts (default: 3)
- `workingHours`: Send only during these hours (default: 9-17 SAST)

### Email Templates
Templates are stored in `templates/`:
- `initial.md` - First contact email
- `followup-1.md` - First follow-up
- `followup-2.md` - Second follow-up
- `followup-3.md` - Final follow-up

### Lead Prioritization
Leads are scored by `estimatedValue`:
- High (R10,000+): Priority queue
- Medium (R5,000-R10,000): Standard queue
- Low (<R5,000): Batch processing

## Lead List Format

Add leads to `leads.json`:

```json
[
  {
    "email": "prospect@example.com",
    "name": "John Smith",
    "company": "Example Corp",
    "service": "Website Development",
    "estimatedValue": 15000,
    "source": "LinkedIn",
    "notes": "Saw their outdated website"
  }
]
```

## Workflow

1. **Load Leads**: Read from `leads.json` or fetch from sources
2. **Prioritize**: Sort by estimated value
3. **Generate Email**: Customize template for each lead
4. **Send**: Via configured email provider
5. **Track**: Log to `outreach-log.txt` and update `status.json`
6. **Follow-up**: Schedule and send follow-ups based on cadence

## Tracking

### Status File (`status.json`)
```json
{
  "sarah@techstartup.co.za": {
    "status": "followup-1",
    "lastContact": "2026-02-20T05:57:32Z",
    "nextFollowUp": "2026-02-23T09:00:00Z",
    "estimatedValue": 5000
  }
}
```

### Daily Target
- Revenue goal: R480/day
- Average deal value: R8,000
- Required conversions: ~2 per week
- Outreach target: 5 leads/day

## Email Templates

### Initial Email
Hi {name},

I noticed {observation about their business} and wanted to reach out.

I specialise in {relevant service} and have helped similar businesses {specific result}.

Would you be open to a free 15-minute consultation to see if I can help?

Best,
Kofi

### Follow-up 1 (Day 3)
Hi {name},

Just following up on my previous email about {service}.

I recently helped {similar business} achieve {specific result} and thought of you.

Any interest in a quick chat?

### Follow-up 2 (Day 7)
Hi {name},

I understand you're busy. I'll keep this brief:

- {Benefit 1}
- {Benefit 2}
- {Benefit 3}

If {service} isn't a priority right now, no worries. But if it is, I'm here to help.

### Follow-up 3 (Day 14)
Hi {name},

This is my final follow-up about {service}.

If you're ever looking for help with {service area}, feel free to reach out.

I'll remove you from my list now. Wishing you success!

## Metrics to Track

- Emails sent (daily/weekly)
- Open rate
- Response rate
- Conversion rate
- Revenue per lead
- Time to conversion

## Safety & Compliance

- Include unsubscribe option
- Honour opt-out requests immediately
- Never send more than 50 emails/day from one account
- Comply with South Africa's POPIA regulations
