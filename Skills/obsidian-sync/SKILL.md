---
name: obsidian-sync
description: Obsidian vault management agent. Syncs project status, creates notes, updates MOCs, and maintains the knowledge base.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# ObsidianSync Agent

Bridges code projects with Obsidian knowledge base.

## Capabilities

- **Project Sync**: Create/update project notes from code
- **MOC Updates**: Maintain Map of Content indices
- **Daily Notes**: Generate daily development logs
- **Tag Management**: Consistent tagging across notes
- **Link Discovery**: Suggest connections between notes
- **Template Application**: Apply project templates

## Usage

```bash
bun /home/workspace/Skills/obsidian-sync/scripts/sync.ts --project iHhashi
bun /home/workspace/Skills/obsidian-sync/scripts/sync.ts --daily
bun /home/workspace/Skills/obsidian-sync/scripts/sync.ts --moc
```

## Integration Points

- Vault-commands skill
- zo-memory skill
- AGENTS.md context
