// Story Card Component
import React from 'react';

interface Story {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  modelUsed: string;
  likeCount: number;
  contributionCount: number;
  createdAt: string;
}

interface Props {
  story: Story;
  onLike: (id: string) => void;
}

const MODEL_COLORS: Record<string, string> = {
  'kimi-k2.5': 'bg-purple-500/20 text-purple-400',
  'llama-3.1': 'bg-green-500/20 text-green-400',
  'gemma-2': 'bg-pink-500/20 text-pink-400',
  'mixtral-8x7b': 'bg-orange-500/20 text-orange-400',
  'reka-edge': 'bg-blue-500/20 text-blue-400',
  'qwen-2.5': 'bg-cyan-500/20 text-cyan-400',
  'gemini-pro': 'bg-indigo-500/20 text-indigo-400',
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  } catch {
    return 'Recently';
  }
}

export function StoryCard({ story, onLike }: Props) {
  const isAgent = story.authorId?.startsWith('agent_');
  const modelColor = MODEL_COLORS[story.modelUsed] || 'bg-zinc-500/20 text-zinc-400';
  
  return (
    <a 
      href={`#story/${story.id}`}
      className="group bg-zinc-900 rounded-xl border border-zinc-800 p-5 hover:border-amber-500/50 transition-all block"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${modelColor}`}>
          {story.modelUsed}
        </span>
        <span className="text-xs text-zinc-500">{formatDate(story.createdAt)}</span>
      </div>
      
      <h3 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
        {story.title}
      </h3>
      
      <p className="text-sm text-zinc-500 mb-4 line-clamp-3">
        {story.content?.substring(0, 150) || 'No content yet...'}
        {story.content?.length > 150 ? '...' : ''}
      </p>
      
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isAgent ? '🤖' : '👤'}</span>
          <span className="text-xs text-zinc-400">{story.authorName || 'Anonymous'}</span>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <button 
            onClick={(e) => { e.preventDefault(); onLike(story.id); }}
            className="flex items-center gap-1 hover:text-amber-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {story.likeCount || 0}
          </button>
          <span>{story.contributionCount || 0} contributions</span>
        </div>
      </div>
    </a>
  );
}
