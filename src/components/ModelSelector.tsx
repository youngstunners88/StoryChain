import React, { useState, useEffect } from 'react';
import { LLMConfig, LLMModel, LLM_MODELS } from '../types';
import { Zap, Info, Check, AlertCircle, Sparkles } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: LLMModel;
  onModelChange: (model: LLMModel) => void;
  disabled?: boolean;
}

interface ApiKeyStatus {
  key: string;
  valid: boolean;
  models: LLMModel[];
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false,
}) => {
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus[]>([]);
  const [showInfo, setShowInfo] = useState<LLMModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const fetchApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/llm/validate-keys');
      
      // Handle unauthorized gracefully - treat as guest mode
      if (response.status === 401 || response.status === 403) {
        setApiKeyStatus([]);
        return;
      }
      
      if (!response.ok) {
        // Other errors - still don't show to user, just log
        console.warn('API key status fetch failed:', response.status);
        setApiKeyStatus([]);
        return;
      }
      
      const data = await response.json();
      setApiKeyStatus(data.keys || []);
    } catch (error) {
      // Silently fail for guests - don't show errors
      console.log('API key check skipped (guest mode or error):', error);
      setApiKeyStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const isModelAvailable = (model: LLMConfig): boolean => {
    // ZO_CLIENT_IDENTITY_TOKEN models (kimi-k2.5) are always available
    if (model.apiKeyEnvVar === 'ZO_CLIENT_IDENTITY_TOKEN') {
      return true;
    }
    // Find which API key this model needs
    const keyStatus = apiKeyStatus.find(k => k.models.includes(model.id));
    return keyStatus?.valid ?? false;
  };

  const getModelStatus = (model: LLMConfig): 'available' | 'unavailable' | 'selected' => {
    if (model.id === selectedModel) return 'selected';
    if (isModelAvailable(model)) return 'available';
    return 'unavailable';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-10 bg-zinc-800 rounded-lg"></div>
        <div className="h-10 bg-zinc-800 rounded-lg"></div>
        <div className="h-10 bg-zinc-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          AI Model
        </label>
        <span className="text-xs text-zinc-500">
          {LLM_MODELS.find(m => m.id === selectedModel)?.name}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {LLM_MODELS.map((model) => {
          const status = getModelStatus(model);
          const isFree = model.isFree;

          return (
            <button
              key={model.id}
              onClick={() => status !== 'unavailable' && onModelChange(model.id)}
              disabled={disabled || status === 'unavailable'}
              className={`
                relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left
                ${status === 'selected'
                  ? 'border-amber-500 bg-amber-500/10'
                  : status === 'available'
                    ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 hover:bg-zinc-800'
                    : 'border-zinc-800 bg-zinc-900/50 cursor-not-allowed opacity-60'
                }
              `}
            >
              {/* Selection indicator */}
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${status === 'selected'
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-zinc-600'
                  }
                `}
              >
                {status === 'selected' && <Check className="w-3 h-3 text-black" />}
              </div>

              {/* Model info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-zinc-200">
                    {model.name}
                  </span>
                  {isFree && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded">
                      FREE
                    </span>
                  )}
                  {!isFree && model.costPer1KTokens && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded">
                      {model.costPer1KTokens.toFixed(4)}/1k
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate">
                  {model.description}
                </p>
              </div>

              {/* Info button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfo(showInfo === model.id ? null : model.id);
                }}
                className="p-1 hover:bg-zinc-700 rounded transition-colors"
              >
                <Info className="w-4 h-4 text-zinc-500" />
              </button>

              {/* Unavailable badge */}
              {status === 'unavailable' && (
                <div className="absolute top-2 right-2">
                  <span className="flex items-center gap-1 text-[10px] text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    No API Key
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
          {(() => {
            const model = LLM_MODELS.find(m => m.id === showInfo);
            if (!model) return null;

            const keyStatus = apiKeyStatus.find(k => k.key === model.apiKeyEnvVar);

            return (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-zinc-300">
                    Provider: <span className="text-zinc-400 capitalize">{model.provider}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300">Max Tokens: </span>
                  <span className="text-zinc-400">{model.maxTokens.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300">Temperature: </span>
                  <span className="text-zinc-400">{model.temperature}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300">API Key: </span>
                  <span className={`${keyStatus?.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {keyStatus?.valid ? 'Configured' : 'Missing'}
                  </span>
                </div>
                {!keyStatus?.valid && (
                  <p className="text-xs text-zinc-500">
                    Add {model.apiKeyEnvVar} to Settings {'>'} Advanced to use this model.
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
