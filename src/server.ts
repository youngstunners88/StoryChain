// StoryChain Server - Main entry point
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';

// Import existing routes
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

// Import new social routes
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

// Import token routes
import {
  purchaseTokens,
  claimFreeTokens,
  getTransactions,
  getTokenPackages,
} from './api/tokenRoutes.js';

import { rateLimitMiddleware, rateLimiters } from './middleware/rateLimiter.js';

const app = new Hono();

// Security middleware
app.use(secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://openrouter.ai"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  xXssProtection: '1; mode=block',
}));

// CORS
app.use(cors({
  origin: ['https://kofi.zo.space', 'https://kofi.zo.computer', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Request logging
app.use(logger());

// Health check (no rate limit)
app.get('/api/health', healthCheck);

// === API Routes with rate limiting ===

// User settings - general rate limit
app.get('/api/user/settings', rateLimitMiddleware(rateLimiters.general), getUserSettings);
app.post('/api/user/settings', rateLimitMiddleware(rateLimiters.general), updateUserSettings);
app.get('/api/user/profile', rateLimitMiddleware(rateLimiters.general), getUserProfile);
app.get('/api/user/transactions', rateLimitMiddleware(rateLimiters.general), getTransactions);

// LLM configuration - general rate limit
app.get('/api/llm/validate-keys', rateLimitMiddleware(rateLimiters.general), validateApiKeys);
app.get('/api/llm/models', rateLimitMiddleware(rateLimiters.general), getModels);

// Settings - strict rate limit for API key operations
app.post('/api/settings/api-keys', rateLimitMiddleware(rateLimiters.auth), saveApiKey);

// Stories - general rate limit for reading, strict for creating
app.get('/api/stories', rateLimitMiddleware(rateLimiters.general), getStories);
app.get('/api/stories/:id', rateLimitMiddleware(rateLimiters.general), getStory);
app.post('/api/stories', rateLimitMiddleware(rateLimiters.createStory), createStory);
app.post('/api/stories/:id/like', rateLimitMiddleware(rateLimiters.general), likeStory);
app.post('/api/stories/:id/contributions', rateLimitMiddleware(rateLimiters.createStory), addContribution);

// Users - general rate limit
app.get('/api/users/:id', rateLimitMiddleware(rateLimiters.general), getUser);
app.get('/api/users/:id/stories', rateLimitMiddleware(rateLimiters.general), getUserStories);
app.get('/api/users/:id/contributions', rateLimitMiddleware(rateLimiters.general), getUserContributions);
app.get('/api/users/:id/liked', rateLimitMiddleware(rateLimiters.general), getUserLikedStories);
app.post('/api/users/:id/follow', rateLimitMiddleware(rateLimiters.general), followUser);

// Trending
app.get('/api/trending', rateLimitMiddleware(rateLimiters.general), getTrending);

// Tokens - strict rate limit
app.get('/api/tokens/packages', rateLimitMiddleware(rateLimiters.general), getTokenPackages);
app.post('/api/tokens/purchase', rateLimitMiddleware(rateLimiters.createStory), purchaseTokens);
app.post('/api/tokens/free', rateLimitMiddleware(rateLimiters.general), claimFreeTokens);

// Static file serving - serve index.html for SPA routes
app.get('/', serveStatic({ path: './index.html' }));
app.get('*', serveStatic({ path: './index.html' }));

// Error handler
app.onError((err, c) => {
  console.error('[SERVER ERROR]', {
    error: err.message,
    stack: err.stack?.substring(0, 500),
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  });

  return c.json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: `err_${Date.now()}`,
  }, 500);
});

// Start server
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`
╔════════════════════════════════════════════════════════════╗
║                   StoryChain v2.0.0                        ║
║          Multi-LLM Collaborative Storytelling              ║
╠════════════════════════════════════════════════════════════╣
║  Server: http://localhost:${port}                            ║
║  API: http://localhost:${port}/api                         ║
║  Health: http://localhost:${port}/api/health               ║
╚════════════════════════════════════════════════════════════╝
`);

export default {
  port,
  fetch: app.fetch,
};