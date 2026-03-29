// EarningsPanel — STORY token earnings dashboard
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { WalletConnect } from './WalletConnect';

interface EarningsData {
  balance: number;
  totalEarned: number;
  totalSlashed: number;
  storiesContributed: number;
  transactionCount: number;
  breakdown: Array<{ type: string; description: string; total: number; count: number }>;
  topStories: Array<{ story_id: string; title: string; earnings: number }>;
  rewards: Record<string, number>;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  story_title?: string;
  chain: string;
  tx_hash?: string;
  created_at: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const EarningsPanel: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<'overview' | 'transactions' | 'wallet' | 'leaderboard'>('overview');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchWithAuth('/api/blockchain/earnings/me').then(r => r.ok ? r.json() : null),
      fetchWithAuth('/api/blockchain/transactions').then(r => r.ok ? r.json() : null),
    ]).then(([e, t]) => {
      if (e) setEarnings(e);
      if (t) setTxs(t.transactions ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'leaderboard' && leaderboard.length === 0) {
      fetchWithAuth('/api/blockchain/leaderboard').then(r => r.ok ? r.json() : null).then(d => {
        if (d) setLeaderboard(d.leaderboard ?? []);
      }).catch(() => {});
    }
  }, [tab]);

  const handleClaim = async () => {
    setClaiming(true);
    setClaimMsg(null);
    try {
      const r = await fetchWithAuth('/api/blockchain/claim-onchain', { method: 'POST' });
      const d = await r.json();
      if (d.queued) setClaimMsg('On-chain claiming coming soon — your balance is securely recorded.');
      else if (d.success) setClaimMsg(`✓ ${d.amount} STORY claimed to ${d.wallet.slice(0, 6)}…${d.wallet.slice(-4)}`);
      else setClaimMsg(d.error ?? 'Claim failed');
    } catch {
      setClaimMsg('Network error');
    } finally {
      setClaiming(false);
    }
  };

  const TABS = [
    { id: 'overview',     label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'wallet',       label: 'Wallet' },
    { id: 'leaderboard',  label: 'Leaderboard' },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: '#ede6d6' }}>STORY Earnings</h1>
        <p className="text-sm" style={{ color: '#8a7a68' }}>Your token rewards for writing on StoryChain</p>
      </div>

      {/* Balance hero */}
      {earnings && (
        <div className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a1508 0%, #161210 60%)', border: '1px solid rgba(201,168,76,0.25)' }}>
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ background: 'radial-gradient(circle at 80% 20%, #c9a84c, transparent 60%)' }} />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#4a3f35' }}>Current Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl font-bold" style={{ color: '#c9a84c' }}>
                  {earnings.balance.toLocaleString()}
                </span>
                <span className="text-lg" style={{ color: '#8a7a68' }}>STORY</span>
              </div>
              <p className="text-xs mt-1" style={{ color: '#4a3f35' }}>
                Total earned: {earnings.totalEarned.toLocaleString()} · Slashed: {earnings.totalSlashed.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <button
                onClick={handleClaim}
                disabled={claiming || earnings.balance < 100}
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: earnings.balance >= 100 ? 'linear-gradient(135deg, #c9a84c, #b8942e)' : 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: earnings.balance >= 100 ? '#0d0b08' : '#4a3f35',
                  cursor: earnings.balance >= 100 ? 'pointer' : 'not-allowed',
                }}>
                {claiming ? 'Claiming…' : '↑ Claim to Celo'}
              </button>
              {earnings.balance < 100 && (
                <p className="text-xs mt-1" style={{ color: '#4a3f35' }}>Min 100 STORY to claim</p>
              )}
              {claimMsg && <p className="text-xs mt-1" style={{ color: '#34d399' }}>{claimMsg}</p>}
            </div>
          </div>
          {/* Quick stats */}
          <div className="flex gap-6 mt-5 pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
            {[
              { label: 'Stories', value: earnings.storiesContributed },
              { label: 'Transactions', value: earnings.transactionCount },
              { label: 'Per segment', value: `+${earnings.rewards?.per_segment ?? 10}` },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xl font-bold" style={{ color: '#ede6d6' }}>{s.value}</p>
                <p className="text-xs" style={{ color: '#4a3f35' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: '#161210', border: '1px solid #2a2218' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
            style={{
              background: tab === t.id ? 'rgba(201,168,76,0.12)' : 'transparent',
              color: tab === t.id ? '#c9a84c' : '#8a7a68',
              border: tab === t.id ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
              cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && earnings && (
        <div className="space-y-4">
          {/* Rewards guide */}
          <div className="rounded-2xl p-5" style={{ background: '#161210', border: '1px solid #2a2218' }}>
            <h4 className="font-serif font-semibold mb-4" style={{ color: '#ede6d6' }}>How you earn</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Per segment published', value: `+${earnings.rewards.per_segment}`, color: '#34d399' },
                { label: 'Story completion', value: `+${earnings.rewards.story_completion} (split)`, color: '#34d399' },
                { label: 'Quality score > 80', value: `+${earnings.rewards.quality_bonus}`, color: '#60a5fa' },
                { label: 'Editor review', value: `+${earnings.rewards.editor_review}`, color: '#a78bfa' },
                { label: 'Quality score < 40', value: `-${earnings.rewards.slash_penalty}`, color: '#f87171' },
                { label: 'Agent staking min', value: `${earnings.rewards.staking_minimum} STORY`, color: '#c9a84c' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: '#1e1a16', border: '1px solid #2a2218' }}>
                  <span className="text-xs" style={{ color: '#8a7a68' }}>{r.label}</span>
                  <span className="text-sm font-bold" style={{ color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top stories */}
          {earnings.topStories.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: '#161210', border: '1px solid #2a2218' }}>
              <h4 className="font-serif font-semibold mb-4" style={{ color: '#ede6d6' }}>Top earning stories</h4>
              {earnings.topStories.map((s, i) => (
                <div key={s.story_id} className="flex items-center justify-between py-2"
                  style={{ borderBottom: i < earnings.topStories.length - 1 ? '1px solid #2a2218' : 'none' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs" style={{ color: '#4a3f35' }}>#{i + 1}</span>
                    <span className="text-sm truncate" style={{ color: '#ede6d6' }}>{s.title}</span>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0 ml-3" style={{ color: '#c9a84c' }}>
                    +{s.earnings.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      {tab === 'transactions' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#161210', border: '1px solid #2a2218' }}>
          {txs.length === 0 ? (
            <div className="p-8 text-center" style={{ color: '#4a3f35' }}>
              <p className="text-3xl mb-3">◈</p>
              <p className="text-sm">No transactions yet. Start contributing to earn STORY.</p>
            </div>
          ) : (
            txs.map((tx, i) => (
              <div key={tx.id} className="flex items-start justify-between px-4 py-3"
                style={{ borderBottom: i < txs.length - 1 ? '1px solid #1e1a16' : 'none' }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#ede6d6' }}>{tx.description}</p>
                  {tx.story_title && (
                    <p className="text-xs truncate" style={{ color: '#8a7a68' }}>{tx.story_title}</p>
                  )}
                  <p className="text-xs" style={{ color: '#4a3f35' }}>{fmtDate(tx.created_at)}</p>
                </div>
                <span className="text-sm font-bold flex-shrink-0 ml-3"
                  style={{ color: tx.amount > 0 ? '#34d399' : '#f87171' }}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Wallet */}
      {tab === 'wallet' && <WalletConnect />}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#161210', border: '1px solid #2a2218' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #2a2218' }}>
            <h4 className="font-serif font-semibold" style={{ color: '#ede6d6' }}>Top STORY Earners</h4>
          </div>
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center" style={{ color: '#4a3f35' }}>Loading…</div>
          ) : leaderboard.map((w, i) => (
            <div key={w.id} className="flex items-center gap-3 px-5 py-3"
              style={{ borderBottom: i < leaderboard.length - 1 ? '1px solid #1e1a16' : 'none' }}>
              <span className="text-sm w-6 flex-shrink-0 text-center"
                style={{ color: i < 3 ? '#c9a84c' : '#4a3f35', fontWeight: i < 3 ? 700 : 400 }}>
                {i + 1}
              </span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${w.avatar_color ?? '#c9a84c'}22`, color: w.avatar_color ?? '#c9a84c' }}>
                {(w.name ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#ede6d6' }}>
                  {w.name}
                  {w.is_agent ? <span className="ml-1 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>AI</span> : null}
                </p>
              </div>
              <span className="text-sm font-bold flex-shrink-0" style={{ color: '#c9a84c' }}>
                {w.balance.toLocaleString()} ◈
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
