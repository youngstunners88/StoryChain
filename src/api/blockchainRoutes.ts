// Blockchain Routes — wallet connect, token balance, NFT minting, leaderboard
import type { Context } from 'hono';
import { getDb } from '../database/connection.js';
import { requireAuthCompat as requireAuth } from '../middleware/auth.js';
import {
  connectWallet,
  getTokenBalance,
  getCeloTokenBalance,
  getTransactionHistory,
  getLeaderboard,
  getStoryContributors,
  mintStoryNFT,
  awardTokens,
  STORY_REWARDS,
} from '../services/blockchainService.js';

// POST /api/blockchain/connect-wallet
export async function connectWalletRoute(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { solanaWallet, celoWallet } = await c.req.json();
    await connectWallet(auth.userId, solanaWallet, celoWallet);
    return c.json({ success: true, message: 'Wallet connected' });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to connect wallet' }, 400);
  }
}

// GET /api/blockchain/balance
export async function getBalanceRoute(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const db = await getDb();
    const user = db.query('SELECT story_token_balance, wallet_address, solana_wallet FROM users WHERE id=?').get(auth.userId) as any;
    const offchainBalance = user?.story_token_balance ?? 0;

    // Optionally fetch on-chain Celo balance
    let celoOnchainBalance = '0';
    if (user?.wallet_address && process.env.STORY_TOKEN_CONTRACT) {
      celoOnchainBalance = await getCeloTokenBalance(user.wallet_address);
    }

    return c.json({
      offchain: offchainBalance,
      celoOnchain: celoOnchainBalance,
      solanaWallet: user?.solana_wallet ?? null,
      celoWallet: user?.wallet_address ?? null,
      symbol: 'STORY',
    });
  } catch {
    return c.json({ error: 'Failed to fetch balance' }, 500);
  }
}

// GET /api/blockchain/transactions
export async function getTransactionsRoute(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const txs = await getTransactionHistory(auth.userId, 100);
    return c.json({ transactions: txs });
  } catch {
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
}

// GET /api/blockchain/leaderboard
export async function getLeaderboardRoute(c: Context) {
  try {
    const leaders = await getLeaderboard(25);
    return c.json({ leaderboard: leaders });
  } catch {
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
}

// GET /api/blockchain/story/:storyId/nft
export async function getStoryNFTRoute(c: Context) {
  const storyId = c.req.param('storyId');
  try {
    const db = await getDb();
    const story = db.query(
      `SELECT id, title, mint_address, arweave_uri, mint_tx_signature, minted_at FROM stories WHERE id=?`
    ).get(storyId) as any;
    if (!story) return c.json({ error: 'Story not found' }, 404);
    const contributors = await getStoryContributors(storyId);
    return c.json({
      storyId,
      title: story.title,
      minted: !!story.mint_address,
      mintAddress: story.mint_address ?? null,
      arweaveUri: story.arweave_uri ?? null,
      txSignature: story.mint_tx_signature ?? null,
      mintedAt: story.minted_at ?? null,
      contributors,
    });
  } catch {
    return c.json({ error: 'Failed to fetch NFT info' }, 500);
  }
}

// POST /api/blockchain/mint-nft/:storyId
export async function mintNFTRoute(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const storyId = c.req.param('storyId');
  try {
    const db = await getDb();
    const story = db.query(
      `SELECT id, title, author_id, is_completed, mint_address, cover_url, foreword, genre, bestseller_score
       FROM stories WHERE id=?`
    ).get(storyId) as any;
    if (!story) return c.json({ error: 'Story not found' }, 404);
    if (story.author_id !== auth.userId) return c.json({ error: 'Only the story author can mint' }, 403);
    if (!story.is_completed) return c.json({ error: 'Story must be completed before minting' }, 400);
    if (story.mint_address) return c.json({ error: 'Already minted', mintAddress: story.mint_address }, 409);

    const contributors = await getStoryContributors(storyId);
    const segCount = (db.query('SELECT COUNT(*) as n FROM contributions WHERE story_id=?').get(storyId) as any)?.n ?? 0;

    const result = await mintStoryNFT({
      storyId,
      title: story.title,
      genre: story.genre ?? 'fiction',
      coverUrl: story.cover_url ?? '',
      foreword: story.foreword ?? '',
      contributors: contributors.map(c => ({ userId: c.userId, wallet: c.solanaWallet ?? c.wallet, segments: c.segments })),
      segmentCount: segCount,
      bestsellerScore: story.bestseller_score ?? 0,
    });

    if (!result) {
      return c.json({
        success: false,
        queued: true,
        message: 'NFT queued — configure SOLANA_TREASURY_KEYPAIR to enable minting',
      });
    }

    return c.json({ success: true, ...result });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Mint failed' }, 500);
  }
}

// GET /api/blockchain/earnings/:userId
export async function getEarningsRoute(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const targetId = c.req.param('userId') === 'me' ? auth.userId : c.req.param('userId');
  try {
    const db = await getDb();

    const stats = db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_slashed,
        COUNT(DISTINCT story_id) as stories_contributed,
        COUNT(*) as transaction_count
      FROM token_transactions WHERE user_id=?
    `).get(targetId) as any;

    const breakdown = db.query(`
      SELECT type, description, SUM(amount) as total, COUNT(*) as count
      FROM token_transactions WHERE user_id=?
      GROUP BY type, description
      ORDER BY total DESC
    `).all(targetId) as any[];

    const topStories = db.query(`
      SELECT tt.story_id, s.title, SUM(tt.amount) as earnings
      FROM token_transactions tt
      JOIN stories s ON s.id = tt.story_id
      WHERE tt.user_id=? AND tt.story_id IS NOT NULL
      GROUP BY tt.story_id
      ORDER BY earnings DESC LIMIT 5
    `).all(targetId) as any[];

    const balance = await getTokenBalance(targetId);

    return c.json({
      userId: targetId,
      balance,
      totalEarned: stats?.total_earned ?? 0,
      totalSlashed: stats?.total_slashed ?? 0,
      storiesContributed: stats?.stories_contributed ?? 0,
      transactionCount: stats?.transaction_count ?? 0,
      breakdown,
      topStories,
      rewards: STORY_REWARDS,
    });
  } catch {
    return c.json({ error: 'Failed to fetch earnings' }, 500);
  }
}

// POST /api/blockchain/claim-onchain — convert off-chain balance → Celo on-chain
export async function claimOnchainRoute(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const db = await getDb();
    const user = db.query('SELECT story_token_balance, wallet_address FROM users WHERE id=?').get(auth.userId) as any;
    if (!user?.wallet_address) return c.json({ error: 'Connect a Celo wallet first' }, 400);
    const balance = user.story_token_balance ?? 0;
    if (balance < 100) return c.json({ error: 'Minimum 100 STORY required to claim on-chain' }, 400);
    if (!process.env.STORY_TOKEN_CONTRACT) {
      return c.json({ queued: true, message: 'On-chain minting coming soon — your balance is recorded' });
    }
    const { mintStoryTokensOnChain } = await import('../services/blockchainService.js');
    const txHash = await mintStoryTokensOnChain(user.wallet_address, balance);
    if (!txHash) return c.json({ error: 'On-chain mint failed' }, 500);
    // Atomically zero out off-chain balance and record transaction
    const txId = `tx_${Date.now()}_claim`;
    db.exec('BEGIN');
    try {
      db.run('UPDATE users SET story_token_balance = 0 WHERE id=?', [auth.userId]);
      db.run(
        `INSERT INTO token_transactions (id, user_id, amount, type, description, tx_hash, chain, wallet_address)
         VALUES (?, ?, ?, 'claim', 'Claimed to Celo on-chain', ?, 'celo', ?)`,
        [txId, auth.userId, -balance, txHash, user.wallet_address],
      );
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    return c.json({ success: true, txHash, amount: balance, wallet: user.wallet_address });
  } catch {
    return c.json({ error: 'Claim failed' }, 500);
  }
}
