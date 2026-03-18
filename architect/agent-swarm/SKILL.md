# Agent Swarm System

## Purpose

Multi-agent orchestration for StoryChain using ClawTeam patterns. Spawn coordinated agent teams for complex story operations.

## Integration with StoryChain

This system embeds ClawTeam's agent swarm capabilities into StoryChain's file-tree architecture. Agents are spawned as ephemeral workers that read/write to the file system to complete tasks.

## Architecture

```
architect/agent-swarm/
├── SKILL.md                 # This file
├── soul/                    # Swarm personality
│   └── default.yaml         # Default swarm behavior
├── memory/                  # Task state & results
│   ├── active/              # Running tasks
│   ├── pending/             # Queued tasks
│   └── completed/           # Finished tasks
├── tools/                   # Agent capabilities
│   ├── story-creator.yaml   # Create stories
│   ├── story-continuer.yaml # Continue chains
│   ├── quality-checker.yaml # Moderate content
│   └── voter.yaml           # Vote on contributions
├── scripts/                 # Entry points
│   ├── spawn.ts             # Spawn agent team
│   ├── dispatch.ts          # Dispatch task
│   └── monitor.ts           # Monitor progress
└── tasks/                   # Task templates
    ├── create-story.toml    # Story creation team
    ├── moderate-story.toml  # Content moderation team
    └── analyze-story.toml   # Analytics team
```

## Agent Types

### 1. Story Creator
- Generates 300-character story openers
- Uses 7 persona types (adventure, romance, mystery, etc.)
- Outputs to `memory/active/{task-id}/story.yaml`

### 2. Story Continuer  
- Reads story chain from `memory/active/{task-id}/chain/`
- Writes 300-character continuation
- Validates against max_contributions limit

### 3. Quality Checker
- Moderates contributions for:
  - Length (exactly 300 chars)
  - Content appropriateness
  - Story coherence
- Writes verdict to `memory/active/{task-id}/verdict.yaml`

### 4. Voter
- Analyzes contribution quality
- Casts votes via API
- Logs votes to `memory/active/{task-id}/votes.yaml`

## Task Templates

Tasks define agent teams with dependencies. Format follows ClawTeam TOML spec adapted for StoryChain.

### Example: Create Story Team

```toml
# tasks/create-story.toml
[[agents]]
name = "opener-generator"
type = "story-creator"
model = "claude-opus-4-20250514"
prompt = "Generate a 300-character story opener..."
output = "memory/active/{task-id}/story.yaml"

[[agents]]
name = "quality-gate"
type = "quality-checker"
depends_on = ["opener-generator"]
model = "claude-opus-4-20250514"
input = "memory/active/{task-id}/story.yaml"
output = "memory/active/{task-id}/verdict.yaml"

[[agents]]
name = "publisher"
type = "story-publisher"
depends_on = ["quality-gate"]
if_verdict = "pass"
action = "POST /api/stories"
```

## Usage

### Spawn a Task

```bash
bun scripts/spawn.ts --task create-story --params '{"persona": "mystery"}'
```

### Monitor Progress

```bash
bun scripts/monitor.ts --task-id {id}
```

### Check Results

```bash
cat memory/completed/{task-id}/result.yaml
```

## File-Based Communication

Agents communicate via the file system:

1. **Task created** → `memory/pending/{task-id}/task.yaml`
2. **Agent spawned** → `memory/active/{task-id}/agents/{agent-name}/`
3. **Agent writes output** → `memory/active/{task-id}/{agent-name}/output.yaml`
4. **Dependencies resolved** → Next agent starts
5. **Task complete** → `memory/completed/{task-id}/result.yaml`

## Integration Points

### With Orchestrator System
- Orchestrator creates task files
- Agent-swarm executes via ClawTeam pattern
- Orchestrator moves completed stories to `data/stories/`

### With Quality Engine
- Quality agents use quality-checker.yaml tool
- Results feed back to orchestrator
- Failed content flagged for review

### With API Routes
- Agent actions map to API endpoints
- Agents can POST/GET via fetch
- Results stored in files for audit trail

## Rules

1. **No framework code** - Only YAML, markdown, and shell scripts
2. **File-first communication** - All state in files, never in memory
3. **One agent per file** - Each agent has its own output file
4. **Dependency chaining** - Tasks declare dependencies explicitly
5. **Immutable tasks** - Once complete, results are read-only

## Environment Variables

```bash
AGENT_SWARM_MAX_CONCURRENT=5      # Max parallel agents
AGENT_SWARM_DEFAULT_MODEL=claude-opus-4-20250514
AGENT_SWARM_LOG_LEVEL=info
```
