// StoryChain Configuration - Centralized config management
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const BASE_DIR = process.cwd();

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
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appName: process.env.APP_NAME || 'StoryChain',

  defaultModel: process.env.DEFAULT_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free',
  fallbackModel1: process.env.FALLBACK_MODEL_1 || 'nvidia/nemotron-3-nano-30b-a3b:free',
  fallbackModel2: process.env.FALLBACK_MODEL_2 || 'groq/llama-3.3-70b-versatile',

  apiKeys: {
    openrouter: process.env.OPENROUTER_API_KEY || '',
    groq: process.env.GROQ_API_KEY || '',
    google: process.env.GOOGLE_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
  },

  database: {
    path: ensureDir(process.env.DATABASE_URL || `${BASE_DIR}/data/storychain.db`),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: ensureDir(process.env.LOG_DIR || `${BASE_DIR}/logs`),
    get apiErrorsPath() { return `${this.dir}/api-errors.jsonl`; },
    get llmErrorsPath() { return `${this.dir}/llm-errors.jsonl`; },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    general: parseInt(process.env.RATE_LIMIT_GENERAL || '100', 10),
    createStory: parseInt(process.env.RATE_LIMIT_CREATE_STORY || '10', 10),
    llmCall: parseInt(process.env.RATE_LIMIT_LLM_CALL || '20', 10),
    auth: parseInt(process.env.RATE_LIMIT_AUTH || '5', 10),
  },

  cors: {
    origins: (process.env.ALLOWED_ORIGINS || '*').split(',').map(o => o.trim()),
  },

  features: {
    stripePayments: process.env.ENABLE_STRIPE_PAYMENTS === 'true',
    stripeApiKey: process.env.STRIPE_API_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  security: {
    sessionSecret: process.env.SESSION_SECRET || 'development_secret_change_in_production',
    forceHttps: process.env.FORCE_HTTPS === 'true',
  },
};

export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiKeys.openrouter) {
    console.warn('[Config] Warning: OPENROUTER_API_KEY not set. Free models (Nemotron) will be unavailable.');
  }

  if (config.isProduction) {
    if (config.security.sessionSecret === 'development_secret_change_in_production') {
      errors.push('SESSION_SECRET must be changed from default in production');
    }
    if (!config.security.forceHttps) {
      console.warn('[Config] Warning: FORCE_HTTPS is not enabled in production');
    }
  }

  return { valid: errors.length === 0, errors };
}

export default config;
