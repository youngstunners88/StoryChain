// LLM Service - Unified interface for multiple LLM providers
// With comprehensive error handling and logging

import { LLMModel, LLMConfig, LLMResponse, LLM_MODELS, ApiError } from '../types/index.js';
import { config } from '../config/index.js';

interface LLMRequest {
  model: LLMModel;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ErrorContext {
  userId?: string;
  storyId?: string;
  model?: LLMModel;
  requestData?: Record<string, unknown>;
  component: string;
}

class LLMService {
  private requestTimeout = 30000; // 30 seconds
  private maxRetries = 3;

  private getApiKey(modelConfig: LLMConfig): string {
    // First check config object for known keys
    switch (modelConfig.apiKeyEnvVar) {
      case 'OPENROUTER_API_KEY':
        if (config.apiKeys.openrouter) return config.apiKeys.openrouter;
        break;
      case 'INCEPTION_API_KEY':
        if (config.apiKeys.inception) return config.apiKeys.inception;
        break;
      case 'GROQ_API_KEY':
        if (config.apiKeys.groq) return config.apiKeys.groq;
        break;
      case 'GOOGLE_API_KEY':
        if (config.apiKeys.google) return config.apiKeys.google;
        break;
      case 'ZO_CLIENT_IDENTITY_TOKEN':
        if (config.zoClientIdentityToken) return config.zoClientIdentityToken;
        break;
    }
    
    // Fallback to environment variable
    const key = process.env[modelConfig.apiKeyEnvVar];
    if (!key) {
      throw new Error(`Missing API key: ${modelConfig.apiKeyEnvVar}. Please add it to Settings > Advanced.`);
    }
    return key;
  }

  private createApiError(
    code: string,
    message: string,
    context: ErrorContext,
    originalError?: Error
  ): ApiError {
    const error: ApiError = {
      code,
      message,
      details: {
        ...context,
        originalError: originalError?.message,
      },
      timestamp: new Date(),
      requestId: this.generateRequestId(),
    };

    // Log the error
    this.logError(error, context, originalError);

    return error;
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logError(error: ApiError, context: ErrorContext, originalError?: Error): Promise<void> {
    const logEntry = {
      id: error.requestId,
      error_code: error.code,
      error_message: error.message,
      user_id: context.userId,
      story_id: context.storyId,
      request_data: JSON.stringify(context.requestData),
      stack_trace: originalError?.stack?.substring(0, 500),
      context: JSON.stringify(context),
      severity: this.getSeverity(error.code),
      created_at: new Date().toISOString(),
    };

    // Log to console with rich context
    console.error('[LLM ERROR]', {
      ...logEntry,
      timestamp: new Date().toISOString(),
      component: context.component,
      model: context.model,
    });

    // Write to file-based log for persistence
    try {
      const fs = await import('fs/promises');
      await fs.appendFile(
        config.logging.llmErrorsPath,
        JSON.stringify(logEntry) + '\n'
      );
    } catch (e) {
      // Silently fail - we've already logged to console
    }
  }

  private getSeverity(errorCode: string): 'info' | 'warning' | 'error' | 'critical' {
    if (errorCode.includes('RATE_LIMIT')) return 'warning';
    if (errorCode.includes('AUTH')) return 'critical';
    if (errorCode.includes('TIMEOUT')) return 'warning';
    if (errorCode.includes('NETWORK')) return 'warning';
    return 'error';
  }

  private async callWithRetry<T>(
    fn: () => Promise<T>,
    context: ErrorContext,
    attempt = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = this.isRetryableError(error);
      
      if (isRetryable && attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`[LLM] Retrying after ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(fn, context, attempt + 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('503') ||
        message.includes('502')
      );
    }
    return false;
  }

  async generateContent(request: LLMRequest, context: ErrorContext): Promise<LLMResponse> {
    const startTime = Date.now();
    const config = LLM_MODELS.find(m => m.id === request.model);
    
    if (!config) {
      return {
        content: '',
        model: request.model,
        tokensUsed: 0,
        latency: 0,
        error: this.createApiError(
          'INVALID_MODEL',
          `Unknown model: ${request.model}`,
          context
        ),
      };
    }

    context.model = request.model;
    context.component = 'LLMService.generateContent';

    try {
      const result = await this.callWithRetry(async () => {
        switch (config.provider) {
          case 'zo':
            return await this.callZoAPI(config, request);
          case 'openrouter':
            return await this.callOpenRouterAPI(config, request);
          case 'inception':
            return await this.callInceptionAPI(config, request);
          case 'groq':
            return await this.callGroqAPI(config, request);
          case 'google':
            return await this.callGoogleAPI(config, request);
          default:
            throw new Error(`Unsupported provider: ${config.provider}`);
        }
      }, context);

      return {
        content: result.content || '',
        model: result.model || request.model,
        tokensUsed: result.tokensUsed || 0,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      const errorCode = this.classifyError(error);
      const apiError = this.createApiError(
        errorCode,
        error instanceof Error ? error.message : 'Unknown error',
        context,
        error instanceof Error ? error : undefined
      );

      return {
        content: '',
        model: request.model,
        tokensUsed: 0,
        latency: Date.now() - startTime,
        error: apiError,
      };
    }
  }

  private classifyError(error: unknown): string {
    if (!(error instanceof Error)) return 'UNKNOWN_ERROR';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('api key') || message.includes('authentication') || message.includes('auth')) {
      return 'AUTH_FAILURE';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'RATE_LIMIT_EXCEEDED';
    }
    if (message.includes('timeout')) {
      return 'REQUEST_TIMEOUT';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('quota') || message.includes('billing')) {
      return 'QUOTA_EXCEEDED';
    }
    
    return 'GENERATION_FAILED';
  }

  private async callZoAPI(config: LLMConfig, request: LLMRequest): Promise<Partial<LLMResponse>> {
    const apiKey = this.getApiKey(config);
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: request.prompt,
        model_name: config.modelId,
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Zo API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.output || data.content || '',
      model: request.model,
      tokensUsed: data.tokens_used || 0,
    };
  }

  private async callOpenRouterAPI(config: LLMConfig, request: LLMRequest): Promise<Partial<LLMResponse>> {
    const apiKey = this.getApiKey(config);
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://storychain.zo.space',
        'X-Title': 'StoryChain',
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        temperature: request.temperature ?? config.temperature,
        max_tokens: request.maxTokens ?? config.maxTokens,
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: request.model,
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  private async callInceptionAPI(config: LLMConfig, request: LLMRequest): Promise<Partial<LLMResponse>> {
    const apiKey = this.getApiKey(config);
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        temperature: request.temperature ?? config.temperature,
        max_tokens: request.maxTokens ?? config.maxTokens,
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Inception error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: request.model,
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  private async callGroqAPI(config: LLMConfig, request: LLMRequest): Promise<Partial<LLMResponse>> {
    const apiKey = this.getApiKey(config);
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        temperature: request.temperature ?? config.temperature,
        max_tokens: request.maxTokens ?? config.maxTokens,
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: request.model,
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  private async callGoogleAPI(config: LLMConfig, request: LLMRequest): Promise<Partial<LLMResponse>> {
    const apiKey = this.getApiKey(config);
    
    const url = new URL(config.endpoint);
    url.searchParams.append('key', apiKey);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          ...(request.systemPrompt ? [{ role: 'user', parts: [{ text: request.systemPrompt }] }] : []),
          { role: 'user', parts: [{ text: request.prompt }] },
        ],
        generationConfig: {
          temperature: request.temperature ?? config.temperature,
          maxOutputTokens: request.maxTokens ?? config.maxTokens,
        },
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model: request.model,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
    };
  }

  getAvailableModels(): LLMConfig[] {
    return LLM_MODELS.filter(model => {
      // Check if API key is available
      const apiKey = process.env[model.apiKeyEnvVar];
      return !!apiKey || model.apiKeyEnvVar === 'ZO_CLIENT_IDENTITY_TOKEN';
    });
  }

  getAllModels(): LLMConfig[] {
    return LLM_MODELS;
  }

  validateApiKeys(): { key: string; valid: boolean; models: string[] }[] {
    return [
      { key: 'ZO_CLIENT_IDENTITY_TOKEN', valid: !!config.zoClientIdentityToken, models: ['kimi-k2.5'] },
      { key: 'OPENROUTER_API_KEY', valid: !!config.apiKeys.openrouter, models: ['reka-edge', 'qwen-2.5'] },
      { key: 'INCEPTION_API_KEY', valid: !!config.apiKeys.inception, models: ['mercury-2'] },
      { key: 'GROQ_API_KEY', valid: !!config.apiKeys.groq, models: ['llama-3.1', 'gemma-2', 'mixtral-8x7b'] },
      { key: 'GOOGLE_API_KEY', valid: !!config.apiKeys.google, models: ['gemini-pro'] },
    ];
  }
}

export const llmService = new LLMService();
export default llmService;
