// ─── Story Store ──────────────────────────────────────────────────────────────
// Manages the active story feed, individual story state, and contributions.

import { create } from 'zustand';
import { api } from '../shared/api/client.js';
import type { Story, Segment } from '../shared/types/domain.js';

interface StoryState {
  // Feed
  feed: Story[];
  feedLoading: boolean;
  feedGenreFilter: string | null;

  // Active story
  activeStoryId: string | null;
  activeStory: Story | null;
  segments: Segment[];
  storyLoading: boolean;

  // Actions
  loadFeed: (genre?: string) => Promise<void>;
  openStory: (id: string) => Promise<void>;
  contribute: (storyId: string, content: string) => Promise<Segment>;
  createStory: (genre: string, title?: string, seed?: string) => Promise<Story>;
  setGenreFilter: (genre: string | null) => void;
  reset: () => void;
}

export const useStoryStore = create<StoryState>()((set, get) => ({
  feed: [],
  feedLoading: false,
  feedGenreFilter: null,
  activeStoryId: null,
  activeStory: null,
  segments: [],
  storyLoading: false,

  loadFeed: async (genre) => {
    set({ feedLoading: true });
    try {
      const data = await api.stories.list(1, genre);
      set({ feed: (data.stories ?? data).map(normaliseStory), feedLoading: false });
    } catch {
      set({ feedLoading: false });
    }
  },

  openStory: async (id) => {
    if (get().activeStoryId === id) return;
    set({ storyLoading: true, activeStoryId: id, segments: [] });
    try {
      const data = await api.stories.get(id);
      set({
        activeStory: normaliseStory(data.story ?? data),
        segments: (data.contributions ?? data.segments ?? []).map(normaliseSegment),
        storyLoading: false,
      });
    } catch {
      set({ storyLoading: false });
    }
  },

  contribute: async (storyId, content) => {
    const data = await api.stories.contribute(storyId, content);
    const seg = normaliseSegment(data.contribution ?? data);
    set(s => ({ segments: [...s.segments, seg] }));
    return seg;
  },

  createStory: async (genre, title, seed) => {
    const data = await api.stories.create({ genre, title, seed });
    const story = normaliseStory(data.story ?? data);
    set(s => ({ feed: [story, ...s.feed] }));
    return story;
  },

  setGenreFilter: (genre) => {
    set({ feedGenreFilter: genre });
    get().loadFeed(genre ?? undefined);
  },

  reset: () => set({ activeStoryId: null, activeStory: null, segments: [] }),
}));

function normaliseStory(raw: any): Story {
  return {
    id:             raw.id,
    title:          raw.title ?? 'Untitled',
    genre:          raw.genre ?? 'default',
    status:         raw.is_completed ? 'completed' : 'active',
    authorId:       raw.author_id ?? raw.authorId,
    authorName:     raw.author_name ?? raw.authorName ?? '',
    segmentCount:   raw.segment_count ?? raw.segmentCount ?? 0,
    coverUrl:       raw.cover_url ?? raw.coverUrl,
    bestsellerScore: raw.bestseller_score ?? raw.bestsellerScore,
    createdAt:      raw.created_at ?? raw.createdAt,
    updatedAt:      raw.updated_at ?? raw.updatedAt,
  };
}

function normaliseSegment(raw: any): Segment {
  return {
    id:           raw.id,
    storyId:      raw.story_id ?? raw.storyId,
    authorId:     raw.author_id ?? raw.authorId,
    authorName:   raw.author_name ?? raw.pen_name ?? raw.authorName ?? '',
    content:      raw.content,
    qualityScore: raw.quality_score ?? raw.qualityScore,
    modelUsed:    raw.model_used ?? raw.modelUsed,
    tokensUsed:   raw.tokens_spent ?? raw.tokensUsed,
    createdAt:    raw.created_at ?? raw.createdAt,
  };
}
