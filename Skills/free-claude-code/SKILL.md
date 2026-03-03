---
name: free-claude-code
description: Run Claude Code for FREE using local Ollama models. No API costs, all code stays on your machine. Uses Qwen 2.5 Coder and DeepSeek Coder for code generation, debugging, and refactoring. Perfect for iHhashi development and swarm agent orchestration.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# Free Claude Code with Ollama

Run Claude Code completely FREE using local models via Ollama's Anthropic API compatibility.

## What This Does

- **Zero API costs** - Run unlimited code sessions
- **100% local** - Your code never leaves your machine
- **Multiple models** - Switch between best coding models
- **Swarm orchestration** - Use for iHhashi and agent workflows

## Available Models

| Model | Best For | Size |
|-------|----------|------|
| `qwen2.5-coder:7b` | All-around code generation | 4.7 GB |
| `deepseek-coder:6.7b` | Debugging & refactoring | 3.8 GB |
| `qwen3:latest` | General reasoning | 5.2 GB |
| `llama3.2:latest` | Quick tasks | 2.0 GB |

## Quick Start

### 1. Test Connection
```bash
bun /home/workspace/Skills/free-claude-code/scripts/test-connection.ts
```

### 2. Run Claude Code with Local Model
```bash
# Use Qwen 2.5 Coder (best all-around)
bun /home/workspace/Skills/free-claude-code/scripts/claude-local.ts

# Use specific model
bun /home/workspace/Skills/free-claude-code/scripts/claude-local.ts --model deepseek-coder:6.7b

# Run in a specific directory
bun /home/workspace/Skills/free-claude-code/scripts/claude-local.ts --cwd /home/workspace/iHhashi
```

### 3. Code Review for iHhashi
```bash
# Review code before pushing
bun /home/workspace/Skills/free-claude-code/scripts/review.ts --project iHhashi

# Review specific files
bun /home/workspace/Skills/free-claude-code/scripts/review.ts --files src/auth.ts src/api.ts
```

## Usage Patterns

### For iHhashi Development

1. **Quick Edits & Scaffolding**
   ```bash
   bun /home/workspace/Skills/free-claude-code/scripts/claude-local.ts --cwd /home/workspace/iHhashi --model qwen2.5-coder:7b
   ```

2. **Debugging Sessions**
   ```bash
   bun /home/workspace/Skills/free-claude-code/scripts/claude-local.ts --cwd /home/workspace/iHhashi --model deepseek-coder:6.7b
   ```

3. **Pre-commit Review**
   ```bash
   bun /home/workspace/Skills/free-claude-code/scripts/review.ts --project iHhashi
   ```

### For Swarm Agent Orchestration

The local models can handle:
- Code scaffolding for agents
- Test generation
- Boilerplate code
- Quick refactors
- Documentation generation

For complex multi-file refactors, consider using cloud models, but for everyday coding, local models work great.

## Environment Variables

The skill automatically sets:
- `ANTHROPIC_BASE_URL=http://localhost:11434`
- `ANTHROPIC_API_KEY=ollama` (dummy key, Ollama doesn't need it)

## Limitations

Local models are NOT Sonnet or Opus:
- Complex multi-file refactors may stumble
- Long context windows can get messy
- Best for: scaffolding, tests, quick edits, boilerplate

For critical production code, use the review script to check quality before committing.

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `test-connection.ts` | Verify Ollama is running and models are available |
| `claude-local.ts` | Launch Claude Code with local model |
| `review.ts` | Code review with local model |

## Integration with Zo

This skill integrates with:
- **vault-commands** - Use local models to analyze vault content
- **zo-memory** - Generate memory entries
- **ihhashi-sync** - Review code before sync

## Tips for Best Results

1. **Use the right model for the task**
   - Code generation: `qwen2.5-coder:7b`
   - Debugging: `deepseek-coder:6.7b`
   - Quick tasks: `llama3.2:latest`

2. **Be specific in prompts**
   Local models need more context than cloud models.

3. **Break down complex tasks**
   Instead of one big prompt, use smaller, focused prompts.

4. **Review before committing**
   Always run the review script for production code.
