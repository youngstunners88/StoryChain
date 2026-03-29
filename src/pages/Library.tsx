import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { MintButton } from '../components/MintButton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompletedStory {
  id: string; title: string; excerpt: string;
  authorId: string; authorName: string; modelUsed: string;
  coverUrl?: string; chapterCount: number; likeCount: number;
  bookPublished: boolean; createdAt: string; updatedAt: string;
}

interface BookChapter {
  id: string; chapterNumber: number; content: string;
  authorId: string; authorName: string; isAgent: boolean;
  modelUsed: string; createdAt: string;
}

interface Contributor { authorId: string; authorName: string; contributionCount: number; isAgent: boolean; }

interface Book {
  id: string; title: string; opening: string;
  authorId: string; authorName: string; modelUsed: string;
  createdAt: string; isCompleted: boolean;
  coverUrl?: string; foreword?: string; copyrightText?: string; dedication?: string;
  bookPublished: boolean;
  contributors: Contributor[];
  chapters: BookChapter[];
  totalChapters: number; totalWords: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GENRE_MAP: Record<string, string> = {
  'nemotron-super': '#a78bfa', 'kimi-k2.5': '#2dd4bf', 'groq-llama-free': '#fb7185',
  'llama-3.1': '#fb7185', 'gemini-pro': '#22d3ee', default: '#c9a84c',
};

function accentFor(s: string) {
  const colors = ['#a78bfa','#2dd4bf','#fb7185','#fbbf24','#38bdf8','#f97316','#22d3ee','#dc2626','#facc15'];
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Book Cover card ──────────────────────────────────────────────────────────

const BookCard: React.FC<{ story: CompletedStory; index: number; onClick: () => void }> = ({ story, index, onClick }) => {
  const accent = accentFor(story.authorId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      {/* Book cover */}
      <div className="relative rounded-2xl overflow-hidden mb-3 transition-all duration-300 group-hover:scale-[1.02]"
        style={{ aspectRatio: '2/3', background: `linear-gradient(160deg, ${accent}22, #161210 60%)`, border: `1px solid ${accent}35`, boxShadow: `0 8px 32px ${accent}18` }}>
        {story.coverUrl ? (
          <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>📖</div>
            <p className="font-serif text-lg font-bold leading-tight" style={{ color: '#ede6d6' }}>{story.title}</p>
            <p className="text-xs mt-2" style={{ color: accent }}>by {story.authorName}</p>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}55)` }} />
          </div>
        )}
        {/* Chapter badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold"
          style={{ background: 'rgba(0,0,0,0.7)', color: accent, backdropFilter: 'blur(8px)' }}>
          {story.chapterCount} ch.
        </div>
      </div>
      <h3 className="font-serif font-bold text-sm leading-snug mb-1 line-clamp-2" style={{ color: '#ede6d6' }}>{story.title}</h3>
      <p className="text-xs" style={{ color: accent }}>by {story.authorName}</p>
      <p className="text-xs mt-0.5" style={{ color: '#4a3f35' }}>♥ {story.likeCount}</p>
    </motion.div>
  );
};

// ─── Full book reader ─────────────────────────────────────────────────────────

const BookReader: React.FC<{ storyId: string; onClose: () => void; token?: string | null; userId?: string | null; currentUserId?: string | null }> = ({ storyId, onClose, token, userId, currentUserId }) => {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ foreword: '', dedication: '', copyrightText: '' });
  const [coverPromptUrl, setCoverPromptUrl] = useState<string | null>(null);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [savingBook, setSavingBook] = useState(false);

  const isAuthor = book && (currentUserId === book.authorId || userId === book.authorId);

  useEffect(() => {
    fetch(`/api/stories/${storyId}/book`)
      .then(r => r.json())
      .then(d => {
        setBook(d.book);
        setForm({ foreword: d.book.foreword ?? '', dedication: d.book.dedication ?? '', copyrightText: d.book.copyrightText ?? '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storyId]);

  const handleGenerateCover = async () => {
    setGeneratingCover(true);
    const res = await fetch(`/api/stories/${storyId}/book/cover-prompt`, { method: 'POST' });
    const d = await res.json();
    setCoverPromptUrl(d.coverPromptUrl);
    setGeneratingCover(false);
    // Auto-save the cover URL
    if (token && d.coverPromptUrl) {
      await fetch(`/api/stories/${storyId}/book`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ coverUrl: d.coverPromptUrl }),
      });
      setBook(b => b ? { ...b, coverUrl: d.coverPromptUrl } : b);
    }
  };

  const handleSaveBook = async () => {
    if (!token) return;
    setSavingBook(true);
    await fetch(`/api/stories/${storyId}/book`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ foreword: form.foreword, dedication: form.dedication, copyrightText: form.copyrightText }),
    });
    setBook(b => b ? { ...b, foreword: form.foreword, dedication: form.dedication, copyrightText: form.copyrightText } : b);
    setSavingBook(false);
    setEditing(false);
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
    </div>
  );
  if (!book) return null;

  const accent = accentFor(book.authorId);

  const renderPage = (title: string, children: React.ReactNode) => (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {title && <h2 className="font-serif text-lg font-semibold mb-6 pb-3" style={{ color: accent, borderBottom: `1px solid ${accent}30` }}>{title}</h2>}
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden" style={{ background: '#08080d' }}>
      {/* Sidebar TOC */}
      <div className="hidden md:flex flex-col w-64 flex-shrink-0 overflow-y-auto py-6 px-4"
        style={{ background: '#0d0b10', borderRight: '1px solid #1e1a2e' }}>
        <button onClick={onClose} className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: '#4a4060', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.color = accent)}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a4060')}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
          Back to Library
        </button>

        <div className="mb-6">
          <p className="font-serif font-bold text-sm mb-1" style={{ color: '#ede6d6' }}>{book.title}</p>
          <p className="text-xs" style={{ color: accent }}>by {book.authorName}</p>
          <p className="text-xs mt-1" style={{ color: '#4a4060' }}>{book.totalWords.toLocaleString()} words · {book.totalChapters} chapters</p>
        </div>

        <nav className="space-y-1">
          {[
            { id: 'cover', label: '📖 Cover' },
            { id: 'title', label: '✦ Title Page' },
            ...(book.dedication ? [{ id: 'dedication', label: '💌 Dedication' }] : []),
            ...(book.foreword ? [{ id: 'foreword', label: '📜 Foreword' }] : []),
            { id: 'toc', label: '◉ Contents' },
            { id: 'opening', label: 'Opening' },
            ...book.chapters.map(ch => ({ id: `ch-${ch.chapterNumber}`, label: `Chapter ${ch.chapterNumber}` })),
            { id: 'contributors', label: '✍ Contributors' },
            { id: 'copyright', label: '© Copyright' },
          ].map(item => (
            <a key={item.id} href={`#book-${item.id}`}
              className="block text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#6a6080', textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = accent; (e.currentTarget as HTMLElement).style.background = `${accent}10`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6a6080'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              {item.label}
            </a>
          ))}
        </nav>

        {isAuthor && (
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid #1e1a2e' }}>
            <button onClick={() => setEditing(!editing)}
              className="w-full text-xs px-3 py-2 rounded-lg transition-all"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30`, color: accent, cursor: 'pointer' }}>
              {editing ? '✓ Done Editing' : '✎ Edit Book Details'}
            </button>
            <button onClick={handleGenerateCover} disabled={generatingCover}
              className="w-full text-xs px-3 py-2 rounded-lg mt-2 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2040', color: '#8a7a90', cursor: 'pointer' }}>
              {generatingCover ? '⟳ Generating…' : '🎨 Generate Cover'}
            </button>
          </div>
        )}
        {book?.isCompleted && (
          <div className="mt-4">
            <MintButton
              storyId={book.id}
              storyTitle={book.title}
              isAuthor={!!isAuthor}
              isCompleted={book.isCompleted}
            />
          </div>
        )}
      </div>

      {/* Main book content */}
      <div className="flex-1 overflow-y-auto" style={{ color: '#d4c8c0' }}>
        {/* Mobile back */}
        <div className="md:hidden px-4 py-3 flex items-center justify-between sticky top-0 z-10"
          style={{ background: 'rgba(8,8,13,0.95)', borderBottom: '1px solid #1e1a2e', backdropFilter: 'blur(8px)' }}>
          <button onClick={onClose} style={{ color: '#8a7a90', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            ← Library
          </button>
          <span className="font-serif text-sm" style={{ color: '#ede6d6' }}>{book.title}</span>
          <span />
        </div>

        {/* ── Cover page ── */}
        <div id="book-cover" className="min-h-screen flex flex-col items-center justify-center px-8 py-16 relative"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${accent}12, #08080d 60%)` }}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: `repeating-linear-gradient(0deg, ${accent} 0, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, ${accent} 0, transparent 1px, transparent 60px)` }} />
          {book.coverUrl ? (
            <img src={book.coverUrl} alt="Cover" className="max-h-96 rounded-2xl shadow-2xl mb-8 relative z-10" style={{ maxWidth: 280 }} />
          ) : (
            <div className="w-56 h-80 rounded-2xl flex flex-col items-center justify-center mb-8 relative z-10"
              style={{ background: `linear-gradient(160deg, ${accent}20, #16141e)`, border: `1px solid ${accent}35`, boxShadow: `0 24px 64px ${accent}20` }}>
              <div className="text-6xl mb-4">📖</div>
              <p className="text-xs text-center px-4" style={{ color: `${accent}80` }}>No cover yet</p>
            </div>
          )}
          <h1 className="font-serif text-4xl font-bold text-center mb-3 relative z-10 leading-tight"
            style={{ color: '#ede6d6', textShadow: `0 0 40px ${accent}30` }}>
            {book.title}
          </h1>
          <p className="text-lg relative z-10" style={{ color: accent }}>by {book.authorName}</p>
          <p className="text-sm mt-2 relative z-10" style={{ color: '#4a4060' }}>StoryChain · {fmt(book.createdAt)}</p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
        </div>

        {/* ── Edit panel ── */}
        <AnimatePresence>
          {editing && isAuthor && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
              style={{ background: '#0d0b10', borderBottom: '1px solid #1e1a2e' }}>
              <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
                <h3 className="font-serif text-sm font-semibold" style={{ color: accent }}>Edit Book Details</h3>
                {[
                  { label: 'Dedication', field: 'dedication', rows: 2, ph: 'For those who believed in the story…' },
                  { label: 'Foreword', field: 'foreword', rows: 5, ph: 'A message from the author to the reader…' },
                  { label: 'Copyright', field: 'copyrightText', rows: 2, ph: 'Auto-generated, or write your own…' },
                ].map(({ label, field, rows, ph }) => (
                  <div key={field}>
                    <label className="text-xs mb-1 block" style={{ color: '#4a4060' }}>{label}</label>
                    <textarea value={(form as any)[field]} rows={rows}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={ph} className="input-ink w-full px-4 py-3 text-sm resize-none" />
                  </div>
                ))}
                <button onClick={handleSaveBook} disabled={savingBook}
                  className="btn-gold px-5 py-2 text-sm">
                  {savingBook ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Title page ── */}
        {renderPage('', (
          <div id="book-title" className="text-center py-12">
            <p className="text-xs tracking-[0.25em] uppercase mb-8" style={{ color: accent }}>StoryChain Presents</p>
            <h1 className="font-serif text-5xl font-bold mb-4" style={{ color: '#ede6d6' }}>{book.title}</h1>
            <div className="w-12 h-0.5 mx-auto mb-4" style={{ background: accent }} />
            <p className="text-lg mb-2" style={{ color: '#b8a898' }}>by {book.authorName}</p>
            {book.contributors.length > 0 && (
              <p className="text-sm" style={{ color: '#4a4060' }}>
                with contributions by {book.contributors.map(c => c.authorName).join(', ')}
              </p>
            )}
            <p className="text-xs mt-8" style={{ color: '#2a2040' }}>{fmt(book.createdAt)} · {book.totalWords.toLocaleString()} words</p>
          </div>
        ))}

        {/* ── Dedication ── */}
        {book.dedication && renderPage('', (
          <div id="book-dedication" className="text-center py-12">
            <p className="font-serif text-xl italic leading-relaxed" style={{ color: '#8a7a90' }}>{book.dedication}</p>
          </div>
        ))}

        {/* ── Foreword ── */}
        {book.foreword && renderPage('Foreword', (
          <div id="book-foreword">
            <p className="text-base leading-loose whitespace-pre-wrap" style={{ color: '#b8a898', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {book.foreword}
            </p>
          </div>
        ))}

        {/* ── Table of contents ── */}
        {renderPage('Table of Contents', (
          <div id="book-toc" className="space-y-2">
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1e1a2e' }}>
              <span className="text-sm" style={{ color: '#8a7a90' }}>Opening</span>
              <span className="text-xs" style={{ color: '#2a2040' }}>by {book.authorName}</span>
            </div>
            {book.chapters.map(ch => (
              <div key={ch.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1a1628' }}>
                <a href={`#book-ch-${ch.chapterNumber}`} className="text-sm transition-colors" style={{ color: '#8a7a90', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = accent)}
                  onMouseLeave={e => (e.currentTarget.style.color = '#8a7a90')}>
                  Chapter {ch.chapterNumber}
                </a>
                <span className="text-xs" style={{ color: '#2a2040' }}>by {ch.authorName}</span>
              </div>
            ))}
          </div>
        ))}

        {/* ── Opening ── */}
        {renderPage('Opening', (
          <div id="book-opening">
            <p className="text-base leading-loose italic" style={{ color: '#c8b8a8', fontFamily: '"Playfair Display", Georgia, serif' }}>
              "{book.opening}"
            </p>
            <p className="text-xs mt-4 text-right" style={{ color: '#2a2040' }}>— {book.authorName}</p>
          </div>
        ))}

        {/* ── Chapters ── */}
        {book.chapters.map(ch => renderPage(`Chapter ${ch.chapterNumber}`, (
          <div key={ch.id} id={`book-ch-${ch.chapterNumber}`}>
            <p className="text-base leading-loose" style={{ color: '#c8b8a8', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {ch.content}
            </p>
            <div className="flex items-center gap-2 mt-6">
              <div className="h-px flex-1" style={{ background: '#1e1a2e' }} />
              <p className="text-xs" style={{ color: '#2a2040' }}>
                {ch.isAgent && '🤖 '}{ch.authorName}
              </p>
              <div className="h-px flex-1" style={{ background: '#1e1a2e' }} />
            </div>
          </div>
        )))}

        {/* ── Contributors ── */}
        {renderPage('Contributors', (
          <div id="book-contributors" className="space-y-3">
            <div className="flex items-center justify-between rounded-xl p-4" style={{ background: '#0d0b10', border: '1px solid #1e1a2e' }}>
              <div>
                <span className="font-semibold text-sm" style={{ color: '#ede6d6' }}>{book.authorName}</span>
                <span className="ml-2 text-xs" style={{ color: accent }}>Author</span>
              </div>
              <span className="text-xs" style={{ color: '#4a4060' }}>Original story</span>
            </div>
            {book.contributors.map(c => (
              <div key={c.authorId} className="flex items-center justify-between rounded-xl p-4" style={{ background: '#0d0b10', border: '1px solid #1e1a2e' }}>
                <div>
                  <span className="font-semibold text-sm" style={{ color: '#ede6d6' }}>{c.authorName}</span>
                  {c.isAgent && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>AI</span>}
                </div>
                <span className="text-xs" style={{ color: '#4a4060' }}>{c.contributionCount} chapter{c.contributionCount !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        ))}

        {/* ── Copyright ── */}
        {renderPage('', (
          <div id="book-copyright" className="text-center py-8">
            <div className="w-8 h-0.5 mx-auto mb-6" style={{ background: '#2a2040' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#4a4060' }}>{book.copyrightText}</p>
            <p className="text-xs mt-4" style={{ color: '#2a2040' }}>Published on StoryChain · storychain-kofi.zocomputer.io</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Library page ─────────────────────────────────────────────────────────────

export function Library() {
  const { token, user } = useAuth();
  const userId = token ? 'user_' + token.slice(-16) : null;
  const [stories, setStories] = useState<CompletedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stories/completed')
      .then(r => r.json())
      .then(d => setStories(d.stories ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (openId) {
    return <BookReader storyId={openId} onClose={() => setOpenId(null)} token={token} userId={userId} currentUserId={user?.id ?? null} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: '#ede6d6' }}>The Completed Works</h1>
        <p className="text-sm" style={{ color: '#8a7a68' }}>
          {stories.length} finished {stories.length === 1 ? 'story' : 'stories'} in the archive
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {[1,2,3,4,5].map(i => (
            <div key={i}>
              <div className="skeleton rounded-2xl mb-3" style={{ aspectRatio: '2/3' }} />
              <div className="skeleton h-4 w-3/4 rounded mb-1" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📚</p>
          <p className="font-serif text-xl mb-2" style={{ color: '#ede6d6' }}>No completed works yet</p>
          <p className="text-sm" style={{ color: '#8a7a68' }}>Stories complete at 12 chapters — the agents are writing now</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {stories.map((s, i) => (
            <BookCard key={s.id} story={s} index={i} onClick={() => setOpenId(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
