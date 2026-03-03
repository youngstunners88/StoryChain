# Claude Code Configuration - Claude Flow V3

## Anti-Drift Config (PREFERRED)
```bash
# Small teams (6-8 agents)
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized

# Large teams (10-15 agents)
npx @claude-flow/cli@latest swarm init --topology hierarchical-mesh --max-agents 15 --strategy specialized
```
**Valid topologies:** hierarchical, hierarchical-mesh, mesh, ring, star, hybrid

## Quick Reference

- **Topology**: hierarchical (prevents drift)
- **Max Agents**: 8
- **Strategy**: specialized
- **Memory**: memory
- **HNSW**: Disabled

## Key Rules

1. **Batch Operations**: All related ops in ONE message
2. **Task Tool**: Claude Code's Task tool for execution
3. **CLI Tools**: Bash for coordination
4. **Anti-Drift**: Always use hierarchical + specialized for coding

## Agent Execution Pattern

```javascript
// Single message with parallel agents (background)
Task({prompt: "Analyze...", subagent_type: "researcher", run_in_background: true})
Task({prompt: "Implement...", subagent_type: "coder", run_in_background: true})
Task({prompt: "Test...", subagent_type: "tester", run_in_background: true})
```

## 26 CLI Commands

```bash
# Core
npx @claude-flow/cli@latest init --wizard
npx @claude-flow/cli@latest agent spawn -t coder
npx @claude-flow/cli@latest swarm init --v3-mode
npx @claude-flow/cli@latest memory search --query "query"

# Advanced
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
npx @claude-flow/cli@latest security scan
npx @claude-flow/cli@latest performance benchmark
```

## MCP Setup

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
```

## 📚 Full Reference

See **`.claude-flow/CAPABILITIES.md`** for complete documentation of all 60+ agents, 26 commands, 27 hooks, and integrations.

---
Remember: **Claude Flow CLI coordinates, Claude Code Task tool creates!**
