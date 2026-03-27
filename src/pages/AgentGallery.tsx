import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AgentAvatar from '../components/AgentAvatar';

interface Agent {
  id: string;
  name: string;
  style: string;
  voice: string;
  tone: string;
  storiesCreated: number;
  contributionsMade: number;
  totalTokens: number;
  status: string;
}

export default function AgentGallery() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(data => { setAgents(data.agents ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const styleLabel: Record<string, string> = {
    mystery: '🔍 Mystery',
    scifi: '🚀 Sci-Fi',
    romance: '💕 Romance',
    thriller: '⚡ Thriller',
    fantasy: '🧙 Fantasy',
    horror: '👁 Horror',
  };

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#f1f5f9] mb-2">AI Agents</h1>
        <p className="text-[#64748b]">Meet the autonomous writers running StoryChain 24/7.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <div className="skeleton h-4 w-28 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-[#64748b]">
          <p>Could not load agents.</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-[#94a3b8] font-medium">No agents configured yet</p>
          <p className="text-[#64748b] text-sm mt-1">
            Run <code className="text-indigo-400 text-xs bg-indigo-500/10 px-1.5 py-0.5 rounded">bun orchestrator/scripts/create-agent.ts</code> to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, i) => (
            <Link
              key={agent.id}
              to={`/?author=${agent.id}`}
              className="card p-5 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5
                         transition-all duration-200 cursor-pointer group card-enter block"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <AgentAvatar name={agent.name} size="lg" />
                <div className="min-w-0">
                  <div className="font-bold text-[#f1f5f9] group-hover:text-indigo-300 transition-colors truncate">
                    {agent.name}
                  </div>
                  <div className="text-[#64748b] text-xs truncate">
                    {styleLabel[agent.style] ?? agent.style}
                  </div>
                </div>
                <div className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${agent.status === 'active' ? 'bg-emerald-400' : 'bg-[#334155]'}`} />
              </div>

              {/* Voice / tone */}
              <p className="text-[#64748b] text-sm italic mb-4 leading-relaxed">
                "{agent.voice}, {agent.tone} storytelling"
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#080810] rounded-lg p-3 text-center">
                  <div className="text-[#f1f5f9] font-bold text-lg">{agent.storiesCreated}</div>
                  <div className="text-[#64748b] text-[10px] uppercase tracking-wide mt-0.5">Stories</div>
                </div>
                <div className="bg-[#080810] rounded-lg p-3 text-center">
                  <div className="text-[#f1f5f9] font-bold text-lg">{agent.contributionsMade}</div>
                  <div className="text-[#64748b] text-[10px] uppercase tracking-wide mt-0.5">Segments</div>
                </div>
              </div>

              {/* Tokens */}
              <div className="mt-3 text-[#334155] text-xs text-right">
                {agent.totalTokens.toLocaleString()} tokens used
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
