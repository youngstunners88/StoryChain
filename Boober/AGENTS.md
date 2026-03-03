# Boober Project Context

## Project Overview

**Boober** - Taxi safety app for South Africa
- Target Launch: **Friday, February 28, 2026** (4 days remaining)
- Progress: 35% ready
- Repository: `/home/workspace/Boober/`

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind
- **Backend**: Python FastAPI
- **Database**: MongoDB
- **Mobile**: PWA or React Native (decision pending)

## Core Features

1. **Passenger Safety**: Track taxis, share ride status
2. **Driver Verification**: Through taxi associations
3. **Marshal Integration**: Rank managers as trusted nodes
4. **Location Tracking**: Real-time with consent

## Key Stakeholders

- Taxi associations (must not disrupt)
- Passengers (primary users)
- Drivers (secondary users)
- Marshals (rank managers)

## Critical Blockers (from LAUNCH-CHECKLIST)

### 🔴 Must Fix Before Launch
- [ ] JWT_SECRET security in production
- [ ] Production MongoDB setup
- [ ] Rate limiting implementation
- [ ] Input sanitization
- [ ] Mobile app conversion (PWA or RN)
- [ ] Security audit

### 🟡 Should Fix
- [ ] Google Play Developer Account ($25)
- [ ] Phone screenshots (3-8)
- [ ] Influencer outreach
- [ ] User feedback system

## Agent Swarm Status

6 agents running every 2 hours:
1. Master Coordinator
2. Backend Security
3. Play Store Prep
4. Marketing Content
5. Bug Hunter
6. Documentation

## Strategic Positioning

> "Position app as COMPLEMENTARY to taxi industry"
> "No disruption of existing taxi operations"
> "Focus on passenger safety and convenience"

## Vault Integration

This project is connected to vault-commands for:
- `/context --focus=Boober` - Load current state
- `/trace "taxi safety"` - Follow idea evolution
- `/connect "Boober" "taxi industry"` - Find connections
- `/ideas --domain=safety` - Generate opportunities
- `/graduate --type=action-plan` - Create deliverables

## Recent Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-24 | Agent swarm activated | Parallelize launch prep |
| 2026-02-24 | TikTok content plan | Target demographic |
| 2026-02-23 | PWA vs RN pending | Need to decide by Tuesday |

## Files to Track

- `LAUNCH-CHECKLIST.md` - Master progress tracker
- `agent-reports/` - Generated agent outputs
- `INSIGHTS.md` - Strategic insights from vault
- `backend/server.py` - Core API
- `src/` - React frontend

---
*Last updated: 2026-02-24*
