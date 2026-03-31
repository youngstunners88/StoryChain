# CLAUDE.md Patterns Analysis

Comparing iamfakeguru/claude-md production patterns against SuperAgent Bridge's current CAPABILITIES.md.

## What CLAUDE.md Emphasizes (That We Can Adopt)

| CLAUDE.md Pattern | Current State | Gap/Opportunity |
|-------------------|---------------|-----------------|
| **Forced Verification** (type-check, lint, tests before "done") | Demo script exists but no enforcement | Add pre-push checks to AGENTS.md |
| **Phased Execution** (max 5 files per phase) | Not documented | Use for large refactors |
| **Sub-Agent Swarming** (parallel agents for >5 files) | Not mentioned | Document in AGENTS.md for scale work |
| **Context Decay Awareness** (re-read after 10+ messages) | Not documented | Critical for long dev sessions |
| **File Read Budget** (chunk reads for >500 LOC) | Not documented | Prevent stale context bugs |
| **Edit Integrity** (re-read before/after all edits) | Not documented | Prevents silent edit failures |
| **No Semantic Search** (manual multi-pattern search) | Not documented | Critical for renames in TypeScript |
| **Two-Perspective Review** | Not documented | Good for polishing docs |
| **Bug Autopsy** | Not documented | Build institutional knowledge |
| **Fresh Eyes Pass** | Not documented | Good for UX/Demo polish |

## What CAPABILITIES.md Already Covers Well

- **Clear differentiation** — Obsidian Skills vs SuperAgent Bridge table
- **Technical architecture** — Visual diagrams
- **Real-world use cases** — 3 concrete examples
- **Monetization strategy** — Clear revenue streams

## What We Could Add (Borrowed from CLAUDE.md Style)

### 1. Problem/Solution Table Format
CLAUDE.md uses clean tables showing Problem → Root Cause → Directive.

We could add to CAPABILITIES.md:

| Obsidian Skills Limitation | Why It Exists | Our Solution |
|----------------------------|---------------|--------------|
| No external APIs | JavaScript sandbox | Server-side proxy |
| No scheduling | No cron in browser | Persistent server process |
| Single-threaded | No threading in JS | Bun multi-threading |

### 2. Explicit "Can't Do" Statements
CLAUDE.md is unapologetic about failures: "Follow them or produce garbage — there is no middle ground."

Our docs could be more direct:
"Obsidian Skills CANNOT access external APIs. Not a limitation we work around — an architectural impossibility."

### 3. Tool Limitations Callouts
CLAUDE.md documents tool constraints:
- "File reads capped at 2,000 lines"
- "Tool results truncated to 2,000-byte preview"

We should document our bridge constraints similarly.

## Priority Adoptions

**Must Adopt:**
1. Forced Verification — prevents "done but broken" bug
2. Context Decay Awareness — critical for long coding sessions
3. Edit Integrity — prevents silent failures

**Should Adopt:**
4. Phased Execution — helps user understand multi-step refactors
5. Sub-Agent Swarming — explains how we scale work
6. Two-Perspective Review — good for final polish

**Nice to Have:**
7. Bug Autopsy — builds knowledge over time
8. Fresh Eyes Pass — helps with demo quality

## Updated File Inventory

Post-integration, SuperAgent Bridge should have:

```
obsidian-agent-bridge/
├── AGENTS.md              ✓ Production agent directives
├── CAPABILITIES.md        ✓ Competitive analysis
├── README.md              ✓ High-level pitch
├── docs/
│   ├── go-to-market.md    ✓ Already exists
│   ├── monetization.md    ✓ Already exists
│   └── claude-patterns-analysis.md  ✓ This file
└── src/
    └── demo-superiority.ts  ✓ Capability demo
```

## Conclusion

Current state: **Strong competitive analysis, weak execution guidance.**

CLAUDE.md fills the gap with production-ready development disciplines:
- Verification before reporting success
- Context management techniques
- Safe edit patterns
- Self-evaluation frameworks

These are **agent-side** concerns (how we build) that complement the existing **product-side** docs (what we're building).

**Recommendation:** Keep CAPABILITIES.md focused on product/market differentiation. Use AGENTS.md for development discipline (incorporating CLAUDE.md patterns). This document captures the synthesis.
