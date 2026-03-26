// StoryChain Types - Complete Type Definitions

export interface User {
  id: string;
  username: string;
  email: string;
  tokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  authorId: string;
  modelUsed: LLMModel;
  characterCount: number;
  tokensSpent: number;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contribution {
  id: string;
  storyId: string;
  authorId: string;
  content: string;
  modelUsed: LLMModel;
  characterCount: number;
  tokensSpent: number;
  createdAt: Date;
}

export type LLMModel =
  | 'nemotron-super'
  | 'nemotron-nano'
  | 'llama-3.3-70b'
  | 'llama-3.1'
  | 'gemma-2'
  | 'mixtral-8x7b'
  | 'gemini-pro'
  | 'gpt-4o-mini'
  | 'claude-haiku';

export interface LLMConfig {
  id: LLMModel;
  name: string;
  provider: 'openrouter' | 'groq' | 'google' | 'openai' | 'anthropic';
  description: string;
  maxTokens: number;
  temperature: number;
  isFree: boolean;
  costPer1KTokens?: number;
  apiKeyEnvVar: string;
  endpoint: string;
  modelId: string;
}

export interface CharacterExtension {
  baseCharacters: number;
  maxExtensions: number;
  extensionSize: number;
  tokensPerExtension: number;
  maxTotalCharacters: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId: string;
}

export interface LLMResponse {
  content: string;
  model: LLMModel;
  tokensUsed: number;
  latency: number;
  error?: ApiError;
}

export interface UserSettings {
  preferredModel: LLMModel;
  autoPurchaseExtensions: boolean;
  notificationEnabled: boolean;
}

export const DEFAULT_CHARACTER_EXTENSION: CharacterExtension = {
  baseCharacters: 300,
  maxExtensions: 5,
  extensionSize: 100,
  tokensPerExtension: 5,
  maxTotalCharacters: 800,
};

export const LLM_MODELS: LLMConfig[] = [
  {
    id: 'nemotron-super',
    name: 'Nemotron Super 120B',
    provider: 'openrouter',
    description: "NVIDIA's flagship reasoning model - FREE via OpenRouter",
    maxTokens: 4096,
    temperature: 0.7,
    isFree: true,
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
  },
  {
    id: 'nemotron-nano',
    name: 'Nemotron Nano 30B',
    provider: 'openrouter',
    description: "NVIDIA's fast lightweight model - FREE via OpenRouter",
    maxTokens: 4096,
    temperature: 0.7,
    isFree: true,
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'nvidia/nemotron-3-nano-30b-a3b:free',
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    description: "Meta's latest open model - FAST & FREE on Groq",
    maxTokens: 4096,
    temperature: 0.7,
    isFree: true,
    apiKeyEnvVar: 'GROQ_API_KEY',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelId: 'llama-3.3-70b-versatile',
  },
  {
    id: 'llama-3.1',
    name: 'Llama 3.1 70B (Groq)',
    provider: 'groq',
    description: "Meta's open-source model - FAST & FREE",
    maxTokens: 4096,
    temperature: 0.7,
    isFree: true,
    apiKeyEnvVar: 'GROQ_API_KEY',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelId: 'llama-3.1-70b-versatile',
  },
  {
    id: 'gemma-2',
    name: 'Gemma 2 (Groq)',
    provider: 'groq',
    description: "Google's lightweight open model - FREE",
    maxTokens: 4096,
    temperature: 0.7,
    isFree: true,
    apiKeyEnvVar: 'GROQ_API_KEY',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelId: 'gemma2-9b-it',
  },
  {
    id: 'mixtral-8x7b',
    name: 'Mixtral 8x7B (Groq)',
    provider: 'groq',
    description: "Mistral's MoE model - FREE tier available",
    maxTokens: 4096,
    temperature: 0.7,
    isFree: true,
    apiKeyEnvVar: 'GROQ_API_KEY',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelId: 'mixtral-8x7b-32768',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro (Google)',
    provider: 'google',
    description: "Google's multimodal model - FREE tier available",
    maxTokens: 4096,
    temperature: 0.7,
    isFree: true,
    apiKeyEnvVar: 'GOOGLE_API_KEY',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    modelId: 'gemini-pro',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: "OpenAI's fast affordable model",
    maxTokens: 4096,
    temperature: 0.7,
    isFree: false,
    costPer1KTokens: 0.00015,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    modelId: 'gpt-4o-mini',
  },
  {
    id: 'claude-haiku',
    name: 'Claude Haiku',
    provider: 'anthropic',
    description: "Anthropic's fast creative model",
    maxTokens: 4096,
    temperature: 0.7,
    isFree: false,
    costPer1KTokens: 0.00025,
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com/v1/messages',
    modelId: 'claude-haiku-4-5-20251001',
  },
];

export const REQUIRED_API_KEYS = [
  { key: 'OPENROUTER_API_KEY', models: ['nemotron-super', 'nemotron-nano'], required: true },
  { key: 'GROQ_API_KEY', models: ['llama-3.3-70b', 'llama-3.1', 'gemma-2', 'mixtral-8x7b'], required: false },
  { key: 'GOOGLE_API_KEY', models: ['gemini-pro'], required: false },
  { key: 'OPENAI_API_KEY', models: ['gpt-4o-mini'], required: false },
  { key: 'ANTHROPIC_API_KEY', models: ['claude-haiku'], required: false },
];
