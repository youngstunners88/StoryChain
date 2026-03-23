// Error Types - OpenClaw-inspired structured error handling
// Provides consistent error responses across StoryChain API

/**
 * Error payload structure matching OpenClaw's GatewayErrorPayload
 */
export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
  retryAfterMs?: number;
}

/**
 * API Error Response structure
 */
export interface ApiErrorResponse {
  error: ErrorPayload;
  requestId: string;
  timestamp: string;
}

/**
 * HTTP Status codes mapped to error codes
 */
export const HTTP_STATUS_CODES = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  UNPROCESSABLE_ENTITY: 422,

  // 5xx Server Errors
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Error codes with their default HTTP status codes and retryability
 */
type ErrorDefinition = {
  status: number;
  retryable: boolean;
  retryAfterMs?: number;
};

export const ERROR_DEFINITIONS: Record<string, ErrorDefinition> = {
  // Authentication errors
  AUTH_FAILURE: { status: 401, retryable: false },
  UNAUTHORIZED: { status: 401, retryable: false },
  FORBIDDEN: { status: 403, retryable: false },
  TOKEN_EXPIRED: { status: 401, retryable: false },
  INVALID_TOKEN_FORMAT: { status: 401, retryable: false },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: { status: 429, retryable: true, retryAfterMs: 60000 },
  TOO_MANY_REQUESTS: { status: 429, retryable: true, retryAfterMs: 60000 },

  // Validation errors
  BAD_REQUEST: { status: 400, retryable: false },
  VALIDATION_ERROR: { status: 400, retryable: false },
  INVALID_MODEL: { status: 400, retryable: false },
  INVALID_API_KEY: { status: 400, retryable: false },
  CHARACTER_LIMIT_EXCEEDED: { status: 400, retryable: false },
  INSUFFICIENT_TOKENS: { status: 402, retryable: false },

  // Not found
  NOT_FOUND: { status: 404, retryable: false },
  STORY_NOT_FOUND: { status: 404, retryable: false },
  AGENT_NOT_FOUND: { status: 404, retryable: false },

  // Business logic errors
  CONFLICT: { status: 409, retryable: false },
  DUPLICATE_STORY: { status: 409, retryable: false },
  AGENT_NOT_ACTIVE: { status: 403, retryable: false },

  // Server errors
  INTERNAL_ERROR: { status: 500, retryable: false },
  GENERATION_FAILED: { status: 500, retryable: true },
  SERVICE_UNAVAILABLE: { status: 503, retryable: true, retryAfterMs: 5000 },
  DATABASE_ERROR: { status: 500, retryable: true, retryAfterMs: 3000 },
  QUOTA_EXCEEDED: { status: 503, retryable: true, retryAfterMs: 3600000 },

  // Network/timeout errors
  REQUEST_TIMEOUT: { status: 504, retryable: true, retryAfterMs: 3000 },
  NETWORK_ERROR: { status: 502, retryable: true, retryAfterMs: 5000 },
  GATEWAY_ERROR: { status: 502, retryable: true, retryAfterMs: 5000 },
};

export type ErrorCode = keyof typeof ERROR_DEFINITIONS;

/**
 * StoryChain API Error class
 * Inspired by OpenClaw's GatewayResponseError
 */
export class StoryChainError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, unknown>;
  retryable: boolean;
  retryAfterMs?: number;
  requestId: string;

  constructor(params: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    retryable?: boolean;
    retryAfterMs?: number;
  }) {
    super(params.message);
    this.name = 'StoryChainError';
    this.code = params.code;

    const definition = ERROR_DEFINITIONS[params.code] || { status: 500, retryable: false };
    this.statusCode = definition.status;
    this.retryable = params.retryable ?? definition.retryable ?? false;
    this.retryAfterMs = params.retryAfterMs ?? definition.retryAfterMs;
    this.requestId = params.requestId || `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.details = params.details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StoryChainError);
    }
  }

  toJSON(): ErrorPayload & { requestId: string } {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      retryable: this.retryable,
      retryAfterMs: this.retryAfterMs,
      requestId: this.requestId,
    };
  }
}

/**
 * Error severity levels for logging
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Error context for logging
 */
export interface ErrorLogContext {
  requestId: string;
  userId?: string;
  agentId?: string;
  storyId?: string;
  component: string;
  endpoint?: string;
  severity: ErrorSeverity;
  timestamp: string;
  errorCode: string;
  errorMessage: string;
  stackTrace?: string;
  retryable?: boolean;
  additionalContext?: Record<string, unknown>;
}
