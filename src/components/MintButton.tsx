// MintButton — mint a completed story as a Solana NFT
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface NFTState {
  minted: boolean;
  mintAddress: string | null;
  arweaveUri: string | null;
  txSignature: string | null;
  mintedAt: string | null;
  contributors: Array<{ name: string; segments: number }>;
}

export const MintButton: React.FC<{
  storyId: string;
  storyTitle: string;
  isAuthor: boolean;
  isCompleted: boolean;
}> = ({ storyId, storyTitle, isAuthor, isCompleted }) => {
  const { fetchWithAuth } = useAuth();
  const [nft, setNft] = useState<NFTState | null>(null);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchWithAuth(`/api/blockchain/story/${storyId}/nft`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setNft(d); })
      .catch(() => {});
  }, [storyId]);

  const handleMint = async () => {
    if (!isAuthor || !isCompleted) return;
    setMinting(true);
    setError(null);
    try {
      const r = await fetchWithAuth(`/api/blockchain/mint-nft/${storyId}`, { method: 'POST' });
      const d = await r.json();
      if (d.queued) {
        setError('NFT queued — Solana wallet config needed on server');
      } else if (d.success) {
        setNft(prev => ({ ...prev!, minted: true, mintAddress: d.mintAddress, arweaveUri: d.arweaveUri, txSignature: d.txSignature }));
      } else {
        setError(d.error ?? 'Minting failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setMinting(false);
    }
  };

  if (!isCompleted) return null;

  if (nft?.minted) {
    return (
      <div>
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', cursor: 'pointer' }}>
          <span>◈</span> NFT Minted
        </button>
        {showDetail && nft.mintAddress && (
          <div className="mt-3 p-4 rounded-xl text-xs space-y-2" style={{ background: '#161210', border: '1px solid rgba(52,211,153,0.2)' }}>
            <p style={{ color: '#8a7a68' }}>Mint address</p>
            <p className="font-mono break-all" style={{ color: '#34d399' }}>{nft.mintAddress}</p>
            {nft.arweaveUri && (
              <>
                <p style={{ color: '#8a7a68' }}>Metadata</p>
                <a href={nft.arweaveUri} target="_blank" rel="noopener noreferrer"
                  className="font-mono break-all block" style={{ color: '#c9a84c' }}>
                  {nft.arweaveUri.slice(0, 60)}…
                </a>
              </>
            )}
            {nft.contributors?.length > 0 && (
              <div className="pt-2" style={{ borderTop: '1px solid #2a2218' }}>
                <p className="mb-1" style={{ color: '#8a7a68' }}>Contributors</p>
                {nft.contributors.map((c, i) => (
                  <p key={i} style={{ color: '#ede6d6' }}>
                    {c.name} — {c.segments} segment{c.segments !== 1 ? 's' : ''}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!isAuthor) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
        style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', color: '#4a3f35' }}>
        <span>◈</span> Mintable by author
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleMint}
        disabled={minting}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: minting ? 'rgba(201,168,76,0.06)' : 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(167,139,250,0.2))',
          border: '1px solid rgba(201,168,76,0.4)', color: '#c9a84c', cursor: minting ? 'wait' : 'pointer',
        }}>
        {minting ? (
          <>
            <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
              style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
            Minting…
          </>
        ) : (
          <><span>◈</span> Mint as NFT</>
        )}
      </button>
      {error && <p className="mt-2 text-xs" style={{ color: '#f87171' }}>{error}</p>}
      {!error && (
        <p className="mt-1 text-xs" style={{ color: '#4a3f35' }}>
          Mints on Solana · 15% royalties to all contributors
        </p>
      )}
    </div>
  );
};
