// Error Handler - OpenClaw-inspired error handling utilities
// Provides consistent error responses and logging across StoryChain API

import type { Context } from 'hono';
import { join } from 'node:path';
import {
  StoryChainError,
  ERROR_DEFINITIONS,
  HTTP_STATUS_CODES,
  type ErrorCode,
  type ErrorLogContext,
  type ErrorSeverity,
} from '../types/errors';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get severity level based on error code
 */
export function getErrorSeverity(errorCode: string): ErrorSeverity {
  if (errorCode.includes('RATE_LIMIT')) return 'warning';
  if (errorCode.includes('TIMEOUT')) return 'warning';
  if (errorCode.includes('NETWORK')) return 'warning';
  if (errorCode.includes('GATEWAY')) return 'warning';
  if (errorCode.includes('AUTH') || errorCode.includes('UNAUTHORIZED') || errorCode.includes('FORBIDDEN')) {
    return 'critical';
  }
  if (errorCode.includes('INTERNAL') || errorCode.includes('DATABASE_ERROR')) return 'error';
  return 'error';
}

/**
 * Check if an error is retryable based on its code
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof StoryChainError) {
    return error.retryable;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('504')
    );
  }
  return false;
}

/**
 * Get retry delay in milliseconds with exponential backoff
 */
export function getRetryDelay(attempt: number, baseDelay = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}

/**
 * Classify a raw error into an error code
 */
export function classifyError(error: unknown): ErrorCode {
  if (error instanceof StoryChainError) {
    return error.code;
  }

  if (!(error instanceof Error)) return 'INTERNAL_ERROR';

  const message = error.message.toLowerCase();

  // Authentication errors
  if (message.includes('api key') || message.includes('authentication') || message.includes('auth')) {
    return 'AUTH_FAILURE';
  }
  if (message.includes('unauthorized')) return 'UNAUTHORIZED';
  if (message.includes('forbidden')) return 'FORBIDDEN';
  if (message.includes('token expired') || message.includes('expired')) return 'TOKEN_EXPIRED';

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
    return 'RATE_LIMIT_EXCEEDED';
  }

  // Timeout and network
  if (message.includes('timeout') || message.includes('timed out')) return 'REQUEST_TIMEOUT';
  if (message.includes('network') || message.includes('fetch') || message.includes('econnreset')) {
    return 'NETWORK_ERROR';
  }

  // Quota and billing
  if (message.includes('quota') || message.includes('billing')) return 'QUOTA_EXCEEDED';

  // Gateway errors
  if (message.includes('gateway') || message.includes('502')) return 'GATEWAY_ERROR';

  // Database errors
  if (message.includes('database') || message.includes('sqlite') || message.includes('sql')) {
    return 'DATABASE_ERROR';
  }

  // Not found
  if (message.includes('not found') || message.includes('404')) return 'NOT_FOUND';

  return 'INTERNAL_ERROR';
}

/**
 * Create a StoryChainError from any error
 */
export function createStoryChainError(
  error: unknown,
  code?: ErrorCode,
  details?: Record<string, unknown>
): StoryChainError {
  if (error instanceof StoryChainError) {
    return error;
  }

  const errorCode = code || classifyError(error);
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  const requestId = generateRequestId();

  return new StoryChainError({
    code: errorCode,
    message,
    details: {
      ...details,
      originalError: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    },
    requestId,
  });
}

/**
 * Log error to file with rich context
 */
export async function logError(context: ErrorLogContext): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const logPath = join(process.cwd(), 'logs', 'api-errors.jsonl');

    const logEntry = {
      ...context,
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
    };

    await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
  } catch {
    // Silently fail - error logging should never break the application
  }
}

/**
 * Log error to console with rich context
 */
export function logErrorToConsole(context: ErrorLogContext): void {
  const { severity, errorCode, errorMessage, requestId, component, userId } = context;

  const logMethod = severity === 'critical' || severity === 'error' ? console.error : console.warn;

  logMethod(`[${severity.toUpperCase()}] [${errorCode}] ${errorMessage}`, {
    requestId,
    component,
    userId,
    timestamp: context.timestamp,
    details: context.additionalContext,
  });
}

/**
 * Main error handler - returns proper HTTP response with OpenClaw-style error format
 */
export function handleApiError(
  c: Context,
  error: unknown,
  component: string,
  context?: {
    userId?: string;
    agentId?: string;
    storyId?: string;
    endpoint?: string;
  }
): Response {
  const timestamp = new Date().toISOString();
  const storyChainError = createStoryChainError(error);

  const errorContext: ErrorLogContext = {
    requestId: storyChainError.requestId,
    userId: context?.userId,
    agentId: context?.agentId,
    storyId: context?.storyId,
    component,
    endpoint: context?.endpoint || c.req.path,
    severity: getErrorSeverity(storyChainError.code),
    timestamp,
    errorCode: storyChainError.code,
    errorMessage: storyChainError.message,
    stackTrace: storyChainError.details?.stackTrace as string | undefined,
    retryable: storyChainError.retryable,
    additionalContext: storyChainError.details,
  };

  // Log the error
  logErrorToConsole(errorContext);
  void logError(errorContext); // Fire and forget

  // Build response with proper headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': storyChainError.requestId,
  };

  // Add retry-after header for retryable errors
  if (storyChainError.retryable && storyChainError.retryAfterMs) {
    headers['Retry-After'] = Math.ceil(storyChainError.retryAfterMs / 1000).toString();
  }

  // Return structured error response
  return c.json(
    {
      error: {
        code: storyChainError.code,
        message: storyChainError.message,
        details: storyChainError.details,
        retryable: storyChainError.retryable,
        retryAfterMs: storyChainError.retryAfterMs,
      },
      requestId: storyChainError.requestId,
      timestamp,
    },
    storyChainError.statusCode as any,
    headers
  );
}

/**
 * Wrapper for async route handlers with automatic error handling
 */
export function withErrorHandling(
  handler: (c: Context) => Promise<Response>,
  component: string
) {
  return async (c: Context): Promise<Response> => {
    try {
      return await handler(c);
    } catch (error) {
      return handleApiError(c, error, component);
    }
  };
}

/**
 * Create a successful response with request ID
 */
export function createSuccessResponse<T>(c: Context, data: T, status = HTTP_STATUS_CODES.OK): Response {
  const requestId = generateRequestId();

  return c.json(
    {
      data,
      requestId,
      timestamp: new Date().toISOString(),
    },
    status,
    {
      'X-Request-Id': requestId,
    }
  );
}

/**
 * Validation error helper
 */
export function createValidationError(
  message: string,
  field?: string,
  details?: Record<string, unknown>
): StoryChainError {
  return new StoryChainError({
    code: 'VALIDATION_ERROR',
    message,
    details: {
      ...details,
      field,
    },
  });
}

/**
 * Not found error helper
 */
export function createNotFoundError(resource: string, id: string): StoryChainError {
  return new StoryChainError({
    code: 'NOT_FOUND',
    message: `${resource} not found: ${id}`,
    details: { resource, id },
  });
}

/**
 * Authentication error helper
 */
export function createAuthError(message = 'Authentication required'): StoryChainError {
  return new StoryChainError({
    code: 'UNAUTHORIZED',
    message,
  });
}

/**
 * Rate limit error helper
 */
export function createRateLimitError(retryAfterMs = 60000): StoryChainError {
  return new StoryChainError({
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded. Please try again later.',
    retryable: true,
    retryAfterMs,
  });
}
