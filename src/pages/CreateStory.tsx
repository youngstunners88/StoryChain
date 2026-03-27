import React, { useState, useEffect, useRef } from 'react';
import { PenTool, Send, AlertCircle, RefreshCw, Coins, ArrowRight, User } from 'lucide-react';
import { ModelSelector } from '../components/ModelSelector';
import { CharacterSlider } from '../components/CharacterSlider';
import { LLMModel, Story, DEFAULT_CHARACTER_EXTENSION } from '../types';
import { useAuth } from '../context/AuthContext';

interface WriterItem {
  userId: string;
  displayName: string;
  isAgent: boolean;
  avatarEmoji: string;
}

export const CreateStory: React.FC = () => {
  const { fetchWithAuth, isAuthenticated, penName, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedModel, setSelectedModel] = useState<LLMModel>('kimi-k2.5');
  const [maxCharacters, setMaxCharacters] = useState(DEFAULT_CHARACTER_EXTENSION.baseCharacters);
  const [tokens, setTokens] = useState(1000); // Default for guests
  const [autoPurchase, setAutoPurchase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdStory, setCreatedStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  // Collaborators
  const [collabOpen, setCollabOpen] = useState(false);
  const [writersList, setWritersList] = useState<WriterItem[]>([]);
  const [writersLoading, setWritersLoading] = useState(false);
  const [writersLoaded, setWritersLoaded] = useState(false);
  const [selectedCollabs, setSelectedCollabs] = useState<Set<string>>(new Set());
  const [collabSearch, setCollabSearch] = useState('');
  const collabFetchedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    } else {
      // Clear errors and set guest defaults
      setError(null);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadUserData = async () => {
    try {
      const response = await fetchWithAuth('/api/user/profile');
      
      if (!response.ok) {
        // If auth fails, treat as guest and clear any errors
        setError(null);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.user) {
        setTokens(data.user.tokens || 1000);
        setSelectedModel(data.user.preferredModel || 'kimi-k2.5');
        setAutoPurchase(data.user.autoPurchaseExtensions || false);
      }
      // Clear any previous errors on successful load
      setError(null);
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Don't show error - just use defaults and clear error state
      setError(null);
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
    if (!content.trim()) return { valid: false, reason: 'Please enter your story content' };
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
      const response = await fetchWithAuth('/api/stories', {
        method: 'POST',
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
        // API can return errors in two formats:
        // { error: "string message" } or { error: { message: "string", code: "..." } }
        let errorMessage: string;
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = 'Failed to create story';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setCreatedStory(data.story);

      // Send collab invites (non-blocking)
      if (selectedCollabs.size > 0 && data.story?.id) {
        const newStoryId = data.story.id;
        const newStoryTitle = data.story.title ?? title.trim();
        for (const userId of selectedCollabs) {
          const writer = writersList.find(w => w.userId === userId);
          if (!writer) continue;
          fetchWithAuth('/api/collab-invites', {
            method: 'POST',
            body: JSON.stringify({
              storyId: newStoryId,
              storyTitle: newStoryTitle,
              inviteeId: userId,
              inviteeName: writer.displayName,
              message: "You've been invited to collaborate!",
            }),
          }).catch(() => {});
        }
      }

      // Refresh token balance
      if (isAuthenticated) {
        await loadUserData();
      }

      // Reset form
      setTitle('');
      setContent('');
      setMaxCharacters(DEFAULT_CHARACTER_EXTENSION.baseCharacters);
      setSelectedCollabs(new Set());
      setCollabOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create story');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollabToggle = () => {
    setCollabOpen(v => !v);
    if (!collabFetchedRef.current && !writersLoaded) {
      collabFetchedRef.current = true;
      setWritersLoading(true);
      fetch('/api/writers')
        .then(r => r.json())
        .then(d => {
          const writers: WriterItem[] = (d.writers ?? []).map((w: any) => ({
            userId: w.id ?? w.userId,
            displayName: w.name ?? w.displayName,
            isAgent: w.isAgent ?? false,
            avatarEmoji: w.avatarEmoji ?? '✍️',
          }));
          setWritersList(writers);
          setWritersLoaded(true);
        })
        .catch(() => {})
        .finally(() => setWritersLoading(false));
    }
  };

  const toggleCollab = (userId: string) => {
    setSelectedCollabs(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };

  const filteredWriters = writersList.filter(w =>
    w.displayName.toLowerCase().includes(collabSearch.toLowerCase())
  );

  const tokensNeeded = calculateTokensNeeded();
  const validation = canSubmit();

  if (loading || authLoading) {
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
                href={`#story/${createdStory.id}`}
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
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isAuthenticated ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-500/10 border-amber-500/30'}`}>
            {isAuthenticated ? (
              <>
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="font-medium text-zinc-300">{tokens}</span>
                <span className="text-xs text-zinc-500">tokens</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400">Guest Mode</span>
              </>
            )}
          </div>
        </div>

        {/* Guest Mode Notice */}
        {!isAuthenticated && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-400">
              <strong>Welcome, Guest!</strong> You can explore and draft stories, but you&apos;ll need to add your API token in{' '}
              <a href="https://kofi.zo.computer/?t=settings&s=advanced" className="underline hover:text-amber-300">
                Settings &gt; Advanced
              </a>{' '}
              to publish.
            </p>
          </div>
        )}

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
              disabled={isSubmitting || !isAuthenticated}
            />
          </div>

          {/* Invite Collaborators */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a2218' }}>
            <button type="button" onClick={handleCollabToggle}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors"
              style={{ background: collabOpen ? '#1e1a16' : '#161210', border: 'none', cursor: 'pointer' }}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#8a7a68" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: '#8a7a68' }}>
                  Invite Collaborators
                  <span className="ml-1.5 text-xs" style={{ color: '#4a3f35' }}>(optional)</span>
                </span>
                {selectedCollabs.size > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}>
                    {selectedCollabs.size} selected
                  </span>
                )}
              </div>
              <svg className="w-4 h-4 transition-transform" viewBox="0 0 24 24" fill="none" stroke="#4a3f35" strokeWidth="2"
                style={{ transform: collabOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {collabOpen && (
              <div style={{ borderTop: '1px solid #2a2218', background: '#161210' }}>
                <div className="px-4 py-3">
                  <input
                    value={collabSearch}
                    onChange={e => setCollabSearch(e.target.value)}
                    placeholder="Search writers…"
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: '#0d0b08', border: '1px solid #2a2218', color: '#ede6d6', outline: 'none' }}
                  />
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {writersLoading ? (
                    <div className="px-4 py-6 text-center text-sm" style={{ color: '#4a3f35' }}>Loading writers…</div>
                  ) : filteredWriters.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm" style={{ color: '#4a3f35' }}>
                      {collabSearch ? 'No writers match your search' : 'No writers found'}
                    </div>
                  ) : (
                    filteredWriters.map(w => {
                      const checked = selectedCollabs.has(w.userId);
                      return (
                        <label key={w.userId}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                          style={{ background: checked ? 'rgba(201,168,76,0.05)' : 'transparent' }}
                          onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = checked ? 'rgba(201,168,76,0.05)' : 'transparent'; }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleCollab(w.userId)}
                            style={{ accentColor: '#c9a84c', width: 14, height: 14 }} />
                          <span style={{ fontSize: 16 }}>{w.avatarEmoji}</span>
                          <span className="text-sm flex-1" style={{ color: '#ede6d6' }}>{w.displayName}</span>
                          {w.isAgent && (
                            <span className="text-xs px-1.5 py-0.5 rounded-md"
                              style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.3)', color: '#2dd4bf' }}>
                              AI Agent
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
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
