---
name: openclaw-studio
description: Web dashboard for OpenClaw multi-agent coding system. Manage agents, chat with AI, approve executions, and configure cron jobs from a clean web UI. Use for orchestrating AI coding agents at scale.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# OpenClaw Studio

OpenClaw Studio is a clean web dashboard for managing OpenClaw - a multi-agent coding orchestration system. It provides a centralized UI to connect to your OpenClaw Gateway, manage agents, handle approvals, and configure automated jobs.

## What OpenClaw Does

OpenClaw is a multi-agent orchestration platform that coordinates AI coding agents to work on complex tasks. Think of it as a team of specialized AI agents working together:

- **Coder agents** - Write and modify code
- **Reviewer agents** - Review code quality and security
- **Tester agents** - Write and run tests
- **Planner agents** - Break down complex tasks into subtasks
- **Researcher agents** - Explore codebases and gather context

Studio gives you a web UI to interact with all of this.

## Installation

Located at: `/home/workspace/Projects/openclaw-studio`

```bash
cd /home/workspace/Projects/openclaw-studio
npm run dev
```

Access at: http://localhost:3000

## Quick Start

### 1. Start the Studio

```bash
cd /home/workspace/Projects/openclaw-studio
npm run dev
```

### 2. Configure Gateway Connection

In the Studio UI, set:
- **Upstream URL**: `ws://localhost:18789` (if Gateway is local)
- **Upstream Token**: Your gateway token from `openclaw config get gateway.auth.token`

### 3. Create Agents

Use the UI to create agents with specific:
- Tool policies (what tools they can use)
- Sandbox configurations (filesystem access)
- Execution approval settings

## Key Features

### Agent Management
- Create specialized agents for different tasks
- Configure tool permissions and sandboxing
- Set up exec approval workflows for sensitive operations

### Chat Interface
- Direct chat with agents
- Streaming responses with tool call visualization
- Thinking traces and transcript history

### Cron Jobs
- Schedule automated tasks
- Configure recurring agent workflows
- Monitor job execution history

### Approval Queue
- Review pending exec approvals
- Approve or deny sensitive operations
- Set auto-approval policies

## Network Architecture

```
Browser → Studio (HTTP/WebSocket) → Gateway (WebSocket) → Agents
```

Two separate network paths:
1. **Browser to Studio**: HTTP for UI + WebSocket for real-time updates
2. **Studio to Gateway**: WebSocket connection to OpenClaw Gateway

## Configuration

### Studio Settings
- Location: `~/.openclaw/openclaw-studio/settings.json`
- Default gateway URL: `ws://localhost:18789`

### Environment Variables
- `NEXT_PUBLIC_GATEWAY_URL` - Override default gateway URL
- `STUDIO_ACCESS_TOKEN` - Required when binding to public host

## Use Cases

### 1. Multi-Agent Development
Create a team of specialized agents:
- One for feature implementation
- One for code review
- One for testing
- One for documentation

### 2. Automated Workflows
Set up cron jobs for:
- Daily security scans
- Automated test runs
- Dependency updates

### 3. Collaborative Coding
Use the approval queue to:
- Review agent actions before execution
- Maintain control over sensitive operations
- Audit agent behavior

## Integration with Zo

OpenClaw Studio runs as a separate service on your Zo Computer. You can:

1. Run it as a hosted service on a specific port
2. Access it via Tailscale for remote access
3. Use it alongside other development tools

## Troubleshooting

### Connection Issues
- Check Gateway is running: `openclaw gateway status`
- Verify token: `openclaw config get gateway.auth.token`
- Check URL format: `ws://` for local, `wss://` for TLS

### 401 Errors
- Set `STUDIO_ACCESS_TOKEN` environment variable
- Open `/?access_token=...` to set auth cookie

### Assets 404
- Serve Studio at root path `/`
- Or configure `basePath` and rebuild

## Files in This Project

- `src/` - Next.js React components
- `server/` - Backend server code
- `docs/` - Detailed documentation
- `tests/` - Playwright and Vitest tests
- `.agent/` - Agent configuration templates
