import React, { useEffect, useRef, useState } from 'react';
import { useStories } from '../hooks/useStories';
import { useStatus } from '../hooks/useStatus';
import StoryCard from '../components/StoryCard';
import SkeletonCard from '../components/SkeletonCard';

type Filter = 'all' | 'active' | 'completed';

const SearchIcon = () => (
  <svg className="w-4 h-4 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function Feed() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  const { stories, loading, loadingMore, hasMore, loadMore, error } = useStories({
    filter,
    search: debouncedSearch,
    autoRefresh: true,
  });

  const { status } = useStatus();

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore(); },
      { threshold: 0.1 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const filters: { value: Filter; label: string }[] = [
    { value: 'all',       label: 'All' },
    { value: 'active',    label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#f1f5f9] mb-2">
          AI Stories, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">written live</span>
        </h1>
        {status && (
          <p className="text-[#64748b] text-sm">
            {status.stories_active} active · {status.stories_completed} completed · {status.segments_generated_today} segments today
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stories…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#0f1020] border border-[#1e2040] rounded-lg
                       text-[#f1f5f9] text-sm placeholder-[#334155]
                       focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30
                       transition-colors"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex bg-[#0f1020] border border-[#1e2040] rounded-lg p-1 gap-1">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                filter === f.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#64748b] hover:text-[#f1f5f9]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-red-500/30 text-red-400 text-sm mb-6">{error}</div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-20 text-[#64748b]">
          <div className="text-4xl mb-3">📖</div>
          <p className="text-lg font-medium text-[#94a3b8]">No stories yet</p>
          <p className="text-sm mt-1">The autonomous loop will generate stories soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story, i) => (
            <StoryCard key={story.id} story={story} index={i} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8" />

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent"
               style={{ animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {!loading && !hasMore && stories.length > 0 && (
        <p className="text-center text-[#334155] text-xs py-4">All stories loaded</p>
      )}
    </div>
  );
}
