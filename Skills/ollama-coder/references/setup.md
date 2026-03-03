# Ollama + Claude Code Free Setup

## What This Enables

Run Claude Code-style workflows completely free using local Ollama models:
- Code generation
- Code review
- Debugging
- Refactoring
- Test generation
- Multi-agent orchestration

## Setup (Already Done on This Zo)

### 1. Ollama Installation
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull Models
```bash
# Lightweight (works on 4GB RAM)
ollama pull qwen2.5-coder:0.5b

# Full coder (needs 8GB RAM)
ollama pull qwen2.5-coder:7b

# Debug specialist (needs 6GB RAM)
ollama pull deepseek-coder:6.7b

# General purpose
ollama pull llama3.2:1b
```

### 3. API Endpoint
Ollama provides OpenAI-compatible API at:
```
http://localhost:11434/v1/chat/completions
```

### 4. Claude Code Integration
To use with Claude Code CLI:
```bash
ANTHROPIC_BASE_URL=http://localhost:11434 claude
```

This makes Claude Code think it's talking to Anthropic, but it's actually using your local Ollama models.

## Model Selection Guide

| Model | Size | RAM Needed | Best For |
|-------|------|------------|----------|
| qwen2.5-coder:0.5b | 397 MB | 1 GB | Quick tasks, scaffolding |
| qwen2.5-coder:7b | 4.7 GB | 8 GB | Complex code, best quality |
| deepseek-coder:6.7b | 3.8 GB | 6 GB | Debugging, refactoring |
| llama3.2:1b | 1.3 GB | 2 GB | General reasoning |

## Memory Management

On 4GB systems:
- Use qwen2.5-coder:0.5b (fast, always works)
- Stop large models: `ollama stop qwen2.5-coder:7b`
- Check memory: `free -h`

## Cost Savings

- Before: $200/month for Claude API
- After: $0 (completely free, local)

## Privacy Benefits

- Code never leaves your machine
- No API keys to manage
- Works offline
- No rate limits

## Current Status

This Zo Computer has:
- Ollama 0.17.0 installed
- Multiple coding models ready
- 4GB RAM (use 0.5b models)
- OpenAI-compatible API running on port 11434
