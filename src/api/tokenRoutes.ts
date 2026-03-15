// Token Management API Routes for StoryChain
// Purchases, free tokens, and transaction history

import type { Context } from 'hono';
import { timingSafeEqual } from 'node:crypto';

// Database connection
let db: any = null;

async function getDb() {
  if (!db) {
    const { Database } = await import('bun:sqlite');
    db = new Database('/home/workspace/StoryChain/data/storychain.db');
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

// Auth middleware
async function requireAuth(c: Context): Promise<{ userId: string; email: string } | Response> {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = auth.slice(7);
  const expectedToken = process.env.ZO_CLIENT_IDENTITY_TOKEN;

  if (!expectedToken) {
    return c.json({ error: 'Server configuration error' }, 500);
  }

  const aBytes = Buffer.from(token);
  const bBytes = Buffer.from(expectedToken);
  if (aBytes.length !== bBytes.length) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!timingSafeEqual(aBytes, bBytes)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return { userId: 'user_' + token.slice(-16), email: 'user@storychain.local' };
}

// POST /api/tokens/purchase - Purchase tokens
export async function purchaseTokens(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const { packageId, tokens } = await c.req.json();

    if (!packageId || !tokens || tokens <= 0) {
      return c.json({ error: 'Invalid purchase data' }, 400);
    }

    const database = await getDb();

    // In production, this would verify Stripe payment
    // For now, simulate a successful purchase

    // Add tokens to user
    database.run('UPDATE users SET tokens = tokens + ? WHERE id = ?', [tokens, auth.userId]);

    // Log transaction
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.run(
      'INSERT INTO token_transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)',
      [txId, auth.userId, tokens, 'purchase', `Purchased ${tokens} tokens (${packageId} package)`]
    );

    // Get new balance
    const user = database.query('SELECT tokens FROM users WHERE id = ?').get(auth.userId);

    return c.json({
      success: true,
      newBalance: user.tokens,
      tokensPurchased: tokens,
    });
  } catch (error) {
    console.error('Error purchasing tokens:', error);
    return c.json({ error: 'Failed to purchase tokens' }, 500);
  }
}

// POST /api/tokens/free - Claim free daily tokens
export async function claimFreeTokens(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const database = await getDb();

    // Check if user claimed free tokens in last 24 hours
    const lastClaim = database.query(`
      SELECT created_at FROM token_transactions 
      WHERE user_id = ? AND type = 'bonus' AND description LIKE 'Daily free%'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(auth.userId);

    if (lastClaim) {
      const lastClaimDate = new Date(lastClaim.created_at);
      const now = new Date();
      const hoursSinceLastClaim = (now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastClaim < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastClaim);
        return c.json({
          error: 'Free tokens already claimed',
          hoursRemaining,
          nextClaimAt: new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        }, 429);
      }
    }

    // Grant free tokens (50 tokens)
    const freeTokens = 50;
    database.run('UPDATE users SET tokens = tokens + ? WHERE id = ?', [freeTokens, auth.userId]);

    // Log transaction
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.run(
      'INSERT INTO token_transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)',
      [txId, auth.userId, freeTokens, 'bonus', 'Daily free tokens claim']
    );

    // Get new balance
    const user = database.query('SELECT tokens FROM users WHERE id = ?').get(auth.userId);

    return c.json({
      success: true,
      tokensGranted: freeTokens,
      newBalance: user.tokens,
      nextClaimAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error claiming free tokens:', error);
    return c.json({ error: 'Failed to claim free tokens' }, 500);
  }
}

// GET /api/user/transactions - Get user's transaction history
export async function getTransactions(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const { limit = '50', offset = '0' } = c.req.query();
    const database = await getDb();

    const transactions = database.query(`
      SELECT * FROM token_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(auth.userId, parseInt(limit), parseInt(offset));

    return c.json({
      transactions: transactions.map((t: any) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        storyId: t.story_id,
        createdAt: t.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
}

// GET /api/tokens/packages - Get available token packages
export async function getTokenPackages(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  const packages = [
    { id: 'starter', tokens: 100, price: 4.99, bonus: 0 },
    { id: 'popular', tokens: 500, price: 19.99, bonus: 50, popular: true },
    { id: 'pro', tokens: 1000, price: 34.99, bonus: 150 },
    { id: 'unlimited', tokens: 5000, price: 149.99, bonus: 1000 },
  ];

  return c.json({ packages });
}