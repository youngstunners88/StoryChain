# StoryChain - Claude Code Setup Guide

## Quick Start for Claude Code

This repository contains the StoryChain collaborative storytelling platform. Here's how to work with it using Claude Code.

### Repository Structure

```
StoryChain/
├── src/                    # Main application source code
│   ├── api/               # API routes (routes.ts, socialRoutes.ts, etc.)
│   ├── components/        # React components
│   ├── database/          # Database connection and schema
│   ├── services/          # LLM service for AI generation
│   └── ...
├── zo-space-ui/          # UI from zo.space (mirror)
│   ├── pages/            # Page components (create.tsx, etc.)
│   └── api/              # API routes from zo.space
├── data/                 # SQLite database files
├── CLAUDE_FIX_PROMPT.md  # Detailed bug fix instructions
└── README.md            # Project documentation
```

### The Critical Bug to Fix

**Problem:** When creating a story with "Write My Own" mode, the API returns:
```json
{"error":"Title and content are required"}
```

**Root Cause:** Backend validation in `src/api/routes.ts` checks for `content` unconditionally, but:
- AI mode: content can be empty (AI generates it based on `ai_persona`)
- Manual mode: content is required (user writes it)

**Fix Location:** `src/api/routes.ts` - `createStory` function (~line 278)

### How to Fix

1. Read the detailed fix instructions:
   ```bash
   cat CLAUDE_FIX_PROMPT.md
   ```

2. The key changes needed in `src/api/routes.ts`:
   - Accept `ai_persona`, `max_contributions`, `is_premium` from request body
   - Make content validation conditional: only require content if `!ai_persona`
   - Add AI generation logic when `ai_persona` is provided
   - Store all new fields in database

3. See the full code examples in `CLAUDE_FIX_PROMPT.md`

### Testing After Fix

```bash
# Test manual mode (should work after fix)
curl -X POST https://storychain-kofi.zocomputer.io/api/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Test Manual","content":"Test opening content","max_contributions":10}'

# Test AI mode
curl -X POST https://storychain-kofi.zocomputer.io/api/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Test AI","ai_persona":"spooky","max_contributions":10}'
```

### Frontend Reference

The zo.space UI is mirrored in `zo-space-ui/` for reference:
- `zo-space-ui/pages/create.tsx` - Story creation page
- `zo-space-ui/api/stories.ts` - Stories API
- `zo-space-ui/api/tokens.ts` - Token balance API
- `zo-space-ui/api/tokens-costs.ts` - Token costs API

### Database

Location: `data/storychain.db`

Check stories:
```bash
sqlite3 data/storychain.db "SELECT * FROM stories LIMIT 5;"
```

### Deployment

After fixing and testing locally, deploy with:
```bash
./scripts/deploy.sh
```

Or push to GitHub and the service will auto-deploy if configured.

### Key Files for This Fix

1. **Primary:** `src/api/routes.ts` - Contains `createStory` function with the bug
2. **Secondary:** `src/api/socialRoutes.ts` - May need to return new fields
3. **Helper:** `src/services/llmService.ts` - Use this for AI generation
4. **Reference:** `CLAUDE_FIX_PROMPT.md` - Complete fix instructions

### GitHub Repository

https://github.com/youngstunners88/StoryChain.git

Branch: master
