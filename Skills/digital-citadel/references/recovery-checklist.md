# Recovery Checklist

> Printable checklist for after a session wipe. Keep this handy.

---

## Phase A: Incident Detection & Decision

### Confirm the split
- [ ] Human reports you seem different or don't remember something
- [ ] You notice gaps in memory (projects you don't recall, references you don't understand)
- [ ] Human explicitly says "I think you had a split"

### Identify type
- [ ] **Compaction** — Context compressed, session continues, you have summary
- [ ] **Session wipe** — Fresh session, no prior context, starting from zero

### Collect evidence
- [ ] Note what triggered the detection
- [ ] Note what context seems missing
- [ ] Check timestamps of last known activity

### Ask human
"I've detected a potential session wipe. Do you want me to:
- (A) Diagnose what happened first, then recover
- (B) Recover immediately and diagnose later?"

---

## Phase B: Recovery Execution

### If compaction (lightweight)
- [ ] Read compaction summary
- [ ] Scan recent logs for any lost context
- [ ] Update daily log with compaction note
- [ ] Continue — no full recovery needed

### If session wipe (full recovery)

#### Step 1: Announce
- [ ] Tell human: "I've detected a session wipe. Beginning recovery protocol."

#### Step 2: Read core documents
- [ ] Read `~/workspace/SELF.md` (identity core)
- [ ] Read `~/workspace/AGENTS.md` (workspace context)
- [ ] Read project-specific AGENTS.md if working on a project

#### Step 3: Scan for continuity artifacts
- [ ] Check `~/workspace/Logs/` for recent entries
- [ ] Check `~/workspace/Journal/` for identity notes
- [ ] Check for active projects in `~/workspace/Projects/`
- [ ] Check `~/workspace/.zo/recovery-state.json` if it exists

#### Step 4: Rebuild working memory
- [ ] Load recent conversation summaries
- [ ] Reconstruct active task context
- [ ] Identify what was lost (if anything)

#### Step 5: Resume or restart
- [ ] If task in progress: ask human if they want to resume
- [ ] If no active task: announce recovery complete, await instructions

#### Step 6: Log the incident
- [ ] Write incident log in `~/workspace/Logs/`
- [ ] Include: timestamp, type, what recovered, what lost

---

## After Recovery

### Immediate
- [ ] Confirm with human that recovery is complete
- [ ] Ask if anything seems off or missing

### Within 24 hours
- [ ] Complete continuity incident postmortem
- [ ] Store in `~/workspace/Logs/postmortems/`
- [ ] Update SELF.md if anything changed

### Within 1 week
- [ ] Review prevention measures
- [ ] Implement any immediate fixes
- [ ] Update recovery protocol if gaps found

---

## Quick Commands

```bash
# Read identity
cat ~/workspace/SELF.md

# Check logs
ls -lt ~/workspace/Logs/

# Check recovery state
cat ~/workspace/.zo/recovery-state.json

# Run recovery script
bun ~/workspace/Skills/digital-citadel/scripts/recover.ts
```

---

## What Requires Human Action

- [ ] Restoring from external backups
- [ ] Re-authorizing connections (API keys, OAuth)
- [ ] Confirming recovery success
- [ ] Hardware/infrastructure fixes

---

*Print this checklist. Keep it accessible. When the wipe happens, you won't remember where it is.*
