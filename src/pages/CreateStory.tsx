import React, { useState, useEffect } from 'react';
import { PenTool, Send, AlertCircle, RefreshCw, Coins, ArrowRight } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { CharacterSlider } from '../components/CharacterSlider';
import { LLMModel, Story, DEFAULT_CHARACTER_EXTENSION } from '../types';

export const CreateStory: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedModel, setSelectedModel] = useState<LLMModel>('kimi-k2.5');
  const [maxCharacters, setMaxCharacters] = useState(DEFAULT_CHARACTER_EXTENSION.baseCharacters);
  const [tokens, setTokens] = useState(0);
  const [autoPurchase, setAutoPurchase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdStory, setCreatedStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (data.user) {
        setTokens(data.user.tokens || 0);
        setSelectedModel(data.user.preferredModel || 'kimi-k2.5');
        setAutoPurchase(data.user.autoPurchaseExtensions || false);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTokensNeeded = (): number => {
    const { baseCharacters, extensionSize, tokensPerExtension } = DEFAULT_CHARACTER_EXTENSION;
    if (maxCharacters <= baseCharacters) return 0;
    const extensions = Math.ceil((maxCharacters - baseCharacters) / extensionSize);
    return extensions * tokensPerExtension;
  };

  const canSubmit = (): { valid: boolean; reason?: string } => {
    if (!title.trim()) return { valid: false, reason: 'Please enter a title' };
    if (!content.trim()) return { valid: false, reason: 'Please enter content' };
    if (content.length > maxCharacters) {
      return {
        valid: false,
        reason: `Content exceeds ${maxCharacters} character limit (${content.length} chars)`,
      };
    }

    const tokensNeeded = calculateTokensNeeded();
    if (tokensNeeded > tokens && !autoPurchase) {
      return {
        valid: false,
        reason: `Insufficient tokens. Need ${tokensNeeded}, have ${tokens}. Enable auto-purchase or buy more tokens.`,
      };
    }

    return { valid: true };
  };

  const handleSubmit = async () => {
    const validation = canSubmit();
    if (!validation.valid) {
      setError(validation.reason || 'Cannot submit');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          modelUsed: selectedModel,
          characterCount: content.length,
          tokensSpent: calculateTokensNeeded(),
          maxCharacters,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create story');
      }

      const data = await response.json();
      setCreatedStory(data.story);
      
      // Refresh token balance
      await loadUserData();
      
      // Reset form
      setTitle('');
      setContent('');
      setMaxCharacters(DEFAULT_CHARACTER_EXTENSION.baseCharacters);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create story');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tokensNeeded = calculateTokensNeeded();
  const validation = canSubmit();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (createdStory) {
    return (
      <div className="min-h-screen bg-zinc-950 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">Story Created!</h2>
            <p className="text-zinc-500 mb-6">
              Your story &ldquo;{createdStory.title}&rdquo; has been published.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-zinc-400 mb-6">
              <span>Model: {createdStory.modelUsed}</span>
              <span>&bull;</span>
              <span>{createdStory.characterCount} characters</span>
              <span>&bull;</span>
              <span>{createdStory.tokensSpent} tokens spent</span>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setCreatedStory(null)}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                Create Another
              </button>
              <a
                href={`/story/${createdStory.id}`}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                View Story
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <PenTool className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Create Story</h1>
              <p className="text-zinc-500">Share your tale with the community</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-zinc-300">{tokens}</span>
            <span className="text-xs text-zinc-500">tokens</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Story Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a captivating title..."
              maxLength={100}
              className="
                w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl
                text-lg text-zinc-100 placeholder-zinc-600
                focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50
              "
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Your Story</label>
              <span className={`text-xs ${content.length > maxCharacters ? 'text-red-400' : 'text-zinc-500'}`}>
                {content.length} / {maxCharacters} characters
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Once upon a time..."
              rows={12}
              className={`
                w-full px-4 py-3 bg-zinc-900 border rounded-xl resize-none
                text-zinc-100 placeholder-zinc-600
                focus:outline-none focus:ring-1
                ${content.length > maxCharacters
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                  : 'border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/50'
                }
              `}
            />
          </div>

          {/* Configuration Panel */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-6">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Story Configuration
            </h3>

            {/* Model Selector */}
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isSubmitting}
            />

            {/* Character Slider */}
            <CharacterSlider
              currentCharacters={content.length}
              maxCharacters={maxCharacters}
              onChange={setMaxCharacters}
              tokens={tokens}
              autoPurchase={autoPurchase}
              onAutoPurchaseChange={setAutoPurchase}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !validation.valid}
            className={`
              w-full flex items-center justify-center gap-2 py-4 px-6
              font-medium rounded-xl transition-all
              ${validation.valid
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {tokensNeeded > 0 ? `Publish (${tokensNeeded} tokens)` : 'Publish Free'}
              </>
            )}
          </button>

          {!validation.valid && validation.reason && (
            <p className="text-center text-sm text-red-400">{validation.reason}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateStory;
