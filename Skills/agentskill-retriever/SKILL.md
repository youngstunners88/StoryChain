---
name: agentskill-retriever
description: Retrieve relevant skills from 90,000+ agent skills using AgentSkillOS. Use when you need to discover, search for, or find relevant skills for any task. Helps build agent pipelines and workflows from a curated skill pool.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  source: https://github.com/ynulihao/AgentSkillOS
---

# AgentSkill Retriever

Retrieve relevant skills from the AgentSkillOS ecosystem (90,000+ skills) for any task.

## When to Use

- When you need to find relevant skills for a complex task
- When building multi-step agent workflows
- When discovering new capabilities for your agent
- When you need to compose multiple skills into a pipeline

## Commands

### Search for Skills

```bash
bun /home/workspace/Skills/agentskill-retriever/scripts/retrieve.ts "your task description"
```

Returns a list of relevant skills with descriptions and how to use them.

### List Available Skills

```bash
bun /home/workspace/Skills/agentskill-retriever/scripts/list-skills.ts
```

Lists all available skills in the current skill pool.

### Get Skill Details

```bash
bun /home/workspace/Skills/agentskill-retriever/scripts/get-skill.ts <skill-name>
```

Get detailed information about a specific skill including its SKILL.md content.

### Build Skill Tree

```bash
cd /home/workspace/Skills/agentskillos-repo && python run.py build -v
```

Rebuild the capability tree (needed when adding new skills).

### Start Web UI

```bash
cd /home/workspace/Skills/agentskillos-repo && python run.py --port 8765
```

Launch the AgentSkillOS web interface for interactive skill discovery.

## Skill Groups

| Group | Skills | Description |
|-------|--------|-------------|
| skill_seeds | ~50 | Curated high-quality skills (default) |
| top500 | ~500 | Top 500 from skills.sh |
| top1000 | ~1000 | Top 1000 from skills.sh |

## Configuration

Set these in Zo Settings > Advanced > Secrets:

- `LLM_API_KEY` - API key for LLM (OpenRouter, OpenAI, etc.)
- `LLM_MODEL` - Model to use (e.g., `openai/anthropic/claude-opus-4.5`)
- `LLM_BASE_URL` - API endpoint (default: OpenRouter)

## Examples

### Example 1: Find Video Editing Skills

```bash
bun scripts/retrieve.ts "Create a cat meme video with green screen removal and subtitles"
```

Returns skills like: `video-generation`, `green-screen-removal`, `subtitle-generator`

### Example 2: Find Data Analysis Skills

```bash
bun scripts/retrieve.ts "Analyze CSV data and create visualizations"
```

Returns skills like: `data-visualization`, `data-storytelling`, `analyzing-financial-statements`

### Example 3: Find Web Development Skills

```bash
bun scripts/retrieve.ts "Build a React dashboard with authentication"
```

Returns skills like: `auth-implementation-patterns`, `api-integration-specialist`, `frontend-testing`

## Integration with Other Skills

This skill works well with:
- `smart-solver` - For fallback chains when skills fail
- `claude-code-capabilities` - For orchestrating multi-skill workflows
- Any task that requires discovering what capabilities are available

## References

- See `references/` directory for detailed AgentSkillOS documentation
- Original repo: https://github.com/ynulihao/AgentSkillOS
