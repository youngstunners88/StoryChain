---
name: agenticseek-integration
description: Integration with agenticSeek - a fully local autonomous AI agent that can browse the web, write code, and plan tasks. Runs on your hardware for complete privacy.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  source: https://github.com/Fosowl/agenticSeek
---

# agenticSeek Integration

Fully local autonomous agent for web browsing, coding, and task planning.

## What agenticSeek Does

1. **Autonomous Web Browsing** - Search, read, extract, fill forms
2. **Code Generation** - Write, debug, run Python, JS, Go, etc.
3. **Task Planning** - Break down complex tasks into steps
4. **File Operations** - Read, write, organize files
5. **Multi-Agent** - Routes tasks to specialized agents

## Setup

agenticSeek is cloned to `/home/workspace/agenticSeek/`

### Requirements
- Docker (installed)
- Python 3.10+
- API key (optional - can run fully local with Ollama)

### Configuration

```bash
cd /home/workspace/agenticSeek
mv .env.example .env
```

Edit `.env`:
```env
SEARXNG_BASE_URL="http://searxng:8080"
REDIS_BASE_URL="redis://redis:6379/0"
WORK_DIR="/home/workspace"
OLLAMA_PORT="11434"
# Optional API keys for cloud models:
ANTHROPIC_API_KEY='your-key-here'
OPENAI_API_KEY='optional'
```

## Usage

### Start Services (Docker)

```bash
cd /home/workspace/agenticSeek

# Start all services (web interface)
./start_services.sh full

# CLI mode
./start_services.sh
uv run cli.py
```

### Web Interface

After `./start_services.sh full`, open:
- http://localhost:3000

### CLI Mode

```bash
cd /home/workspace/agenticSeek
./start_services.sh  # Start searxng + redis
uv run cli.py
```

## With Claude/Anthropic API

To use Claude models (like Opus):

1. Set your API key in `.env`:
   ```env
   ANTHROPIC_API_KEY='sk-ant-...'
   ```

2. Update `config.ini`:
   ```ini
   [MAIN]
   is_local = False
   provider_name = openai  # or anthropic if supported
   provider_model = claude-3-opus-20240229
   ```

## Example Queries

```
> Search for the best restaurants in Johannesburg and save a list

> Write a Python script to fetch weather data for Cape Town

> Find the latest news about food delivery in South Africa

> Create a React component for a food order form
```

## Integration with iHhashi Team

agenticSeek joins the agent team as the **Web Research & Autonomous Coding Agent**:

| Agent | Specialty |
|-------|-----------|
| **agenticSeek** | Web research, autonomous coding, task planning |
| **Claude Code** | Code building, receives brand guidelines |
| **Brand Agent** | SA style enforcement |
| **Quality Agent** | Glitch detection |
| **Zo** | Orchestration |

## Running Locally (No API)

For fully local, private operation with Ollama:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull deepseek-r1:32b

# Update config.ini
[MAIN]
is_local = True
provider_name = ollama
provider_model = deepseek-r1:32b
provider_server_address = http://127.0.0.1:11434
```

## Files

```
/home/workspace/agenticSeek/
├── .env              # Your configuration
├── config.ini        # Model and agent settings
├── docker-compose.yml
├── start_services.sh
├── sources/          # Agent source code
├── frontend/         # Web UI
└── docs/             # Documentation
```

## Status

Run the integration check:
```bash
bun /home/workspace/Skills/agenticseek-integration/scripts/status.ts
```
