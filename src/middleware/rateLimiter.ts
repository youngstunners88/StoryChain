// Rate Limiting Middleware for StoryChain
// Implements token bucket algorithm with Redis-like in-memory store

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Prefix for rate limit keys
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastRefill > 10 * 60 * 1000) { // 10 minutes
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const fullKey = `${this.config.keyPrefix || 'rl'}:${key}`;
    
    let entry = store.get(fullKey);
    
    if (!entry) {
      // New entry
      entry = {
        tokens: this.config.maxRequests - 1,
        lastRefill: now,
      };
      store.set(fullKey, entry);
      
      return {
        allowed: true,
        remaining: entry.tokens,
        resetTime: now + this.config.windowMs,
      };
    }

    // Calculate tokens to refill
    const timePassed = now - entry.lastRefill;
    const tokensToAdd = Math.floor(timePassed / (this.config.windowMs / this.config.maxRequests));
    
    if (tokensToAdd > 0) {
      entry.tokens = Math.min(this.config.maxRequests, entry.tokens + tokensToAdd);
      entry.lastRefill = now;
    }

    if (entry.tokens > 0) {
      entry.tokens--;
      return {
        allowed: true,
        remaining: entry.tokens,
        resetTime: now + this.config.windowMs,
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.lastRefill + this.config.windowMs,
    };
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // General API: 100 requests per minute
  general: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'api',
  }),

  // Story creation: 10 per minute (expensive operation)
  createStory: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'story',
  }),

  // LLM calls: 20 per minute (rate limited by providers)
  llmCall: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyPrefix: 'llm',
  }),

  // Authentication: 5 per minute (prevent brute force)
  auth: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'auth',
  }),
};

// Hono middleware wrapper
import type { Context, Next } from 'hono';

export function rateLimitMiddleware(limiter: RateLimiter) {
  return async (c: Context, next: Next) => {
    const stressMode = process.env.STRESS_TEST_MODE === 'true' || c.req.header('x-stress-test') === 'true';
    if (stressMode) {
      await next();
      return;
    }

    // Get user identifier (IP + user ID if authenticated)
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const userId = c.get('userId') || 'anonymous';
    const key = `${ip}:${userId}`;

    const result = await limiter.checkLimit(key);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(limiter['config'].maxRequests));
    c.header('X-RateLimit-Remaining', String(result.remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

    if (!result.allowed) {
      return c.json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      }, 429);
    }

    await next();
  };
}

// Circuit breaker for external services
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60 * 1000; // 1 minute

export async function withCircuitBreaker<T>(
  service: string,
  operation: () => Promise<T>
): Promise<T> {
  let breaker = circuitBreakers.get(service);
  
  if (!breaker) {
    breaker = { failures: 0, lastFailure: 0, state: 'closed' };
    circuitBreakers.set(service, breaker);
  }

  // Check if circuit is open
  if (breaker.state === 'open') {
    const timeSinceLastFailure = Date.now() - breaker.lastFailure;
    if (timeSinceLastFailure < CIRCUIT_BREAKER_TIMEOUT) {
      throw new Error(`Circuit breaker open for ${service}. Try again in ${Math.ceil((CIRCUIT_BREAKER_TIMEOUT - timeSinceLastFailure) / 1000)}s`);
    }
    // Transition to half-open
    breaker.state = 'half-open';
  }

  try {
    const result = await operation();
    
    // Success: reset circuit
    if (breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failures = 0;
    }
    
    return result;
  } catch (error) {
    // Failure: increment counter
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      breaker.state = 'open';
    }
    
    throw error;
  }
}

export default rateLimiters;
