// LLM Service - Unified interface with autonomous provider cascade
import { LLMModel, LLMConfig, LLMResponse, LLM_MODELS, ApiError } from '../types/index.js';
import { config } from '../config/index.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GenerationResult {
  content: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  tokensUsed: number;
}

interface ProviderDef {
  name: string;
  endpoint: string;
  modelId: string;
  apiKeyEnv: string;
  callType: 'openrouter' | 'openai_compat' | 'anthropic';
  isFree: boolean;
}

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

// ─── Provider chain (priority order) ─────────────────────────────────────────

const PROVIDER_CHAIN: ProviderDef[] = [
  {
    name: 'nemotron-super-free',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    callType: 'openrouter',
    isFree: true,
  },
  {
    name: 'nemotron-nano-free',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'nvidia/nemotron-3-nano-30b-a3b:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    callType: 'openrouter',
    isFree: true,
  },
  {
    name: 'groq-llama-free',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelId: 'llama-3.3-70b-versatile',
    apiKeyEnv: 'GROQ_API_KEY',
    callType: 'openai_compat',
    isFree: true,
  },
  {
    name: 'anthropic-sonnet',
    endpoint: 'https://api.anthropic.com/v1/messages',
    modelId: 'claude-sonnet-4-6',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    callType: 'anthropic',
    isFree: false,
  },
  {
    name: 'openai-gpt4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    modelId: 'gpt-4o-mini',
    apiKeyEnv: 'OPENAI_API_KEY',
    callType: 'openai_compat',
    isFree: false,
  },
];

// ─── Main service class ───────────────────────────────────────────────────────

class LLMService {
  private requestTimeout = 45000;
  private maxRetries = 3;

  // ── Autonomous generation with provider cascade ──────────────────────────

  /**
   * Generate content using the provider cascade.
   * Tries NEMOTRON_FREE first, falls through on rate-limit/error.
   * Returns null only if every configured provider fails.
   */
  async generateContent(prompt: string, systemPrompt?: string, maxTokens = 900): Promise<GenerationResult | null> {
    const temperature = 0.8;

    for (const provider of PROVIDER_CHAIN) {
      const apiKey = process.env[provider.apiKeyEnv];
      if (!apiKey) {
        // Skip unconfigured providers silently
        continue;
      }

      try {
        const result = await this.callWithRetry(
          () => this.callProvider(provider, prompt, systemPrompt, maxTokens, temperature),
          { component: `cascade:${provider.name}` }
        );

        console.log(`[LLM] Generated via ${provider.name} (${result.tokensUsed} tokens)`);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[LLM] Provider ${provider.name} failed: ${msg} — trying next`);
        await this.appendSystemLog(`[LLM] Provider ${provider.name} failed: ${msg}`);
      }
    }

    console.error('[LLM] All providers exhausted — returning null');
    await this.appendSystemLog('[LLM] All providers exhausted for generation request');
    return null;
  }

  // ── Per-provider HTTP call ───────────────────────────────────────────────

  private async callProvider(
    provider: ProviderDef,
    prompt: string,
    systemPrompt: string | undefined,
    maxTokens: number,
    temperature: number
  ): Promise<GenerationResult> {
    switch (provider.callType) {
      case 'openrouter':
        return this.callOpenRouterProvider(provider, prompt, systemPrompt, maxTokens, temperature);
      case 'openai_compat':
        return this.callOpenAICompatProvider(provider, prompt, systemPrompt, maxTokens, temperature);
      case 'anthropic':
        return this.callAnthropicProvider(provider, prompt, systemPrompt, maxTokens, temperature);
    }
  }

  private async callOpenRouterProvider(
    provider: ProviderDef,
    prompt: string,
    systemPrompt: string | undefined,
    maxTokens: number,
    temperature: number
  ): Promise<GenerationResult> {
    const apiKey = process.env[provider.apiKeyEnv]!;
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://storychain.app',
        'X-Title': 'StoryChain',
      },
      body: JSON.stringify({
        model: provider.modelId,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${response.status} ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      provider: provider.name,
      promptTokens,
      completionTokens,
      tokensUsed: (promptTokens + completionTokens) || (data.usage?.total_tokens ?? 0),
    };
  }

  private async callOpenAICompatProvider(
    provider: ProviderDef,
    prompt: string,
    systemPrompt: string | undefined,
    maxTokens: number,
    temperature: number
  ): Promise<GenerationResult> {
    const apiKey = process.env[provider.apiKeyEnv]!;
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.modelId,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${response.status} ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      provider: provider.name,
      promptTokens,
      completionTokens,
      tokensUsed: (promptTokens + completionTokens) || (data.usage?.total_tokens ?? 0),
    };
  }

  private async callAnthropicProvider(
    provider: ProviderDef,
    prompt: string,
    systemPrompt: string | undefined,
    maxTokens: number,
    temperature: number
  ): Promise<GenerationResult> {
    const apiKey = process.env[provider.apiKeyEnv]!;
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.modelId,
        max_tokens: maxTokens,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(this.requestTimeout),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${response.status} ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const promptTokens = data.usage?.input_tokens ?? 0;
    const completionTokens = data.usage?.output_tokens ?? 0;
    return {
      content: data.content?.[0]?.text ?? '',
      provider: provider.name,
      promptTokens,
      completionTokens,
      tokensUsed: promptTokens + completionTokens,
    };
  }

  // ── Provider status ──────────────────────────────────────────────────────

  getProviderStatus(): Array<{ name: string; configured: boolean; isFree: boolean; model: string }> {
    return PROVIDER_CHAIN.map(p => ({
      name: p.name,
      configured: !!process.env[p.apiKeyEnv],
      isFree: p.isFree,
      model: p.modelId,
    }));
  }

  getDefaultProvider(): string {
    return PROVIDER_CHAIN[0].name;
  }

  // ── User-facing model API (used by API routes) ───────────────────────────

  private getApiKey(modelConfig: LLMConfig): string {
    switch (modelConfig.apiKeyEnvVar) {
      case 'OPENROUTER_API_KEY': if (config.apiKeys.openrouter) return config.apiKeys.openrouter; break;
      case 'GROQ_API_KEY':       if (config.apiKeys.groq)       return config.apiKeys.groq; break;
      case 'OPENAI_API_KEY':     if (config.apiKeys.openai)     return config.apiKeys.openai; break;
      case 'ANTHROPIC_API_KEY':  if (config.apiKeys.anthropic)  return config.apiKeys.anthropic; break;
    }
    const key = process.env[modelConfig.apiKeyEnvVar];
    if (!key) throw new Error(`Missing API key: ${modelConfig.apiKeyEnvVar}`);
    return key;
  }

  async generateForUser(request: LLMRequest, context: ErrorContext): Promise<LLMResponse> {
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

    try {
      const result = await this.callWithRetry(async () => {
        switch (modelConfig.provider) {
          case 'openrouter': return this.callOpenRouterAPI(modelConfig, request);
          case 'groq':       return this.callGroqAPI(modelConfig, request);
          case 'openai':     return this.callOpenAIAPI(modelConfig, request);
          case 'anthropic':  return this.callAnthropicAPI(modelConfig, request);
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
    if (!response.ok) { const e = await response.text(); throw new Error(`OpenRouter ${response.status}: ${e}`); }
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
    if (!response.ok) { const e = await response.text(); throw new Error(`Groq ${response.status}: ${e}`); }
    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '', model: request.model, tokensUsed: data.usage?.total_tokens || 0 };
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
    if (!response.ok) { const e = await response.text(); throw new Error(`OpenAI ${response.status}: ${e}`); }
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
    if (!response.ok) { const e = await response.text(); throw new Error(`Anthropic ${response.status}: ${e}`); }
    const data = await response.json();
    return { content: data.content?.[0]?.text || '', model: request.model, tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) };
  }

  // ── Retry / backoff ──────────────────────────────────────────────────────

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
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return (
      msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('econnreset') ||
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('503') ||
      msg.includes('502')
    );
  }

  private classifyError(error: unknown): string {
    if (!(error instanceof Error)) return 'UNKNOWN_ERROR';
    const msg = error.message.toLowerCase();
    if (msg.includes('api key') || msg.includes('authentication')) return 'AUTH_FAILURE';
    if (msg.includes('rate limit') || msg.includes('too many requests')) return 'RATE_LIMIT_EXCEEDED';
    if (msg.includes('timeout')) return 'REQUEST_TIMEOUT';
    if (msg.includes('network') || msg.includes('fetch')) return 'NETWORK_ERROR';
    if (msg.includes('quota') || msg.includes('billing')) return 'QUOTA_EXCEEDED';
    return 'GENERATION_FAILED';
  }

  private createApiError(code: string, message: string, context: ErrorContext, originalError?: Error): ApiError {
    const error: ApiError = {
      code,
      message,
      details: { ...context, originalError: originalError?.message },
      timestamp: new Date(),
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    this.logError(error, context);
    return error;
  }

  private async logError(error: ApiError, context: ErrorContext): Promise<void> {
    console.error('[LLM ERROR]', { code: error.code, message: error.message, context });
    try {
      const fs = await import('fs/promises');
      const entry = JSON.stringify({
        id: error.requestId,
        error_code: error.code,
        error_message: error.message,
        context: JSON.stringify(context),
        severity: this.getSeverity(error.code),
        created_at: new Date().toISOString(),
      }) + '\n';
      await fs.appendFile(config.logging.llmErrorsPath, entry);
    } catch (_) {}
  }

  private getSeverity(errorCode: string): 'info' | 'warning' | 'error' | 'critical' {
    if (errorCode.includes('RATE_LIMIT')) return 'warning';
    if (errorCode.includes('AUTH')) return 'critical';
    if (errorCode.includes('TIMEOUT')) return 'warning';
    if (errorCode.includes('NETWORK')) return 'warning';
    return 'error';
  }

  private async appendSystemLog(msg: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const line = `${new Date().toISOString()} ${msg}\n`;
      await fs.appendFile(`${process.cwd()}/logs/system.log`, line);
    } catch (_) {}
  }

  // ── Public helpers (used by routes) ─────────────────────────────────────

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
      { key: 'OPENAI_API_KEY',     valid: !!config.apiKeys.openai,     models: ['gpt-4o-mini'] },
      { key: 'ANTHROPIC_API_KEY',  valid: !!config.apiKeys.anthropic,  models: ['claude-sonnet'] },
    ];
  }
}

export const llmService = new LLMService();
export default llmService;
