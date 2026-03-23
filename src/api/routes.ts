// API Routes for StoryChain - Token-free version
import type { Context } from 'hono';
import { llmService } from '../services/llmService.js';
import { DEFAULT_CHARACTER_EXTENSION, LLM_MODELS, ApiError } from '../types/index.js';
import { getDb } from '../database/connection.js';
import { config } from '../config/index.js';
import { appendFileSync } from 'fs';
import { resolveActorIdentity } from '../core/auth/actor.js';
import { buildWorkspaceContext } from '../core/context/workspaceContext.js';
import {
  handleApiError,
  createStoryChainError,
  createValidationError,
  createNotFoundError,
  generateRequestId,
} from '../utils/errorHandler.js';

interface UserRow {
  id: string;
  username: string;
  email: string;
  preferred_model: string;
  auto_purchase_extensions: number;
}

interface StoryRow {
  id: string;
  title: string;
  content: string;
  author_id: string;
  model_used: string;
  character_count: number;
  created_at: string;
}

// Auth middleware - bearer token verification
async function requireAuth(c: Context): Promise<{ userId: string; email: string } | Response> {
  const actor = resolveActorIdentity({
    authorizationHeader: c.req.header('authorization'),
    sessionIdHeader: c.req.header('x-session-id'),
    expectedToken: config.authMode === 'token' ? config.zoClientIdentityToken : '',
  });

  return { userId: actor.userId, email: actor.email };
}

// GET /api/user/settings
export async function getUserSettings(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const database = await getDb();
    const user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId) as UserRow | null;

    if (!user) {
      // Create default user - NO TOKENS
      database.run(
        'INSERT INTO users (id, username, email, preferred_model, auto_purchase_extensions) VALUES (?, ?, ?, ?, ?)',
        [auth.userId, auth.email.split('@')[0], auth.email, 'kimi-k2.5', false]
      );

      const requestId = generateRequestId();
      return c.json(
        {
          settings: {
            preferredModel: 'kimi-k2.5',
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
    let user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId) as UserRow | null;

    if (!user) {
      // Create default user - NO TOKENS
      database.run(
        'INSERT INTO users (id, username, email, preferred_model, auto_purchase_extensions) VALUES (?, ?, ?, ?, ?)',
        [auth.userId, auth.email.split('@')[0], auth.email, 'kimi-k2.5', false]
      );
      user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId) as UserRow | null;
      if (!user) {
        throw createNotFoundError('User', auth.userId);
      }
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

// POST /api/stories - Create story (PUBLIC - supports anonymous, agent, and authenticated users)
export async function createStory(c: Context) {
  const startTime = Date.now();
  const workspace = buildWorkspaceContext(c);

  // Try to get auth, but don't require it
  let auth: { userId: string; email: string } | null = null;
  const authHeader = c.req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token && token.length >= 20) {
      auth = { userId: 'user_' + token.slice(-16), email: 'user@storychain.local' };
    }
  }

  try {
    const body = await c.req.json();
    const {
      title,
      content,
      modelUsed,
      authorId,     // Optional: for anonymous/agent authors
      authorName,   // Optional: display name
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

    // Validate model (default to kimi-k2.5)
    const resolvedModel = modelUsed || 'kimi-k2.5';
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
      finalAuthorName = auth.email.split('@')[0];
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
    const user = database.query('SELECT * FROM users WHERE id = ?').get(finalAuthorId) as UserRow | null;
    if (!user) {
      database.run(
        'INSERT INTO users (id, username, email, preferred_model) VALUES (?, ?, ?, ?)',
        [finalAuthorId, finalAuthorName, `${finalAuthorId}@storychain.local`, resolvedModel]
      );
    }

    // Generate story ID
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert story - NO TOKENS_SPENT
    database.run(
      `INSERT INTO stories (id, title, content, author_id, model_used, character_count, is_premium, max_contributions, is_completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        storyId,
        title.trim(),
        content.trim(),
        finalAuthorId,
        resolvedModel,
        content.length,
        0, // Not premium
        50, // Default max contributions
      ]
    );

    const story = database.query('SELECT * FROM stories WHERE id = ?').get(storyId) as StoryRow;
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
      { 'X-Request-Id': requestId, 'X-Workspace-Id': workspace.workspaceId }
    );
  } catch (error) {
    return handleApiError(c, error, 'createStory', { userId: auth?.userId || 'anonymous' });
  }
}

// Health check
export async function healthCheck(c: Context) {
  try {
    const workspace = buildWorkspaceContext(c);
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
        workspaceId: workspace.workspaceId,
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'healthCheck');
  }
}

export { requireAuth };
