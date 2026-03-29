// TokenBalance — STORY token balance display for nav/header
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

interface BalanceData {
  offchain: number;
  celoOnchain: string;
  solanaWallet: string | null;
  celoWallet: string | null;
}

export const TokenBalance: React.FC<{
  onClick?: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  const { fetchWithAuth, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const r = await fetchWithAuth('/api/blockchain/balance');
      if (r.ok) {
        const d: BalanceData = await r.json();
        setBalance(d.offchain ?? 0);
        setLoaded(true);
      }
    } catch { /* silent */ }
  }, [fetchWithAuth, isAuthenticated]);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (!loaded || !isAuthenticated) return null;

  return (
    <button
      onClick={onClick}
      className={className}
      title={`${balance.toLocaleString()} STORY tokens earned`}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 10,
        background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
        color: '#c9a84c', cursor: onClick ? 'pointer' : 'default',
        fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.14)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)'; }}>
      <span style={{ fontSize: 14 }}>◈</span>
      <span>{balance >= 1000 ? `${(balance / 1000).toFixed(1)}k` : balance.toLocaleString()}</span>
      <span style={{ opacity: 0.7, fontSize: 10 }}>STORY</span>
    </button>
  );
};
