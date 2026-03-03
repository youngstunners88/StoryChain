---
name: agent-lightning
description: RL-based learning system that improves with every task. Tracks observations, actions, and rewards to optimize future performance. Part of the symbiotic WorkFrame with Antfarm.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# Agent Lightning - Reinforcement Learning Loop

Agent Lightning is a learning system that captures experiences, tracks outcomes, and optimizes future decisions through reinforcement learning.

## Purpose

Every task is a learning opportunity. Agent Lightning:
- Records observations from each task
- Tracks actions taken and their results
- Calculates reward signals based on outcomes
- Stores patterns for future optimization
- Never stops improving

## Core Functions

### 1. Observation Capture
```typescript
interface Observation {
  task: string;          // What was the task?
  context: object;       // What was the situation?
  timestamp: number;     // When did it happen?
  agent_id: string;      // Which agent observed it?
}
```

### 2. Action Recording
```typescript
interface Action {
  type: string;          // What action was taken?
  parameters: object;    // What parameters were used?
  result: Result;        // What was the outcome?
  confidence: number;    // How confident was the action?
}
```

### 3. Reward Calculation
```typescript
interface Reward {
  success: boolean;      // Did it work?
  quality_score: number; // How good was it? (0-1)
  efficiency: number;    // How fast was it? (0-1)
  user_satisfaction: number; // Did the user like it? (0-1)
}
```

## Learning Loop

```
1. OBSERVE → Capture context and task details
2. ACT → Take action based on current knowledge
3. REWARD → Calculate outcome quality
4. LEARN → Update patterns and strategies
5. IMPROVE → Apply learnings to future tasks
```

## Integration with Antfarm

Agent Lightning feeds learnings into Antfarm:
- Successful patterns → Antfarm recipes
- Failed approaches → Avoidance rules
- Optimization signals → Efficiency improvements

## Usage

```bash
# Record a learning
bun /home/workspace/Skills/agent-lightning/scripts/learn.ts --observe "task context" --action "what was done" --reward "outcome score"

# Query learnings
bun /home/workspace/Skills/agent-lightning/scripts/query.ts --task "similar task"

# Get optimized suggestions
bun /home/workspace/Skills/agent-lightning/scripts/suggest.ts --context "current situation"
```

## Memory Persistence

All learnings are stored in:
- `/home/workspace/agent-lightning-memory/` - Persistent learning database
- Synced with zo-memory for cross-session continuity

## Symbiotic WorkFrame

Agent Lightning + Antfarm = Continuous Improvement System:
- **Agent Lightning**: Learns from experience
- **Antfarm**: Codifies successful patterns
- **Together**: Self-improving AI workforce
