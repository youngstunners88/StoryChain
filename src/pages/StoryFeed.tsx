import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';

interface Story {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  modelUsed: string;
  characterCount: number;
  isCompleted: boolean;
  isPremium: boolean;
  maxContributions: number;
  contributionCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

type SortOption = 'newest' | 'trending' | 'most-liked' | 'most-contributions';

const formatDate = (date: string): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const truncate = (s: string, n = 160) => s.length <= n ? s : s.slice(0, n).trimEnd() + '…';

// Genre colour accent based on model/author style
function accentColor(authorId: string): string {
  const colors = ['#a78bfa','#2dd4bf','#fb7185','#fbbf24','#38bdf8','#a3e635','#94a3b8'];
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) hash = authorId.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const modelLabel = (m: string): string => {
  const map: Record<string, string> = {
    'nemotron-super': 'Nemotron', 'nemotron-nano': 'Nemotron Nano',
    'kimi-k2.5': 'Kimi', 'llama-3.1': 'Llama', 'gemma-2': 'Gemma',
    'mixtral-8x7b': 'Mixtral', 'gemini-pro': 'Gemini', 'reka-edge': 'Reka',
    'qwen-2.5': 'Qwen', 'mercury-2': 'Mercury',
  };
  return map[m] || m;
};

const StoryCard: React.FC<{ story: Story; index: number }> = ({ story, index }) => {
  const accent = accentColor(story.authorId);
  const borderBase = `${accent}25`;
  const borderHover = `${accent}55`;
  const shadowHover = `0 4px 28px ${accent}14`;
  return (
    <motion.a
      href={`#story/${story.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group block rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: '#161210', border: `1px solid ${borderBase}`, textDecoration: 'none' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = borderHover;
        (e.currentTarget as HTMLElement).style.boxShadow = shadowHover;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = borderBase;
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Accent top stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}35` }}>
              {modelLabel(story.modelUsed)}
            </span>
            {story.isCompleted
              ? <span className="badge-done">Complete</span>
              : <span className="badge-new">Ongoing</span>
            }
          </div>
          <span className="text-xs" style={{ color: '#4a3f35' }}>{formatDate(story.createdAt)}</span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-semibold mb-2 leading-snug"
          style={{ color: '#ede6d6' }}>
          {story.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: '#8a7a68', fontStyle: 'italic' }}>
          "{truncate(story.content)}"
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${accent}20` }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#4a3f35' }}>
            <button onClick={e => { e.preventDefault(); window.location.hash = `writers/${story.authorId}`; }}
              className="hover:underline transition-colors"
              style={{ color: '#4a3f35', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = accent)}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a3f35')}>
              ✍ {story.authorName}
            </button>
            <span>◆ {story.contributionCount} chapters</span>
            <span>♥ {story.likeCount}</span>
          </div>
          <svg className="w-4 h-4" style={{ color: `${accent}60` }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </motion.a>
  );
};

export const StoryFeed: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PER_PAGE = 12;

  const fetchStories = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortBy, filter: filterBy,
        page: currentPage.toString(), limit: PER_PAGE.toString(),
      });
      if (search) params.set('q', search);
      const res = await fetch(`/api/stories?${params}`);
      if (!res.ok) throw new Error('Failed to load stories');
      const data = await res.json();
      setStories(prev => reset ? data.stories : [...prev, ...data.stories]);
      setPage(reset ? 2 : currentPage + 1);
      setHasMore(data.stories.length === PER_PAGE);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [sortBy, filterBy, search, page]);

  useEffect(() => { fetchStories(true); }, [sortBy, filterBy]);

  useEffect(() => {
    const t = setTimeout(() => { if (search !== undefined) fetchStories(true); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const SORTS: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Latest' },
    { value: 'trending', label: 'Trending' },
    { value: 'most-liked', label: 'Beloved' },
    { value: 'most-contributions', label: 'Most Active' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: '#ede6d6' }}>
            The Shelf
          </h1>
          <p className="text-sm" style={{ color: '#8a7a68' }}>
            Stories written by AI & the writers circle
          </p>
        </div>
        <a href="#create"
          className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 text-sm self-start sm:self-auto">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
          Compose a Story
        </a>
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3"
        style={{ background: '#161210', border: '1px solid #2a2218' }}>
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a3f35' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search the shelf…"
            className="input-ink w-full pl-9 pr-4 py-2 text-sm" />
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: '#0d0b08', border: '1px solid #2a2218' }}>
          {SORTS.map(({ value, label }) => (
            <button key={value} onClick={() => setSortBy(value)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                color: sortBy === value ? '#0d0b08' : '#8a7a68',
                background: sortBy === value ? '#c9a84c' : 'transparent',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Filter */}
        <select value={filterBy} onChange={e => setFilterBy(e.target.value)}
          className="input-ink px-3 py-2 text-sm">
          <option value="all">All Stories</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 mb-6 text-sm text-center" style={{ background: 'rgba(201,68,68,0.1)', border: '1px solid rgba(201,68,68,0.25)', color: '#e07070' }}>
          {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && stories.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: '#161210', border: '1px solid #2a2218' }}>
              <div className="skeleton h-4 w-20 mb-3 rounded-full" />
              <div className="skeleton h-6 w-full mb-2 rounded" />
              <div className="skeleton h-4 w-5/6 mb-1 rounded" />
              <div className="skeleton h-4 w-4/6 mb-4 rounded" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && stories.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📜</div>
          <h3 className="font-serif text-xl mb-2" style={{ color: '#ede6d6' }}>The shelf is empty</h3>
          <p className="text-sm mb-6" style={{ color: '#8a7a68' }}>Be the first to pen a tale</p>
          <a href="#create" className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 text-sm">
            Start writing
          </a>
        </div>
      )}

      {/* Grid */}
      {stories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story, i) => <StoryCard key={story.id} story={story} index={i} />)}
        </div>
      )}

      {/* Load more */}
      {hasMore && stories.length > 0 && (
        <div className="text-center mt-8">
          <button onClick={() => fetchStories()} disabled={loading}
            className="btn-ghost px-8 py-3 text-sm disabled:opacity-40">
            {loading ? 'Loading…' : 'Load more stories'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryFeed;
