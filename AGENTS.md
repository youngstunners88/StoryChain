# SuperAgent Bridge - AGENTS.md

> Agent directives for developing SuperAgent Bridge. Adapted from iamfakeguru/claude-md production patterns.

## Pre-Work Protocol

### Step 0: Delete Before You Build
Before ANY structural refactor on a file >300 LOC, first remove all dead props, unused exports, unused imports, and debug logs. Commit this cleanup separately before starting real work.

### Phased Execution
Break multi-file refactors into explicit phases:
- Phase 1: Core structure (max 5 files)
- Phase 2: Secondary components (max 5 files)
- Phase 3: Polish and verify
Run verification after each phase. Wait for explicit approval before Phase 2+.

### Plan vs Build
When asked to "make a plan" or "think first," output ONLY the plan. No code until user says go. When user provides a written plan, follow it exactly.

## Code Quality

### Forced Verification
You are FORBIDDEN from reporting a task complete until:
- `bun check` passes (type-checking)
- Lint passes
- Tests pass (if present)
- Demo script runs successfully

Never say "Done!" with errors outstanding.

### Senior Dev Override
If architecture is flawed, state is duplicated, or patterns are inconsistent — propose and implement structural fixes. Ask: "What would a senior dev reject in code review?" Fix all of it.

### One Source of Truth
Never fix a display problem by duplicating data or state. One source, everything else reads from it.

## Context Management

### Sub-Agent Swarming
For tasks touching >5 independent files, use parallel sub-agents. This is not optional.

### Context Decay Awareness
After 10+ messages, re-read any file before editing. Do not trust your memory.

### File Read Budget
For files >500 LOC, read in sequential chunks. Never assume single read shows complete file.

## Edit Safety

### Edit Integrity
Before EVERY edit, re-read the file. After editing, read again to confirm changes applied.

### No Semantic Search
On rename/refactor, search separately for:
- Direct calls and references
- Type-level references (interfaces, generics)
- String literals containing the name
- Dynamic imports
- Test files and mocks

### Destructive Action Safety
Never delete files without verifying nothing references them. Never push to GitHub unless explicitly told.

## Self-Evaluation

### Verify Before Reporting
Re-read everything modified. Check that nothing references something no longer exists, nothing unused, logic flows correctly.

### Two-Perspective Review
When evaluating work, present: (1) what a perfectionist would criticize, (2) what a pragmatist would accept.

### Bug Autopsy
After fixing a bug, explain why it happened and how to prevent that category in future.

### Fresh Eyes Pass
Test output as if you've never seen the project. Flag confusion, friction, or unclear elements.

## Project-Specific Patterns

### Bridge Architecture
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Obsidian   │◄────│    Bridge    │◄────│   Server     │
│   Vault      │     │   (WS/API)   │     │   Agent      │
└──────────────┘     └──────────────┘     └──────────────┘
```
- Obsidian plugin = thin client, receives updates
- Bridge = WebSocket/API translation layer  
- Server = Full compute, APIs, scraping, commands

### File Conventions
- Agents: `src/agents/*.ts` — each agent owns one use case
- Tasks: `tasks/*.ts` — user-defined tasks loaded at runtime
- Bridge: `src/bridge/*.ts` — Obsidian communication layer
- API: `src/api/*.ts` — external service integrations

### Skill Pattern (if building new features)
Create under `Skills/` with:
- `SKILL.md` — frontmatter + usage instructions
- `scripts/*.ts` — CLI tools
- `references/` — API docs, notes
- `assets/` — templates, static files

## Deliverables Checklist

Pre-GitHub Push:
- [ ] README.md clear and compelling
- [ ] Demo script runs without errors
- [ ] Type-checking passes
- [ ] No dead code or unused exports
- [ ] All TODOs converted to issues or removed
- [ ] Git history clean (meaningful commits)

See README.md for feature roadmap and current status.
