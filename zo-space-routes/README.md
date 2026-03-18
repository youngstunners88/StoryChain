# Zo Space Routes

This folder contains the zo.space route code for the StoryChain application.

These are the live routes currently deployed to https://kofi.zo.space

## Routes

| File | Zo Space Path | Description |
|------|---------------|-------------|
| `create.tsx` | `/create` | Story creation page with token economy |
| `api-stories.ts` | `/api/stories` | Stories API (list/create) |
| `api-tokens.ts` | `/api/tokens` | Token balance API |

## Current Bug

**File**: `api-stories.ts` (line ~90)

The validation requires both `title` and `content` to be present:

```typescript
if (!title?.trim() || !content?.trim()) {
  return c.json({ error: "Title and content are required" }, 400);
}
```

**Problem**: When `useAI=true` in the frontend, the content is empty because the AI will generate it. But the API rejects the request because content is empty.

**Fix Needed**: Only require content when NOT in AI mode. Check for `body.ai_persona` or `body.use_ai` flag to skip content validation when AI is generating the opening.

## To Update Zo Space

After fixing the code in this repo, use the Zo Computer tools to update the live routes at kofi.zo.space
