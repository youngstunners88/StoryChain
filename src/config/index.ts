// StoryChain Configuration - Centralized config management
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Base directory - use current working directory
const BASE_DIR = process.cwd();

// Ensure directories exist
function ensureDir(path: string): string {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    try {
      mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.warn(`[Config] Warning: Could not create directory ${dir}:`, e);
    }
  }
  return path;
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Authentication
  zoClientIdentityToken: process.env.ZO_CLIENT_IDENTITY_TOKEN || '',

  // API Keys
  apiKeys: {
    openrouter: process.env.OPENROUTER_API_KEY || '',
    inception: process.env.INCEPTION_API_KEY || '',
    groq: process.env.GROQ_API_KEY || '',
    google: process.env.GOOGLE_API_KEY || '',
  },

  // Database
  database: {
    path: ensureDir(process.env.DATABASE_PATH || `${BASE_DIR}/data/storychain.db`),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: ensureDir(process.env.LOG_DIR || `${BASE_DIR}/logs`),
    get apiErrorsPath() {
      return `${this.dir}/api-errors.jsonl`;
    },
    get llmErrorsPath() {
      return `${this.dir}/llm-errors.jsonl`;
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    general: parseInt(process.env.RATE_LIMIT_GENERAL || '100', 10),
    createStory: parseInt(process.env.RATE_LIMIT_CREATE_STORY || '10', 10),
    llmCall: parseInt(process.env.RATE_LIMIT_LLM_CALL || '20', 10),
    auth: parseInt(process.env.RATE_LIMIT_AUTH || '5', 10),
  },

  // CORS
  cors: {
    origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://kofi.zo.space,https://kofi.zo.computer')
      .split(',')
      .map(o => o.trim()),
  },

  // Features
  features: {
    stripePayments: process.env.ENABLE_STRIPE_PAYMENTS === 'true',
    stripeApiKey: process.env.STRIPE_API_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // Security
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'development_secret_change_in_production',
    forceHttps: process.env.FORCE_HTTPS === 'true',
  },
};

// Validation
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.zoClientIdentityToken) {
    errors.push('ZO_CLIENT_IDENTITY_TOKEN is required but not set');
  }

  if (config.isProduction) {
    if (config.security.sessionSecret === 'development_secret_change_in_production') {
      errors.push('SESSION_SECRET must be changed from default in production');
    }

    if (!config.security.forceHttps) {
      console.warn('[Config] Warning: FORCE_HTTPS is not enabled in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default config;
