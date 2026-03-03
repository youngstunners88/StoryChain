---
name: ihhashi-sync
description: Synchronizes all iHhashi agents (Nduna, Marketing OpenClaw, etc.) with the latest app information. Run this whenever iHhashi is updated to ensure all agents have current knowledge.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# iHhashi Agent Synchronizer

Keeps all iHhashi-related agents synchronized with the latest app information.

## When to Run

Run this skill when:
- iHhashi app features are added, changed, or removed
- New user types or roles are introduced
- Business logic changes (pricing, payments, verification)
- Marketing messaging needs updating
- Any significant app update occurs

## How It Works

1. Reads the current state of iHhashi from:
   - `/home/workspace/iHhashi/AGENTS.md` (project memory)
   - `/home/workspace/iHhashi/README.md` (documentation)
   - Backend models and routes (feature detection)

2. Generates updated knowledge bases for:
   - Nduna Telegram bot (`knowledge-base.json`)
   - Marketing OpenClaw prompts
   - Any future agents

3. Preserves what's important:
   - Brand identity
   - Core features
   - South African context
   - Content guidelines

## Usage

```bash
bun /home/workspace/Skills/ihhashi-sync/scripts/sync.ts
```

## Output

- Updated knowledge-base.json for Nduna bot
- Updated marketing prompts
- Summary of changes made
- List of agents that were synchronized

## Agents Synchronized

1. **Nduna** - Telegram bot for customer support and marketing
   - Location: `/home/workspace/mosta-agent/`
   - Knowledge file: `knowledge-base.json`

2. **Marketing OpenClaw** - Content creation and marketing
   - Location: `/home/workspace/mosta-agent/prompts/`
   - Prompt file: `marketing-prompts.md`

## Important Notes

- iHhashi is a DELIVERY platform, NOT a taxi app
- Never reference ride-hailing or passenger transport
- Preserve the Boober pivot history for context
- Keep South African cultural elements intact
