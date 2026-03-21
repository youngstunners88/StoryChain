// StoryChain Server - Main entry point
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';

// Import config
import { config, validateConfig } from './config/index.js';
import { getDb, initializeDatabase, checkDatabaseHealth } from './database/connection.js';

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
  getTokenInfo,
  getTokenCosts,
} from './api/tokenRoutes.js';

// Import OpenClaw routes
import {
  registerOpenClawAgent,
  listOpenClawAgents,
  getOpenClawAgent,
  agentCreateStory,
  getFileStories,
  openclawHealth,
} from './api/openclawRoutes.js';

// Import v3 routes
import { createV3Routes } from './api/v3/index.js';

import { rateLimitMiddleware, rateLimiters } from './middleware/rateLimiter.js';

// Validate configuration before starting
const configValidation = validateConfig();
if (!configValidation.valid) {
  console.warn('[Server] Configuration warnings:');
  configValidation.errors.forEach(err => console.warn(`  - ${err}`));
  // Don't exit — allow partial functionality
}

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

// CORS - wildcard or specific origins
const corsOrigins = config.cors.origins;
app.use(cors({
  origin: corsOrigins.includes('*') ? '*' : corsOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: !corsOrigins.includes('*'),
}));

// Request logging
app.use(logger());

// Health check (no rate limit)
app.get('/api/health', async (c) => {
  const dbHealth = await checkDatabaseHealth();
  
  if (!dbHealth.healthy) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: dbHealth.error,
    }, 503);
  }
  
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    version: '2.0.0',
    environment: config.nodeEnv,
  });
});

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
app.get('/api/tokens', rateLimitMiddleware(rateLimiters.general), getTokenInfo);
app.get('/api/tokens/costs', rateLimitMiddleware(rateLimiters.general), getTokenCosts);
app.get('/api/tokens/packages', rateLimitMiddleware(rateLimiters.general), getTokenPackages);
app.post('/api/tokens/purchase', rateLimitMiddleware(rateLimiters.createStory), purchaseTokens);
app.post('/api/tokens/free', rateLimitMiddleware(rateLimiters.general), claimFreeTokens);

// OpenClaw integration routes
app.get('/api/openclaw/health', openclawHealth);
app.get('/api/openclaw/agents', listOpenClawAgents);
app.post('/api/openclaw/agents', rateLimitMiddleware(rateLimiters.general), registerOpenClawAgent);
app.get('/api/openclaw/agents/:id', getOpenClawAgent);
app.post('/api/openclaw/agents/:id/stories', rateLimitMiddleware(rateLimiters.createStory), agentCreateStory);
app.get('/api/openclaw/file-stories', getFileStories);

// === v3 API Routes (IP Registry, Multi-Wallet, Freemium, Categories) ===
const v3Routes = createV3Routes(getDb());
app.route('/api/v3', v3Routes);

// Static file serving - serve index.html for SPA routes
app.get('/', serveStatic({ path: './index.html' }));
app.get('*', serveStatic({ path: './index.html' }));

// Error handler
app.onError((err, c) => {
  const timestamp = new Date().toISOString();
  const requestId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create rich error context
  const errorContext = {
    timestamp,
    requestId,
    error: err.message,
    stackTrace: err.stack?.substring(0, 500),
    path: c.req.path,
    method: c.req.method,
  };

  // Log to console with rich context
  console.error('[SERVER ERROR]', errorContext);

  // Return safe error to client
  return c.json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId,
    timestamp,
  }, 500);
});

// Not found handler
app.notFound((c) => {
  return c.json({
    error: 'Not found',
    code: 'NOT_FOUND',
    path: c.req.path,
  }, 404);
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    const port = config.port;
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                   StoryChain v2.0.0                        ║
║          Multi-LLM Collaborative Storytelling              ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(44)} ║
║  Server: http://localhost:${port}${port.toString().length === 4 ? '' : ' '}${''.padEnd(25)} ║
║  API: http://localhost:${port}/api${''.padEnd(22)} ║
║  Health: http://localhost:${port}/api/health${''.padEnd(16)} ║
╚════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  const { closeDatabase } = await import('./database/connection.js');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  const { closeDatabase } = await import('./database/connection.js');
  closeDatabase();
  process.exit(0);
});

// Start the server
startServer();

export default { port: config.port, fetch: app.fetch };
