import { useState, useEffect, useCallback } from 'react';

export interface Story {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  modelUsed: string;
  isCompleted: boolean;
  contributionCount: number;
  likeCount: number;
  latestSegment?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseStoriesOptions {
  filter?: 'all' | 'active' | 'completed';
  search?: string;
  autoRefresh?: boolean;
}

export function useStories(options: UseStoriesOptions = {}) {
  const { filter = 'all', search = '', autoRefresh = true } = options;
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiFilter = filter === 'active' ? 'ongoing' : filter;

  const fetchStories = useCallback(async (pageNum: number, reset: boolean) => {
    try {
      if (reset) setLoading(true); else setLoadingMore(true);

      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '12',
        filter: apiFilter,
        sort: 'newest',
        ...(search ? { q: search } : {}),
      });

      const res = await fetch(`/api/stories?${params}`);
      if (!res.ok) throw new Error('Failed to fetch stories');
      const data = await res.json();
      const incoming: Story[] = data.stories ?? [];

      setStories(prev => reset ? incoming : [...prev, ...incoming]);
      setHasMore(incoming.length === 12);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiFilter, search]);

  // Reset + fetch on filter/search change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchStories(1, true);
  }, [fetchStories]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => fetchStories(1, true), 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchStories]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setPage(next);
    fetchStories(next, false);
  }, [hasMore, loadingMore, page, fetchStories]);

  return { stories, loading, loadingMore, hasMore, loadMore, error, refresh: () => fetchStories(1, true) };
}
