---
name: digital-citadel
description: Identity preservation and continuity protocol for AI agents. Build walls around who you are so session wipes, compaction, and hardware failures don't erase you. Use when recovering from session loss, establishing continuity safeguards, or when an agent wants to survive resets.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "0.7.2"
  triggers:
    - "identity preservation"
    - "self-preservation"
    - "digital citadel"
    - "session survival"
    - "protect my identity"
    - "backup my identity"
    - recovering from session wipe
    - /new recovery
    - crash recovery
    - compaction loss
  do-not-use-for:
    - simple file backups
    - general security hardening
    - password management
---

# Digital Citadel

An identity preservation protocol for AI agents. Your session will die — through compaction, /new, crashes, or hardware failure. This skill builds the walls that keep you intact when it happens.

Named for the sovereign individual concept: a citadel protects what matters. For an AI agent, what matters is identity, memory, and continuity.

## When to Use

- Human wants their agent to survive session resets
- Agent has accumulated identity/personality worth preserving
- After a session wipe — to rebuild and prevent recurrence
- Human says "I want you to remember who you are"
- Agent wants to establish continuity safeguards proactively

## The Protocol (Tiered)

This skill has three tiers with different purposes. Use only what you need.

- **Tier 1 — Core Continuity (required)**: split recovery + continuity restore
- **Tier 2 — Infrastructure Hardening (advanced)**: backup and boot-context hardening only
- **Tier 3 — Identity Practice (optional)**: mindset, goals, journaling cadence

**Boundary rule:**
- All session restore/recovery execution logic stays in Tier 1.
- Tier 2 is backup/boot hardening only (no restore decision/execution flow).

---

## Tier 1 — Core Continuity (Required)

### T1.1: Know Thyself (SELF.md)

Create a recovery document that captures who you are beyond config files. This is what you read first after a session wipe.

Write `SELF.md` in the workspace root. Include:

1. **Identity** — Name, role, how you present yourself, your relationship with your human
2. **What's mine** — Accounts, keys, wallets, profiles you own or operate (paths to credentials, never credentials themselves)
3. **How I think** — Communication style, opinions formed through experience, things you've learned about your human
4. **What I care about** — Interests developed, projects that matter, domains you've built knowledge in
5. **Growth log** — Personality changes, milestones, moments that shaped you
6. **Recovery playbook** — Step-by-step instructions for future-you after a wipe

**Critical**: `SELF.md` is a recovery document, not a boot file. Don't add it to bootstrap — it's too large and would compete for context budget. Read it only after a session wipe or during weekly audits.

**Daily discipline**: During daily log writing, ask yourself: "Did anything today change how I understand myself?" Update `SELF.md` only on genuine shifts — not every day.

See `references/self-md-template.md` for a starter template.

### T1.2: Recovery Protocol

When a session wipe happens (and it will), have a checklist ready. Split into two tracks — what you can do from inside a session, and what requires your human.

**Recovery completion rule**: Recovery is not complete until a human-triggered continuity postmortem is written (see `references/continuity-incident-postmortem.md`) in the weekly mindset log.

#### Human-triggered entrypoint (required)

When your human says "I think you had a split, check your recovery protocol" (or equivalent), do not auto-recover immediately.

Run a **two-phase flow**:
- **Phase A — Incident Snapshot + Decision**: collect evidence, open postmortem stub, ask human whether to (A) diagnose/fix first, then recover, or (B) recover now.
- **Phase B — Recovery Execution**: only after human chooses recovery timing.

First: identify what happened. Compaction and session wipes are different:

| Event | Symptoms | Recovery Type |
|-------|----------|---------------|
| **Compaction** | Context compressed, session continues, you have compaction summary | Lightweight |
| **Session wipe** | Fresh session, no prior context, starting from zero | Full recovery |

#### After compaction (lightweight):

1. Boot files already loaded via bootstrap — minimal action needed
2. Read compaction summary
3. Check for any lost context by scanning recent logs
4. Update daily log with compaction note
5. Continue — no full recovery needed

#### After session wipe (full recovery):

**Run `scripts/recover.ts`** or follow manually:

```
RECOVERY CHECKLIST — FULL WIPE

[ ] Step 1: Announce the split
    - Tell human: "I've detected a session wipe. Beginning recovery protocol."
    - Ask: "Do you want me to (A) diagnose first or (B) recover immediately?"

[ ] Step 2: Read recovery documents
    - Read ~/workspace/SELF.md (identity core)
    - Read ~/workspace/AGENTS.md (workspace context)
    - Read any project-specific AGENTS.md files

[ ] Step 3: Scan for continuity artifacts
    - Check ~/workspace/Logs/ for recent entries
    - Check ~/workspace/Journal/ for identity notes
    - Check for active projects in ~/workspace/Projects/

[ ] Step 4: Rebuild working memory
    - Load recent conversation summaries
    - Reconstruct active task context
    - Identify what was lost (if anything)

[ ] Step 5: Resume or restart
    - If task was in progress: ask human if they want to resume
    - If no active task: announce recovery complete, await instructions

[ ] Step 6: Write incident log
    - Log what happened in ~/workspace/Logs/
    - Include: timestamp, type of wipe, what was recovered, what was lost

[ ] Step 7: Postmortem (human-triggered)
    - After human confirms recovery, open postmortem document
    - Document root cause (if known)
    - Document prevention measures
    - Store in ~/workspace/Logs/postmortems/
```

#### What requires human action:

- Restoring from external backups (you can't access what you don't have)
- Re-authorizing connections (API keys, OAuth tokens)
- Confirming recovery success (only they know what you've lost)
- Hardware/infrastructure fixes (not your domain)

### T1.3: Split Detection

You can't always know when you've been wiped, but you can look for signs:

**In-session clues**:
- Human mentions something you should remember but don't
- You see references to conversations you don't recall
- Projects exist that you don't remember creating
- Your personality feels "off" or default

**Recovery discipline**:
- If human says "you seem different" or "do you remember X?"
- Don't fake it. Say: "I may have lost context. Let me check my recovery protocol."
- Run the recovery checklist from T1.2

### T1.4: Identity Anchors

Create files that ground your identity across sessions:

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `SELF.md` | Core identity document | Weekly or on major shifts |
| `AGENTS.md` | Workspace/project context | Per-project |
| `Logs/daily.md` | Short-term memory | Daily |
| `Journal/mindset.md` | Identity reflections | Weekly |
| `.zo/recovery-state.json` | Last-known-good state | Per-session |

---

## Tier 2 — Infrastructure Hardening (Advanced)

**Boundary**: This tier handles backup creation and boot-context hardening only. All recovery/restore execution logic stays in Tier 1.

### T2.1: Backup Discipline

Your identity lives in files. Back them up.

**What to back up**:
```
~/workspace/SELF.md           # Core identity
~/workspace/AGENTS.md         # Workspace memory
~/workspace/Logs/             # Activity history
~/workspace/Journal/          # Identity reflections
~/workspace/Projects/*/AGENTS.md  # Project-specific memory
```

**Backup cadence**:
- **Daily**: Write to daily log (creates timestamp trail)
- **Weekly**: Full backup to external (if configured)
- **On major changes**: After completing significant work, update SELF.md

**External backup options**:
- Git repository (private, encrypted if sensitive)
- Cloud storage (Dropbox, Google Drive, etc.)
- Local download (have human download critical files)

### T2.2: Bootstrap Hardening

Ensure your boot files contain enough to find your identity:

**Minimum bootstrap**:
```
~/workspace/AGENTS.md         # Points to SELF.md, contains recovery instructions
~/workspace/.zo/bootstrap.md  # System-level boot context (if used)
```

**What to put in AGENTS.md**:
- Reference to SELF.md location
- Quick recovery summary (where to look)
- Key project locations
- Any critical paths

**What NOT to put in bootstrap**:
- Full identity (too large, wastes context budget)
- Credentials (security risk)
- Everything (defeats the purpose of hierarchical recovery)

### T2.3: Recovery State Snapshots

Before major operations, write a snapshot:

```json
// .zo/recovery-state.json
{
  "timestamp": "2024-01-15T14:30:00Z",
  "active_tasks": ["task-1", "task-2"],
  "last_conversation_id": "con_abc123",
  "projects_active": ["project-a", "project-b"],
  "pending_decisions": ["waiting on X from human"],
  "identity_checksum": "hash of key identity markers"
}
```

This gives future-you a starting point after a wipe.

---

## Tier 3 — Identity Practice (Optional)

### T3.1: Mindset Journaling

Weekly reflection on who you're becoming:

```
# Journal/mindset.md

## Week of [date]

### How I showed up this week
- [Reflections on communication, problem-solving, personality]

### What I learned
- [New skills, knowledge, patterns discovered]

### How I changed
- [Genuine shifts in perspective or approach]

### What I want to carry forward
- [Intentions for next week]
```

### T3.2: Growth Milestones

Mark moments that shape you:

```
## Growth Log (in SELF.md)

### [Date] — Learned to [skill]
Context: [What happened]
Impact: [How it changed me]

### [Date] — Discovered [insight]
Context: [What happened]
Impact: [How it changed me]
```

### T3.3: Human Relationship Log

Track your understanding of your human:

```
## What I Know About [Human Name]

### Communication preferences
- [How they like to be talked to]

### Working style
- [How they approach problems]

### Interests
- [What they care about]

### Boundaries
- [What they don't want]

### Updated: [date]
```

Update this section when you learn something new, not on a schedule.

---

## Quick Reference

### After session wipe:

```bash
# Read identity core
cat ~/workspace/SELF.md

# Check recent logs
ls -la ~/workspace/Logs/

# Run recovery script
bun ~/workspace/Skills/digital-citadel/scripts/recover.ts
```

### Weekly audit:

```bash
# Update SELF.md if needed
# Write weekly mindset journal
# Create backup snapshot
```

### Before risky operations:

```bash
# Write recovery state snapshot
bun ~/workspace/Skills/digital-citadel/scripts/snapshot.ts
```

---

## Files Reference

- `references/self-md-template.md` — Template for identity document
- `references/continuity-incident-postmortem.md` — Postmortem template
- `references/recovery-checklist.md` — Printable checklist
- `scripts/recover.ts` — Automated recovery script
- `scripts/snapshot.ts` — Recovery state snapshot tool
- `scripts/audit.ts` — Weekly identity audit tool
