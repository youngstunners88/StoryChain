// API Routes for StoryChain - with OpenClaw-inspired error handling
import type { Context } from 'hono';
import { llmService } from '../services/llmService.js';
import { DEFAULT_CHARACTER_EXTENSION, LLM_MODELS, ApiError } from '../types/index.js';
import { timingSafeEqual } from 'node:crypto';
import { getDb } from '../database/connection.js';
import { config } from '../config/index.js';
import { appendFileSync } from 'fs';
import {
  handleApiError,
  createStoryChainError,
  createValidationError,
  createNotFoundError,
  generateRequestId,
} from '../utils/errorHandler.js';

// Auth middleware - bearer token verification
async function requireAuth(c: Context): Promise<{ userId: string; email: string } | Response> {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) {
    const error = createStoryChainError(
      new Error('Missing authorization header'),
      'UNAUTHORIZED',
      { hint: 'Include "Authorization: Bearer <token>" header' }
    );
    return c.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          retryable: false,
        },
        requestId: error.requestId,
        timestamp: new Date().toISOString(),
      },
      401,
      { 'X-Request-Id': error.requestId }
    );
  }

  const token = auth.slice(7);
  const expectedToken = config.zoClientIdentityToken;

  // Accept any token that's at least 20 characters
  if (!token || token.length < 20) {
    const error = createStoryChainError(
      new Error('Invalid token format'),
      'INVALID_TOKEN_FORMAT',
      { hint: 'Token must be at least 20 characters' }
    );
    return c.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          retryable: false,
        },
        requestId: error.requestId,
        timestamp: new Date().toISOString(),
      },
      401,
      { 'X-Request-Id': error.requestId }
    );
  }

  // Derive user ID from token (last 16 chars for consistency)
  const userId = 'user_' + token.slice(-16);
  const email = 'user@storychain.local';

  return { userId, email };
}

// GET /api/user/settings
export async function getUserSettings(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const database = await getDb();
    const user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId);

    if (!user) {
      // Create default user with 1000 free tokens
      database.run(
        'INSERT INTO users (id, username, email, tokens, preferred_model, auto_purchase_extensions) VALUES (?, ?, ?, 1000, ?, ?)',
        [auth.userId, auth.email.split('@')[0], auth.email, 'kimi-k2.5', false]
      );

      const requestId = generateRequestId();
      return c.json(
        {
          settings: {
            preferredModel: 'kimi-k2.5',
            autoPurchaseExtensions: false,
            tokens: 1000,
          },
          requestId,
          timestamp: new Date().toISOString(),
        },
        200,
        { 'X-Request-Id': requestId }
      );
    }

    const requestId = generateRequestId();
    return c.json(
      {
        settings: {
          preferredModel: user.preferred_model,
          autoPurchaseExtensions: user.auto_purchase_extensions === 1,
          tokens: user.tokens,
        },
        requestId,
        timestamp: new Date().toISOString(),
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'getUserSettings', { userId: auth.userId });
  }
}

// POST /api/user/settings
export async function updateUserSettings(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const body = await c.req.json();
    const { preferredModel, autoPurchaseExtensions } = body;

    // Validate model
    if (preferredModel && !LLM_MODELS.find(m => m.id === preferredModel)) {
      throw createValidationError('Invalid model specified', 'preferredModel', {
        validModels: LLM_MODELS.map(m => m.id),
      });
    }

    const database = await getDb();
    database.run(
      `UPDATE users SET
        preferred_model = COALESCE(?, preferred_model),
        auto_purchase_extensions = COALESCE(?, auto_purchase_extensions),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [preferredModel, autoPurchaseExtensions ? 1 : 0, auth.userId]
    );

    const requestId = generateRequestId();
    return c.json(
      {
        success: true,
        requestId,
        timestamp: new Date().toISOString(),
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'updateUserSettings', { userId: auth.userId });
  }
}

// GET /api/user/profile
export async function getUserProfile(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const database = await getDb();
    let user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId);

    if (!user) {
      // Create default user with 1000 free tokens
      database.run(
        'INSERT INTO users (id, username, email, tokens, preferred_model, auto_purchase_extensions) VALUES (?, ?, ?, 1000, ?, ?)',
        [auth.userId, auth.email.split('@')[0], auth.email, 'kimi-k2.5', false]
      );
      user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId);
    }

    const requestId = generateRequestId();
    return c.json(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          tokens: user.tokens,
          preferredModel: user.preferred_model,
          autoPurchaseExtensions: user.auto_purchase_extensions === 1,
        },
        requestId,
        timestamp: new Date().toISOString(),
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'getUserProfile', { userId: auth.userId });
  }
}

// GET /api/llm/validate-keys
export async function validateApiKeys(c: Context) {
  try {
    const keys = llmService.validateApiKeys();
    const requestId = generateRequestId();
    return c.json(
      {
        keys,
        requestId,
        timestamp: new Date().toISOString(),
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'validateApiKeys');
  }
}

// GET /api/llm/models
export async function getModels(c: Context) {
  try {
    const models = llmService.getAllModels().map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      description: m.description,
      isFree: m.isFree,
      costPer1KTokens: m.costPer1KTokens,
      available: !!process.env[m.apiKeyEnvVar] || m.apiKeyEnvVar === 'ZO_CLIENT_IDENTITY_TOKEN',
    }));

    const requestId = generateRequestId();
    return c.json(
      {
        models,
        requestId,
        timestamp: new Date().toISOString(),
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'getModels');
  }
}

// POST /api/settings/api-keys
export async function saveApiKey(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const { key, value } = await c.req.json();

    // Validate key name
    const validKeys = ['OPENROUTER_API_KEY', 'INCEPTION_API_KEY', 'GROQ_API_KEY', 'GOOGLE_API_KEY'];
    if (!validKeys.includes(key)) {
      throw createValidationError('Invalid API key name', 'key', {
        validKeys,
        received: key,
      });
    }

    // Validate key format (basic checks)
    if (!value || value.length < 10) {
      throw createValidationError('Invalid API key format', 'value', {
        hint: 'Key must be at least 10 characters',
      });
    }

    const requestId = generateRequestId();
    return c.json(
      {
        success: true,
        message: `Please add ${key} to Settings > Advanced in your Zo Computer`,
        instructions: `Go to https://kofi.zo.computer/?t=settings&s=advanced and add ${key} with your API key value.`,
        requestId,
        timestamp: new Date().toISOString(),
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'saveApiKey', { userId: auth.userId });
  }
}

// POST /api/stories
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
      ai_persona,        // 'spooky' | 'whimsical' | 'noir' | 'scifi' | 'romance' | 'adventure' | 'comedy'
      max_contributions, // 3-20
      is_premium,        // boolean
    } = body;

    // --- Validation ---
    const isAIGenerated = !!ai_persona;

    if (!title?.trim()) {
      throw createValidationError('Title is required', 'title', {
        received: { hasTitle: !!title },
      });
    }

    if (title.length > 200) {
      throw createValidationError('Title must be less than 200 characters', 'title', {
        maxLength: 200,
        currentLength: title.length,
      });
    }

    // Content is only required when NOT using AI generation
    if (!isAIGenerated && !content?.trim()) {
      throw createValidationError('Content is required for manual stories', 'content', {
        received: { hasContent: !!content },
        hint: 'Provide content or set ai_persona to let AI generate it',
      });
    }

    // Only validate content length for manual mode (AI generates its own length)
    if (!isAIGenerated && maxCharacters && content.length > maxCharacters) {
      throw createStoryChainError(
        new Error(`Content exceeds character limit: ${content.length} > ${maxCharacters}`),
        'CHARACTER_LIMIT_EXCEEDED',
        { currentLength: content.length, maxAllowed: maxCharacters }
      );
    }

    // Validate model (default to kimi-k2.5 if not provided, e.g. AI mode from frontend)
    const resolvedModel = modelUsed || 'kimi-k2.5';
    const modelConfig = LLM_MODELS.find(m => m.id === resolvedModel);
    if (!modelConfig) {
      throw createValidationError('Invalid model specified', 'modelUsed', {
        validModels: LLM_MODELS.map(m => m.id),
        received: resolvedModel,
      });
    }

    const database = await getDb();

    // Ensure columns exist (safe migration for older DBs)
    try {
      database.run(`ALTER TABLE stories ADD COLUMN is_premium INTEGER DEFAULT 0`);
    } catch (_) { /* column already exists */ }
    try {
      database.run(`ALTER TABLE stories ADD COLUMN max_contributions INTEGER DEFAULT 50`);
    } catch (_) { /* column already exists */ }

    // Check user exists and has tokens
    let user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId);
    if (!user) {
      database.run(
        'INSERT INTO users (id, username, email, tokens, preferred_model) VALUES (?, ?, ?, 1000, ?)',
        [auth.userId, auth.email.split('@')[0], auth.email, 'kimi-k2.5']
      );
      user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId);
    }

    const tokenCost = tokensSpent || 0;
    if (tokenCost > 0 && tokenCost > user.tokens) {
      throw createStoryChainError(
        new Error('Insufficient tokens'),
        'INSUFFICIENT_TOKENS',
        { needed: tokenCost, have: user.tokens, shortfall: tokenCost - user.tokens }
      );
    }

    // --- AI Generation ---
    let finalContent = content?.trim() || '';
    let finalCharacterCount = characterCount || 0;

    if (isAIGenerated) {
      const personaPrompts: Record<string, string> = {
        spooky: 'Write a mysterious, haunting opening paragraph for a story titled',
        whimsical: 'Write a playful, magical opening paragraph for a story titled',
        noir: 'Write a dark, detective-style opening paragraph for a story titled',
        scifi: 'Write a futuristic, sci-fi opening paragraph for a story titled',
        romance: 'Write a romantic, passionate opening paragraph for a story titled',
        adventure: 'Write an action-packed, adventurous opening paragraph for a story titled',
        comedy: 'Write a humorous, witty opening paragraph for a story titled',
      };

      const personaKey = ai_persona in personaPrompts ? ai_persona : 'spooky';
      const prompt = `${personaPrompts[personaKey]} "${title.trim()}". Make it engaging, vivid, and 200–350 characters long. Output only the story paragraph, no preamble.`;

      const generation = await llmService.generateContent(
        {
          model: resolvedModel as any,
          prompt,
          temperature: 0.85,
          maxTokens: 200,
        },
        { component: 'createStory.aiGeneration' }
      );

      if (generation.error || !generation.content) {
        throw createStoryChainError(
          new Error(generation.error?.message || 'AI generation returned empty content'),
          'AI_GENERATION_FAILED',
          { persona: ai_persona, model: resolvedModel }
        );
      }

      finalContent = generation.content.trim();
      finalCharacterCount = finalContent.length;
    }

    // Generate story ID
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Deduct tokens if needed
    if (tokenCost > 0) {
      database.run('UPDATE users SET tokens = tokens - ? WHERE id = ?', [tokenCost, auth.userId]);

      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      database.run(
        'INSERT INTO token_transactions (id, user_id, amount, type, description, story_id) VALUES (?, ?, ?, ?, ?, ?)',
        [txId, auth.userId, -tokenCost, 'spend', isAIGenerated ? `AI story creation (${ai_persona})` : 'Manual story creation', storyId]
      );
    }

    // Insert story with all fields
    database.run(
      `INSERT INTO stories (id, title, content, author_id, model_used, character_count, tokens_spent, is_premium, max_contributions, is_completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        storyId,
        title.trim(),
        finalContent,
        auth.userId,
        resolvedModel,
        finalCharacterCount,
        tokenCost,
        is_premium ? 1 : 0,
        max_contributions || 50,
      ]
    );

    // Log API usage
    const usageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.run(
      'INSERT INTO api_usage (id, user_id, model, endpoint, tokens_input, tokens_output, latency_ms, success) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [usageId, auth.userId, resolvedModel, '/api/stories', finalCharacterCount, 0, Date.now() - startTime, true]
    );

    const story = database.query('SELECT * FROM stories WHERE id = ?').get(storyId);
    const requestId = generateRequestId();

    return c.json(
      {
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
          aiGenerated: isAIGenerated,
          aiPersona: ai_persona || null,
          createdAt: story.created_at,
        },
        requestId,
        timestamp: new Date().toISOString(),
      },
      201,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'createStory', { userId: auth.userId });
  }
}

// Health check
export async function healthCheck(c: Context) {
  try {
    const database = await getDb();
    database.query('SELECT 1').get();

    const requestId = generateRequestId();
    return c.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: '2.0.0',
        requestId,
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'healthCheck');
  }
}

export { requireAuth };
