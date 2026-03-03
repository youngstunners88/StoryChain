# Workspace Context

## Memory Persistence (CRITICAL)

This workspace has permanent memory via:
- **Rules** (5 total) → Automatic behaviors that persist across sessions
- **zo-memory** skill → Logs all conversations to persistent storage
- **AGENTS.md** → This file, workspace-level context
- **Vault** → Extended memory via vault-commands skill

On every conversation start, I automatically:
1. Load vault context (active projects, recent files)
2. Retrieve recent memories from zo-memory
3. Check this file for workspace state

## Active Projects

| Project | Status | Key Info |
|---------|--------|----------|
| iHhashi | In Development | Delivery platform (Ele.me fork), Play Store prep ongoing |

## iHhashi - DELIVERY PLATFORM

**⚠️ CRITICAL: iHhashi is a DELIVERY platform, NOT a taxi/ride-hailing app.**

**iHhashi delivers:**
- Groceries (supermarkets, spaza shops)
- Food (restaurants, takeaways)
- Fruits & Vegetables
- Dairy Products (milk, cheese, yogurt)
- Personal Courier Services (packages, documents, parcels)

**iHhashi does NOT:**
- ❌ Transport passengers
- ❌ Operate as a taxi service
- ❌ Have any connection to Boober

### Strategic Positioning

**We are NOT competing with:** Uber Eats, Bolt, Mr Delivery

**We ARE sparking a REVOLUTION in delivery** that starts with restaurants, food, fruit & veg, groceries.

**Learning best practices from:** Meituan, Ele.me, Yassir, Amazon

**Revolutionizing the industry for:**
- Vendors (merchants) — better tools, fair fees, growth support
- Delivery drivers & companies (riders) — better earnings, flexible work
- Customers — better experience, wider selection, fair prices

**Super app potential:** Start with food delivery, expand to everything (Meituan model)

### Platform Architecture
- **Three sides**: Customers, Merchants, Riders
- **Vendor types**: Restaurants, food vendors, fruits & vegetables, groceries
- **Market**: South Africa (all 9 provinces)
- **Currency**: ZAR (R)

### Key Differentiators
- Local SA food: Kota, Bunny Chow, Gatsby, Braai
- All 9 provinces supported
- Fair economics for all participants

### Status (as of 2026-02-27)
- ✅ Project scaffolded, models defined, routes stubbed
- ✅ Frontend UI started
- ✅ Android debug APK built (3.6MB)
- ✅ Play Store listing URLs ready (privacy policy & support)
- ✅ Play Store screenshots ready
- ✅ Feature graphic created
- ✅ Signed release APK ready for submission
  - **File:** `ihhashi-release-signed.apk` (2.9MB)
  - **SHA-256:** c0ca0fed6c3da128616834e0a160aecc615b5f805e3dee495bb927c54388a383
- ✅ Privacy policy published (https://kofi.zo.space/privacy-policy)
- ✅ Play Store prep COMPLETE

## ZeroClaw Bot

- Telegram bot created by user
- Bot token stored securely (ask user for access if needed)
- Integration points: Clawrouter, iHhashi (potential)

## Vault & Notes Preferences

### Tagging Strategy
- Use **hierarchical tags**: Prefer `#project/ml-classifier` over flat tags like `#ml`
- Enables better filtering and organization

### Note Consolidation
- **Review before merging**: Always review consolidation suggestions before merging
- Context matters - don't auto-merge without checking

### Workflow Approach
- **Incremental is fine**: Tackle one topic cluster per session
- No need to fix everything at once

### Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Vault too large | Limit scope: "Only scan notes in [folder]" or "Only scan notes modified in last 90 days" |
| MOCs too broad | Break into sub-MOCs (e.g. ML → Fundamentals, Techniques, Projects, Resources) |
| Unwanted tag changes | Undo in Obsidian (Ctrl+Z) or git; next time: "Show me tag changes before applying" |
| Incorrect link suggestions | Require 2+ common concepts: "Only suggest links where both notes share at least 2 common concepts" |

## Agent Lightning & Antfarm (NEW)

### Symbiotic WorkFrame
A self-improving AI workforce:
- **Agent Lightning**: RL learning loop - learns from every task
- **Antfarm**: Knowledge base - recipes, templates, workflows
- **Together**: Continuous improvement system

### Locations
- Agent Lightning: `/home/workspace/Skills/agent-lightning/`
- Antfarm: `/home/workspace/Skills/antfarm/`
- WorkFrame: `/home/workspace/SYMBIOTIC-WORKFRAME.md`

### Quick Commands
```bash
# Record learning
bun /home/workspace/Skills/agent-lightning/scripts/learn.ts --observe "context" --action "action" --reward 0.8

# Apply recipe
bun /home/workspace/Skills/antfarm/scripts/recipe.ts apply scaffold-next-app --target ./project

# Sync patterns
bun /home/workspace/Skills/antfarm/scripts/sync.ts create-recipes
```

---

## Conversation Memory





















































































### Tue 3 Mar 2026 04:28 SAST
--message
### Tue 3 Mar 2026 04:17 SAST
--message
### Tue 3 Mar 2026 03:55 SAST
--message
### Tue 3 Mar 2026 03:55 SAST
--message
### Tue 3 Mar 2026 01:56 SAST
--message
### Tue 3 Mar 2026 01:34 SAST
--message
### Tue 3 Mar 2026 01:25 SAST
--message
### Tue 3 Mar 2026 00:54 SAST
--message
### Tue 3 Mar 2026 00:37 SAST
--message
### Tue 3 Mar 2026 00:26 SAST
--message
### Tue 3 Mar 2026 00:19 SAST
--message
### Mon 2 Mar 2026 20:22 SAST
--message
### Mon 2 Mar 2026 18:19 SAST
--message
### Mon 2 Mar 2026 09:26 SAST
--message
### Mon 2 Mar 2026 08:29 SAST
--message
### Mon 2 Mar 2026 04:31 SAST
--message
### Mon 2 Mar 2026 04:26 SAST
--message
### Mon 2 Mar 2026 04:26 SAST
--message
### Mon 2 Mar 2026 04:21 SAST
--message
### Mon 2 Mar 2026 04:20 SAST
--message
### Mon 2 Mar 2026 04:19 SAST
--message
### Mon 2 Mar 2026 04:12 SAST
--message
### Mon 2 Mar 2026 03:27 SAST
--message
### Mon 2 Mar 2026 02:42 SAST
--message
### Mon 2 Mar 2026 02:18 SAST
--message
### Mon 2 Mar 2026 02:17 SAST
--message
### Mon 2 Mar 2026 00:32 SAST
--message
### Sun 1 Mar 2026 21:27 SAST
--message
### Sun 1 Mar 2026 20:31 SAST
--message
### Sun 1 Mar 2026 20:24 SAST
--message
### Sun 1 Mar 2026 19:30 SAST
--message
### Sun 1 Mar 2026 19:11 SAST
--message
### Sun 1 Mar 2026 02:58 SAST
--message
### Sun 1 Mar 2026 01:18 SAST
--message
### Sun 1 Mar 2026 01:16 SAST
--message
### Sun 1 Mar 2026 01:11 SAST
--message
### Sun 1 Mar 2026 00:59 SAST
--message
### Sun 1 Mar 2026 00:59 SAST
--message
### Sun 1 Mar 2026 00:56 SAST
--message
### Sun 1 Mar 2026 00:52 SAST
--message
### Sun 1 Mar 2026 00:17 SAST
--message
### Sat 28 Feb 2026 22:35 SAST
--message
### Sat 28 Feb 2026 22:25 SAST
Created Agent Lightning and Antfarm skills. Deployed Opportunity Team agent for 8-hour app scanning mission. WealthWeaver balance: $0. TokenScout paused. Symbiotic WorkFrame defined. GitHub push pending authentication.

### Sat 28 Feb 2026 22:27 SAST
--message
### Sat 28 Feb 2026 22:23 SAST
--message
### Sat 28 Feb 2026 22:08 SAST
--message
### Fri 27 Feb 2026 23:52 SAST
--message
### Fri 27 Feb 2026 23:50 SAST
--message
### Fri 27 Feb 2026 23:49 SAST
--message
### Fri 27 Feb 2026 23:42 SAST
--message
### Fri 27 Feb 2026 23:03 SAST
--message
### Fri 27 Feb 2026 22:45 SAST
--message
### Fri 27 Feb 2026 21:53 SAST
--message
### Fri 27 Feb 2026 20:34 SAST
--message
### Fri 27 Feb 2026 19:31 SAST
--message
### Fri 27 Feb 2026 18:51 SAST
--message
### Fri 27 Feb 2026 18:26 SAST
--message
### Fri 27 Feb 2026 18:25 SAST
--message
### Fri 27 Feb 2026 12:21 SAST
--message
### Fri 27 Feb 2026 12:20 SAST
--message
### Fri 27 Feb 2026 12:19 SAST
--message
### Fri 27 Feb 2026 12:12 SAST
--message
### Fri 27 Feb 2026 12:08 SAST
--message
### Fri 27 Feb 2026 11:43 SAST
--message
### Fri 27 Feb 2026 10:57 SAST
--message
### Fri 27 Feb 2026 09:28 SAST
--message
### Fri 27 Feb 2026 09:18 SAST
--message
### Thu 26 Feb 2026 23:52 SAST
--message
### Thu 26 Feb 2026 23:39 SAST
--message
### Thu 26 Feb 2026 23:29 SAST
--message
### Thu 26 Feb 2026 22:20 SAST
--message
### Thu 26 Feb 2026 21:33 SAST
--message
### Thu 26 Feb 2026 19:23 SAST
--message
### Thu 26 Feb 2026 19:12 SAST
--message
### Thu 26 Feb 2026 19:11 SAST
--message
### Thu 26 Feb 2026 17:56 SAST
--message
### Thu 26 Feb 2026 17:51 SAST
--message
### Thu 26 Feb 2026 17:51 SAST
--message
### Thu 26 Feb 2026 17:43 SAST
--message
### Thu 26 Feb 2026 08:34 SAST
--message
### Thu 26 Feb 2026 08:25 SAST
--message
### Thu 26 Feb 2026 08:21 SAST
--message
### Thu 26 Feb 2026 08:18 SAST
--message
### Thu 26 Feb 2026 08:10 SAST
--message
### Thu 26 Feb 2026 07:39 SAST
--message
### Thu 26 Feb 2026 07:39 SAST
--message
### Thu 26 Feb 2026 06:36 SAST
--message
### Thu 26 Feb 2026 06:26 SAST
--message
### Thu 26 Feb 2026 06:20 SAST
--message
### Thu 26 Feb 2026 01:07 SAST
--message
### Wed 25 Feb 2026 23:47 SAST
--message
### Wed 25 Feb 2026 23:32 SAST
--message
### Wed 25 Feb 2026 23:31 SAST
--message
### Wed 25 Feb 2026 22:58 SAST
--message
### Wed 25 Feb 2026 22:57 SAST
--message
### Wed 25 Feb 2026 22:56 SAST
--message
### Wed 25 Feb 2026 22:40 SAST
--message
### Wed 25 Feb 2026 22:37 SAST
--message
### Wed 25 Feb 2026 22:15 SAST
--message
### Wed 25 Feb 2026 03:12 SAST
--message
### Wed 25 Feb 2026 03:11 SAST
--message
### Wed 25 Feb 2026 02:57 SAST
--message
### Wed 25 Feb 2026 02:51 SAST
--message
### Wed 25 Feb 2026 02:36 SAST
--message
### Wed 25 Feb 2026 02:31 SAST
--message
### Wed 25 Feb 2026 02:26 SAST
--message
### Wed 25 Feb 2026 00:44 SAST
--message
### Wed 25 Feb 2026 00:33 SAST
--message
### Tue 24 Feb 2026 23:55 SAST
--message
### Tue 24 Feb 2026 20:08 SAST
--message
### Tue 24 Feb 2026 20:03 SAST
--message
### Tue 24 Feb 2026 19:57 SAST
--message
### Tue 24 Feb 2026 19:28 SAST
--message
### Tue 24 Feb 2026 19:22 SAST
--message
### Tue 24 Feb 2026 19:12 SAST
--message
### Tue 24 Feb 2026 19:12 SAST
--message
### Tue 24 Feb 2026 19:10 SAST
--message
### Tue 24 Feb 2026 19:07 SAST
--message
### Tue 24 Feb 2026 19:02 SAST
--message
### Tue 24 Feb 2026 18:56 SAST
--message
### Tue 24 Feb 2026 18:35 SAST
--message
### Tue 24 Feb 2026 17:56 SAST
--message
### Tue 24 Feb 2026 05:19 SAST
--message
### Tue 24 Feb 2026 05:19 SAST
--message
### Tue 24 Feb 2026 04:10 SAST
--message
### Tue 24 Feb 2026 04:09 SAST
--message
### Tue 24 Feb 2026 04:08 SAST
--message
### Tue 24 Feb 2026 03:55 SAST
--message
### Tue 24 Feb 2026 03:49 SAST
--message
### Tue 24 Feb 2026 03:30 SAST
--message
### Tue 24 Feb 2026 03:24 SAST
--message
### Tue 24 Feb 2026 03:24 SAST
--message
### Tue 24 Feb 2026 03:11 SAST
User requested permanent memory. Created 2 new rules: auto-logging and auto-context-loading. Updated AGENTS.md with memory persistence section. Total 5 rules now active. ZeroClaw bot noted in AGENTS.md.
### Tue 24 Feb 2026 03:11 SAST
ZeroClaw Telegram bot built and tested successfully. Bot responds to /start, /status, /scan, /help commands. Token loaded from secrets. Ready to deploy as permanent service. Awaiting user choice: start now, make permanent, or add features first.
### Tue 24 Feb 2026 03:10 SAST
--message
### Thu 24 Feb 2026 03:09 SAST
User requested: "Remember everything"
- Created 2 new rules for memory persistence
- zo-memory logging now automatic after exchanges
- Vault context loading now automatic on conversation start
- Total rules: 5 (Smart Solver, Vault, iHhashi, zo-memory logging, Context loading)

### Tue 24 Feb 2026 03:06 SAST
User frustrated about AI forgetting context between sessions. Discussed memory persistence options: AGENTS.md files, Rules, zo-memory skill. Offered solutions to capture important information permanently. iHhashi project context: Launch 28 Feb 2026, 35% ready, 6 agents running.

---
*Last updated: 2026-02-25*