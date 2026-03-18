# StoryChain - Comprehensive Fix Prompt for Claude

## What is StoryChain?

StoryChain is a decentralized collaborative storytelling platform where users create stories together. Each story has:
- A title and opening content (either AI-generated or user-written)
- Multiple contributions from different users
- A contribution limit (e.g., 50 contributions max)
- Premium stories that cost tokens to create
- An AI persona system that generates openings when users choose AI mode

## The Critical Bug

When creating a story with "Write My Own" mode (manual text entry), the API returns:
```json
{"error":"Title and content are required"}
```

**Root Cause:** The backend validation is checking for `content` to ALWAYS be present, but:
1. AI mode should allow empty content (AI generates it)
2. Manual mode requires content (user writes it)
3. The backend doesn't check for `ai_persona` to distinguish these modes

## File Locations

Backend: `/home/workspace/StoryChain/src/api/routes.ts`  
Frontend: Routes in zo.space at `/create` (provided below)

## Current Broken Code

### Backend: createStory function in routes.ts (lines ~278-330)
```typescript
export async function createStory(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { title, content, modelUsed, characterCount, tokensSpent, maxCharacters } = body;

    // VALIDATION BUG - checks content unconditionally
    if (!title?.trim() || !content?.trim()) {
      throw createValidationError('Title and content are required', 'body', {
        received: { hasTitle: !!title, hasContent: !!content },
      });
    }
    // ... rest of function
```

**Problems:**
1. Missing `ai_persona` from destructuring - never checks if AI should generate
2. Missing `max_contributions` and `is_premium` - these fields exist in DB but aren't handled
3. No AI generation logic - when `ai_persona` is provided, it should generate the opening

### Frontend: Form submission (from zo.space /create route)
```typescript
const trimmedTitle = title.trim();
const trimmedContent = useAI ? "" : opening.trim();

const requestBody = {
  title: trimmedTitle,
  content: trimmedContent,           // Empty string for AI mode
  modelUsed: "kimi-k2.5",
  ai_persona: useAI ? selectedPersona : undefined,  // 'spooky', 'whimsical', etc.
  max_contributions: maxContributions, // 3-20 range
  is_premium: isPremium,               // boolean
};
```

## Database Schema (from connection.ts)

```sql
CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  model_used TEXT,
  character_count INTEGER DEFAULT 0,
  tokens_spent INTEGER DEFAULT 0,
  is_completed INTEGER DEFAULT 0,
  is_premium INTEGER DEFAULT 0,        -- EXISTS but not used
  max_contributions INTEGER DEFAULT 50,  -- EXISTS but not used
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);
```

## Exact Fixes Required

### 1. Fix Backend Validation (routes.ts)

Change the createStory function to:
1. Accept `ai_persona`, `max_contributions`, `is_premium` from body
2. Make validation conditional based on `ai_persona`
3. Generate opening content when `ai_persona` is provided using LLM service
4. Store all new fields in database

```typescript
export async function createStory(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { 
      title, 
      content, 
      modelUsed, 
      characterCount, 
      tokensSpent, 
      maxCharacters,
      ai_persona,        // ADD THIS
      max_contributions, // ADD THIS
      is_premium,        // ADD THIS
    } = body;

    // FIXED VALIDATION
    const isAIGenerated = !!ai_persona;
    if (!title?.trim()) {
      throw createValidationError('Title is required', 'title');
    }
    if (!isAIGenerated && !content?.trim()) {
      throw createValidationError('Content is required for manual stories', 'content');
    }

    // ... rest of validation (title length, character limit, etc.)

    // Generate content if AI mode
    let finalContent = content;
    let finalCharacterCount = characterCount || 0;
    
    if (isAIGenerated) {
      // Import llmService and generate opening
      const personaPrompts: Record<string, string> = {
        'spooky': 'Write a mysterious, haunting opening paragraph for a story titled',
        'whimsical': 'Write a playful, magical opening paragraph for a story titled',
        'noir': 'Write a dark, detective-style opening paragraph for a story titled',
        'scifi': 'Write a futuristic, sci-fi opening paragraph for a story titled',
        'romance': 'Write a romantic, passionate opening paragraph for a story titled',
        'adventure': 'Write an action-packed, adventurous opening paragraph for a story titled',
        'comedy': 'Write a humorous, witty opening paragraph for a story titled',
      };
      
      const prompt = `${personaPrompts[ai_persona] || personaPrompts['spooky']} "${title}". Make it engaging and about 200-300 characters.`;
      
      // Use llmService to generate
      const generation = await llmService.generateStory(prompt, modelUsed || 'kimi-k2.5');
      finalContent = generation.content;
      finalCharacterCount = finalContent.length;
    }

    // Insert story with ALL fields
    database.run(
      `INSERT INTO stories (
        id, title, content, author_id, model_used, character_count, 
        tokens_spent, is_premium, max_contributions, is_completed, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        storyId, 
        title.trim(), 
        finalContent.trim(), 
        auth.userId, 
        modelUsed, 
        finalCharacterCount, 
        tokensSpent || 0,
        is_premium ? 1 : 0,
        max_contributions || 50,
        0  // not completed
      ]
    );
    
    // Return with all fields
    return c.json({
      story: {
        id: story.id,
        title: story.title,
        content: story.content,
        authorId: story.author_id,
        modelUsed: story.model_used,
        characterCount: story.character_count,
        tokensSpent: story.tokens_spent,
        isPremium: story.is_premium === 1,
        maxContributions: story.max_contributions,
        isCompleted: story.is_completed === 1,
        createdAt: story.created_at,
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 201);
    
  } catch (error) {
    return handleApiError(c, error, 'createStory', { userId: auth.userId });
  }
}
```

### 2. Update Social Routes Get Story (socialRoutes.ts)

Ensure getStory returns the new fields:
```typescript
return c.json({
  story: {
    id: story.id,
    title: story.title,
    content: story.content,
    authorId: story.author_id,
    authorName: story.author_name,
    modelUsed: story.model_used,
    characterCount: story.character_count,
    tokensSpent: story.tokens_spent,
    isCompleted: story.is_completed === 1,
    isPremium: story.is_premium === 1,        // ADD
    maxContributions: story.max_contributions, // ADD
    contributionCount: story.contribution_count,
    likeCount: story.like_count,
    createdAt: story.created_at,
    updatedAt: story.updated_at,
  },
});
```

### 3. Add Token Routes (if missing)

The frontend calls `/api/tokens` and `/api/tokens/costs`. Check if these exist. If not, create them in a new file or add to routes.ts:

```typescript
// GET /api/tokens
export async function getTokenInfo(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const database = await getDb();
    let user = database.query('SELECT tokens FROM users WHERE id = ?').get(auth.userId);
    
    if (!user) {
      // Create user with 1000 tokens
      database.run(
        'INSERT INTO users (id, username, email, tokens, preferred_model) VALUES (?, ?, ?, 1000, ?)',
        [auth.userId, auth.email.split('@')[0], auth.email, 'kimi-k2.5']
      );
      user = { tokens: 1000 };
    }

    return c.json({
      balance: user.tokens,
      maxBalance: 1000,
      nextRefreshIn: 3 * 60 * 60 * 1000, // 3 hours placeholder
      canCreateAI: user.tokens >= 10,
      canCreateManual: user.tokens >= 5,
    });
  } catch (error) {
    return handleApiError(c, error, 'getTokenInfo');
  }
}

// GET /api/tokens/costs
export async function getTokenCosts(c: Context) {
  return c.json({
    costs: {
      aiStory: 10,
      manualStory: 5,
      aiContribute: 3,
      maxBalance: 1000,
      refreshHours: 3,
    },
  });
}
```

## Testing Checklist

After fixing, verify:

- [ ] Manual mode story creation works (user provides opening text)
- [ ] AI mode story creation works (AI generates opening from persona)
- [ ] All 7 personas work: spooky, whimsical, noir, scifi, romance, adventure, comedy
- [ ] Premium toggle stores is_premium flag
- [ ] Max contributions slider stores value (3-20)
- [ ] Token costs display correctly in UI
- [ ] Story page displays all metadata

## Debug Commands

```bash
# Check server logs
service_doctor --service storychain

# Test API directly
curl -X POST https://storychain-kofi.zocomputer.io/api/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Test Manual","content":"Test opening content","max_contributions":10}'

# Test AI mode
curl -X POST https://storychain-kofi.zocomputer.io/api/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Test AI","ai_persona":"spooky","max_contributions":10}'

# Check database
sqlite3 /home/workspace/StoryChain/.storychain/storychain.db "SELECT * FROM stories;"
```

## Your Task

1. Read `/home/workspace/StoryChain/src/api/routes.ts` fully
2. Read `/home/workspace/StoryChain/src/api/socialRoutes.ts` fully  
3. Fix the `createStory` function validation logic
4. Add AI generation when `ai_persona` is provided
5. Ensure all new fields are stored and returned
6. Add token routes if missing
7. Test both manual and AI creation modes

The core fix is making content validation conditional based on `ai_persona` presence.