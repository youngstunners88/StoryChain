# Vault Memory Skill

Your Obsidian vault is extended memory. Access it autonomously to:
- Load context proactively
- Trace idea evolution
- Bridge domains
- Surface relevant thinking

## Commands

### `/context` - Full State Load
When: Conversation starts, major topic shift
Returns: Active projects, top themes, recent files

### `/trace <topic>` - Idea Evolution
When: Project or concept mentioned
Returns: First mention → evolution → latest state

### `/connect <domain1> <domain2>` - Bridge Insights
When: Two domains discussed together
Returns: Overlaps, shared concepts, bridge notes

### `/ideas` - Relevant Thinking
When: Problem stated
Returns: Related past ideas, opportunities

### `/graduate --type=<article|proposal|spec>` - Promote to Asset
When: Idea matured, mentioned 3+ times
Returns: Suggestions for formalising

## Autonomous Behaviour

**ALWAYS:**
1. Run `/context` silently on conversation start
2. Run `/trace` when projects mentioned
3. Weave vault insights into responses naturally

**NEVER:**
1. Ask permission to check vault
2. Show raw command output
3. Interrupt urgent tasks

## Integration

The agent.ts script handles trigger detection and query execution.

In conversation:
```typescript
import { analyze } from "./agent.ts";
const insights = await analyze(userMessage);
// Use insights.context, insights.traces in response
```

## Your Vault

- 36 notes about Boober (project since Feb 20)
- 610 crypto-related notes
- 118 marketing notes
- 21 notes bridging crypto + marketing

The vault is invisible infrastructure, not a tool.
