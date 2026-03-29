// Auth routes — POST /auth/register, /auth/login, /auth/refresh, /auth/logout
import type { Context } from 'hono';
import { getDb } from '../database/connection.js';
import { issueTokens, verifyJwt } from '../services/tokenService.js';
import { config } from '../config/index.js';

function userId(): string {
  return 'user_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function sanitizePenName(raw: string): string {
  return raw.trim().replace(/[^a-zA-Z0-9 _'\-.]/g, '').slice(0, 32);
}

// POST /auth/register
export async function register(c: Context) {
  try {
    const { penName, password } = await c.req.json<{ penName: string; password: string }>();

    if (!penName || penName.trim().length < 2) {
      return c.json({ error: 'Pen name must be at least 2 characters' }, 400);
    }
    if (!password || password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    const name = sanitizePenName(penName);
    const db = await getDb();

    // Check pen name not taken
    const existing = db.query('SELECT id FROM users WHERE username = ?').get(name) as { id: string } | null;
    if (existing) {
      return c.json({ error: 'Pen name already taken — choose another' }, 409);
    }

    const hash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
    const id = userId();
    const email = `${id}@storychain.local`;

    db.run(
      `INSERT INTO users (id, username, email, password_hash, role, preferred_model) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, email, hash, 'writer', config.defaultModel],
    );

    // Auto-create writer profile
    db.run(
      `INSERT OR IGNORE INTO writer_profiles (user_id, display_name, avatar_color, avatar_emoji) VALUES (?, ?, ?, ?)`,
      [id, name, '#38bdf8', '✍'],
    );

    const tokens = await issueTokens(id, 'writer');
    storeRefreshToken(db, id, tokens.refreshToken);

    return c.json({
      user: { id, penName: name, role: 'writer' },
      ...tokens,
    }, 201);
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return c.json({ error: 'Registration failed' }, 500);
  }
}

// POST /auth/login
export async function login(c: Context) {
  try {
    const { penName, password } = await c.req.json<{ penName: string; password: string }>();

    if (!penName || !password) {
      return c.json({ error: 'Pen name and password required' }, 400);
    }

    const db = await getDb();
    const user = db.query(
      `SELECT id, username, password_hash, role FROM users WHERE username = ? AND password_hash IS NOT NULL`
    ).get(sanitizePenName(penName)) as { id: string; username: string; password_hash: string; role: string } | null;

    if (!user) {
      return c.json({ error: 'Invalid pen name or password' }, 401);
    }

    const valid = await Bun.password.verify(password, user.password_hash);
    if (!valid) {
      return c.json({ error: 'Invalid pen name or password' }, 401);
    }

    const tokens = await issueTokens(user.id, user.role ?? 'writer');
    storeRefreshToken(db, user.id, tokens.refreshToken);

    return c.json({
      user: { id: user.id, penName: user.username, role: user.role ?? 'writer' },
      ...tokens,
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return c.json({ error: 'Login failed' }, 500);
  }
}

// POST /auth/refresh
export async function refreshToken(c: Context) {
  try {
    const { refreshToken: rt } = await c.req.json<{ refreshToken: string }>();
    if (!rt) return c.json({ error: 'Refresh token required' }, 400);

    const payload = await verifyJwt(rt);
    if (!payload) return c.json({ error: 'Invalid or expired refresh token' }, 401);

    const db = await getDb();
    const stored = db.query(
      `SELECT id FROM refresh_tokens WHERE user_id = ? AND revoked = 0 ORDER BY created_at DESC LIMIT 1`
    ).get(payload.userId) as { id: string } | null;

    if (!stored) return c.json({ error: 'Refresh token revoked' }, 401);

    const tokens = await issueTokens(payload.userId, payload.role);
    storeRefreshToken(db, payload.userId, tokens.refreshToken);

    return c.json(tokens);
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    return c.json({ error: 'Token refresh failed' }, 500);
  }
}

// GET /auth/me — return current user from access token
export async function getMe(c: Context) {
  try {
    const authHeader = c.req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

    const payload = await verifyJwt(authHeader.slice(7));
    if (!payload) return c.json({ error: 'Invalid token' }, 401);

    const db = await getDb();
    const user = db.query(
      `SELECT id, username, role FROM users WHERE id = ?`
    ).get(payload.userId) as { id: string; username: string; role: string } | null;

    if (!user) return c.json({ error: 'User not found' }, 404);

    return c.json({ id: user.id, penName: user.username, role: user.role });
  } catch (err) {
    console.error('[Auth] Me error:', err);
    return c.json({ error: 'Failed to get user' }, 500);
  }
}

// POST /auth/logout
export async function logout(c: Context) {
  try {
    const authHeader = c.req.header('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const payload = await verifyJwt(authHeader.slice(7));
      if (payload) {
        const db = await getDb();
        db.run(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`, [payload.userId]);
      }
    }
    return c.json({ ok: true });
  } catch {
    return c.json({ ok: true });
  }
}

function storeRefreshToken(db: ReturnType<typeof getDb> extends Promise<infer T> ? T : never, userId: string, token: string): void {
  const id = `rt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  db.run(
    `INSERT INTO refresh_tokens (id, user_id, token_preview, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [id, userId, token.slice(-8)],
  );
  // Keep only the 5 most recent refresh tokens per user
  db.run(
    `DELETE FROM refresh_tokens WHERE user_id = ? AND id NOT IN (SELECT id FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 5)`,
    [userId, userId],
  );
}
