---
name: agent-orchestra
description: Master orchestrator that coordinates ShieldGuard (security), BugHunter (testing), DocMaster (documentation), and Obsidian (knowledge) agents in synchronicity for complex multi-agent tasks.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
  agents:
    - shieldguard
    - bughunter
    - docmaster
    - obsidian
---

# Agent Orchestra

The conductor that synchronizes all specialized agents for complex development tasks.

## Agents

### ShieldGuard
Security-first agent that:
- Scans code for vulnerabilities
- Validates API keys and secrets handling
- Enforces security best practices
- Reviews authentication/authorization
- Checks input validation

### BugHunter
Quality assurance agent that:
- Writes comprehensive tests
- Finds edge cases and bugs
- Validates error handling
- Performance testing
- Integration test generation

### DocMaster
Documentation agent that:
- Generates API documentation
- Updates README files
- Creates code comments
- Maintains CHANGELOG
- Generates type definitions

### Obsidian
Knowledge management agent that:
- Updates Obsidian vault
- Creates daily logs
- Links related concepts
- Tracks decisions
- Maintains architecture docs

## Commands

### `conduct <task>`
Orchestrate all agents for a task.

```bash
bun scripts/orchestra.ts conduct "Implement order routes with full CRUD"
```

### `sync`
Synchronize all agent outputs.

```bash
bun scripts/orchestra.ts sync
```

### `status`
Check agent health and task progress.

```bash
bun scripts/orchestra.ts status
```

## Usage Pattern

When working on iHhashi or complex projects:

1. **ShieldGuard** reviews security first
2. **BugHunter** identifies test requirements
3. **DocMaster** documents as you build
4. **Obsidian** records decisions and links

All agents work in parallel, then Orchestra synthesizes outputs.
