import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, AlertCircle, Check, Save, RefreshCw, ExternalLink } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { LLMModel } from '../types';

interface ApiKeyConfig {
  key: string;
  label: string;
  description: string;
  url: string;
  models: string[];
  required: boolean;
}

const API_KEYS: ApiKeyConfig[] = [
  {
    key: 'ZO_CLIENT_IDENTITY_TOKEN',
    label: 'ZO Client Identity Token',
    description: 'Required for Kimi K2.5 (provided by Zo)',
    url: 'https://kofi.zo.computer/?t=settings&s=advanced',
    models: ['Kimi K2.5'],
    required: true,
  },
  {
    key: 'OPENROUTER_API_KEY',
    label: 'OpenRouter API Key',
    description: 'For Reka Edge and Qwen 2.5',
    url: 'https://openrouter.ai/keys',
    models: ['Reka Edge', 'Qwen 2.5'],
    required: false,
  },
  {
    key: 'INCEPTION_API_KEY',
    label: 'Inception API Key',
    description: 'For Mercury 2 storytelling model',
    url: 'https://inceptionlabs.ai',
    models: ['Mercury 2'],
    required: false,
  },
  {
    key: 'GROQ_API_KEY',
    label: 'Groq API Key',
    description: 'For free Llama 3.1, Gemma 2, Mixtral',
    url: 'https://console.groq.com/keys',
    models: ['Llama 3.1', 'Gemma 2', 'Mixtral 8x7B'],
    required: false,
  },
  {
    key: 'GOOGLE_API_KEY',
    label: 'Google API Key',
    description: 'For Gemini Pro (free tier available)',
    url: 'https://aistudio.google.com/app/apikey',
    models: ['Gemini Pro'],
    required: false,
  },
];

export const Settings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({});
  const [preferredModel, setPreferredModel] = useState<LLMModel>('kimi-k2.5');
  const [autoPurchase, setAutoPurchase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/settings');
      const data = await response.json();
      
      if (data.settings) {
        setPreferredModel(data.settings.preferredModel || 'kimi-k2.5');
        setAutoPurchase(data.settings.autoPurchaseExtensions || false);
      }

      // Get current API key status
      const statusResponse = await fetch('/api/llm/validate-keys');
      const statusData = await statusResponse.json();
      
      const statusMap: Record<string, boolean> = {};
      statusData.keys.forEach((k: { key: string; valid: boolean }) => {
        statusMap[k.key] = k.valid;
      });
      setKeyStatus(statusMap);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Save API keys
      const keyPromises = Object.entries(apiKeys)
        .filter(([, value]) => value.trim())
        .map(([key, value]) =>
          fetch('/api/settings/api-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: value.trim() }),
          })
        );

      await Promise.all(keyPromises);

      // Save user preferences
      await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredModel,
          autoPurchaseExtensions: autoPurchase,
        }),
      });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Refresh key status
      await loadSettings();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyChange = (key: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <SettingsIcon className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
            <p className="text-zinc-500">Configure your StoryChain experience</p>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`
              flex items-center gap-2 p-4 rounded-lg
              ${message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }
            `}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* API Keys Section */}
        <section className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-200">API Keys</h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Add your API keys to unlock more AI models. Keys are stored securely in Settings > Advanced.
            </p>
          </div>

          <div className="divide-y divide-zinc-800">
            {API_KEYS.map((apiKey) => {
              const isConfigured = keyStatus[apiKey.key];
              const hasValue = apiKeys[apiKey.key]?.trim();

              return (
                <div key={apiKey.key} className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-zinc-300">{apiKey.label}</h3>
                        {apiKey.required && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded">
                            REQUIRED
                          </span>
                        )}
                        {isConfigured && (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <Check className="w-3 h-3" />
                            Configured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">{apiKey.description}</p>
                      <p className="text-xs text-zinc-600 mt-1">
                        Powers: {apiKey.models.join(', ')}
                      </p>
                    </div>
                    <a
                      href={apiKey.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      Get key
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      value={apiKeys[apiKey.key] || ''}
                      onChange={(e) => handleKeyChange(apiKey.key, e.target.value)}
                      placeholder={isConfigured ? '••••••••••••••••' : 'Enter API key'}
                      className="
                        w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg
                        text-sm text-zinc-300 placeholder-zinc-600
                        focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50
                      "
                    />
                    {hasValue && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-xs text-amber-500">Unsaved</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Model Preferences */}
        <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">Default Model</h2>
          <ModelSelector
            selectedModel={preferredModel}
            onModelChange={setPreferredModel}
          />
        </section>

        {/* Auto-purchase */}
        <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-200">Auto-purchase Extensions</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Automatically purchase character extensions when needed
              </p>
            </div>
            <button
              onClick={() => setAutoPurchase(!autoPurchase)}
              className={`
                relative w-14 h-7 rounded-full transition-colors
                ${autoPurchase ? 'bg-amber-500' : 'bg-zinc-700'}
              `}
            >
              <span
                className={`
                  absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
                  ${autoPurchase ? 'translate-x-7' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="
            w-full flex items-center justify-center gap-2 py-3 px-6
            bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800
            text-black font-medium rounded-xl transition-colors
          "
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;
