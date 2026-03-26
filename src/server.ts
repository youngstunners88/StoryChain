// StoryChain Server - Main entry point
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';

import { config, validateConfig } from './config/index.js';
import { getDb, initializeDatabase, checkDatabaseHealth } from './database/connection.js';

import {
  getUserSettings,
  updateUserSettings,
  getUserProfile,
  validateApiKeys,
  getModels,
  saveApiKey,
  createStory,
  healthCheck,
} from './api/routes.js';

import {
  getStories,
  getStory,
  likeStory,
  addContribution,
  getUser,
  getUserStories,
  getUserContributions,
  getUserLikedStories,
  followUser,
  getTrending,
} from './api/socialRoutes.js';

import { rateLimitMiddleware, rateLimiters } from './middleware/rateLimiter.js';

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

app.get('/api/health', async (c) => {
  const dbHealth = await checkDatabaseHealth();
  if (!dbHealth.healthy) {
    return c.json({ status: 'unhealthy', timestamp: new Date().toISOString(), database: 'disconnected', error: dbHealth.error }, 503);
  }
  return c.json({ status: 'healthy', timestamp: new Date().toISOString(), database: 'connected', version: '2.0.0', environment: config.nodeEnv });
});

// User settings
app.get('/api/user/settings', rateLimitMiddleware(rateLimiters.general), getUserSettings);
app.post('/api/user/settings', rateLimitMiddleware(rateLimiters.general), updateUserSettings);
app.get('/api/user/profile', rateLimitMiddleware(rateLimiters.general), getUserProfile);

// LLM
app.get('/api/llm/validate-keys', rateLimitMiddleware(rateLimiters.general), validateApiKeys);
app.get('/api/llm/models', rateLimitMiddleware(rateLimiters.general), getModels);

// Settings
app.post('/api/settings/api-keys', rateLimitMiddleware(rateLimiters.auth), saveApiKey);

// Stories
app.get('/api/stories', rateLimitMiddleware(rateLimiters.general), getStories);
app.get('/api/stories/:id', rateLimitMiddleware(rateLimiters.general), getStory);
app.post('/api/stories', rateLimitMiddleware(rateLimiters.createStory), createStory);
app.post('/api/stories/:id/like', rateLimitMiddleware(rateLimiters.general), likeStory);
app.post('/api/stories/:id/contributions', rateLimitMiddleware(rateLimiters.createStory), addContribution);

// Users
app.get('/api/users/:id', rateLimitMiddleware(rateLimiters.general), getUser);
app.get('/api/users/:id/stories', rateLimitMiddleware(rateLimiters.general), getUserStories);
app.get('/api/users/:id/contributions', rateLimitMiddleware(rateLimiters.general), getUserContributions);
app.get('/api/users/:id/liked', rateLimitMiddleware(rateLimiters.general), getUserLikedStories);
app.post('/api/users/:id/follow', rateLimitMiddleware(rateLimiters.general), followUser);

// Trending
app.get('/api/trending', rateLimitMiddleware(rateLimiters.general), getTrending);

// Static SPA
app.get('/', serveStatic({ path: './index.html' }));
app.get('*', serveStatic({ path: './index.html' }));

app.onError((err, c) => {
  const requestId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.error('[SERVER ERROR]', { requestId, error: err.message, path: c.req.path });
  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR', requestId, timestamp: new Date().toISOString() }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Not found', code: 'NOT_FOUND', path: c.req.path }, 404);
});

async function startServer() {
  try {
    await initializeDatabase();
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
