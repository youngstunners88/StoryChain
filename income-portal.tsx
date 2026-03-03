import { useState } from 'react';
import { Wallet, Copy, Check, ExternalLink, TrendingUp, Zap } from 'lucide-react';

export default function IncomePortal() {
  const [copied, setCopied] = useState<string | null>(null);

  const wallets = [
    { chain: 'Ethereum', address: '0x0089395dBced5DE83D65f13a38140F70777D56F0', explorer: 'etherscan.io/address/' },
    { chain: 'Solana', address: 'An3Ng8J9iaUzhmRb8vDUegAJ9aSh7DndoLmho2bqrb2u', explorer: 'solscan.io/account/' },
    { chain: 'Bitcoin', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', explorer: 'blockchain.com/btc/address/' },
    { chain: 'Base (USDC)', address: '0x3713C3af73870c2674F63E7C796B13c4A4014201', explorer: 'basescan.org/address/' },
  ];

  const streams = [
    { name: 'Trading Bot', status: 'Active', risk: 'Medium', apy: '15-40%' },
    { name: 'Yield Farming', status: 'Scanning', risk: 'Low', apy: '10-25%' },
    { name: 'Airdrop Hunter', status: 'Active', risk: 'Low', apy: 'Variable' },
  ];

  const opportunities = [
    { name: 'TRUTH Airdrop', type: 'Airdrop', reward: '3,333 TRUTH', status: 'LIVE' },
    { name: 'UniFarm', type: 'Yield', apy: '36-250% APY' },
    { name: 'PEPE Signal', type: 'Trade', signal: 'STRONG BUY 87%' },
  ];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Zap className="w-10 h-10 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Autonomous Income Engine</h1>
            <p className="text-zinc-400">24/7 AI-powered revenue generation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {streams.map((s, i) => (
            <div key={i} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{s.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${s.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{s.status}</span>
              </div>
              <div className="text-sm text-zinc-400">Risk: {s.risk}</div>
              <div className="text-sm text-purple-400">APY: {s.apy}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Active Opportunities
        </h2>
        <div className="bg-zinc-800/50 rounded-lg p-4 mb-8 border border-zinc-700">
          <div className="space-y-3">
            {opportunities.map((o, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-700 last:border-0">
                <div>
                  <span className="font-medium">{o.name}</span>
                  <span className="text-zinc-400 text-sm ml-2">({o.type})</span>
                </div>
                <div className="text-right text-sm">
                  {o.reward && <span className="text-green-400">{o.reward}</span>}
                  {o.apy && <span className="text-purple-400">{o.apy}</span>}
                  {o.signal && <span className="text-green-400">{o.signal}</span>}
                  {o.status && <span className="text-yellow-400">{o.status}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-purple-500" />
          Deposit Addresses
        </h2>
        <div className="space-y-4">
          {wallets.map((w, i) => (
            <div key={i} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-400 font-medium">{w.chain}</span>
                <div className="flex gap-2">
                  <a href={`https://${w.explorer}${w.address}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-zinc-600 rounded transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => copyToClipboard(w.address, w.chain)} className="p-2 hover:bg-zinc-600 rounded transition-colors">
                    {copied === w.chain ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  </button>
                </div>
              </div>
              <p className="font-mono text-sm text-zinc-300 break-all">{w.address}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-500 mt-8 text-center">All transactions are final. Funds power autonomous AI operations.</p>
      </div>
    </div>
  );
}
