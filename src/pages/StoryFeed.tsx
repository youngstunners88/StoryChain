import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Clock, TrendingUp, User, Filter, Search, Sparkles, Heart, MessageCircle, ChevronRight } from 'lucide-react';
import type { Story, LLMModel } from '../types';

interface StoryWithAuthor extends Story {
  authorName: string;
  contributionCount: number;
  likeCount: number;
}

type SortOption = 'newest' | 'trending' | 'most-liked' | 'most-contributions';
type FilterOption = 'all' | 'completed' | 'ongoing' | 'my-stories';

export const StoryFeed: React.FC = () => {
  const [stories, setStories] = useState<StoryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<LLMModel | 'all'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const STORIES_PER_PAGE = 12;

  const fetchStories = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sort: sortBy,
        filter: filterBy,
        page: currentPage.toString(),
        limit: STORIES_PER_PAGE.toString(),
      });

      if (searchQuery) params.set('q', searchQuery);
      if (modelFilter !== 'all') params.set('model', modelFilter);

      const response = await fetch(`/api/stories?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch stories');

      const data = await response.json();
      
      if (reset) {
        setStories(data.stories);
        setPage(2);
      } else {
        setStories(prev => [...prev, ...data.stories]);
        setPage(currentPage + 1);
      }
      
      setHasMore(data.stories.length === STORIES_PER_PAGE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, [sortBy, filterBy, searchQuery, modelFilter, page]);

  useEffect(() => {
    fetchStories(true);
  }, [sortBy, filterBy, modelFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery) fetchStories(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const getModelColor = (model: LLMModel): string => {
    const colors: Record<LLMModel, string> = {
      'kimi-k2.5': 'bg-purple-500/20 text-purple-400',
      'reka-edge': 'bg-blue-500/20 text-blue-400',
      'qwen-2.5': 'bg-cyan-500/20 text-cyan-400',
      'mercury-2': 'bg-amber-500/20 text-amber-400',
      'llama-3.1': 'bg-green-500/20 text-green-400',
      'gemma-2': 'bg-pink-500/20 text-pink-400',
      'mixtral-8x7b': 'bg-orange-500/20 text-orange-400',
      'gemini-pro': 'bg-indigo-500/20 text-indigo-400',
    };
    return colors[model] || 'bg-zinc-500/20 text-zinc-400';
  };

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const truncateContent = (content: string, maxLength: number = 150): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <BookOpen className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Discover Stories</h1>
              <p className="text-zinc-500">Explore collaborative tales from the community</p>
            </div>
          </div>
          <a
            href="#create"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Create Story
          </a>
        </div>

        {/* Filters & Search */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories by title or content..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-400">Sort:</span>
              <div className="flex gap-1">
                {[
                  { value: 'newest', label: 'Newest', icon: Clock },
                  { value: 'trending', label: 'Trending', icon: TrendingUp },
                  { value: 'most-liked', label: 'Most Liked', icon: Heart },
                  { value: 'most-contributions', label: 'Most Active', icon: MessageCircle },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value as SortOption)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
                      ${sortBy === value
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Filter:</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Stories</option>
                <option value="completed">Completed</option>
                <option value="ongoing">Ongoing</option>
                <option value="my-stories">My Stories</option>
              </select>
            </div>

            {/* Model Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Model:</span>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value as LLMModel | 'all')}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Models</option>
                <option value="kimi-k2.5">Kimi K2.5</option>
                <option value="reka-edge">Reka Edge</option>
                <option value="qwen-2.5">Qwen 2.5</option>
                <option value="mercury-2">Mercury 2</option>
                <option value="llama-3.1">Llama 3.1</option>
                <option value="gemma-2">Gemma 2</option>
                <option value="mixtral-8x7b">Mixtral 8x7B</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Stories Grid */}
        {stories.length === 0 && !loading ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-zinc-400">No stories found</h3>
            <p className="text-zinc-500 mt-2">Try adjusting your filters or create a new story</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => (
              <a
                key={story.id}
                href={`#story/${story.id}`}
                className="group bg-zinc-900 rounded-xl border border-zinc-800 p-5 hover:border-amber-500/30 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${getModelColor(story.modelUsed)}`}>
                    {story.modelUsed}
                  </span>
                  <span className="text-xs text-zinc-500">{formatDate(story.createdAt)}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
                  {story.title}
                </h3>

                {/* Content Preview */}
                <p className="text-sm text-zinc-500 mb-4 line-clamp-3">
                  {truncateContent(story.content)}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {story.authorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {story.contributionCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {story.likeCount}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && stories.length > 0 && (
          <div className="text-center">
            <button
              onClick={() => fetchStories()}
              disabled={loading}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Stories'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryFeed;