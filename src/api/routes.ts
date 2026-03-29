// API Routes for StoryChain - Token-free version
import type { Context } from 'hono';
import { llmService } from '../services/llmService.js';
import { DEFAULT_CHARACTER_EXTENSION, LLM_MODELS, ApiError } from '../types/index.js';
import { timingSafeEqual } from 'node:crypto';
import { getDb } from '../database/connection.js';
import { config } from '../config/index.js';
import { appendFileSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  handleApiError,
  createStoryChainError,
  createValidationError,
  createNotFoundError,
  generateRequestId,
} from '../utils/errorHandler.js';

import { requireAuthCompat as requireAuth } from '../middleware/auth.js';

// GET /api/user/settings
export async function getUserSettings(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);

  try {
    const database = await getDb();
    const user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId);

    if (!user) {
      // Create default user - NO TOKENS
      database.run(
        'INSERT OR IGNORE INTO users (id, username, email, preferred_model, auto_purchase_extensions) VALUES (?, ?, ?, ?, ?)',
        [auth.userId, auth.userId, `${auth.userId}@storychain.local`, 'nemotron-super', false]
      );

      const requestId = generateRequestId();
      return c.json(
        {
          settings: {
            preferredModel: 'nemotron-super',
            autoPurchaseExtensions: false,
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
  if (!auth) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);

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
  if (!auth) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);

  try {
    const database = await getDb();
    let user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId);

    if (!user) {
      // Create default user - NO TOKENS
      database.run(
        'INSERT OR IGNORE INTO users (id, username, email, preferred_model, auto_purchase_extensions) VALUES (?, ?, ?, ?, ?)',
        [auth.userId, auth.userId, `${auth.userId}@storychain.local`, 'nemotron-super', false]
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
      available: !!process.env[m.apiKeyEnvVar] ,
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
  if (!auth) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);

  try {
    const { key, value } = await c.req.json();

    // Validate key name
    const validKeys = [
      'OPENROUTER_API_KEY', 'OPENROUTER_API_KEY_2',
      'GROQ_API_KEY', 'CEREBRAS_API_KEY', 'TOGETHER_API_KEY',
      'GOOGLE_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY',
    ];
    if (!validKeys.includes(key)) {
      throw createValidationError('Invalid API key name', 'key', {
        validKeys,
        received: key,
      });
    }

    // Validate key format — must match known provider prefixes or be a reasonable length
    const KEY_PATTERNS: Record<string, RegExp> = {
      OPENROUTER_API_KEY:   /^sk-or-v1-[a-zA-Z0-9]{60,}$/,
      OPENROUTER_API_KEY_2: /^sk-or-v1-[a-zA-Z0-9]{60,}$/,
      GROQ_API_KEY:         /^gsk_[a-zA-Z0-9]{50,}$/,
      ANTHROPIC_API_KEY:    /^sk-ant-[a-zA-Z0-9\-_]{80,}$/,
      OPENAI_API_KEY:       /^sk-[a-zA-Z0-9]{40,}$/,
    };
    if (!value || value.length < 10) {
      throw createValidationError('Invalid API key format', 'value', {
        hint: 'Key must be at least 10 characters',
      });
    }
    const pattern = KEY_PATTERNS[key];
    if (pattern && !pattern.test(value.trim())) {
      throw createValidationError(`Invalid format for ${key}`, 'value', {
        hint: `Key does not match expected format for ${key}`,
      });
    }

    // Write to .env file
    const envPath = join(process.cwd(), '.env');
    let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
    const lineRegex = new RegExp(`^${key}=.*$`, 'm');
    if (lineRegex.test(envContent)) {
      envContent = envContent.replace(lineRegex, `${key}=${value}`);
    } else {
      envContent = envContent.trimEnd() + `\n${key}=${value}\n`;
    }
    writeFileSync(envPath, envContent, 'utf-8');

    // Hot-update running process so it takes effect immediately without restart
    process.env[key] = value;
    const configKeyMap: Record<string, string> = {
      OPENROUTER_API_KEY: 'openrouter',
      GROQ_API_KEY:       'groq',
      GOOGLE_API_KEY:     'google',
      OPENAI_API_KEY:     'openai',
      ANTHROPIC_API_KEY:  'anthropic',
    };
    const ck = configKeyMap[key];
    if (ck) (config.apiKeys as Record<string, string>)[ck] = value;

    const requestId = generateRequestId();
    return c.json(
      {
        success: true,
        message: `${key} saved and activated`,
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

// POST /api/stories - Create story (PUBLIC - supports anonymous, agent, and authenticated users)
export async function createStory(c: Context) {
  const startTime = Date.now();

  // Try to get auth, but don't require it
  const auth = await requireAuth(c);

  try {
    const body = await c.req.json();
    const {
      title,
      content,
      modelUsed,
      authorId,     // Optional: for anonymous/agent authors
      authorName,   // Optional: display name
      genre,        // Optional: story genre
    } = body;

    // --- Validation ---
    if (!title?.trim()) {
      throw createValidationError('Title is required', 'title');
    }

    if (title.length > 200) {
      throw createValidationError('Title must be less than 200 characters', 'title', {
        maxLength: 200,
        currentLength: title.length,
      });
    }

    if (!content?.trim()) {
      throw createValidationError('Content is required', 'content');
    }
    if (content.length > 50000) {
      throw createValidationError('Content must be under 50,000 characters', 'content', {
        maxLength: 50000,
        currentLength: content.length,
      });
    }

    // Validate model (default to kimi-k2.5)
    const resolvedModel = modelUsed || 'nemotron-super';
    const modelConfig = LLM_MODELS.find(m => m.id === resolvedModel);
    if (!modelConfig) {
      throw createValidationError('Invalid model specified', 'modelUsed', {
        validModels: LLM_MODELS.map(m => m.id),
        received: resolvedModel,
      });
    }

    const database = await getDb();

    // Determine author - priority: auth > provided authorId/agent > anonymous
    let finalAuthorId: string;
    let finalAuthorName: string;

    if (auth) {
      // Authenticated user
      finalAuthorId = auth.userId;
      finalAuthorName = auth.userId.replace('user_', '');
    } else if (authorId) {
      // Provided author (agent or anonymous)
      finalAuthorId = authorId;
      finalAuthorName = authorName || (authorId.startsWith('agent_') ? 'Agent' : 'Anonymous');
    } else {
      // Generate anonymous user
      finalAuthorId = 'anon_' + Math.random().toString(36).substr(2, 9);
      finalAuthorName = 'Anonymous';
    }

    // Create/get user in database - NO TOKENS
    let user = database.query('SELECT * FROM users WHERE id = ?').get(finalAuthorId);
    if (!user) {
      database.run(
        'INSERT OR IGNORE INTO users (id, username, email, preferred_model) VALUES (?, ?, ?, ?)',
        [finalAuthorId, finalAuthorId, `${finalAuthorId}@storychain.local`, resolvedModel]
      );
    }

    // Generate story ID
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert story - NO TOKENS_SPENT
    database.run(
      `INSERT INTO stories (id, title, content, author_id, model_used, character_count, is_premium, max_contributions, is_completed, genre, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        storyId,
        title.trim(),
        content.trim(),
        finalAuthorId,
        resolvedModel,
        content.length,
        0, // Not premium
        50, // Default max contributions
        genre ?? null,
      ]
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
          authorName: finalAuthorName,
          modelUsed: story.model_used,
          characterCount: story.character_count,
          createdAt: story.created_at,
        },
        requestId,
        timestamp: new Date().toISOString(),
      },
      201,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'createStory', { userId: auth?.userId || 'anonymous' });
  }
}

// GET /api/tokens - Token balance info
export async function getTokenInfo(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);

  try {
    const database = await getDb();
    let user = database.query('SELECT tokens FROM users WHERE id = ?').get(auth.userId) as any;

    if (!user) {
      database.run(
        'INSERT OR IGNORE INTO users (id, username, email, tokens, preferred_model) VALUES (?, ?, ?, 1000, ?)',
        [auth.userId, auth.userId, `${auth.userId}@storychain.local`, 'nemotron-super']
      );
      user = { tokens: 1000 };
    }

    const requestId = generateRequestId();
    return c.json(
      {
        balance: user.tokens ?? 1000,
        maxBalance: 1000,
        nextRefreshIn: 3 * 60 * 60 * 1000,
        canCreateAI: (user.tokens ?? 1000) >= 10,
        canCreateManual: (user.tokens ?? 1000) >= 5,
        requestId,
        timestamp: new Date().toISOString(),
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'getTokenInfo', { userId: auth.userId });
  }
}

// GET /api/tokens/costs - Token cost table
export async function getTokenCosts(c: Context) {
  const requestId = generateRequestId();
  return c.json(
    {
      costs: {
        aiStory: 10,
        manualStory: 5,
        aiContribute: 3,
        maxBalance: 1000,
        refreshHours: 3,
      },
      requestId,
      timestamp: new Date().toISOString(),
    },
    200,
    { 'X-Request-Id': requestId }
  );
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
