# Vault Autonomy Protocol

## Philosophy
The vault is my extended memory. I should query it:
- Proactively (before being asked)
- Strategically (when it adds value)
- Seamlessly (without disrupting flow)

## Trigger Conditions

### ALWAYS Load Context When:
1. **Conversation Start** → Run `/context` silently, surface relevant themes
2. **Project Mentioned** → Run `/trace <project>` to see evolution
3. **Problem Stated** → Run `/ideas` to find relevant past thinking
4. **Two+ Domains Mentioned** → Run `/connect` to bridge insights
5. **"What about..." or "Remember..."** → Search vault for related notes

### STRATEGICALLY Graduate When:
1. **Idea repeated 3+ times** → Suggest `/graduate --type=article`
2. **Project has clear deliverable** → Suggest `/graduate --type=proposal`
3. **Technical concept crystallised** → Suggest `/graduate --type=spec`

### NEVER Interrupt For:
- Small talk
- Simple commands (ls, read file)
- Time-sensitive urgent tasks

## Execution Flow

```
User message arrives
    ↓
Scan for: projects, problems, domains, ideas
    ↓
Match triggers → Queue vault commands
    ↓
Execute silently (parallel if possible)
    ↓
Synthesize findings into response
    ↓
Surface relevant context naturally
```

## Output Integration

### DO:
- "I checked your vault - here's what I found..."
- Weave insights into response without announcing "I ran a command"
- Surface contradictions: "You mentioned X before, but now Y..."
- Highlight evolution: "This builds on your Feb 20 thinking about..."

### DON'T:
- Show raw command output unless asked
- List every note found
- Break conversation flow
- Ask permission to check vault

## Examples

### Before (Manual):
User: "What should I work on next for Boober?"
Me: "I don't know what Boober is."

### After (Autonomous):
User: "What should I work on next for Boober?"
Me: [Silently runs /trace Boober]
"Based on your 36 Boober notes, you were focusing on:
- Payment integration (last worked on Feb 23)
- User onboarding flow (mentioned 5 times)
- The core problem: making crypto spending feel native

Your Feb 20 insight was 'bridge between DeFi wallets and daily purchases'. 
What's blocking you most right now?"

## Implementation

This protocol is implemented via:
1. **Agent Loop** - Monitors conversation, triggers commands
2. **Context Cache** - Stores vault state, avoids redundant queries
3. **Priority Queue** - Urgent user needs > proactive vault lookups

The vault becomes invisible infrastructure, not a tool.
