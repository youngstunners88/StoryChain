---
name: coco-openclaw-workflow
description: Combined workflow for using COCO (autonomous coding) with OpenClaw Studio (multi-agent orchestration). Use for maximum productivity when building complex systems.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# COCO + OpenClaw Studio Workflow

This skill describes how to combine COCO (autonomous coding agent) with OpenClaw Studio (multi-agent orchestration) for maximum productivity.

## Tool Comparison

| Feature | COCO | OpenClaw Studio |
|---------|------|-----------------|
| Type | CLI autonomous agent | Web dashboard |
| Best for | Single dev, focused tasks | Team coordination, complex workflows |
| Quality loop | Built-in convergence | Configurable per agent |
| UI | Terminal REPL | Web interface |
| Agents | 6 specialized (auto-routed) | Multiple configurable agents |
| Visibility | CLI output | Dashboard, chat, approvals |

## When to Use Which

### Use COCO When:
- Quick feature implementation
- Single-developer workflow
- Terminal-centric development
- Need quality convergence loop
- Working on a specific module/file

### Use OpenClaw Studio When:
- Team coordination needed
- Multiple parallel tasks
- Need approval workflows
- Want visual dashboard
- Scheduling automated jobs
- Managing multiple agents

### Use Both Together When:
- Complex multi-component systems
- Need quality assurance + orchestration
- Mix of solo work + team coordination

## Recommended Workflow

### Phase 1: Foundation with COCO

Use COCO to build core components with quality assurance:

```bash
cd /home/workspace/Projects/your-project
npx @corbat-tech/coco

# Build core modules
coco> Create the authentication module with:
      - JWT tokens with refresh
      - bcrypt password hashing
      - Rate limiting
      - 90% test coverage

coco> Create the database layer with:
      - PostgreSQL connection pooling
      - Migration system
      - Repository pattern
```

### Phase 2: Orchestration with OpenClaw

Use OpenClaw Studio for complex multi-agent workflows:

1. Start Studio:
   ```bash
   cd /home/workspace/Projects/openclaw-studio
   npm run dev
   ```

2. Create specialized agents:
   - **Feature Agent** - For new features
   - **Review Agent** - For code review
   - **Test Agent** - For test generation
   - **Docs Agent** - For documentation

3. Set up cron jobs:
   - Daily security scan
   - Automated test runs

### Phase 3: Integration

Combine both for maximum output:

1. **Morning Routine**
   - Check OpenClaw Studio dashboard for overnight job results
   - Use COCO to fix any issues found
   - Run `/check` to verify quality

2. **Feature Development**
   - Use COCO for initial implementation
   - Let convergence loop ensure quality
   - Push to branch

3. **Review & Deploy**
   - Use OpenClaw review agent for additional perspective
   - Use COCO `/ship` for release
   - Monitor in Studio dashboard

## Configuration Synergy

### Shared Project Structure

```
your-project/
├── .coco/
│   ├── config.json      # COCO config
│   └── skills/          # COCO skills
├── .openclaw/
│   └── agents/          # OpenClaw agent configs
└── src/
```

### Quality Thresholds Alignment

In `.coco.config.json`:
```json
{
  "quality": {
    "minScore": 85,
    "security": 100  // Must be 100 for security
  }
}
```

In OpenClaw agent config:
```yaml
quality:
  minScore: 85
  security: 100
```

## Combined Skills

### Skill: Full Feature Pipeline

Create `.coco/skills/feature.md`:

```markdown
---
name: feature
description: Full feature pipeline with quality assurance
---

1. Research the codebase for similar patterns
2. Design the feature architecture
3. Implement with tests
4. Run quality convergence loop
5. Generate documentation
6. Create PR with description
```

Usage:
```
coco> /feature Add user notification system
```

### Skill: Security Audit

Create `.coco/skills/security.md`:

```markdown
---
name: security
description: Comprehensive security audit
---

1. Run OWASP pattern analysis
2. Check for exposed secrets
3. Review authentication flows
4. Check input validation
5. Review CSRF/XSS protection
6. Generate security report
```

## Parallel Workflows

### Multiple Terminals

Terminal 1 - COCO for active development:
```bash
npx @corbat-tech/coco
coco> Implement the payment processing module
```

Terminal 2 - OpenClaw Studio:
```bash
cd /home/workspace/Projects/openclaw-studio
npm run dev
# Open http://localhost:3000 in browser
```

Terminal 3 - Tests/Builds:
```bash
npm run test:watch
```

### Background Agents

In OpenClaw Studio:
1. Create "Nightly Review" agent
2. Schedule cron job for 2 AM
3. Agent reviews all code changes
4. Results available in morning

## Best Practices

### 1. Use COCO for Quality
- Let the convergence loop run
- Don't skip iterations
- Trust the 12-dimension scoring

### 2. Use OpenClaw for Scale
- Multiple agents for parallel work
- Approval queues for control
- Cron jobs for automation

### 3. Share Skills
- COCO skills can be shared with team
- OpenClaw agents can use same patterns
- Document in both systems

### 4. Monitor Both
- COCO: `/status` for session health
- OpenClaw: Dashboard for agent health

### 5. Configure Providers
- COCO: Switch providers per task
- OpenClaw: Configure per agent
- Use local models for sensitive data

## Example Session

```
# Morning
$ npx @corbat-tech/coco
coco> /status
coco> Review yesterday's changes and fix any issues

# Afternoon  
coco> Add inventory management with:
      - CRUD operations
      - Search/filter
      - Export to CSV
      - 85% coverage

# Evening
coco> /ship
# Check OpenClaw Studio dashboard for overnight jobs
# Approve any pending operations
```

## Troubleshooting

### COCO Slows Down
- Use `/compact` to compress context
- Switch to faster provider (Groq, DeepSeek)
- Reduce `maxIterations` in config

### OpenClaw Connection Issues
- Check Gateway is running
- Verify token configuration
- Check network connectivity

### Quality Not Converging
- Increase `maxIterations`
- Lower `minScore` temporarily
- Use better model (Claude Opus)

## Quick Reference

| Task | Tool | Command |
|------|------|---------|
| Start COCO | CLI | `npx @corbat-tech/coco` |
| Start Studio | CLI | `cd openclaw-studio && npm run dev` |
| Quality check | COCO | `/check` |
| Deploy | COCO | `/ship` |
| Create skill | COCO | `/skill <name>` |
| Check status | COCO | `/status` |
| View agents | Studio | Dashboard |
| Approve ops | Studio | Approval Queue |
| Schedule job | Studio | Cron Jobs |
