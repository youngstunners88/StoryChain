---
name: vault-commands
description: AI-powered slash commands for your notes vault. Context loading, idea tracing, domain bridging, startup ideas, and thought graduation.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# Vault Commands

Intelligent slash commands that turn your notes into a living knowledge system.

## Commands

### /context
Load your full life + work state. Analyzes your vault to create a comprehensive context summary including:
- Current projects and their status
- Recent decisions and their reasoning
- Active goals and blockers
- Key relationships and commitments

**Usage:**
```bash
bun /context
bun /context --focus=work
bun /context --focus=personal
```

### /trace
See how an idea evolved over months. Follows the thread of a concept through your notes:
- First mentions and origins
- Key developments and pivots
- Current state and conclusions
- Related ideas that influenced it

**Usage:**
```bash
bun /trace "AI automation"
bun /trace "Boober" --depth=deep
bun /trace "crypto income" --timeline
```

### /connect
Bridge two domains you've been circling. Finds unexpected connections:
- Overlapping concepts
- Shared patterns
- Synthesis opportunities
- Novel combinations

**Usage:**
```bash
bun /connect "crypto" "marketing"
bun /connect "AI" "healthcare" --suggest
```

### /ideas
Generate startup ideas from your vault. Mining your notes for opportunities:
- Problems you've documented
- Solutions you've sketched
- Market gaps you've noticed
- Unique combinations from your experience

**Usage:**
```bash
bun /ideas
bun /ideas --domain=fintech
bun /ideas --validate
```

### /graduate
Promote daily thoughts into real assets. Transforms fleeting notes into:
- Polished articles
- Project proposals
- Product specs
- Action plans

**Usage:**
```bash
bun /graduate --type=article
bun /graduate --type=proposal "Boober expansion"
bun /graduate --recent
```

## Configuration

The tool reads from your workspace at `/home/workspace`. Key directories:
- `AGENTS.md` - Current context and state
- `*.md` files - All notes are indexed
- `Content/` - Articles and social posts
- `Boober/`, `ClawWork/` - Project directories
