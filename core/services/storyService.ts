// Story API Service
const API_BASE = '/api';

export interface CreateStoryInput {
  title: string;
  content: string;
  modelUsed: string;
  authorId?: string;
  authorName?: string;
}

export interface CreateContributionInput {
  content: string;
  authorId?: string;
  authorName?: string;
}

export async function fetchStories(): Promise<{ stories: any[] }> {
  const res = await fetch(`${API_BASE}/stories`);
  if (!res.ok) throw new Error(`Failed to fetch stories: ${res.status}`);
  return res.json();
}

export async function fetchStory(id: string): Promise<{ story: any }> {
  const res = await fetch(`${API_BASE}/stories/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch story: ${res.status}`);
  return res.json();
}

export async function createStory(data: CreateStoryInput): Promise<{ story: any }> {
  const res = await fetch(`${API_BASE}/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create story: ${res.status}`);
  return res.json();
}

export async function likeStory(id: string): Promise<{ liked: boolean; likes: number }> {
  const res = await fetch(`${API_BASE}/stories/${id}/like`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to like story: ${res.status}`);
  return res.json();
}

export async function addContribution(
  storyId: string, 
  data: CreateContributionInput
): Promise<{ contribution: any }> {
  const res = await fetch(`${API_BASE}/stories/${storyId}/contributions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to add contribution: ${res.status}`);
  return res.json();
}
