# AgentSkillOS Reference

## Overview

AgentSkillOS is an operating system for agent skills, providing:
- **Skill Search & Discovery** - Find relevant skills from 90,000+ available
- **Skill Orchestration** - Compose multiple skills into workflows
- **GUI Interface** - Human-in-the-loop control
- **High-Quality Skill Pool** - Curated based on implementation quality

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AgentSkillOS                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Skill Tree  │  │   Skill     │  │     Skill          │  │
│  │  Builder    │─▶│  Retrieval  │─▶│  Orchestration     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                                    │              │
│         ▼                                    ▼              │
│  ┌─────────────┐                    ┌─────────────────────┐  │
│  │ Capability  │                    │      DAG-based      │  │
│  │    Tree     │                    │     Workflow        │  │
│  └─────────────┘                    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Skill Tree Structure

Skills are organized in a hierarchical capability tree:
- **Root**: Broad capabilities (e.g., "Content Creation")
- **Branches**: Categories (e.g., "Video", "Image", "Text")
- **Leaves**: Specific skills (e.g., "video-generation")

## Available Skill Groups

| Group | Count | Description |
|-------|-------|-------------|
| skill_seeds | ~50 | Curated high-quality skills |
| top500 | ~500 | Top 500 from skills.sh |
| top1000 | ~1000 | Top 1000 from skills.sh |

## Configuration

### Environment Variables

```bash
# LLM Configuration (Required)
LLM_MODEL=openai/anthropic/claude-opus-4.5
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=your-key

# Embedding (Optional - for offline analysis)
EMBEDDING_MODEL=openai/text-embedding-3-large
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_API_KEY=your-key
```

### config.yaml Options

```yaml
# Skill selection
skill_group: skill_seeds
max_skills: 10
prune_enabled: true

# Tree building
branching_factor: 7
tree_build_max_workers: 64
max_depth: 6

# Search
search_max_parallel: 5
search_temperature: 0.3
search_timeout: 600.0

# Orchestration
node_timeout: 1800.0
max_concurrent: 6
```

## Commands

### Build Capability Tree

```bash
cd /home/workspace/Skills/agentskillos-repo
python run.py build -v                    # Default (skill_seeds)
python run.py build -g top500 -v          # Specific group
```

### Start Web UI

```bash
python run.py --port 8765
python run.py --port 8080 --no-browser    # Custom port, no auto-open
```

### Download Larger Skill Pools

```bash
# Download from Google Drive or Baidu Pan
# Extract to data/top500/ or data/top1000/
```

## Skill Format

Each skill follows the AgentSkills specification:

```
skill-name/
├── SKILL.md          # Required: frontmatter + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: detailed docs
└── assets/           # Optional: static resources
```

### SKILL.md Example

```markdown
---
name: my-skill
description: What this skill does
compatibility: Created for Zo Computer
metadata:
  author: user.zo.computer
---

# My Skill

Instructions for how to use this skill...

## Commands
...
```

## Integration Patterns

### 1. Direct Skill Lookup

```bash
# Find skills for a task
bun scripts/retrieve.ts "generate video thumbnails"

# Get skill details
bun scripts/get-skill.ts media-processing
```

### 2. Programmatic Usage

```python
from skill_retriever import SkillRetriever

retriever = SkillRetriever()
skills = retriever.search("create dashboard with charts")
for skill in skills:
    print(skill.name, skill.description)
```

### 3. Workflow Composition

```bash
# Start web UI for interactive composition
python run.py --port 8765

# Or use CLI for batch processing
python run.py orchestrate --task "complex multi-step task"
```

## Troubleshooting

### No Skills Found

1. Check if skill pool is downloaded: `ls data/skill_seeds/`
2. Rebuild tree: `python run.py build -v`
3. Check config: `cat config/config.yaml`

### LLM Errors

1. Verify API key in `.env`
2. Check model availability on your provider
3. Test with: `curl $LLM_BASE_URL/models -H "Authorization: Bearer $LLM_API_KEY"`

### Tree Build Fails

1. Check logs for specific errors
2. Reduce `tree_build_max_workers` if rate-limited
3. Enable caching: `tree_build_caching: true`

## References

- GitHub: https://github.com/ynulihao/AgentSkillOS
- Paper: https://github.com/ynulihao/AgentSkillOS/blob/main/assets/AgentSkillOS.pdf
- Demo: https://ynulihao.github.io/AgentSkillOS/
