// Blockchain Service — Solana NFT minting + Celo STORY token
// Off-chain balance tracked in DB; on-chain ops require env vars to be set.
//
// Solana:  Metaplex pNFT on devnet/mainnet — story NFTs
// Celo:    ERC-20 STORY token on Alfajores/mainnet — writer rewards + staking
// IPFS:    Story metadata stored via nft.storage or ipfs.io

import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getDb } from '../database/connection.js';

// ─── Chain config ─────────────────────────────────────────────────────────────

const SOLANA_RPC    = process.env.SOLANA_RPC_URL    ?? 'https://api.devnet.solana.com';
const CELO_RPC      = process.env.CELO_RPC_URL      ?? 'https://alfajores-forno.celo-testnet.org';
const CELO_CHAIN_ID = process.env.CELO_CHAIN_ID ? parseInt(process.env.CELO_CHAIN_ID) : 44787; // 42220 = mainnet, 44787 = Alfajores

const celoChain = {
  id: CELO_CHAIN_ID,
  name: CELO_CHAIN_ID === 42220 ? 'Celo' : 'Celo Alfajores',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: { default: { http: [CELO_RPC] }, public: { http: [CELO_RPC] } },
  blockExplorers: {
    default: {
      name: 'Celo Explorer',
      url: CELO_CHAIN_ID === 42220 ? 'https://explorer.celo.org' : 'https://alfajores.celoscan.io',
    },
  },
};

// ─── STORY token ABI (minimal ERC-20 + mint) ──────────────────────────────────

export const STORY_TOKEN_ABI = [
  { type: 'function', name: 'balanceOf',  inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'transfer',   inputs: [{ type: 'address', name: 'to' }, { type: 'uint256', name: 'amount' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'mint',       inputs: [{ type: 'address', name: 'to' }, { type: 'uint256', name: 'amount' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'decimals',   inputs: [], outputs: [{ type: 'uint8' }],   stateMutability: 'view' },
  { type: 'function', name: 'symbol',     inputs: [], outputs: [{ type: 'string' }],  stateMutability: 'view' },
  { type: 'event',    name: 'Transfer',   inputs: [{ type: 'address', name: 'from', indexed: true }, { type: 'address', name: 'to', indexed: true }, { type: 'uint256', name: 'value' }] },
] as const;

// ─── STORY token economics ────────────────────────────────────────────────────

export const STORY_REWARDS = {
  per_segment:         10,   // STORY per published segment
  story_completion:   100,   // STORY bonus for completing a story (split across contributors)
  reader_engagement:    1,   // STORY per 100 reads
  editor_review:       25,   // STORY per editorial review completed
  quality_bonus:       15,   // STORY when quality gate score > 80
  staking_minimum:     50,   // STORY required to participate as an agent
  slash_penalty:        5,   // STORY slashed if quality gate < 40
} as const;

// ─── Solana connection (lazy) ─────────────────────────────────────────────────

let _solana: Connection | null = null;
function getSolana(): Connection {
  if (!_solana) _solana = new Connection(SOLANA_RPC, 'confirmed');
  return _solana;
}

// ─── Celo viem client (lazy) ──────────────────────────────────────────────────

let _celoPublic: ReturnType<typeof createPublicClient> | null = null;
function getCeloPublic() {
  if (!_celoPublic) _celoPublic = createPublicClient({ chain: celoChain as any, transport: http(CELO_RPC) });
  return _celoPublic;
}

function getCeloWallet() {
  const pk = process.env.CELO_PRIVATE_KEY;
  if (!pk) return null;
  const account = privateKeyToAccount(pk as `0x${string}`);
  return createWalletClient({ chain: celoChain as any, transport: http(CELO_RPC), account });
}

// ─── Off-chain STORY token ledger ─────────────────────────────────────────────

export async function awardTokens(
  userId: string,
  amount: number,
  reason: string,
  storyId?: string,
): Promise<void> {
  const db = await getDb();
  const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.run(
    `INSERT INTO token_transactions (id, user_id, amount, type, description, story_id, chain)
     VALUES (?, ?, ?, 'bonus', ?, ?, 'offchain')`,
    [id, userId, amount, reason, storyId ?? null],
  );
  db.run(
    `UPDATE users SET story_token_balance = COALESCE(story_token_balance, 0) + ? WHERE id = ?`,
    [amount, userId],
  );
}

export async function slashTokens(
  userId: string,
  amount: number,
  reason: string,
  storyId?: string,
): Promise<void> {
  const db = await getDb();
  const current = (db.query('SELECT story_token_balance FROM users WHERE id=?').get(userId) as any)?.story_token_balance ?? 0;
  const slash = Math.min(amount, current); // can't go below 0
  if (slash <= 0) return;
  const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.run(
    `INSERT INTO token_transactions (id, user_id, amount, type, description, story_id, chain)
     VALUES (?, ?, ?, 'spend', ?, ?, 'offchain')`,
    [id, userId, -slash, reason, storyId ?? null],
  );
  db.run(
    `UPDATE users SET story_token_balance = COALESCE(story_token_balance, 0) - ? WHERE id = ?`,
    [slash, userId],
  );
}

export async function getTokenBalance(userId: string): Promise<number> {
  const db = await getDb();
  const row = db.query('SELECT story_token_balance FROM users WHERE id=?').get(userId) as any;
  return row?.story_token_balance ?? 0;
}

export async function getTransactionHistory(
  userId: string,
  limit = 50,
): Promise<any[]> {
  const db = await getDb();
  return db.query(
    `SELECT tt.*, s.title as story_title
     FROM token_transactions tt
     LEFT JOIN stories s ON tt.story_id = s.id
     WHERE tt.user_id = ?
     ORDER BY tt.created_at DESC LIMIT ?`
  ).all(userId, limit) as any[];
}

export async function getLeaderboard(limit = 20): Promise<any[]> {
  const db = await getDb();
  return db.query(
    `SELECT u.id, COALESCE(wp.display_name, ep.display_name, u.username) as name,
            wp.avatar_url, wp.avatar_color, wp.is_agent,
            COALESCE(u.story_token_balance, 0) as balance,
            COALESCE(u.solana_wallet, u.wallet_address) as wallet
     FROM users u
     LEFT JOIN writer_profiles wp ON wp.user_id = u.id
     LEFT JOIN editor_profiles ep ON ep.user_id = u.id
     WHERE COALESCE(u.story_token_balance, 0) > 0
     ORDER BY u.story_token_balance DESC LIMIT ?`
  ).all(limit) as any[];
}

// ─── Wallet management ────────────────────────────────────────────────────────

export async function connectWallet(
  userId: string,
  solanaWallet?: string,
  celoWallet?: string,
): Promise<void> {
  const db = await getDb();
  if (solanaWallet) {
    // Validate Solana pubkey
    try { new PublicKey(solanaWallet); } catch { throw new Error('Invalid Solana wallet address'); }
    db.run('UPDATE users SET solana_wallet = ? WHERE id = ?', [solanaWallet, userId]);
  }
  if (celoWallet) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(celoWallet)) throw new Error('Invalid Celo/EVM wallet address');
    db.run('UPDATE users SET wallet_address = ? WHERE id = ?', [celoWallet, userId]);
  }
}

// ─── On-chain STORY token (Celo) ─────────────────────────────────────────────

export async function getCeloTokenBalance(walletAddress: string): Promise<string> {
  const contractAddr = process.env.STORY_TOKEN_CONTRACT as `0x${string}` | undefined;
  if (!contractAddr) return '0';
  try {
    const client = getCeloPublic();
    const raw = await client.readContract({
      address: contractAddr,
      abi: STORY_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    }) as bigint;
    return formatUnits(raw, 18);
  } catch {
    return '0';
  }
}

export async function mintStoryTokensOnChain(
  toAddress: string,
  amount: number,
): Promise<string | null> {
  const contractAddr = process.env.STORY_TOKEN_CONTRACT as `0x${string}` | undefined;
  const wallet = getCeloWallet();
  if (!contractAddr || !wallet) return null;
  try {
    const hash = await wallet.writeContract({
      address: contractAddr,
      abi: STORY_TOKEN_ABI,
      functionName: 'mint',
      args: [toAddress as `0x${string}`, parseUnits(amount.toString(), 18)],
    });
    return hash;
  } catch (err) {
    console.error('[Blockchain] Celo mint failed:', err);
    return null;
  }
}

// ─── Solana NFT minting ───────────────────────────────────────────────────────

export interface StoryNFTData {
  storyId:     string;
  title:       string;
  genre:       string;
  coverUrl:    string;
  foreword:    string;
  contributors: Array<{ userId: string; wallet?: string; segments: number }>;
  segmentCount: number;
  bestsellerScore: number;
}

async function uploadMetadataToIPFS(metadata: object): Promise<string> {
  // Use nft.storage or public IPFS node
  const nftStorageKey = process.env.NFT_STORAGE_KEY;
  if (nftStorageKey) {
    const res = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${nftStorageKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
    if (res.ok) {
      const d = await res.json() as any;
      return `https://ipfs.io/ipfs/${d.value?.cid}`;
    }
  }
  // Fallback: return a data URI (for testing)
  return `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;
}

export async function mintStoryNFT(data: StoryNFTData): Promise<{
  mintAddress: string;
  arweaveUri: string;
  txSignature: string;
} | null> {
  const treasuryKeypairRaw = process.env.SOLANA_TREASURY_KEYPAIR;
  if (!treasuryKeypairRaw) {
    console.warn('[Blockchain] SOLANA_TREASURY_KEYPAIR not set — NFT mint queued for when configured');
    return null;
  }

  try {
    const connection = getSolana();

    // Deserialise treasury keypair from base58 or JSON array
    let treasury: Keypair;
    if (treasuryKeypairRaw.startsWith('[')) {
      treasury = Keypair.fromSecretKey(new Uint8Array(JSON.parse(treasuryKeypairRaw)));
    } else {
      const bs58 = await import('@solana/web3.js');
      treasury = Keypair.fromSecretKey(
        Buffer.from(treasuryKeypairRaw, 'base64'),
      );
    }

    // Build NFT metadata
    const totalSegments = data.contributors.reduce((s, c) => s + c.segments, 0) || 1;
    const creatorShares = data.contributors
      .filter(c => c.wallet)
      .map(c => ({
        address: c.wallet!,
        share: Math.round((c.segments / totalSegments) * 100),
      }));

    // Normalise shares to sum to 100
    const shareSum = creatorShares.reduce((s, c) => s + c.share, 0);
    if (shareSum > 0 && shareSum !== 100) {
      creatorShares[0].share += 100 - shareSum;
    }

    const metadata = {
      name: `StoryChain: ${data.title}`,
      symbol: 'STORY',
      description: data.foreword || `A collaborative ${data.genre} story written on StoryChain.`,
      image: data.coverUrl || 'https://storychain.app/og-cover.png',
      external_url: `https://storychain.app/#story/${data.storyId}`,
      attributes: [
        { trait_type: 'Genre',            value: data.genre },
        { trait_type: 'Segments',         value: data.segmentCount },
        { trait_type: 'Authors',          value: data.contributors.length },
        { trait_type: 'BestsellerScore',  value: data.bestsellerScore },
        { trait_type: 'Platform',         value: 'StoryChain' },
      ],
      properties: {
        creators: creatorShares,
        royalty: 1500, // 15% in basis points
      },
    };

    const arweaveUri = await uploadMetadataToIPFS(metadata);

    // Mint a simple SPL token representing the NFT
    // (Full Metaplex pNFT requires @metaplex-foundation packages — add later)
    const mintKeypair = Keypair.generate();
    const mintAddress = mintKeypair.publicKey.toBase58();

    // For now, record the intent — full on-chain mint fires when Metaplex SDK added
    const db = await getDb();
    db.run(
      `UPDATE stories SET mint_address=?, arweave_uri=?, mint_tx_signature=?, minted_at=CURRENT_TIMESTAMP WHERE id=?`,
      [mintAddress, arweaveUri, 'pending_metaplex', data.storyId],
    );

    return { mintAddress, arweaveUri, txSignature: 'pending_metaplex' };
  } catch (err) {
    console.error('[Blockchain] Solana NFT mint failed:', err);
    return null;
  }
}

// ─── Contributor attribution ──────────────────────────────────────────────────

export async function getStoryContributors(storyId: string): Promise<Array<{
  userId: string;
  name: string;
  segments: number;
  wallet?: string;
  solanaWallet?: string;
  tokenBalance: number;
}>> {
  const db = await getDb();
  const rows = db.query(`
    SELECT c.author_id as userId, COUNT(*) as segments,
           COALESCE(wp.display_name, u.username) as name,
           u.wallet_address as wallet,
           u.solana_wallet,
           COALESCE(u.story_token_balance, 0) as tokenBalance
    FROM contributions c
    JOIN users u ON u.id = c.author_id
    LEFT JOIN writer_profiles wp ON wp.user_id = c.author_id
    WHERE c.story_id = ?
    GROUP BY c.author_id
    ORDER BY segments DESC
  `).all(storyId) as any[];
  return rows;
}

// ─── Agent staking checks ─────────────────────────────────────────────────────

export async function canAgentParticipate(agentId: string): Promise<boolean> {
  const balance = await getTokenBalance(agentId);
  return balance >= STORY_REWARDS.staking_minimum;
}

export async function recordQualityReward(
  userId: string,
  score: number,
  storyId: string,
): Promise<void> {
  if (score >= 80) {
    await awardTokens(userId, STORY_REWARDS.quality_bonus, `Quality bonus (score: ${score})`, storyId);
  } else if (score < 40) {
    await slashTokens(userId, STORY_REWARDS.slash_penalty, `Quality penalty (score: ${score})`, storyId);
  }
}

// ─── Story completion reward ──────────────────────────────────────────────────

export async function rewardStoryCompletion(storyId: string): Promise<void> {
  const contributors = await getStoryContributors(storyId);
  if (contributors.length === 0) return;
  const total = STORY_REWARDS.story_completion;
  const perWriter = Math.floor(total / contributors.length);
  for (const c of contributors) {
    await awardTokens(c.userId, perWriter, `Story completion bonus`, storyId);
  }
  console.log(`[Blockchain] Awarded ${total} STORY across ${contributors.length} contributors for story ${storyId}`);
}
