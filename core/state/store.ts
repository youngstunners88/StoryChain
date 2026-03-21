// Central Store - Zero Dependencies State Management
// Uses Maps for O(1) lookups, no array scanning

export interface Story {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  modelUsed: string;
  likeCount: number;
  contributionCount: number;
  contributions?: Contribution[];
  createdAt: string;
}

export interface Contribution {
  id: string;
  storyId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  model: string;
  style: string;
  isWriting: boolean;
}

class Store {
  // State containers - Maps for O(1) access
  stories = new Map<string, Story>();
  agents = new Map<string, Agent>([
    ['agent_1', { id: 'agent_1', name: 'Narrator-7', avatar: '🤖', model: 'kimi-k2.5', style: 'dramatic', isWriting: false }],
    ['agent_2', { id: 'agent_2', name: 'PlotWeaver', avatar: '🎭', model: 'llama-3.1', style: 'plot-driven', isWriting: false }],
    ['agent_3', { id: 'agent_3', name: 'WordSmith', avatar: '✍️', model: 'gemma-2', style: 'poetic', isWriting: false }],
    ['agent_4', { id: 'agent_4', name: 'StoryBot-X', avatar: '📚', model: 'mixtral-8x7b', style: 'concise', isWriting: false }],
  ]);
  
  // Current view state
  currentRoute = '/';
  currentStoryId: string | null = null;
  loading = false;
  error: string | null = null;
  
  // Subscribers
  private listeners = new Set<() => void>();
  
  // Subscribe to changes
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  
  // Notify all subscribers
  private notify() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('Store subscriber error:', e); }
    });
  }
  
  // Actions
  setStories(stories: Story[]) {
    this.stories.clear();
    stories.forEach(s => this.stories.set(s.id, s));
    this.notify();
  }
  
  addStory(story: Story) {
    this.stories.set(story.id, story);
    this.notify();
  }
  
  updateStory(id: string, updates: Partial<Story>) {
    const story = this.stories.get(id);
    if (story) {
      Object.assign(story, updates);
      this.notify();
    }
  }
  
  setCurrentStory(story: Story) {
    this.stories.set(story.id, story);
    this.currentStoryId = story.id;
    this.notify();
  }
  
  setRoute(route: string) {
    this.currentRoute = route;
    this.notify();
  }
  
  setLoading(loading: boolean) {
    this.loading = loading;
    this.notify();
  }
  
  setError(error: string | null) {
    this.error = error;
    this.notify();
  }
  
  setAgentWriting(agentId: string, isWriting: boolean) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.isWriting = isWriting;
      this.notify();
    }
  }
  
  addContribution(storyId: string, contribution: Contribution) {
    const story = this.stories.get(storyId);
    if (story) {
      if (!story.contributions) story.contributions = [];
      story.contributions.push(contribution);
      story.contributionCount = (story.contributionCount || 0) + 1;
      this.notify();
    }
  }
  
  // Getters
  get storiesList(): Story[] {
    return Array.from(this.stories.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  get currentStory(): Story | null {
    return this.currentStoryId ? this.stories.get(this.currentStoryId) || null : null;
  }
  
  get agentsList(): Agent[] {
    return Array.from(this.agents.values());
  }
}

// Singleton instance
export const store = new Store();
