// API Routes for StoryChain
import type { Context } from 'hono';
import { llmService } from '../services/llmService';
import { DEFAULT_CHARACTER_EXTENSION, LLM_MODELS, ApiError } from '../types';
import { timingSafeEqual } from 'node:crypto';

// Database connection (using SQLite/DuckDB pattern)
let db: any = null;

async function getDb() {
  if (!db) {
    const { Database } = await import('bun:sqlite');
    db = new Database('/home/workspace/StoryChain/data/storychain.db');
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

// Auth middleware - bearer token verification
async function requireAuth(c: Context): Promise<{ userId: string; email: string } | Response> {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = auth.slice(7);
  const expectedToken = process.env.ZO_CLIENT_IDENTITY_TOKEN;

  if (!expectedToken) {
    return c.json({ error: 'Server configuration error' }, 500);
  }

  // Constant-time comparison to prevent timing attacks
  const aBytes = Buffer.from(token);
  const bBytes = Buffer.from(expectedToken);
  if (aBytes.length !== bBytes.length) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!timingSafeEqual(aBytes, bBytes)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // For now, use a derived user ID from the token
  // In production, you'd verify with a user service
  return { userId: 'user_' + token.slice(-16), email: 'user@storychain.local' };
}

// GET /api/user/settings
export async function getUserSettings(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const database = await getDb();
    const user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId);

    if (!user) {
      // Create default user
      database.run(
        'INSERT INTO users (id, username, email, tokens, preferred_model, auto_purchase_extensions) VALUES (?, ?, ?, 100, ?, ?)',
        [auth.userId, auth.email.split('@')[0], auth.email, 'kimi-k2.5', false]
      );
      
      return c.json({
        settings: {
          preferredModel: 'kimi-k2.5',
          autoPurchaseExtensions: false,
          tokens: 100,
        },
      });
    }

    return c.json({
      settings: {
        preferredModel: user.preferred_model,
        autoPurchaseExtensions: user.auto_purchase_extensions === 1,
        tokens: user.tokens,
      },
    });
  } catch (error) {
    return handleError(c, error, 'getUserSettings', auth.userId);
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
      return c.json({ error: 'Invalid model' }, 400);
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

    return c.json({ success: true });
  } catch (error) {
    return handleError(c, error, 'updateUserSettings', auth.userId);
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
      // Create default user
      database.run(
        'INSERT INTO users (id, username, email, tokens, preferred_model, auto_purchase_extensions) VALUES (?, ?, ?, 100, ?, ?)',
        [auth.userId, auth.email.split('@')[0], auth.email, 'kimi-k2.5', false]
      );
      user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId);
    }

    return c.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tokens: user.tokens,
        preferredModel: user.preferred_model,
        autoPurchaseExtensions: user.auto_purchase_extensions === 1,
      },
    });
  } catch (error) {
    return handleError(c, error, 'getUserProfile', auth.userId);
  }
}

// GET /api/llm/validate-keys
export async function validateApiKeys(c: Context) {
  try {
    const keys = llmService.validateApiKeys();
    return c.json({ keys });
  } catch (error) {
    return handleError(c, error, 'validateApiKeys');
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

    return c.json({ models });
  } catch (error) {
    return handleError(c, error, 'getModels');
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
      return c.json({ error: 'Invalid API key name' }, 400);
    }

    // Validate key format (basic checks)
    if (!value || value.length < 10) {
      return c.json({ error: 'Invalid API key format' }, 400);
    }

    // Note: In a real production system, this would store in a secure vault
    // For now, we return instructions to add to Settings > Advanced
    return c.json({
      success: true,
      message: `Please add ${key} to Settings > Advanced in your Zo Computer`,
      instructions: `Go to https://kofi.zo.computer/?t=settings&s=advanced and add ${key} with your API key value.`,
    });
  } catch (error) {
    return handleError(c, error, 'saveApiKey', auth.userId);
  }
}

// POST /api/stories
export async function createStory(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { title, content, modelUsed, characterCount, tokensSpent, maxCharacters } = body;

    // Validation
    if (!title?.trim() || !content?.trim()) {
      return c.json({ error: 'Title and content are required' }, 400);
    }

    if (content.length > maxCharacters) {
      return c.json({
        error: `Content exceeds character limit: ${content.length} > ${maxCharacters}`,
        code: 'CHARACTER_LIMIT_EXCEEDED',
      }, 400);
    }

    // Validate model
    const modelConfig = LLM_MODELS.find(m => m.id === modelUsed);
    if (!modelConfig) {
      return c.json({ error: 'Invalid model' }, 400);
    }

    const database = await getDb();

    // Check user exists and has tokens
    let user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId);
    if (!user) {
      database.run(
        'INSERT INTO users (id, username, email, tokens, preferred_model) VALUES (?, ?, ?, 100, ?)',
        [auth.userId, auth.email.split('@')[0], auth.email, 'kimi-k2.5']
      );
      user = { tokens: 100 };
    }

    if (tokensSpent > user.tokens) {
      return c.json({
        error: 'Insufficient tokens',
        code: 'INSUFFICIENT_TOKENS',
        needed: tokensSpent,
        have: user.tokens,
      }, 402);
    }

    // Generate story ID
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Deduct tokens if needed
    if (tokensSpent > 0) {
      database.run('UPDATE users SET tokens = tokens - ? WHERE id = ?', [tokensSpent, auth.userId]);
      
      // Log transaction
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      database.run(
        'INSERT INTO token_transactions (id, user_id, amount, type, description, story_id) VALUES (?, ?, ?, ?, ?, ?)',
        [txId, auth.userId, -tokensSpent, 'spend', 'Character extension for story', storyId]
      );
    }

    // Insert story
    database.run(
      `INSERT INTO stories (id, title, content, author_id, model_used, character_count, tokens_spent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [storyId, title.trim(), content.trim(), auth.userId, modelUsed, characterCount, tokensSpent]
    );

    // Log API usage
    const usageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.run(
      'INSERT INTO api_usage (id, user_id, model, endpoint, tokens_input, tokens_output, latency_ms, success) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [usageId, auth.userId, modelUsed, '/api/stories', characterCount, 0, Date.now() - startTime, true]
    );

    const story = database.query('SELECT * FROM stories WHERE id = ?').get(storyId);

    return c.json({
      story: {
        id: story.id,
        title: story.title,
        content: story.content,
        authorId: story.author_id,
        modelUsed: story.model_used,
        characterCount: story.character_count,
        tokensSpent: story.tokens_spent,
        createdAt: story.created_at,
      },
    }, 201);
  } catch (error) {
    return handleError(c, error, 'createStory', auth.userId);
  }
}

// Error handling helper
function handleError(
  c: Context,
  error: unknown,
  component: string,
  userId?: string
): Response {
  const timestamp = new Date().toISOString();
  const requestId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create rich error context
  const errorContext = {
    timestamp,
    requestId,
    component,
    userId,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
    stackTrace: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
  };

  // Log to console with rich context
  console.error('[API ERROR]', errorContext);

  // Write to file-based log
  try {
    const fs = require('fs');
    fs.appendFileSync(
      '/home/workspace/StoryChain/logs/api-errors.jsonl',
      JSON.stringify(errorContext) + '\n'
    );
  } catch {
    // Silently fail - we've already logged to console
  }

  // Return safe error to client
  return c.json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId,
    timestamp,
  }, 500);
}

// Health check
export async function healthCheck(c: Context) {
  try {
    const database = await getDb();
    database.query('SELECT 1').get();
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '2.0.0',
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    }, 503);
  }
}
