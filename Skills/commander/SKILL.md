---
name: commander
description: Master command agent that launches and coordinates other agents, skills, and automated tasks. Use to trigger multi-agent workflows, start scheduled tasks, or execute complex command sequences.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
---

# Commander

The master command agent that launches and coordinates other agents and automated tasks.

## Capabilities

- Launch and coordinate multiple agents in parallel
- Execute skill scripts with custom parameters
- Monitor agent health and status
- Orchestrate complex multi-step workflows
- Trigger scheduled tasks on demand

## Commands

### `launch <target> [params]`
Launch a specific agent or skill.

```bash
bun scripts/commander.ts launch orchestra "Implement payment routes"
bun scripts/commander.ts launch bankr "Check portfolio"
bun scripts/commander.ts launch trading-bot "Start trading"
```

### `status`
Check status of all active agents.

```bash
bun scripts/commander.ts status
```

### `list`
List all available agents and skills.

```bash
bun scripts/commander.ts list
```

### `exec <command>`
Execute a shell command.

```bash
bun scripts/commander.ts exec "ls -la"
```

## Available Agents

| Agent | Description |
|-------|-------------|
| orchestra | Agent Orchestra - coordinates ShieldGuard, BugHunter, DocMaster, Obsidian |
| bankr | Crypto trading and wallet management |
| trading-bot | Autonomous cryptocurrency trading |
| conway-agent | Conway Research AI agent ecosystem |
| clawrouter-leadership | Clawrouter trading leadership |

## Usage

Commander acts as the central hub for launching and monitoring all agent activities in the workspace.