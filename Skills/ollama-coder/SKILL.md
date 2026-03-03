---
name: ollama-coder
description: Free local code generation using Ollama's OpenAI-compatible API. Generate, review, debug, and refactor code with local LLMs (qwen2.5-coder, deepseek-coder, llama3). Zero API costs, code never leaves your machine.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  models:
    - qwen2.5-coder:0.5b (fast, lightweight)
    - qwen2.5-coder:7b (best quality, needs 8GB RAM)
    - deepseek-coder:6.7b (best debugging)
    - llama3.2:1b (general purpose)
  endpoints:
    openai_compatible: http://localhost:11434/v1/chat/completions
    ollama_native: http://localhost:11434/api/chat
allowed-tools: Bash Read Write Edit
---

# Ollama Coder - Free Local Code Generation

Run Claude Code-style workflows with zero API costs using local Ollama models.

## Quick Start

```bash
# Generate code
bun /home/workspace/Skills/ollama-coder/scripts/coder.ts generate "Create a React hook for fetching data"

# Review code
bun /home/workspace/Skills/ollama-coder/scripts/coder.ts review path/to/file.ts

# Debug code
bun /home/workspace/Skills/ollama-coder/scripts/coder.ts debug path/to/file.ts "Error: Cannot read property"

# Refactor code
bun /home/workspace/Skills/ollama-coder/scripts/coder.ts refactor path/to/file.ts "Convert to async/await"

# Explain code
bun /home/workspace/Skills/ollama-coder/scripts/coder.ts explain path/to/file.ts
```

## Available Models

| Model | Size | Best For | Memory |
|-------|------|----------|--------|
| qwen2.5-coder:0.5b | 397 MB | Quick tasks, scaffolding | 1 GB |
| qwen2.5-coder:7b | 4.7 GB | Complex code, best quality | 8 GB |
| deepseek-coder:6.7b | 3.8 GB | Debugging, refactoring | 6 GB |
| llama3.2:1b | 1.3 GB | General reasoning | 2 GB |

## Model Selection

- **Memory constrained (4GB)**: Use qwen2.5-coder:0.5b or llama3.2:1b
- **Best quality**: Use qwen2.5-coder:7b (requires 8GB RAM)
- **Debugging**: Use deepseek-coder:6.7b

## API Endpoint

All models use the OpenAI-compatible API at:
```
http://localhost:11434/v1/chat/completions
```

## iHhashi Integration

This skill is optimized for iHhashi development workflows:
1. Generate delivery platform components
2. Review React Native/Expo code
3. Debug API integrations
4. Refactor Zustand stores
5. Generate tests for courier logic

## Example Workflow

```bash
# 1. Generate a new component
bun scripts/coder.ts generate "Create a DeliveryCard component for iHhashi showing order status"

# 2. Review generated code
bun scripts/coder.ts review components/DeliveryCard.tsx

# 3. Add tests
bun scripts/coder.ts generate "Write tests for DeliveryCard component using Jest"

# 4. Debug if needed
bun scripts/coder.ts debug components/DeliveryCard.tsx "Status not updating"
```

## Environment

- Ollama version: 0.17.0
- API: OpenAI-compatible at port 11434
- No API key required
- Code stays local
