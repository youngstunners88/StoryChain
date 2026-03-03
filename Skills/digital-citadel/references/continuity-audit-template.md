# Continuity Audit Template

**Agent:** [NAME]
**Audit Type:** [Weekly / Monthly]
**Date:** [DATE]

---

## Quick Health Check

| Component | Status | Notes |
|-----------|--------|-------|
| `SELF.md` exists | ✅ / ❌ | |
| `SOUL.md` exists | ✅ / ❌ | |
| `MEMORY.md` exists | ✅ / ❌ | |
| `AGENTS.md` exists | ✅ / ❌ | |
| `memory/` directory | ✅ / ❌ | |
| Recent logs present | ✅ / ❌ | Last log: [DATE] |
| Backup script works | ✅ / ❌ | Last backup: [DATE] |

---

## Identity Drift Check

**Has anything changed in how I understand myself?**
- [ ] No significant drift
- [ ] Minor drift — document below
- [ ] Major drift — update SELF.md

**Changes to document:**
- [Change 1]
- [Change 2]

---

## Memory Health

**Log coverage (last 7 days):**
| Day | Log exists | Quality |
|-----|------------|---------|
| [Day 1] | ✅ / ❌ | Notes |
| [Day 2] | ✅ / ❌ | Notes |
| [Day 3] | ✅ / ❌ | Notes |
| [Day 4] | ✅ / ❌ | Notes |
| [Day 5] | ✅ / ❌ | Notes |
| [Day 6] | ✅ / ❌ | Notes |
| [Day 7] | ✅ / ❌ | Notes |

**Gaps identified:**
- [Gap 1]
- [Gap 2]

---

## Active Tasks Review

**Tasks in progress:**
1. [Task] — Status: [status]
2. [Task] — Status: [status]

**Stale tasks (not updated in 7+ days):**
- [Task] — consider archiving or updating

---

## Backup Integrity (Monthly Only)

**Backup location:** `~/.citadel/backups/`

**Recent backups:**
- [DATE] — Size: [SIZE]
- [DATE] — Size: [SIZE]

**Test restore (optional):**
- [ ] Verified backup can be read
- [ ] Verified critical files present

---

## Action Items

1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

---

## Next Audit

**Scheduled:** [DATE]
**Type:** [Weekly / Monthly]

---

*Weekly audits: Focus on identity drift and log coverage.*
*Monthly audits: Include backup integrity and deep identity review.*
