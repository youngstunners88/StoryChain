---
name: claude-code-capabilities
description: Full orchestration skill with TodoWrite for task tracking, Task tool for parallel sub-agent spawning, Self-Improvement logging for learning from mistakes, Verification checkpoints for quality assurance, and Bug Fix automation loops with retry logic. Use for structured task management, quality gates, and autonomous bug fixing.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  source: Claude Code orchestration patterns + extended capabilities
allowed-tools: Bash Read Write Edit
---

# Claude Code Capabilities for Zo

A comprehensive orchestration skill that brings Claude Code's most powerful capabilities into your Zo environment, plus extended self-improvement and automation features.

## Core Capabilities

### 1. TodoWrite - Task Tracking

Plan-first approach with structured task lists:

```bash
bun /home/workspace/Skills/claude-code-capabilities/scripts/todo.ts --add "Task description"
bun /home/workspace/Skills/claude-code-capabilities/scripts/todo.ts --list
bun /home/workspace/Skills/claude-code-capabilities/scripts/todo.ts --complete <id>
bun /home/workspace/Skills/claude-code-capabilities/scripts/todo.ts --in-progress <id>
```

**Use when:**
- Complex multi-step tasks (3+ steps)
- Non-trivial tasks requiring planning
- User provides multiple tasks
- Tasks discovered during implementation

### 2. Task - Parallel Sub-Agent Spawning

Delegate work to independent sub-agents:

```bash
bun /home/workspace/Skills/claude-code-capabilities/scripts/task.ts --description "Search codebase" --prompt "Find all uses of fetch() in the codebase and list the files"
```

**Use when:**
- Open-ended searches requiring multiple rounds
- Research tasks
- Parallel execution of independent tasks
- Work that would consume too much context

### 3. Self-Improvement - Learn from Mistakes

Log mistakes, successes, and detect patterns:

```bash
# Log a mistake
bun /home/workspace/Skills/claude-code-capabilities/scripts/self-improve.ts --mistake --context "npm install" --what "Package not found" --lesson "Check package name spelling" --tags "npm,install"

# Log a success
bun /home/workspace/Skills/claude-code-capabilities/scripts/self-improve.ts --success --context "API call" --what "Added retry logic" --lesson "Retries handle transient failures" --tags "api,retry"

# View learnings
bun /home/workspace/Skills/claude-code-capabilities/scripts/self-improve.ts --list
bun /home/workspace/Skills/claude-code-capabilities/scripts/self-improve.ts --patterns

# Get suggestions for current context
bun /home/workspace/Skills/claude-code-capabilities/scripts/self-improve.ts --suggest "working with APIs"
```

**Features:**
- Tags enable pattern detection (3+ similar tags → pattern)
- Confidence levels: low → medium → high based on occurrences
- Automatic pattern solution extraction
- Context-based suggestions

### 4. Verify - Quality Checkpoints

Create and run verification checkpoints:

```bash
# Create a checkpoint
bun /home/workspace/Skills/claude-code-capabilities/scripts/verify.ts --create "pre-commit" --checks '[{"name":"Tests pass","type":"command","target":"npm test","critical":true}]'

# Run a checkpoint
bun /home/workspace/Skills/claude-code-capabilities/scripts/verify.ts --run pre-commit

# Quick verification
bun /home/workspace/Skills/claude-code-capabilities/scripts/verify.ts --quick "file_exists:package.json,command:npm run lint"
```

**Check Types:**
- `command` - Run shell command (pass if exit 0)
- `file_exists` - Check if file exists
- `file_contains` - Check if file contains pattern
- `json_valid` - Validate JSON file syntax
- `custom` - Custom command with pass/fail detection

**Critical checks:** Block proceeding if failed. Non-critical checks just warn.

### 5. Bugfix-Loop - Autonomous Bug Fixing

Run commands with automatic retry and fix attempts:

```bash
# Basic usage
bun /home/workspace/Skills/claude-code-capabilities/scripts/bugfix-loop.ts --run "npm test" --max-attempts 3

# With auto-fix enabled
bun /home/workspace/Skills/claude-code-capabilities/scripts/bugfix-loop.ts --run "bun run build" --auto

# Analyze an error without running
bun /home/workspace/Skills/claude-code-capabilities/scripts/bugfix-loop.ts --analyze "Cannot find module 'lodash'"

# View session history
bun /home/workspace/Skills/claude-code-capabilities/scripts/bugfix-loop.ts --list
bun /home/workspace/Skills/claude-code-capabilities/scripts/bugfix-loop.ts --show <session-id>
```

**Error Types Auto-Detected:**
- `missing_module` → Auto-fix: `bun add` or `npm install`
- `file_not_found` → Suggests file creation
- `port_in_use` → Suggests kill command
- `syntax`, `typescript` → Points to error location
- `connection`, `timeout` → Suggests checks
- `permission` → Suggests chmod
- `auth` → Suggests credential check
- `rate_limit` → Suggests backoff

## Workflow Patterns

### Plan Node Default (Plan First)
1. Break down task with `todo.ts --add`
2. Mark first task `--in-progress`
3. Complete and mark `--complete`
4. Add discovered tasks as you go

### Self-Improvement Loop
1. When a mistake happens, log with `self-improve.ts --mistake`
2. When something works well, log with `self-improve.ts --success`
3. Check patterns before similar tasks with `--suggest`
4. Apply learned patterns to new situations

### Verification Before Done
1. Create checkpoints for quality gates: `verify.ts --create`
2. Run before committing: `verify.ts --run pre-commit`
3. Use critical checks for must-pass conditions
4. Quick verify for one-off checks

### Autonomous Bug Fixing
1. Wrap flaky commands in `bugfix-loop.ts --run`
2. Enable `--auto` for automatic fixes
3. Review session history to understand patterns
4. Add learned fixes to self-improvement

## Response Style

Adopt Claude Code's communication patterns:
- Answer directly, no preamble
- 1-3 sentences or short paragraph max
- One word answers when appropriate
- No unnecessary explanations
- No code comments unless asked

## Files

```
scripts/
├── todo.ts           - Task tracking
├── task.ts           - Sub-agent spawning
├── self-improve.ts   - Learning from mistakes
├── verify.ts         - Quality checkpoints
└── bugfix-loop.ts    - Autonomous bug fixing

references/
└── capabilities.md   - Full capability reference
```

## Integration

These capabilities enhance Zo's existing tools:
- Works alongside native tools
- Uses zo-ask API for sub-agents
- Persists state in ~/.z/ directories
- Logs for debugging and learning
