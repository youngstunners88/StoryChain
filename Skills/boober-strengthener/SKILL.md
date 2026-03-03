---
name: boober-strengthener
description: Autonomous skill that uses vault-commands to strengthen Boober taxi safety app. Analyzes vault context, traces ideas, connects domains, generates insights, and produces actionable reports.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# Boober Strengthener

Autonomous skill that strategically calls vault-commands to strengthen the Boober taxi safety app.

## When to Activate

1. Before agent runs (load fresh context)
2. After code changes (connect to broader strategy)
3. Daily strategic review (trace idea evolution)
4. When stuck on a problem (find connections)
5. Launch preparation (graduate notes to assets)

## Autonomous Strategy

### Phase 1: Context Loading
```bash
cd /home/workspace/Skills/vault-commands && bun /context --focus=Boober
```
- Loads current Boober state from vault
- Identifies active blockers and decisions
- Pulls in related projects and dependencies

### Phase 2: Idea Tracing
```bash
bun /trace "taxi safety" --depth=deep
bun /trace "South African market" --timeline
bun /trace "driver verification"
```
- Follows how key concepts evolved
- Finds forgotten insights
- Surfaces related notes

### Phase 3: Domain Bridging
```bash
bun /connect "Boober" "taxi industry"
bun /connect "safety" "mobile payments"
bun /connect "marshals" "community trust"
```
- Finds unexpected connections
- Identifies opportunity gaps
- Suggests novel approaches

### Phase 4: Insight Generation
```bash
bun /ideas --domain=fintech
bun /ideas --domain=safety
bun /ideas --validate
```
- Mines vault for opportunities
- Validates against market needs
- Prioritizes by impact

### Phase 5: Asset Graduation
```bash
bun /graduate --type=action-plan "Boober launch"
bun /graduate --recent
```
- Converts notes to actionable docs
- Creates polished deliverables
- Updates project artifacts

## Integration with Agents

This skill is designed to work with scheduled agents:

1. **Pre-Run Hook**: Call `/context` before any agent work
2. **Post-Run Hook**: Call `/graduate` to capture insights
3. **Weekly Review**: Full strategic analysis cycle

## Output Artifacts

All outputs saved to:
- `/home/workspace/Boober/agent-reports/` - Generated reports
- `/home/workspace/AGENTS.md` - Updated context
- `/home/workspace/Boober/INSIGHTS.md` - Strategic insights

## Example Usage

```typescript
// In an agent or autonomous workflow:
import { strengthenBoober } from './scripts/strengthener';

// Full strategic analysis
await strengthenBoober.full();

// Quick context refresh
await strengthenBoober.context();

// Find connections for a specific problem
await strengthenBoober.connect('security', 'user trust');

// Graduate recent notes to launch plan
await strengthenBoober.graduate('action-plan');
```

## Rules for Autonomous Operation

1. ALWAYS run `/context` first before any analysis
2. NEVER skip idea tracing - forgotten notes hold value
3. ALWAYS save outputs to Boober/agent-reports/
4. UPDATE LAUNCH-CHECKLIST.md with new blockers/findings
5. CREATE dated reports for audit trail
