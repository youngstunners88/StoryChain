// WalletConnect — multi-chain wallet connection
// Supports Phantom (Solana) + MetaMask/Valora (Celo EVM)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface WalletState {
  solana: string | null;
  celo: string | null;
  connecting: boolean;
  error: string | null;
}

function shortAddr(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export const WalletConnect: React.FC<{
  compact?: boolean;
  onConnected?: (wallets: { solana?: string; celo?: string }) => void;
}> = ({ compact = false, onConnected }) => {
  const { fetchWithAuth } = useAuth();
  const [state, setState] = useState<WalletState>({ solana: null, celo: null, connecting: false, error: null });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load existing wallets from backend
    fetchWithAuth('/api/blockchain/balance').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setState(s => ({ ...s, solana: d.solanaWallet, celo: d.celoWallet }));
    }).catch(() => {});
  }, []);

  const connectPhantom = async () => {
    setState(s => ({ ...s, connecting: true, error: null }));
    try {
      const phantom = (window as any).solana;
      if (!phantom?.isPhantom) {
        setState(s => ({ ...s, connecting: false, error: 'Phantom wallet not found. Install it at phantom.app' }));
        return;
      }
      const resp = await phantom.connect();
      const address = resp.publicKey.toString();
      setState(s => ({ ...s, solana: address, connecting: false }));
      await saveWallets(address, state.celo ?? undefined);
    } catch (e: any) {
      setState(s => ({ ...s, connecting: false, error: e.message ?? 'Failed to connect Phantom' }));
    }
  };

  const connectMetaMask = async () => {
    setState(s => ({ ...s, connecting: true, error: null }));
    try {
      const eth = (window as any).ethereum;
      if (!eth) {
        setState(s => ({ ...s, connecting: false, error: 'MetaMask not found. Install it at metamask.io' }));
        return;
      }
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setState(s => ({ ...s, celo: address, connecting: false }));
      await saveWallets(state.solana ?? undefined, address);
    } catch (e: any) {
      setState(s => ({ ...s, connecting: false, error: e.message ?? 'Failed to connect MetaMask' }));
    }
  };

  const saveWallets = async (solana?: string, celo?: string) => {
    try {
      await fetchWithAuth('/api/blockchain/connect-wallet', {
        method: 'POST',
        body: JSON.stringify({ solanaWallet: solana, celoWallet: celo }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onConnected?.({ solana, celo });
    } catch { /* silent */ }
  };

  if (compact) {
    const connected = state.solana || state.celo;
    return (
      <div className="flex items-center gap-2">
        {connected ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
            {state.solana ? shortAddr(state.solana) : shortAddr(state.celo!)}
          </div>
        ) : (
          <button
            onClick={connectPhantom}
            disabled={state.connecting}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', cursor: 'pointer' }}>
            {state.connecting ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: '#161210', border: '1px solid #2a2218' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #c9a84c, #34d399, #a78bfa)', borderRadius: '8px 8px 0 0', margin: '-24px -24px 20px', width: 'calc(100% + 48px)' }} />

      <h3 className="font-serif text-xl font-bold mb-1" style={{ color: '#ede6d6' }}>Connect Wallet</h3>
      <p className="text-sm mb-6" style={{ color: '#8a7a68' }}>Link your wallets to earn STORY tokens on-chain and mint story NFTs.</p>

      <div className="space-y-3">
        {/* Phantom / Solana */}
        <div className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: '#1e1a16', border: '1px solid #2a2218' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}>👻</div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#ede6d6' }}>Phantom — Solana</p>
              <p className="text-xs" style={{ color: state.solana ? '#34d399' : '#4a3f35' }}>
                {state.solana ? shortAddr(state.solana) : 'Not connected — story NFT minting'}
              </p>
            </div>
          </div>
          <button
            onClick={connectPhantom}
            disabled={state.connecting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: state.solana ? 'rgba(52,211,153,0.1)' : 'rgba(167,139,250,0.15)',
              border: `1px solid ${state.solana ? 'rgba(52,211,153,0.3)' : 'rgba(167,139,250,0.4)'}`,
              color: state.solana ? '#34d399' : '#a78bfa', cursor: 'pointer',
            }}>
            {state.solana ? '✓ Connected' : (state.connecting ? '…' : 'Connect')}
          </button>
        </div>

        {/* MetaMask / Celo */}
        <div className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: '#1e1a16', border: '1px solid #2a2218' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>🦊</div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#ede6d6' }}>MetaMask — Celo</p>
              <p className="text-xs" style={{ color: state.celo ? '#34d399' : '#4a3f35' }}>
                {state.celo ? shortAddr(state.celo) : 'Not connected — STORY token claims'}
              </p>
            </div>
          </div>
          <button
            onClick={connectMetaMask}
            disabled={state.connecting}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: state.celo ? 'rgba(52,211,153,0.1)' : 'rgba(201,168,76,0.15)',
              border: `1px solid ${state.celo ? 'rgba(52,211,153,0.3)' : 'rgba(201,168,76,0.4)'}`,
              color: state.celo ? '#34d399' : '#c9a84c', cursor: 'pointer',
            }}>
            {state.celo ? '✓ Connected' : (state.connecting ? '…' : 'Connect')}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.1)', color: '#f87171', border: '1px solid rgba(220,38,38,0.2)' }}>
          {state.error}
        </p>
      )}
      {saved && (
        <p className="mt-3 text-xs" style={{ color: '#34d399' }}>✓ Wallets saved to your profile</p>
      )}

      <div className="mt-5 pt-4 space-y-1" style={{ borderTop: '1px solid #2a2218' }}>
        <p className="text-xs" style={{ color: '#4a3f35' }}>
          <span style={{ color: '#c9a84c' }}>Phantom</span> — mint completed stories as Solana pNFTs with royalties
        </p>
        <p className="text-xs" style={{ color: '#4a3f35' }}>
          <span style={{ color: '#c9a84c' }}>MetaMask</span> — claim STORY token earnings to Celo blockchain
        </p>
      </div>
    </div>
  );
};
