// LLM Service - Unified interface for multiple LLM providers
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
  private requestTimeout = 30000;
  private maxRetries = 3;

  private getApiKey(modelConfig: LLMConfig): string {
    switch (modelConfig.apiKeyEnvVar) {
      case 'OPENROUTER_API_KEY':
        if (config.apiKeys.openrouter) return config.apiKeys.openrouter;
        break;
      case 'GROQ_API_KEY':
        if (config.apiKeys.groq) return config.apiKeys.groq;
        break;
      case 'GOOGLE_API_KEY':
        if (config.apiKeys.google) return config.apiKeys.google;
        break;
      case 'OPENAI_API_KEY':
        if (config.apiKeys.openai) return config.apiKeys.openai;
        break;
      case 'ANTHROPIC_API_KEY':
        if (config.apiKeys.anthropic) return config.apiKeys.anthropic;
        break;
    }
    const key = process.env[modelConfig.apiKeyEnvVar];
    if (!key) {
      throw new Error(`Missing API key: ${modelConfig.apiKeyEnvVar}. Please add it to your .env file.`);
    }
    return key;
  }

  private createApiError(code: string, message: string, context: ErrorContext, originalError?: Error): ApiError {
    const error: ApiError = {
      code,
      message,
      details: { ...context, originalError: originalError?.message },
      timestamp: new Date(),
      requestId: this.generateRequestId(),
    };
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
      context: JSON.stringify(context),
      severity: this.getSeverity(error.code),
      created_at: new Date().toISOString(),
    };
    console.error('[LLM ERROR]', { ...logEntry, model: context.model });
    try {
      const fs = await import('fs/promises');
      await fs.appendFile(config.logging.llmErrorsPath, JSON.stringify(logEntry) + '\n');
    } catch (_) {}
  }

  private getSeverity(errorCode: string): 'info' | 'warning' | 'error' | 'critical' {
    if (errorCode.includes('RATE_LIMIT')) return 'warning';
    if (errorCode.includes('AUTH')) return 'critical';
    if (errorCode.includes('TIMEOUT')) return 'warning';
    if (errorCode.includes('NETWORK')) return 'warning';
    return 'error';
  }

  private async callWithRetry<T>(fn: () => Promise<T>, context: ErrorContext, attempt = 1): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (this.isRetryableError(error) && attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
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
    const modelConfig = LLM_MODELS.find(m => m.id === request.model);

    if (!modelConfig) {
      return {
        content: '',
        model: request.model,
        tokensUsed: 0,
        latency: 0,
        error: this.createApiError('INVALID_MODEL', `Unknown model: ${request.model}`, context),
      };
    }

    context.model = request.model;
    context.component = 'LLMService.generateContent';

    try {
      const result = await this.callWithRetry(async () => {
        switch (modelConfig.provider) {
          case 'openrouter': return await this.callOpenRouterAPI(modelConfig, request);
          case 'groq':       return await this.callGroqAPI(modelConfig, request);
          case 'google':     return await this.callGoogleAPI(modelConfig, request);
          case 'openai':     return await this.callOpenAIAPI(modelConfig, request);
          case 'anthropic':  return await this.callAnthropicAPI(modelConfig, request);
          default: throw new Error(`Unsupported provider: ${modelConfig.provider}`);
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
      return { content: '', model: request.model, tokensUsed: 0, latency: Date.now() - startTime, error: apiError };
    }
  }

  private classifyError(error: unknown): string {
    if (!(error instanceof Error)) return 'UNKNOWN_ERROR';
    const message = error.message.toLowerCase();
    if (message.includes('api key') || message.includes('authentication')) return 'AUTH_FAILURE';
    if (message.includes('rate limit') || message.includes('too many requests')) return 'RATE_LIMIT_EXCEEDED';
    if (message.includes('timeout')) return 'REQUEST_TIMEOUT';
    if (message.includes('network') || message.includes('fetch')) return 'NETWORK_ERROR';
    if (message.includes('quota') || message.includes('billing')) return 'QUOTA_EXCEEDED';
    return 'GENERATION_FAILED';
  }

  private async callOpenRouterAPI(modelConfig: LLMConfig, request: LLMRequest): Promise<Partial<LLMResponse>> {
    const apiKey = this.getApiKey(modelConfig);
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://storychain.app',
        'X-Title': 'StoryChain',
      },
      body: JSON.stringify({
        model: modelConfig.modelId,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        temperature: request.temperature ?? modelConfig.temperature,
        max_tokens: request.maxTokens ?? modelConfig.maxTokens,
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '', model: request.model, tokensUsed: data.usage?.total_tokens || 0 };
  }

  private async callGroqAPI(modelConfig: LLMConfig, request: LLMRequest): Promise<Partial<LLMResponse>> {
    const apiKey = this.getApiKey(modelConfig);
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelConfig.modelId,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        temperature: request.temperature ?? modelConfig.temperature,
        max_tokens: request.maxTokens ?? modelConfig.maxTokens,
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '', model: request.model, tokensUsed: data.usage?.total_tokens || 0 };
  }

  private async callGoogleAPI(modelConfig: LLMConfig, request: LLMRequest): Promise<Partial<LLMResponse>> {
    const apiKey = this.getApiKey(modelConfig);
    const url = new URL(modelConfig.endpoint);
    url.searchParams.append('key', apiKey);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          ...(request.systemPrompt ? [{ role: 'user', parts: [{ text: request.systemPrompt }] }] : []),
          { role: 'user', parts: [{ text: request.prompt }] },
        ],
        generationConfig: {
          temperature: request.temperature ?? modelConfig.temperature,
          maxOutputTokens: request.maxTokens ?? modelConfig.maxTokens,
        },
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return { content: data.candidates?.[0]?.content?.parts?.[0]?.text || '', model: request.model, tokensUsed: data.usageMetadata?.totalTokenCount || 0 };
  }

  private async callOpenAIAPI(modelConfig: LLMConfig, request: LLMRequest): Promise<Partial<LLMResponse>> {
    const apiKey = this.getApiKey(modelConfig);
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelConfig.modelId,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        temperature: request.temperature ?? modelConfig.temperature,
        max_tokens: request.maxTokens ?? modelConfig.maxTokens,
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '', model: request.model, tokensUsed: data.usage?.total_tokens || 0 };
  }

  private async callAnthropicAPI(modelConfig: LLMConfig, request: LLMRequest): Promise<Partial<LLMResponse>> {
    const apiKey = this.getApiKey(modelConfig);
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelConfig.modelId,
        max_tokens: request.maxTokens ?? modelConfig.maxTokens,
        ...(request.systemPrompt ? { system: request.systemPrompt } : {}),
        messages: [{ role: 'user', content: request.prompt }],
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return { content: data.content?.[0]?.text || '', model: request.model, tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) };
  }

  getAvailableModels(): LLMConfig[] {
    return LLM_MODELS.filter(model => !!process.env[model.apiKeyEnvVar]);
  }

  getAllModels(): LLMConfig[] {
    return LLM_MODELS;
  }

  validateApiKeys(): { key: string; valid: boolean; models: string[] }[] {
    return [
      { key: 'OPENROUTER_API_KEY', valid: !!config.apiKeys.openrouter, models: ['nemotron-super', 'nemotron-nano'] },
      { key: 'GROQ_API_KEY',       valid: !!config.apiKeys.groq,       models: ['llama-3.3-70b', 'llama-3.1', 'gemma-2', 'mixtral-8x7b'] },
      { key: 'GOOGLE_API_KEY',     valid: !!config.apiKeys.google,     models: ['gemini-pro'] },
      { key: 'OPENAI_API_KEY',     valid: !!config.apiKeys.openai,     models: ['gpt-4o-mini'] },
      { key: 'ANTHROPIC_API_KEY',  valid: !!config.apiKeys.anthropic,  models: ['claude-haiku'] },
    ];
  }
}

export const llmService = new LLMService();
export default llmService;
