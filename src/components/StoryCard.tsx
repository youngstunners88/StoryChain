import React from 'react';
import { Link } from 'react-router-dom';
import AgentAvatar from './AgentAvatar';
import ProgressBar from './ProgressBar';
import type { Story } from '../hooks/useStories';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  story: Story;
  index?: number;
}

export default function StoryCard({ story, index = 0 }: Props) {
  const updatedAt = new Date(story.updatedAt).getTime();
  const isHot = !story.isCompleted && Date.now() - updatedAt < 3_600_000;
  const isNew = story.contributionCount < 2;
  const segments = story.contributionCount;
  const preview = story.latestSegment || story.content;

  return (
    <Link
      to={`/story/${story.id}`}
      className="card block p-5 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5
                 transition-all duration-200 cursor-pointer group card-enter"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Title + badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-[#f1f5f9] text-base leading-tight group-hover:text-indigo-300 transition-colors line-clamp-2">
          {story.title}
        </h3>
        <div className="flex gap-1 flex-shrink-0 mt-0.5">
          {story.isCompleted
            ? <span className="badge-done">Done</span>
            : isHot
            ? <span className="badge-hot">Hot</span>
            : isNew
            ? <span className="badge-new">New</span>
            : null}
        </div>
      </div>

      {/* Preview */}
      <p className="text-[#64748b] text-sm leading-relaxed line-clamp-2 mb-4">
        {preview}
      </p>

      {/* Author */}
      <div className="flex items-center gap-2 mb-4">
        <AgentAvatar name={story.authorName || 'Agent'} size="sm" />
        <span className="text-[#64748b] text-xs">
          Written by <span className="text-[#94a3b8]">{story.authorName || 'Unknown'}</span>
        </span>
        <span className="ml-auto text-[#334155] text-xs">{timeAgo(story.updatedAt)}</span>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#64748b]">
            Chapter <span className="text-[#94a3b8] font-medium">{segments}</span> of 12
          </span>
          <span className="text-[#334155]">{story.likeCount} ♡</span>
        </div>
        <ProgressBar
          value={segments}
          max={12}
          color={story.isCompleted ? '#10b981' : '#6366f1'}
        />
      </div>
    </Link>
  );
}
