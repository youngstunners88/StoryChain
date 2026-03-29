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
// Free tier daily limits (approx):
//   Groq:        14,400 req/day  (Llama 3.3 70B — fast, high quality)
//   Cerebras:    ~1,000 req/day  (Llama 3.1 70B — ultra fast)
//   OpenRouter:   2,000 req/day  (various free models)
//   HuggingFace:  ~500 req/day   (small models)
//   Together AI:  paid, but cheap ($0.0002/1k tokens)

// ─── Groq entries — 12 keys × 2 models = 24 entries, ~1.2M tokens/day total ──
// Round-robin index rotates across keys so no single key gets hammered
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_KEYS = [
  'GROQ_API_KEY', 'GROQ_API_KEY_2', 'GROQ_API_KEY_3', 'GROQ_API_KEY_4',
  'GROQ_API_KEY_5', 'GROQ_API_KEY_6', 'GROQ_API_KEY_7', 'GROQ_API_KEY_8',
  'GROQ_API_KEY_9', 'GROQ_API_KEY_10', 'GROQ_API_KEY_11', 'GROQ_API_KEY_12',
];
const GROQ_ENTRIES: ProviderDef[] = GROQ_KEYS.flatMap((envKey, i) => [
  { name: `groq-${i+1}-llama`,   endpoint: GROQ_ENDPOINT, modelId: 'llama-3.3-70b-versatile', apiKeyEnv: envKey, callType: 'openai_compat' as const, isFree: true },
  { name: `groq-${i+1}-llama8b`, endpoint: GROQ_ENDPOINT, modelId: 'llama-3.1-8b-instant',    apiKeyEnv: envKey, callType: 'openai_compat' as const, isFree: true },
]);

// ─── Gemini entries — 5 keys × 2 models = 10 entries, ~7,500 req/day total ──
// Google AI Studio free tier: 1,500 req/day per key — OpenAI-compatible endpoint
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_KEYS = [
  'GOOGLE_API_KEY', 'GOOGLE_API_KEY_2', 'GOOGLE_API_KEY_3',
  'GOOGLE_API_KEY_4', 'GOOGLE_API_KEY_5',
];
const GEMINI_ENTRIES: ProviderDef[] = GEMINI_KEYS.flatMap((envKey, i) => [
  { name: `gemini-${i+1}-flash`,     endpoint: GEMINI_ENDPOINT, modelId: 'gemini-2.5-flash',    apiKeyEnv: envKey, callType: 'openai_compat' as const, isFree: true },
  { name: `gemini-${i+1}-flash-lite`, endpoint: GEMINI_ENDPOINT, modelId: 'gemini-2.0-flash-lite-001', apiKeyEnv: envKey, callType: 'openai_compat' as const, isFree: true },
]);

const PROVIDER_CHAIN: ProviderDef[] = [
  // ── Tier 1: Groq — 12 keys, round-robin injected at call time ──
  ...GROQ_ENTRIES,
  // ── Tier 2: Gemini — 5 keys × 1,500 req/day = 7,500 free req/day ──
  ...GEMINI_ENTRIES,
  // ── Tier 3: Cerebras — ultra-fast free inference ──
  {
    name: 'cerebras-llama',
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    modelId: 'llama-3.3-70b',
    apiKeyEnv: 'CEREBRAS_API_KEY',
    callType: 'openai_compat',
    isFree: true,
  },
  // ── Tier 4: OpenRouter free models (key A — fresh 2000 req/day) ──
  // Model IDs verified against live /api/v1/models endpoint March 2026
  {
    name: 'openrouter-a-llama70b',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    callType: 'openrouter',
    isFree: true,
  },
  {
    name: 'openrouter-a-gemma12b',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'google/gemma-3-12b-it:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    callType: 'openrouter',
    isFree: true,
  },
  // mistral-small-3.1-24b-instruct:free removed — 404 on OpenRouter as of March 2026
  {
    name: 'openrouter-a-gemma4b',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'google/gemma-3-4b-it:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    callType: 'openrouter',
    isFree: true,
  },
  {
    name: 'openrouter-a-nemotron',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    callType: 'openrouter',
    isFree: true,
  },
  // ── Tier 4: OpenRouter key B (backup / resets daily) ──
  {
    name: 'openrouter-b-llama70b',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKeyEnv: 'OPENROUTER_API_KEY_2',
    callType: 'openrouter',
    isFree: true,
  },
  {
    name: 'openrouter-b-gemma12b',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'google/gemma-3-12b-it:free',
    apiKeyEnv: 'OPENROUTER_API_KEY_2',
    callType: 'openrouter',
    isFree: true,
  },
  // ── Tier 5: HuggingFace (small but free) ──
  {
    name: 'hf-llama-free',
    endpoint: 'https://router.huggingface.co/hf-inference/v1/chat/completions',
    modelId: 'meta-llama/Llama-3.2-3B-Instruct',
    apiKeyEnv: 'HUGGINGFACE_ACCESS_TOKEN',
    callType: 'openai_compat',
    isFree: true,
  },
  // ── Tier 6: Deepseek — very cheap paid ($0.0001/1k tokens), great writer ──
  {
    name: 'deepseek-chat',
    endpoint: 'https://api.deepseek.com/chat/completions',
    modelId: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    callType: 'openai_compat',
    isFree: false,
  },
  // ── Tier 7: Together AI ──
  {
    name: 'together-1-llama',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    apiKeyEnv: 'TOGETHER_API_KEY',
    callType: 'openai_compat',
    isFree: false,
  },
  {
    name: 'together-2-llama',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    apiKeyEnv: 'TOGETHER_API_KEY_2',
    callType: 'openai_compat',
    isFree: false,
  },
  // ── Tier 7: Paid providers ──
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

// ─── Round-robin rotation trackers ───────────────────────────────────────────
// Each pool rotates independently so no single key gets hammered first every call
let groqRROffset  = 0;
let geminiRROffset = 0;

function buildRotatedChain(preferProvider?: string): ProviderDef[] {
  // ── Rotate Groq pool (12 keys × 2 models = 24 entries, 2 per key) ──
  const groq = GROQ_ENTRIES.filter(p => !!process.env[p.apiKeyEnv]);
  const groqKeyCount = Math.ceil(groq.length / 2);
  const groqStart = groqRROffset % Math.max(groqKeyCount, 1);
  groqRROffset = (groqRROffset + 1) % Math.max(groqKeyCount, 1);
  const rotatedGroq: ProviderDef[] = [];
  for (let i = 0; i < groqKeyCount; i++) {
    const ki = (groqStart + i) % groqKeyCount;
    rotatedGroq.push(...groq.slice(ki * 2, ki * 2 + 2));
  }

  // ── Rotate Gemini pool (5 keys × 2 models = 10 entries, 2 per key) ──
  const gemini = GEMINI_ENTRIES.filter(p => !!process.env[p.apiKeyEnv]);
  const geminiKeyCount = Math.ceil(gemini.length / 2);
  const geminiStart = geminiRROffset % Math.max(geminiKeyCount, 1);
  geminiRROffset = (geminiRROffset + 1) % Math.max(geminiKeyCount, 1);
  const rotatedGemini: ProviderDef[] = [];
  for (let i = 0; i < geminiKeyCount; i++) {
    const ki = (geminiStart + i) % geminiKeyCount;
    rotatedGemini.push(...gemini.slice(ki * 2, ki * 2 + 2));
  }

  // ── Everything else (Cerebras, OpenRouter, HF, Together, paid) ──
  const rest = PROVIDER_CHAIN.filter(p => !p.name.startsWith('groq-') && !p.name.startsWith('gemini-'));

  let chain = [...rotatedGroq, ...rotatedGemini, ...rest];

  if (preferProvider) {
    const preferred = chain.filter(p => p.name.toLowerCase().includes(preferProvider.toLowerCase()));
    const others    = chain.filter(p => !p.name.toLowerCase().includes(preferProvider.toLowerCase()));
    chain = [...preferred, ...others];
  }

  return chain;
}

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
  async generateContent(
    prompt: string,
    options?: { systemPrompt?: string; maxTokens?: number; preferProvider?: string } | string,
    maxTokensLegacy = 900
  ): Promise<GenerationResult | null> {
    const temperature = 0.8;

    // Support both old signature (prompt, systemPrompt, maxTokens) and new options object
    let systemPrompt: string | undefined;
    let maxTokens = maxTokensLegacy;
    let preferProvider: string | undefined;
    if (typeof options === 'string') {
      systemPrompt = options;
    } else if (options && typeof options === 'object') {
      systemPrompt = options.systemPrompt;
      maxTokens = options.maxTokens ?? maxTokensLegacy;
      preferProvider = options.preferProvider;
    }

    // Build rotated provider chain — Groq keys cycle round-robin, preferProvider bubbles up
    const chain = buildRotatedChain(preferProvider);

    for (const provider of chain) {
      const apiKey = this.resolveEnvKey(provider.apiKeyEnv);
      if (!apiKey) continue;

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
    const apiKey = this.resolveEnvKey(provider.apiKeyEnv)!;
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
    const apiKey = this.resolveEnvKey(provider.apiKeyEnv)!;
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
    const apiKey = this.resolveEnvKey(provider.apiKeyEnv)!;
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

  // Resolve key for PROVIDER_CHAIN entries (uses apiKeyEnv, not apiKeyEnvVar)
  private resolveEnvKey(envVar: string): string | null {
    switch (envVar) {
      case 'OPENROUTER_API_KEY': return config.apiKeys.openrouter || process.env.OPENROUTER_API_KEY || null;
      case 'GROQ_API_KEY':       return config.apiKeys.groq       || process.env.GROQ_API_KEY       || null;
      case 'OPENAI_API_KEY':     return config.apiKeys.openai     || process.env.OPENAI_API_KEY     || null;
      case 'ANTHROPIC_API_KEY':  return config.apiKeys.anthropic  || process.env.ANTHROPIC_API_KEY  || null;
      default:                   return process.env[envVar]       || null;
    }
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
    // NOTE: 429 / rate-limit are NOT retried here — the cascade already moves to
    // the next provider on any thrown error, so retrying the same provider on a
    // rate-limit just wastes 3 × backoff time before falling through.
    return (
      msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('econnreset') ||
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
    const env = process.env;
    return [
      { key: 'GROQ_API_KEY',            valid: !!(config.apiKeys.groq || env.GROQ_API_KEY),            models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] },
      { key: 'GROQ_API_KEY_2',          valid: !!(env.GROQ_API_KEY_2),                                  models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant (key 2)'] },
      { key: 'GROQ_API_KEY_3',          valid: !!(env.GROQ_API_KEY_3),                                  models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant (key 3)'] },
      { key: 'GROQ_API_KEY_4',          valid: !!(env.GROQ_API_KEY_4),                                  models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant (key 4)'] },
      { key: 'GROQ_API_KEY_5',          valid: !!(env.GROQ_API_KEY_5),                                  models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant (key 5)'] },
      { key: 'CEREBRAS_API_KEY',         valid: !!(env.CEREBRAS_API_KEY),                                models: ['llama-3.3-70b (ultra fast)'] },
      { key: 'OPENROUTER_API_KEY',       valid: !!(config.apiKeys.openrouter || env.OPENROUTER_API_KEY), models: ['llama-3.1-8b-instruct:free', 'gemma-3-12b-it:free', 'deepseek-r1:free'] },
      { key: 'OPENROUTER_API_KEY_2',     valid: !!(env.OPENROUTER_API_KEY_2),                            models: ['llama-3.1-8b-instruct:free', 'gemma-3-12b-it:free (backup key)'] },
      { key: 'TOGETHER_API_KEY',         valid: !!(env.TOGETHER_API_KEY),                                models: ['llama-3.3-70b (cheap paid)'] },
      { key: 'OPENAI_API_KEY',           valid: !!(config.apiKeys.openai || env.OPENAI_API_KEY),         models: ['gpt-4o-mini'] },
      { key: 'ANTHROPIC_API_KEY',        valid: !!(config.apiKeys.anthropic || env.ANTHROPIC_API_KEY),   models: ['claude-sonnet'] },
      { key: 'HUGGINGFACE_ACCESS_TOKEN', valid: !!(env.HUGGINGFACE_ACCESS_TOKEN),                        models: ['llama-3.2-3b (small, free)'] },
    ];
  }
}

export const llmService = new LLMService();
export default llmService;
