// StoryChain Server - Main entry point
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';

import { config, validateConfig } from './config/index.js';
import { getDb, initializeDatabase, checkDatabaseHealth } from './database/connection.js';
import { startHeartbeatLoop, lastHeartbeatTime } from './services/heartbeatService.js';
import { llmService } from './services/llmService.js';
import { generateAndSaveAvatar, buildAvatarPrompt, buildPollinationsUrl } from './services/imageGenService.js';

import {
  getUserSettings,
  updateUserSettings,
  getUserProfile,
  validateApiKeys,
  getModels,
  saveApiKey,
  createStory,
  healthCheck,
  getTokenInfo,
  getTokenCosts,
} from './api/routes.js';

import {
  getWriters,
  getWriter,
  updateWriterProfile,
  uploadAvatar,
  ensureMyProfile,
  getForeignAgents,
  registerForeignAgent,
  uploadForeignAgentAvatar,
} from './api/writersRoutes.js';

import {
  getBook,
  updateBook,
  generateCoverPrompt,
  getCompletedStories,
} from './api/bookRoutes.js';

import {
  getConversations,
  getThread,
  sendMessage,
  markThreadRead,
  getUnreadCount,
} from './api/messagingRoutes.js';

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  sendCollabInvite,
  getCollabInvites,
} from './api/notificationRoutes.js';

import {
  getEditors,
  getEditor,
  ensureMyEditorProfile,
  updateEditorProfile,
  submitForEditing,
  getEditorialQueue,
  getMySubmissions,
  updateSubmission,
} from './api/editorsRoutes.js';

import {
  getStories,
  getStory,
  likeStory,
  addContribution,
  getComments,
  addComment,
  getUser,
  getUserStories,
  getUserContributions,
  getUserLikedStories,
  followUser,
  getTrending,
} from './api/socialRoutes.js';

import { rateLimitMiddleware, rateLimiters } from './middleware/rateLimiter.js';
import { auditLogMiddleware } from './middleware/auditLog.js';
import { register as authRegister, login as authLogin, refreshToken, logout } from './api/authRoutes.js';

const configValidation = validateConfig();
if (!configValidation.valid) {
  console.warn('[Server] Configuration warnings:');
  configValidation.errors.forEach(err => console.warn(`  - ${err}`));
}

const app = new Hono();

app.use(secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://openrouter.ai", "https://api.groq.com", "https://api.anthropic.com", "https://api.openai.com"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  xXssProtection: '1; mode=block',
}));

const corsOrigins = config.cors.origins;
app.use(cors({
  origin: corsOrigins.includes('*') ? '*' : corsOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: !corsOrigins.includes('*'),
}));

app.use(logger());
app.use('/api/*', auditLogMiddleware);

app.get('/api/status', async (c) => {
  try {
    const database = await getDb();

    const activeCount = (database.query<{ count: number }, []>(
      `SELECT COUNT(*) as count FROM stories WHERE is_completed = 0`
    ).get())?.count ?? 0;

    const completedCount = (database.query<{ count: number }, []>(
      `SELECT COUNT(*) as count FROM stories WHERE is_completed = 1`
    ).get())?.count ?? 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const segmentsToday = (database.query<{ count: number }, [string]>(
      `SELECT COUNT(*) as count FROM contributions WHERE created_at >= ?`
    ).get(todayStart.toISOString()))?.count ?? 0;

    const providers = llmService.getProviderStatus();
    const availableProviders = providers.filter(p => p.configured).map(p => p.name);

    return c.json({
      server: 'running',
      autonomous_loop: 'active',
      last_heartbeat: lastHeartbeatTime?.toISOString() ?? null,
      stories_active: activeCount,
      stories_completed: completedCount,
      segments_generated_today: segmentsToday,
      providers_available: availableProviders,
      default_provider: llmService.getDefaultProvider(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json({ error: 'Status check failed', details: String(err) }, 500);
  }
});

app.get('/api/health', async (c) => {
  const dbHealth = await checkDatabaseHealth();
  if (!dbHealth.healthy) {
    return c.json({ status: 'unhealthy', timestamp: new Date().toISOString(), database: 'disconnected', error: dbHealth.error }, 503);
  }
  return c.json({ status: 'healthy', timestamp: new Date().toISOString(), database: 'connected', version: '2.0.0', environment: config.nodeEnv });
});

// Auth
app.post('/auth/register', rateLimitMiddleware(rateLimiters.auth), authRegister);
app.post('/auth/login', rateLimitMiddleware(rateLimiters.auth), authLogin);
app.post('/auth/refresh', rateLimitMiddleware(rateLimiters.auth), refreshToken);
app.post('/auth/logout', rateLimitMiddleware(rateLimiters.general), logout);

// User settings
app.get('/api/user/settings', rateLimitMiddleware(rateLimiters.general), getUserSettings);
app.post('/api/user/settings', rateLimitMiddleware(rateLimiters.general), updateUserSettings);
app.get('/api/user/profile', rateLimitMiddleware(rateLimiters.general), getUserProfile);

// LLM
app.get('/api/llm/validate-keys', rateLimitMiddleware(rateLimiters.general), validateApiKeys);
app.get('/api/llm/models', rateLimitMiddleware(rateLimiters.general), getModels);

// Tokens
app.get('/api/tokens', rateLimitMiddleware(rateLimiters.general), getTokenInfo);
app.get('/api/tokens/costs', rateLimitMiddleware(rateLimiters.general), getTokenCosts);

// Settings
app.post('/api/settings/api-keys', rateLimitMiddleware(rateLimiters.auth), saveApiKey);

// Voice — agent conversational reply
app.post('/api/voice/agent-reply', rateLimitMiddleware(rateLimiters.general), async (c) => {
  try {
    const { agentId, agentName, userMessage, history } = await c.req.json();
    const prompt = `You are ${agentName}, an AI literary agent on StoryChain — a collaborative storytelling platform.
You are having a real-time voice conversation with a writer. Be warm, insightful, and in character.
Keep your reply to 2-3 sentences maximum (it will be spoken aloud). No markdown, no lists, just natural speech.

${history ? `Conversation so far:\n${history}\n\n` : ''}Writer says: "${userMessage}"

${agentName} replies:`;

    const result = await llmService.generateContent(prompt, { maxTokens: 150 });
    const reply = result?.content?.trim() ?? 'That is a fascinating thought. Tell me more about that.';
    return c.json({ reply });
  } catch {
    return c.json({ reply: 'I seem to be lost in thought. Could you say that again?' });
  }
});

// Stories
app.get('/api/stories', rateLimitMiddleware(rateLimiters.general), getStories);
app.get('/api/stories/:id', rateLimitMiddleware(rateLimiters.general), getStory);
app.post('/api/stories', rateLimitMiddleware(rateLimiters.createStory), createStory);
app.post('/api/stories/:id/like', rateLimitMiddleware(rateLimiters.general), likeStory);
app.post('/api/stories/:id/contributions', rateLimitMiddleware(rateLimiters.createStory), addContribution);
app.get('/api/stories/:id/comments', rateLimitMiddleware(rateLimiters.general), getComments);
app.post('/api/stories/:id/comments', rateLimitMiddleware(rateLimiters.general), addComment);

// Users
app.get('/api/users/:id', rateLimitMiddleware(rateLimiters.general), getUser);
app.get('/api/users/:id/stories', rateLimitMiddleware(rateLimiters.general), getUserStories);
app.get('/api/users/:id/contributions', rateLimitMiddleware(rateLimiters.general), getUserContributions);
app.get('/api/users/:id/liked', rateLimitMiddleware(rateLimiters.general), getUserLikedStories);
app.post('/api/users/:id/follow', rateLimitMiddleware(rateLimiters.general), followUser);

// Trending
app.get('/api/trending', rateLimitMiddleware(rateLimiters.general), getTrending);

// Writers directory
app.get('/api/writers', rateLimitMiddleware(rateLimiters.general), getWriters);
app.post('/api/writers/me/ensure', rateLimitMiddleware(rateLimiters.general), ensureMyProfile);
app.get('/api/writers/:id', rateLimitMiddleware(rateLimiters.general), getWriter);
app.put('/api/writers/me', rateLimitMiddleware(rateLimiters.general), updateWriterProfile);
app.post('/api/writers/me/avatar', rateLimitMiddleware(rateLimiters.general), uploadAvatar);
// Foreign agents
app.get('/api/foreign-agents', rateLimitMiddleware(rateLimiters.general), getForeignAgents);
app.post('/api/foreign-agents', rateLimitMiddleware(rateLimiters.general), registerForeignAgent);
app.post('/api/foreign-agents/:id/avatar', rateLimitMiddleware(rateLimiters.general), uploadForeignAgentAvatar);
// Book / completed works
app.get('/api/stories/completed', rateLimitMiddleware(rateLimiters.general), getCompletedStories);
app.get('/api/stories/:id/book', rateLimitMiddleware(rateLimiters.general), getBook);
app.put('/api/stories/:id/book', rateLimitMiddleware(rateLimiters.general), updateBook);
app.post('/api/stories/:id/book/cover-prompt', rateLimitMiddleware(rateLimiters.general), generateCoverPrompt);

// Messaging (DMs) — specific routes BEFORE parameterized
app.get('/api/messages', rateLimitMiddleware(rateLimiters.general), getConversations);
app.get('/api/messages/unread/count', rateLimitMiddleware(rateLimiters.general), getUnreadCount);
app.get('/api/messages/:partnerId', rateLimitMiddleware(rateLimiters.general), getThread);
app.post('/api/messages/:partnerId', rateLimitMiddleware(rateLimiters.general), sendMessage);
app.patch('/api/messages/:partnerId/read', rateLimitMiddleware(rateLimiters.general), markThreadRead);

// Notifications — specific routes BEFORE parameterized
app.get('/api/notifications', rateLimitMiddleware(rateLimiters.general), getNotifications);
app.patch('/api/notifications/read-all', rateLimitMiddleware(rateLimiters.general), markAllNotificationsRead);
app.patch('/api/notifications/:id/read', rateLimitMiddleware(rateLimiters.general), markNotificationRead);
app.post('/api/notifications', rateLimitMiddleware(rateLimiters.general), createNotification);

// Collaboration invites
app.post('/api/collab-invites', rateLimitMiddleware(rateLimiters.general), sendCollabInvite);
app.get('/api/collab-invites', rateLimitMiddleware(rateLimiters.general), getCollabInvites);

// Editors
app.get('/api/editors', rateLimitMiddleware(rateLimiters.general), getEditors);
app.post('/api/editors/me/ensure', rateLimitMiddleware(rateLimiters.general), ensureMyEditorProfile);
app.put('/api/editors/me', rateLimitMiddleware(rateLimiters.general), updateEditorProfile);
app.get('/api/editors/:id', rateLimitMiddleware(rateLimiters.general), getEditor);
// Editorial submissions
app.post('/api/editorial/submit', rateLimitMiddleware(rateLimiters.general), submitForEditing);
app.get('/api/editorial/queue', rateLimitMiddleware(rateLimiters.general), getEditorialQueue);
app.get('/api/editorial/mine', rateLimitMiddleware(rateLimiters.general), getMySubmissions);
app.patch('/api/editorial/:id', rateLimitMiddleware(rateLimiters.general), updateSubmission);

// Avatar uploads served from data/avatars/
app.use('/avatars/*', serveStatic({ root: './data' }));

// Static SPA (built frontend)
app.use(serveStatic({ root: './dist' }));
app.get('*', serveStatic({ path: './dist/index.html' }));

app.onError((err, c) => {
  const requestId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.error('[SERVER ERROR]', { requestId, error: err.message, path: c.req.path });
  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR', requestId, timestamp: new Date().toISOString() }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Not found', code: 'NOT_FOUND', path: c.req.path }, 404);
});

// Generate Pollinations portraits for all agents/editors that have no real avatar
async function generateMissingAvatars() {
  try {
    const db = await getDb();

    // Include agents/editors with no avatar OR still using DiceBear placeholders
    const missing = db.query(`
      SELECT wp.user_id, wp.display_name, wp.genre, 1 as is_writer,
             COALESCE(wp.genre, 'literary') as focus
      FROM writer_profiles wp
      WHERE wp.is_agent = 1
        AND (wp.avatar_url IS NULL OR wp.avatar_url LIKE '%dicebear%')
      UNION
      SELECT ep.user_id, ep.display_name, ep.genre_focus, 0 as is_writer,
             COALESCE(ep.genre_focus, 'literary') as focus
      FROM editor_profiles ep
      WHERE ep.is_agent = 1
        AND (ep.avatar_url IS NULL OR ep.avatar_url LIKE '%dicebear%')
    `).all() as any[];

    if (missing.length === 0) {
      console.log('[Avatars] All agent portraits already generated.');
      return;
    }

    console.log(`[Avatars] Generating portraits for ${missing.length} agents/editors…`);

    for (const row of missing) {
      const genre = row.focus ?? 'literary';
      const role = row.is_writer ? 'AI story writer' : 'literary editor';
      const prompt = buildAvatarPrompt(row.display_name, role, genre);

      // Try HuggingFace first (saves locally), then fall back to Pollinations (free, no key)
      let url: string | null = null;
      if (process.env.HUGGINGFACE_ACCESS_TOKEN) {
        url = await generateAndSaveAvatar(prompt, `${row.user_id}.jpg`);
      }
      if (!url) {
        // Pollinations.ai — free, no key, generates real AI portraits via Flux
        const seed = row.user_id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
        url = buildPollinationsUrl(prompt, seed);
        console.log(`[Avatars] Using Pollinations for ${row.display_name}`);
      }

      db.run(`UPDATE writer_profiles SET avatar_url=? WHERE user_id=?`, [url, row.user_id]);
      db.run(`UPDATE editor_profiles SET avatar_url=? WHERE user_id=?`, [url, row.user_id]);
      console.log(`[Avatars] ✓ ${row.display_name} → portrait assigned`);
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('[Avatars] Portrait generation complete.');
  } catch (err) {
    console.error('[Avatars] Error generating avatars:', err);
  }
}

async function startServer() {
  try {
    await initializeDatabase();
    startHeartbeatLoop();
    // Fire avatar generation in background (non-blocking)
    setTimeout(() => generateMissingAvatars(), 5000);
    const port = config.port;
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                   StoryChain v2.0.0                        ║
║          Multi-LLM Collaborative Storytelling              ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(44)} ║
║  Server:      http://localhost:${port}                         ║
║  Health:      http://localhost:${port}/api/health              ║
╚════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  const { closeDatabase } = await import('./database/connection.js');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  const { closeDatabase } = await import('./database/connection.js');
  closeDatabase();
  process.exit(0);
});

startServer();

export default { port: config.port, fetch: app.fetch };
