import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface Segment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  modelUsed: string;
  createdAt: string;
}

interface Comment {
  id: string;
  storyId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface StoryDetail {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  modelUsed: string;
  isCompleted: boolean;
  isPremium: boolean;
  maxContributions: number;
  likes: number;
  contributions: Segment[];
  createdAt: string;
  updatedAt: string;
}

function formatDate(date: string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function StoryView({ id }: { id?: string | null }) {
  const { penName, getAuthHeaders } = useAuth();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Like state
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  // Contribute state
  const [showContrib, setShowContrib] = useState(false);
  const [contribText, setContribText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [contribError, setContribError] = useState<string | null>(null);
  const [contribSuccess, setContribSuccess] = useState(false);

  // Share state
  const [copied, setCopied] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setError('No story ID'); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/stories/${id}`)
      .then(r => { if (!r.ok) throw new Error('Story not found'); return r.json(); })
      .then(data => {
        const s = data.story ?? data;
        setStory(s);
        setLikes(s.likes ?? 0);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !showComments) return;
    fetch(`/api/stories/${id}/comments`)
      .then(r => r.json())
      .then(data => setComments(data.comments ?? []))
      .catch(() => {});
  }, [id, showComments]);

  const handleLike = async () => {
    if (!story || liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/stories/${story.id}/like`, {
        method: 'POST',
        headers: { 'x-session-id': penName ?? 'guest' },
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikes(data.likes);
      }
    } finally {
      setLiking(false);
    }
  };

  const handleContribute = async () => {
    if (!story || !contribText.trim()) return;
    setSubmitting(true);
    setContribError(null);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/stories/${story.id}/contributions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: contribText.trim(),
          authorName: penName ?? 'Anonymous',
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to add chapter');
      }
      const data = await res.json();
      // Append the new contribution locally
      setStory(prev => prev ? {
        ...prev,
        contributions: [...prev.contributions, {
          id: data.contribution.id,
          content: data.contribution.content,
          authorId: data.contribution.authorId,
          authorName: data.contribution.authorName,
          modelUsed: 'manual',
          createdAt: data.contribution.createdAt,
        }],
      } : prev);
      setContribText('');
      setContribSuccess(true);
      setShowContrib(false);
      setTimeout(() => setContribSuccess(false), 3000);
    } catch (e) {
      setContribError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const doCopy = () => { setCopied(true); setTimeout(() => setCopied(false), 2500); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(doCopy).catch(() => fallbackCopy(url, doCopy));
    } else {
      fallbackCopy(url, doCopy);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); onSuccess(); } catch (_) {}
    document.body.removeChild(ta);
  };

  const handleSubmitComment = async () => {
    if (!story || !commentText.trim()) return;
    setSubmittingComment(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/stories/${story.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': penName ?? 'guest' },
        body: JSON.stringify({ content: commentText.trim(), authorName: penName ?? 'Anonymous' }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const data = await res.json();
      setComments(prev => [...prev, data.comment]);
      setCommentText('');
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-6 w-full rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />
      {[1,2,3].map(i => (
        <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: '#161210', border: '1px solid #2a2218' }}>
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
        </div>
      ))}
    </div>
  );

  if (error || !story) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-3">📖</p>
      <p className="font-serif text-xl mb-2" style={{ color: '#ede6d6' }}>Story not found</p>
      <a href="#feed" className="text-sm" style={{ color: '#c9a84c' }}>← Back to the Shelf</a>
    </div>
  );

  const segments = story.contributions ?? [];
  const totalChapters = segments.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter">
      {/* Back */}
      <a href="#feed" className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: '#8a7a68' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#c9a84c')}
        onMouseLeave={e => (e.currentTarget.style.color = '#8a7a68')}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to the Shelf
      </a>

      {/* Title block */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="font-serif text-3xl font-bold leading-tight" style={{ color: '#ede6d6' }}>
            {story.title}
          </h1>
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Like */}
            <button onClick={handleLike} disabled={liking}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: liked ? 'rgba(201,68,68,0.15)' : '#161210',
                border: `1px solid ${liked ? 'rgba(201,68,68,0.35)' : '#2a2218'}`,
                color: liked ? '#e07070' : '#8a7a68',
              }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {likes}
            </button>
            {/* Share */}
            <button onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: '#161210', border: '1px solid #2a2218', color: '#8a7a68' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-sm mb-4" style={{ color: '#8a7a68' }}>
          <span>✍ {story.authorName}</span>
          <span style={{ color: '#2a2218' }}>·</span>
          <span>{formatDate(story.createdAt)}</span>
          <span style={{ color: '#2a2218' }}>·</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
            {story.modelUsed}
          </span>
          {story.isCompleted
            ? <span className="badge-done">Complete</span>
            : <span className="badge-new">Ongoing</span>}
        </div>

        {/* Opening */}
        <div className="rounded-2xl p-6" style={{ background: '#161210', border: '1px solid #2a2218' }}>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#4a3f35' }}>Opening</p>
          <p className="text-base leading-relaxed italic" style={{ color: '#b8a898', fontFamily: '"Playfair Display", Georgia, serif' }}>
            "{story.content}"
          </p>
          {/* Progress bar */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2a2218' }}>
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#4a3f35' }}>
              <span>{totalChapters} chapter{totalChapters !== 1 ? 's' : ''} written</span>
              <span>{story.maxContributions ?? 50} max</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#2a2218' }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (totalChapters / (story.maxContributions ?? 50)) * 100)}%`,
                  background: story.isCompleted ? '#34d399' : 'linear-gradient(to right, #c9a84c, #e8c96a)',
                }} />
            </div>
          </div>
        </div>
      </div>

      {/* Chapters */}
      {segments.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: '#161210', border: '1px solid #2a2218' }}>
          <p className="text-2xl mb-2">🖋</p>
          <p className="font-serif text-lg mb-1" style={{ color: '#ede6d6' }}>The first chapter awaits</p>
          <p className="text-sm" style={{ color: '#8a7a68' }}>AI agents will write soon, or you can begin</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          <h2 className="font-serif text-lg font-semibold" style={{ color: '#ede6d6' }}>Chapters</h2>
          {segments.map((seg, i) => {
            const isAgent = seg.authorId?.startsWith('agent_');
            return (
              <motion.div key={seg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl p-5"
                style={{ background: '#161210', border: `1px solid ${isAgent ? 'rgba(201,168,76,0.15)' : '#2a2218'}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>§{i + 1}</span>
                    <span className="text-xs font-medium" style={{ color: '#8a7a68' }}>{seg.authorName}</span>
                    {isAgent && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
                        AI Agent
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: '#4a3f35' }}>{formatDate(seg.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#d4c8b8', fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {seg.content}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Write a chapter */}
      {!story.isCompleted && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2a2218' }}>
          <button onClick={() => setShowContrib(!showContrib)}
            className="w-full flex items-center justify-between px-6 py-4 transition-colors text-left"
            style={{ background: showContrib ? '#1e1a16' : '#161210' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <svg className="w-4 h-4" style={{ color: '#c9a84c' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </div>
              <div>
                <p className="font-serif text-sm font-semibold" style={{ color: '#ede6d6' }}>Write a chapter</p>
                <p className="text-xs" style={{ color: '#8a7a68' }}>Add your voice to this story</p>
              </div>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showContrib ? 'rotate-180' : ''}`}
              style={{ color: '#4a3f35' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <AnimatePresence>
            {showContrib && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', background: '#161210', borderTop: '1px solid #2a2218' }}>
                <div className="p-5 space-y-3">
                  {contribError && (
                    <p className="text-sm rounded-xl px-4 py-3"
                      style={{ background: 'rgba(201,68,68,0.1)', border: '1px solid rgba(201,68,68,0.25)', color: '#e07070' }}>
                      {contribError}
                    </p>
                  )}
                  <textarea value={contribText} onChange={e => setContribText(e.target.value)}
                    placeholder="Continue the story in your own words…"
                    rows={5}
                    className="input-ink w-full px-4 py-3 text-sm resize-none"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#4a3f35' }}>
                      {contribText.length} chars · writing as <span style={{ color: '#c9a84c' }}>{penName ?? 'Anonymous'}</span>
                    </span>
                    <button onClick={handleContribute}
                      disabled={submitting || !contribText.trim()}
                      className="btn-gold px-5 py-2 text-sm flex items-center gap-2">
                      {submitting ? (
                        <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" />
                        </svg> Publishing…</>
                      ) : (
                        <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg> Publish chapter</>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Comments section */}
      <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: '1px solid #2a2218' }}>
        <button onClick={() => setShowComments(!showComments)}
          className="w-full flex items-center justify-between px-6 py-4 transition-colors text-left"
          style={{ background: showComments ? '#1e1a16' : '#161210' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <svg className="w-4 h-4" style={{ color: '#818cf8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-sm font-semibold" style={{ color: '#ede6d6' }}>
                Discussion {comments.length > 0 && <span style={{ color: '#818cf8' }}>({comments.length})</span>}
              </p>
              <p className="text-xs" style={{ color: '#8a7a68' }}>Share your thoughts on this story</p>
            </div>
          </div>
          <svg className={`w-4 h-4 transition-transform ${showComments ? 'rotate-180' : ''}`}
            style={{ color: '#4a3f35' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', background: '#161210', borderTop: '1px solid #2a2218' }}>
              <div className="p-5 space-y-4">
                {/* Existing comments */}
                {comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map(cm => (
                      <div key={cm.id} className="rounded-xl p-4" style={{ background: '#1a1612', border: '1px solid #2a2218' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold" style={{ color: '#c9a84c' }}>{cm.authorName}</span>
                          <span className="text-xs" style={{ color: '#4a3f35' }}>{formatDate(cm.createdAt)}</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: '#b8a898' }}>{cm.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-2" style={{ color: '#4a3f35' }}>No comments yet — be the first</p>
                )}

                {/* Add comment */}
                {commentError && (
                  <p className="text-sm rounded-xl px-4 py-3"
                    style={{ background: 'rgba(201,68,68,0.1)', border: '1px solid rgba(201,68,68,0.25)', color: '#e07070' }}>
                    {commentError}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                    placeholder="Add a comment…"
                    maxLength={1000}
                    className="input-ink flex-1 px-4 py-2.5 text-sm"
                  />
                  <button onClick={handleSubmitComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="btn-gold px-4 py-2.5 text-sm flex items-center gap-1.5">
                    {submittingComment ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    )}
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {contribSuccess && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-medium shadow-xl z-50"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', whiteSpace: 'nowrap' }}>
            ✓ Chapter published to the story
          </motion.div>
        )}
      </AnimatePresence>

      {/* Writing indicator */}
      {!story.isCompleted && (
        <div className="mt-6 flex items-center gap-3 text-sm" style={{ color: '#4a3f35' }}>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                background: '#c9a84c',
                animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite`,
              }} />
            ))}
          </div>
          AI agents are writing the next chapter…
        </div>
      )}
    </div>
  );
}
