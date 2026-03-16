// Input Validation Middleware for StoryChain
import type { Context, Next } from 'hono';

// Validation error response
interface ValidationError {
  field: string;
  message: string;
}

// Validation result
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitized: Record<string, unknown>;
}

// Validation rules
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  sanitize?: (value: string) => string;
  validate?: (value: unknown) => boolean | string;
}

// Schema definition
type ValidationSchema = Record<string, ValidationRule>;

// Sanitize string input
function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '') // Basic XSS protection
    .slice(0, 10000); // Max length limit
}

// Validate a single field
function validateField(
  key: string,
  value: unknown,
  rule: ValidationRule
): { valid: boolean; error?: string; sanitized?: unknown } {
  // Required check
  if (rule.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${key} is required` };
  }

  // Skip further validation if value is optional and not provided
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { valid: true, sanitized: value };
  }

  let sanitized = value;

  // String validation
  if (typeof value === 'string') {
    // Sanitize
    sanitized = rule.sanitize ? rule.sanitize(value) : sanitizeString(value);

    // Min length
    if (rule.minLength && (sanitized as string).length < rule.minLength) {
      return { valid: false, error: `${key} must be at least ${rule.minLength} characters` };
    }

    // Max length
    if (rule.maxLength && (sanitized as string).length > rule.maxLength) {
      return { valid: false, error: `${key} must be at most ${rule.maxLength} characters` };
    }

    // Pattern
    if (rule.pattern && !rule.pattern.test(sanitized as string)) {
      return { valid: false, error: `${key} format is invalid` };
    }
  }

  // Number validation
  if (typeof value === 'number') {
    sanitized = value;

    if (rule.min !== undefined && value < rule.min) {
      return { valid: false, error: `${key} must be at least ${rule.min}` };
    }

    if (rule.max !== undefined && value > rule.max) {
      return { valid: false, error: `${key} must be at most ${rule.max}` };
    }
  }

  // Custom validation
  if (rule.validate) {
    const result = rule.validate(sanitized);
    if (result !== true) {
      return { valid: false, error: typeof result === 'string' ? result : `${key} is invalid` };
    }
  }

  return { valid: true, sanitized };
}

// Validate entire object against schema
export function validateObject(
  data: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const errors: ValidationError[] = [];
  const sanitized: Record<string, unknown> = {};

  for (const [key, rule] of Object.entries(schema)) {
    const value = data[key];
    const result = validateField(key, value, rule);

    if (!result.valid) {
      errors.push({ field: key, message: result.error! });
    } else {
      sanitized[key] = result.sanitized;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

// Hono middleware factory
export function validateRequest(schema: ValidationSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const result = validateObject(body, schema);

      if (!result.valid) {
        return c.json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: result.errors,
        }, 400);
      }

      // Attach sanitized data to context
      c.set('validatedBody', result.sanitized);

      await next();
    } catch (error) {
      return c.json({
        error: 'Invalid request body',
        code: 'INVALID_BODY',
      }, 400);
    }
  };
}

// Common validation schemas
export const schemas = {
  // Story creation
  createStory: {
    title: { required: true, minLength: 1, maxLength: 200 },
    content: { required: true, minLength: 1, maxLength: 10000 },
    modelUsed: { required: true, maxLength: 50 },
    characterCount: { required: true, min: 0, max: 100000 },
    tokensSpent: { required: true, min: 0, max: 10000 },
    maxCharacters: { required: true, min: 1, max: 100000 },
  } as ValidationSchema,

  // Contribution
  addContribution: {
    content: { required: true, minLength: 1, maxLength: 10000 },
    modelUsed: { required: true, maxLength: 50 },
    characterCount: { required: true, min: 0, max: 100000 },
    tokensSpent: { required: true, min: 0, max: 10000 },
    maxCharacters: { required: true, min: 1, max: 100000 },
  } as ValidationSchema,

  // User settings
  updateSettings: {
    preferredModel: { maxLength: 50 },
    autoPurchaseExtensions: {},
  } as ValidationSchema,

  // API key save
  saveApiKey: {
    key: { required: true, maxLength: 100, pattern: /^[A-Z_]+$/ },
    value: { required: true, minLength: 10, maxLength: 500 },
  } as ValidationSchema,

  // Token purchase
  purchaseTokens: {
    packageId: { required: true, maxLength: 50 },
    tokens: { required: true, min: 1, max: 100000 },
  } as ValidationSchema,

  // Pagination
  pagination: {
    page: { min: 1, max: 10000 },
    limit: { min: 1, max: 100 },
  } as ValidationSchema,

  // Search query
  search: {
    q: { maxLength: 200, sanitize: (v) => v.trim().replace(/[<>%]/g, '') },
    sort: { maxLength: 50, pattern: /^[a-z0-9_-]+$/ },
    filter: { maxLength: 50, pattern: /^[a-z0-9_-]+$/ },
    model: { maxLength: 50, pattern: /^[a-z0-9._-]+$/ },
  } as ValidationSchema,
};

export default { validateRequest, validateObject, schemas };
