---
name: coco
description: Autonomous coding agent with quality convergence loop. Writes code, runs tests, measures quality across 12 dimensions, and iterates until score reaches 85+. Use for production-ready code generation with built-in quality assurance.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# COCO - Autonomous Coding Agent

COCO is an autonomous coding agent that doesn't just write code - it iterates until the code meets a quality bar worth shipping. It uses a convergence loop: write → test → measure → fix, with 12-dimension quality scoring.

## What Makes COCO Different

| Standard AI Tools | COCO |
|-------------------|------|
| Write code, you test manually | Autonomous test-run-fix loop |
| Hope security is okay | OWASP analysis every iteration |
| Guess at coverage | c8/v8 instrumentation |
| Single provider | 12 providers supported |
| Workflows in your head | Reusable skills in repo |

## Installation

```bash
# Already installed globally
npx @corbat-tech/coco --version  # Currently v2.7.0
```

## Quick Start

### Start COCO REPL

```bash
cd /path/to/your/project
npx @corbat-tech/coco
```

### First Task

```
coco> Add JWT authentication to the Express API
```

COCO will:
1. Plan the architecture
2. Implement each component
3. Run tests after each iteration
4. Score quality across 12 dimensions
5. Fix issues until score ≥ 85

## Quality Dimensions (12)

| Dimension | How Measured |
|-----------|--------------|
| Correctness | Test pass rate + build verification |
| Security | OWASP pattern matching (must be 100) |
| Test Coverage | c8/v8 line + branch instrumentation |
| Complexity | Cyclomatic complexity via AST |
| Duplication | Line-based similarity detection |
| Style | oxlint / eslint / biome |
| Documentation | JSDoc coverage |
| Readability | Derived from complexity + naming |
| Maintainability | Maintainability Index (MI) |
| Test Quality | Assertion density, coverage distribution |
| Completeness | Requirements traceability |
| Robustness | Error handling, edge case coverage |

## Essential Commands

| Command | Action |
|---------|--------|
| `/quality on\|off` | Toggle convergence mode |
| `/check` | Typecheck + lint + tests |
| `/review` | Code review with severity ratings |
| `/diff` | Visual diff with highlighting |
| `/ship` | Full release: review → test → PR → merge |
| `/full-access on\|off` | Auto-approve safe operations |
| `/permissions` | Manage tool allowlist |
| `/status` | Project status, git info |
| `/compact` | Compress long context |

### Natural Language Works Too

```
"review the auth module"    →  /review
"let's ship this"           →  /ship
"what changed?"             →  /diff
```

## Providers (12 Supported)

| Provider | Models | Auth |
|----------|--------|------|
| Anthropic | Claude Opus, Sonnet, Haiku | API key / OAuth |
| OpenAI | GPT-4.1, o4-mini | API key |
| Google | Gemini 2.5 Pro/Flash | API key |
| Groq | Llama 4, Mixtral | API key |
| OpenRouter | 200+ models | API key |
| Mistral | Mistral Large, Codestral | API key |
| DeepSeek | DeepSeek-V3, R1 | API key |
| Together AI | Llama 4, Qwen | API key |
| xAI | Grok-2 | API key |
| Cohere | Command R+ | API key |
| Ollama | Any local model | Local |
| LM Studio | Any GGUF model | Local |

### Switch Providers

```bash
coco config set provider groq
coco config set provider deepseek
```

## Skills System

Skills are reusable workflows committed to your repo.

### Skill Locations

```
~/.coco/skills/      # Personal workflows
.coco/skills/        # Team workflows (committed)
built-in             # Shipped with COCO
```

### Built-in Skills

- `/ship` - Full release pipeline
- `/review` - Code review
- `/check` - Quality gate

### Create a Skill

Create `.coco/skills/deploy.md`:

```markdown
---
name: deploy
description: Deploy to staging and run smoke tests
---

Run `pnpm build`, then deploy to staging with `./scripts/deploy.sh staging`,
then hit the health endpoint and verify 200.
```

Now type `/deploy` to use it.

## Configuration

### Project Config (`.coco.config.json`)

```json
{
  "name": "my-api",
  "language": "typescript",
  "quality": {
    "minScore": 88,
    "maxIterations": 8
  }
}
```

### CLI Config

```bash
coco config list
coco config set quality.minScore 90
coco config set provider deepseek
```

## MCP Integration

Connect external tools via MCP:

```bash
# Filesystem server
coco mcp add filesystem \
  --command "npx" \
  --args "-y,@modelcontextprotocol/server-filesystem,/home/user"

# Database server
coco mcp add postgres \
  --command "npx" \
  --args "-y,@modelcontextprotocol/server-postgres" \
  --env "DATABASE_URL=postgresql://..."
```

## Multi-Agent Architecture

Six specialized agents route automatically:

1. **Researcher** - Codebase exploration, context gathering
2. **Coder** - Implementation (default)
3. **Tester** - Test generation, coverage improvement
4. **Reviewer** - Quality audits, security analysis
5. **Optimizer** - Refactoring, performance
6. **Planner** - Architecture, task decomposition

## Best Practices for Maximum Output

### 1. Be Specific About Requirements

❌ "Add auth"
✅ "Add JWT authentication with refresh tokens, bcrypt password hashing, and rate limiting on login endpoints"

### 2. Let the Loop Run

- Don't interrupt the convergence loop
- Each iteration improves quality
- Trust the scoring system

### 3. Use Skills for Repetitive Work

Create skills for:
- Deployment workflows
- Testing patterns
- Code review checklists
- Security audits

### 4. Configure Quality Thresholds

```json
{
  "quality": {
    "minScore": 90,      // Higher bar for production
    "maxIterations": 10  // More iterations for complex tasks
  }
}
```

### 5. Use the Right Provider

- **Claude Opus** - Best quality, complex tasks
- **Claude Sonnet** - Balanced, most tasks
- **DeepSeek/Groq** - Fast, cheaper iterations
- **Local models** - Privacy-sensitive code

### 6. Leverage `/ship` for Releases

The `/ship` command runs:
1. Code review
2. Test suite
3. Linting
4. Branch creation
5. PR creation
6. Merge

### 7. Use `/full-access` for Trusted Projects

Speed up by auto-approving safe operations:
```
/full-access on
```

### 8. Check Status Regularly

```
/status
```
Shows:
- Git status
- Session stats
- Context usage
- Quality scores

## Example Workflows

### New Feature

```
coco> Add a rate limiter middleware to the API with:
      - Configurable requests per minute
      - IP-based tracking
      - Redis backend for distributed systems
      - Proper error responses
```

### Bug Fix

```
coco> Fix the memory leak in the websocket handler.
      The connections array keeps growing.
      Add proper cleanup on disconnect.
```

### Refactoring

```
coco> Refactor the payment module to use the strategy pattern.
      Support multiple payment providers: Stripe, PayPal, Square.
      Each provider should be swappable via config.
```

### Testing

```
coco> Add integration tests for the auth flow:
      - Login
      - Logout
      - Token refresh
      - Password reset
      Target 90% coverage.
```

## Environment Setup

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# COCO alias for easier access
alias coco='npx @corbat-tech/coco'

# Set default provider
export COCO_PROVIDER=anthropic

# API keys (if not using OAuth)
export ANTHROPIC_API_KEY=your-key
export OPENAI_API_KEY=your-key
export GROQ_API_KEY=your-key
```

## Files in This Skill

- `SKILL.md` - This documentation
- `scripts/` - Helper scripts for COCO integration
