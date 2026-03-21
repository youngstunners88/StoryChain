// React Hook for Store Subscription
import { useState, useEffect, useCallback } from 'react';
import { store, Story, Agent } from '../../core/state/store';

export function useStore() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    return store.subscribe(() => forceUpdate({}));
  }, []);
  
  return {
    stories: store.storiesList,
    currentStory: store.currentStory,
    agents: store.agentsList,
    loading: store.loading,
    error: store.error,
    currentRoute: store.currentRoute,
  };
}

export function useStories() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    return store.subscribe(() => forceUpdate({}));
  }, []);
  
  const loadStories = useCallback(async () => {
    store.setLoading(true);
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      store.setStories(data.stories || []);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to load stories');
    } finally {
      store.setLoading(false);
    }
  }, []);
  
  return {
    stories: store.storiesList,
    loading: store.loading,
    error: store.error,
    loadStories,
  };
}

export function useStory(id: string | null) {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    return store.subscribe(() => forceUpdate({}));
  }, []);
  
  const loadStory = useCallback(async () => {
    if (!id) return;
    store.setLoading(true);
    try {
      const res = await fetch(`/api/stories/${id}`);
      const data = await res.json();
      if (data.story) {
        store.setCurrentStory(data.story);
      }
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to load story');
    } finally {
      store.setLoading(false);
    }
  }, [id]);
  
  const likeStory = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/stories/${id}/like`, { method: 'POST' });
      const data = await res.json();
      store.updateStory(id, { likeCount: data.likes });
    } catch (e) {
      console.error('Failed to like:', e);
    }
  }, [id]);
  
  const addContribution = useCallback(async (content: string, authorId?: string, authorName?: string) => {
    if (!id || !content.trim()) return;
    try {
      const res = await fetch(`/api/stories/${id}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, authorId, authorName }),
      });
      const data = await res.json();
      if (data.contribution) {
        store.addContribution(id, data.contribution);
      }
      return data.contribution;
    } catch (e) {
      console.error('Failed to contribute:', e);
      throw e;
    }
  }, [id]);
  
  return {
    story: id ? store.stories.get(id) || null : null,
    loading: store.loading,
    error: store.error,
    loadStory,
    likeStory,
    addContribution,
  };
}

export function useAgents() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    return store.subscribe(() => forceUpdate({}));
  }, []);
  
  const triggerAgent = useCallback(async (agentId: string, storyId: string) => {
    const agent = store.agents.get(agentId);
    if (!agent || agent.isWriting) return;
    
    store.setAgentWriting(agentId, true);
    
    // Simulate agent writing delay
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
    
    // Generate content based on agent style
    const continuations: Record<string, string[]> = {
      'dramatic': [
        "The plot thickens as our protagonist discovers a hidden truth...",
        "In the shadows, a figure watches. The game has just begun.",
        "The silence was deafening. Something was about to change forever."
      ],
      'plot-driven': [
        "Meanwhile, the plan was set in motion. There was no turning back.",
        "The pieces fell into place. All that remained was the execution.",
        "A new character emerged, bringing unexpected complications."
      ],
      'poetic': [
        "The wind whispered secrets through the ancient trees...",
        "Moonlight danced upon the waters, revealing truths long hidden.",
        "In that moment, time itself seemed to hold its breath."
      ],
      'concise': [
        "Things were about to get interesting.",
        "The next move would determine everything.",
        "A twist no one saw coming."
      ]
    };
    
    const options = continuations[agent.style] || continuations['dramatic'];
    const content = options[Math.floor(Math.random() * options.length)];
    
    try {
      await fetch(`/api/stories/${storyId}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          authorId: agent.id, 
          authorName: agent.name 
        }),
      });
      
      // Refresh story to show new contribution
      const res = await fetch(`/api/stories/${storyId}`);
      const data = await res.json();
      if (data.story) {
        store.setCurrentStory(data.story);
      }
    } catch (e) {
      console.error('Agent contribution failed:', e);
    } finally {
      store.setAgentWriting(agentId, false);
    }
  }, []);
  
  return {
    agents: store.agentsList,
    triggerAgent,
  };
}
