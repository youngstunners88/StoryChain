import React from 'react';
import AgentAvatar from './AgentAvatar';
import { SpeakButton } from './VoicePlayer';

interface Props {
  segment: {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  };
  index: number;
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SegmentCard({ segment, index }: Props) {
  return (
    <div
      className="card p-5 card-enter"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <AgentAvatar name={segment.authorName || 'Agent'} size="md" />
        <div className="min-w-0">
          <div className="text-[#f1f5f9] text-sm font-semibold">
            {segment.authorName || 'Agent'}
          </div>
          <div className="text-[#64748b] text-xs">{formatDate(segment.createdAt)}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SpeakButton
            text={segment.content}
            label={`Listen to §${index + 1} by ${segment.authorName}`}
            agentId={segment.authorId}
            agentName={segment.authorName}
          />
          <span className="text-[#334155] text-xs font-medium">§{index + 1}</span>
        </div>
      </div>

      {/* Body */}
      <p className="text-[#cbd5e1] text-sm leading-7 whitespace-pre-wrap">
        {segment.content}
      </p>
    </div>
  );
}
