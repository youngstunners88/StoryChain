---
name: ihhashi-orchestra
description: iHhashi orchestrator that coordinates Brand Agent (SA style), Builder Agent (Claude Code), and Quality Agent (glitch catcher) for South African delivery platform development.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
  project: iHhashi
  agents:
    - brand-agent
    - builder-agent
    - quality-agent
---

# iHhashi Orchestra

The conductor that synchronizes all specialized agents for iHhashi development with South African flair.

## Agents

### Brand Agent (Mzansi Style Enforcer)
Guardian of South African identity:
- Enforces SA slang and tone (hey, my bra, sharp, eish, ja, ne)
- Validates local context (Kota, Bunny Chow, Gatsby, Braai)
- Ensures currency is ZAR (R)
- Checks language support (Zulu, Xhosa, Sotho, Afrikaans, Tswana)
- Reviews cultural sensitivity

### Builder Agent (Claude Code)
The engineer that:
- Receives brand guidelines from Brand Agent
- Implements features with SA context
- Uses best practices and clean code
- Integrates with backend APIs
- Builds React components with Tailwind

### Quality Agent (Glitch Catcher)
The safety net that:
- Catches UI/UX glitches
- Validates responsive design
- Tests edge cases
- Reviews accessibility
- Checks error handling

## Commands

### `conduct <task>`
Orchestrate all agents for a task.

```bash
bun scripts/orchestra.ts conduct "Add Kota order feature"
```

### `brand-check <content>`
Check content for SA brand compliance.

```bash
bun scripts/orchestra.ts brand-check "Welcome to our app"
```

### `build <feature>`
Have Builder Agent implement a feature.

```bash
bun scripts/orchestra.ts build "Merchant dashboard analytics"
```

### `quality-check <file>`
Run Quality Agent on a file.

```bash
bun scripts/orchestra.ts quality-check frontend/src/components/OrderCard.tsx
```

## Workflow

1. **Brand Agent** defines SA style and tone
2. **Builder Agent** implements with brand guidelines
3. **Quality Agent** catches glitches before release
4. **Orchestra** synthesizes and reports

## South African Brand Guidelines

### Tone
- Friendly, warm, welcoming
- Use "hey" instead of "hello"
- "Sharp" for confirmation
- "Eish" for empathy
- "Ja, ne" for agreement
- "My bra" / "My sister" for familiarity

### Food Context
- Kota - township burger (bread + chips + egg + polony)
- Bunny Chow - Durban curry in bread
- Gatsby - Cape Town sandwich
- Braai - South African BBQ

### Currency
- Always ZAR (R)
- Format: R150.00
- VAT inclusive pricing

### Languages
- English (primary)
- Zulu/isiZulu (zu)
- Xhosa/isiXhosa (xh)
- Sotho/Sesotho (st)
- Afrikaans (af)
- Tswana/Setswana (tn)
