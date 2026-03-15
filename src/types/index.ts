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
  | 'kimi-k2.5'
  | 'reka-edge'
  | 'qwen-2.5'
  | 'mercury-2'
  | 'llama-3.1'
  | 'gemma-2'
  | 'mixtral-8x7b'
  | 'gemini-pro';

export interface LLMConfig {
  id: LLMModel;
  name: string;
  provider: 'openrouter' | 'inception' | 'groq' | 'google' | 'zo';
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
    id: 'kimi-k2.5',
    name: 'Kimi K2.5',
    provider: 'zo',
    description: 'Advanced reasoning model with strong creative capabilities',
    maxTokens: 4096,
    temperature: 0.7,
    isFree: true,
    apiKeyEnvVar: 'ZO_CLIENT_IDENTITY_TOKEN',
    endpoint: 'https://api.zo.computer/zo/ask',
    modelId: 'vercel:moonshotai/kimi-k2.5',
  },
  {
    id: 'reka-edge',
    name: 'Reka Edge',
    provider: 'openrouter',
    description: 'Fast and efficient for creative writing tasks',
    maxTokens: 4096,
    temperature: 0.8,
    isFree: false,
    costPer1KTokens: 0.0005,
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'rekaai/reka-edge',
  },
  {
    id: 'qwen-2.5',
    name: 'Qwen 2.5',
    provider: 'openrouter',
    description: 'Alibaba\'s latest model with strong multilingual support',
    maxTokens: 4096,
    temperature: 0.7,
    isFree: false,
    costPer1KTokens: 0.0003,
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelId: 'qwen/qwen-2.5-72b-instruct',
  },
  {
    id: 'mercury-2',
    name: 'Mercury 2',
    provider: 'inception',
    description: 'Specialized for narrative and storytelling',
    maxTokens: 4096,
    temperature: 0.75,
    isFree: false,
    costPer1KTokens: 0.001,
    apiKeyEnvVar: 'INCEPTION_API_KEY',
    endpoint: 'https://api.inceptionlabs.ai/v1/chat/completions',
    modelId: 'mercury-2',
  },
  // FREE MODELS
  {
    id: 'llama-3.1',
    name: 'Llama 3.1 (Groq)',
    provider: 'groq',
    description: 'Meta\'s open-source model - FAST & FREE',
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
    description: 'Google\'s lightweight open model - FREE',
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
    description: 'Mistral\'s MoE model - FREE tier available',
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
    description: 'Google\'s multimodal model - FREE tier available',
    maxTokens: 4096,
    temperature: 0.7,
    isFree: true,
    apiKeyEnvVar: 'GOOGLE_API_KEY',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    modelId: 'gemini-pro',
  },
];

export const REQUIRED_API_KEYS = [
  { key: 'OPENROUTER_API_KEY', models: ['reka-edge', 'qwen-2.5'], required: false },
  { key: 'INCEPTION_API_KEY', models: ['mercury-2'], required: false },
  { key: 'ZO_CLIENT_IDENTITY_TOKEN', models: ['kimi-k2.5'], required: true },
  { key: 'GROQ_API_KEY', models: ['llama-3.1', 'gemma-2', 'mixtral-8x7b'], required: false },
  { key: 'GOOGLE_API_KEY', models: ['gemini-pro'], required: false },
];
