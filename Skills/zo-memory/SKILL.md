---
name: zo-memory
description: Persistent conversation memory system. Use to log conversations, retrieve past context, and maintain continuity across sessions. Automatically updates AGENTS.md with conversation summaries.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# Zo Memory Skill

This skill provides persistent memory across conversations by maintaining a structured log in AGENTS.md.

## Usage

### Log a Conversation

After each significant conversation, log it to maintain continuity:

```bash
# Add a memory entry to AGENTS.md
bun /home/workspace/Skills/zo-memory/scripts/log-memory.ts "Brief summary of what was discussed and decided"
```

### Retrieve Context

Before starting work, check relevant memories:

```bash
# Search memories for context
bun /home/workspace/Skills/zo-memory/scripts/search-memory.ts "search term"
```

### Memory Structure

Memories are stored in AGENTS.md under the `## Conversation Memory` section with this format:

```
### [DATE TIME SAST]
**Topic**: Brief topic
**Context**: Key details, decisions, user preferences
**Action Items**: Follow-up tasks if any
```

## Automatic Logging

The skill should be invoked at the end of each conversation to:
1. Summarize what was discussed
2. Record any decisions or preferences
3. Note any follow-up items
4. Track user's evolving preferences

## Integration

This skill is designed to work with:
- AGENTS.md for workspace-level memory
- Conversation workspaces for session-specific notes
- Rules for user preferences
