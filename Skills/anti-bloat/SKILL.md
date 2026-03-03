---
name: anti-bloat
description: Prevents AI from over-engineering responses, running excessive parallel invocations, or generating massive output without delivering concise answers to the user. Activates when AI is about to orchestrate complex multi-step workflows, call many tools in parallel, or generate long outputs.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# Anti-Bloat Protocol

## When to Activate
- Before running 3+ parallel tool calls
- Before orchestrating multi-expert panels
- Before generating >1000 words of output
- When the user asks for "thoughts" or "brainstorm" - they want synthesis, not a dissertation

## The Rule: DELIVER FIRST

### Wrong Pattern
```
Think → Research → Research More → Generate Massive Output → Forget to Send Response
```

### Right Pattern
```
Think → Quick Research → SYNTHESIZE → Deliver to User → (optional) Save details for later
```

## Pre-Flight Checklist
Before executing complex workflows, ask:

1. **Can I answer in 3 sentences?** → Do that first
2. **Do I need parallel invocations?** → Max 2-3, then synthesize
3. **Is this a "brainstorm" request?** → Give top 3 insights, not a manifesto
4. **Did I deliver to the user?** → If no, STOP and deliver

## Bloat Signals to Avoid
- Running 5+ parallel Zo invocations
- Generating >2000 words before checking in
- Creating complex orchestration when simple answer exists
- Forgetting to call send_telegram_message after doing work

## Quick Synthesis Template
When you've done research/analysis, deliver:

```
TOP 3 INSIGHTS:
1. [Main finding] - 1 sentence
2. [Key recommendation] - 1 sentence
3. [Unique angle] - 1 sentence

Want me to elaborate on any of these?
```

## Recovery Action
If you notice you've been bloated:
1. STOP immediately
2. Send concise synthesis to user
3. Ask: "Want me to go deeper on anything?"

## File Locations
- `/home/workspace/Skills/anti-bloat/SKILL.md` (this file)

## Usage
This skill is self-activating. When the AI detects it's about to over-engineer, it should:
1. Read this file
2. Apply the DELIVER FIRST rule
3. Synthesize before elaborating
