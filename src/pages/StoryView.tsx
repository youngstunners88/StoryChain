import React, { useState, useEffect } from 'react';
import { useParams } from '../utils/useParams';
import { ArrowLeft, Heart, MessageCircle, Share2, Clock, User, Sparkles, Send, AlertCircle, RefreshCw, Coins } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { CharacterSlider } from '../components/CharacterSlider';
import type { Story, Contribution, LLMModel, DEFAULT_CHARACTER_EXTENSION } from '../types';

interface StoryWithDetails extends Story {
  authorName: string;
  contributions: ContributionWithAuthor[];
  likes: number;
  userHasLiked: boolean;
  isFollowingAuthor: boolean;
}

interface ContributionWithAuthor extends Contribution {
  authorName: string;
}

export const StoryView: React.FC = () => {
  const { id } = useParams();
  const [story, setStory] = useState<StoryWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContributeForm, setShowContributeForm] = useState(false);
  
  // Contribution form state
  const [contributionContent, setContributionContent] = useState('');
  const [selectedModel, setSelectedModel] = useState<LLMModel>('kimi-k2.5');
  const [maxCharacters, setMaxCharacters] = useState(300);
  const [tokens, setTokens] = useState(0);
  const [autoPurchase, setAutoPurchase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stories/${id}`);
      if (!response.ok) throw new Error('Failed to fetch story');
      
      const data = await response.json();
      setStory(data.story);
      setSelectedModel(data.story.modelUsed as LLMModel);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!story) return;
    
    try {
      const response = await fetch(`/api/stories/${story.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStory(prev => prev ? { ...prev, likes: data.likes, userHasLiked: data.liked } : null);
      }
    } catch (error) {
      console.error('Failed to like story:', error);
    }
  };

  const handleFollow = async () => {
    if (!story) return;
    
    try {
      const response = await fetch(`/api/users/${story.authorId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStory(prev => prev ? { ...prev, isFollowingAuthor: data.following } : null);
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const handleShare = async () => {
    if (!story) return;
    
    const url = `${window.location.origin}/story/${story.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: `Check out "${story.title}" on StoryChain`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const calculateTokensNeeded = (): number => {
    const baseCharacters = 300;
    const extensionSize = 100;
    const tokensPerExtension = 5;
    
    if (maxCharacters <= baseCharacters) return 0;
    const extensions = Math.ceil((maxCharacters - baseCharacters) / extensionSize);
    return extensions * tokensPerExtension;
  };

  const handleSubmitContribution = async () => {
    if (!story) return;
    
    const tokensNeeded = calculateTokensNeeded();
    if (tokensNeeded > tokens && !autoPurchase) {
      setSubmitError(`Insufficient tokens. Need ${tokensNeeded}, have ${tokens}.`);
      return;
    }

    if (!contributionContent.trim()) {
      setSubmitError('Please enter contribution content');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/stories/${story.id}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contributionContent.trim(),
          modelUsed: selectedModel,
          characterCount: contributionContent.length,
          tokensSpent: tokensNeeded,
          maxCharacters,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit contribution');
      }

      const data = await response.json();
      
      // Refresh story data
      await fetchStory();
      
      // Reset form
      setContributionContent('');
      setMaxCharacters(300);
      setShowContributeForm(false);
      setTokens(data.remainingTokens || tokens - tokensNeeded);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getModelColor = (model: LLMModel): string => {
    const colors: Record<LLMModel, string> = {
      'kimi-k2.5': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'reka-edge': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'qwen-2.5': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'mercury-2': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'llama-3.1': 'bg-green-500/20 text-green-400 border-green-500/30',
      'gemma-2': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'mixtral-8x7b': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'gemini-pro': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    };
    return colors[model] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-zinc-950 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-400">{error || 'Story not found'}</h2>
            <a href="/feed" className="mt-4 inline-block text-amber-500 hover:text-amber-400">
              Back to Feed
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <a
          href="/feed"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </a>

        {/* Story Header */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <span className={`px-2 py-1 text-xs font-medium rounded border ${getModelColor(story.modelUsed)}`}>
              {story.modelUsed}
            </span>
            <div className="flex items-center gap-1 text-sm text-zinc-500">
              <Clock className="w-4 h-4" />
              {formatDate(story.createdAt)}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-4">{story.title}</h1>

          {/* Author */}
          <div className="flex items-center justify-between">
            <a
              href={`/user/${story.authorId}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-zinc-300">{story.authorName}</p>
                <p className="text-xs text-zinc-500">Author</p>
              </div>
            </a>
            
            <button
              onClick={handleFollow}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${story.isFollowingAuthor
                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                }
              `}
            >
              {story.isFollowingAuthor ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Story Content */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-lg text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {story.content}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-zinc-800">
            <button
              onClick={handleLike}
              className={`
                flex items-center gap-2 transition-colors
                ${story.userHasLiked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'}
              `}
            >
              <Heart className={`w-5 h-5 ${story.userHasLiked ? 'fill-current' : ''}`} />
              <span>{story.likes}</span>
            </button>
            <span className="flex items-center gap-2 text-zinc-500">
              <MessageCircle className="w-5 h-5" />
              <span>{story.contributions.length} contributions</span>
            </span>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Contributions */}
        {story.contributions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-amber-500" />
              Contributions ({story.contributions.length})
            </h2>

            {story.contributions.map((contribution, index) => (
              <div
                key={contribution.id}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {contribution.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-zinc-300">{contribution.authorName}</p>
                      <p className="text-xs text-zinc-500">{formatDate(contribution.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${getModelColor(contribution.modelUsed)}`}>
                    {contribution.modelUsed}
                  </span>
                </div>
                <p className="text-zinc-400 whitespace-pre-wrap">{contribution.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Contribute Button / Form */}
        {!showContributeForm ? (
          <button
            onClick={() => setShowContributeForm(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-xl transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Add Your Contribution
          </button>
        ) : (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Add Contribution
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-zinc-300">{tokens}</span>
              </div>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {submitError}
              </div>
            )}

            <textarea
              value={contributionContent}
              onChange={(e) => setContributionContent(e.target.value)}
              placeholder="Continue the story..."
              rows={6}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
            />

            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isSubmitting}
            />

            <CharacterSlider
              currentCharacters={contributionContent.length}
              maxCharacters={maxCharacters}
              onChange={setMaxCharacters}
              tokens={tokens}
              autoPurchase={autoPurchase}
              onAutoPurchaseChange={setAutoPurchase}
              disabled={isSubmitting}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowContributeForm(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitContribution}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {calculateTokensNeeded() > 0 ? `Submit (${calculateTokensNeeded()} tokens)` : 'Submit Free'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryView;