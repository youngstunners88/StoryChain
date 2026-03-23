import type { Context } from 'hono';
import { Database } from 'bun:sqlite';
import { timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';

let db: Database | null = null;

const ANON_USER = { userId: 'anonymous', email: 'anon@storychain.local' };
const VALID_MODELS = new Set([
  'kimi-k2.5',
  'reka-edge',
  'qwen-2.5',
  'mercury-2',
  'llama-3.1',
  'gemma-2',
  'mixtral-8x7b',
  'gemini-pro',
]);

const PERSONA_OPENINGS: Record<string, string> = {
  spooky: 'Moonlight fell across the empty hall as a soft whisper called my name.',
  whimsical: 'By breakfast, the teapot had grown wings and demanded an adventure.',
  noir: 'Rain painted the neon signs while trouble waited at the end of the alley.',
  scifi: 'The ship woke me before dawn, warning that we were no longer alone.',
  romance: 'I saw them again at the station and forgot where I was supposed to go.',
  adventure: 'The map burned at the edges, but its final mark was still clear enough to follow.',
  comedy: 'Everything was normal until the goat got elected mayor.',
};

async function getDb(): Promise<Database> {
  if (!db) {
    db = new Database(join(process.cwd(), 'data', 'storychain.db'));
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function safeTokenCompare(token: string, expectedToken: string): boolean {
  const aBytes = Buffer.from(token);
  const bBytes = Buffer.from(expectedToken);

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  return timingSafeEqual(aBytes, bBytes);
}

function requireAuth(c: Context): { userId: string; email: string } | Response {
  const auth = c.req.header('authorization');

  if (!auth || auth.trim() === '' || auth.trim() === 'Bearer') {
    return ANON_USER;
  }

  if (!auth.startsWith('Bearer ')) {
    return c.json({ error: "Invalid authorization format. Use 'Bearer <token>'" }, 401);
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return ANON_USER;
  }

  const expectedToken = process.env.ZO_CLIENT_IDENTITY_TOKEN;

  // Guest mode fallback when shared secret is not configured.
  if (!expectedToken) {
    return ANON_USER;
  }

  if (!safeTokenCompare(token, expectedToken)) {
    return ANON_USER;
  }

  return { userId: `user_${token.slice(-16)}`, email: 'user@storychain.local' };
}

function pickInitialContent(content: string | undefined, aiPersona: string | undefined): string {
  const trimmed = content?.trim() ?? '';
  if (trimmed) return trimmed;
  if (!aiPersona) return '';
  return PERSONA_OPENINGS[aiPersona] ?? PERSONA_OPENINGS.spooky;
}

export default async function handler(c: Context) {
  const database = await getDb();

  if (c.req.method === 'GET') {
    try {
      const sort = c.req.query('sort') || 'newest';
      const limit = parsePositiveInt(c.req.query('limit'), 12, 50);

      const orderByMap: Record<string, string> = {
        newest: 's.created_at DESC',
        popular: 'likeCount DESC',
        oldest: 's.created_at ASC',
      };
      const orderBy = orderByMap[sort] ?? orderByMap.newest;

      const stories = database
        .query(`
        SELECT s.*, u.username as authorName,
               (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) as contributionCount,
               (SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) as likeCount
        FROM stories s
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.is_completed = FALSE
        ORDER BY ${orderBy}
        LIMIT ?
      `)
        .all(limit) as any[];

      return c.json({
        stories: stories.map((s) => ({
          id: s.id,
          title: s.title,
          content: s.content,
          authorId: s.author_id,
          authorName: s.authorName,
          modelUsed: s.model_used,
          characterCount: s.character_count,
          contributionCount: s.contributionCount,
          likeCount: s.likeCount,
          createdAt: s.created_at,
        })),
      });
    } catch (error) {
      console.error('[LIST STORIES ERROR]', error);
      return c.json({ error: 'Failed to load stories' }, 500);
    }
  }

  if (c.req.method === 'POST') {
    const auth = requireAuth(c);
    if (auth instanceof Response) {
      return auth;
    }

    const startTime = Date.now();

    try {
      const body = await c.req.json();
      const title = typeof body?.title === 'string' ? body.title.trim() : '';
      const modelUsed = typeof body?.modelUsed === 'string' ? body.modelUsed : 'kimi-k2.5';
      const aiPersona = typeof body?.ai_persona === 'string' ? body.ai_persona : undefined;
      const content = pickInitialContent(typeof body?.content === 'string' ? body.content : undefined, aiPersona);

      if (!title || !content) {
        return c.json({ error: 'Title and content are required' }, 400);
      }

      const characterCount = content.length;
      const tokensSpent = 0;
      const maxCharacters = parsePositiveInt(String(body?.maxCharacters ?? ''), 10000, 50000);

      if (characterCount > maxCharacters) {
        return c.json(
          {
            error: `Content exceeds character limit: ${characterCount} > ${maxCharacters}`,
            code: 'CHARACTER_LIMIT_EXCEEDED',
          },
          400,
        );
      }

      if (!VALID_MODELS.has(modelUsed)) {
        return c.json({ error: `Invalid model. Valid models: ${Array.from(VALID_MODELS).join(', ')}` }, 400);
      }

      let user = database.query('SELECT * FROM users WHERE id = ?').get(auth.userId) as any;

      if (!user) {
        database.run('INSERT INTO users (id, username, email, tokens, preferred_model) VALUES (?, ?, ?, 1000, ?)', [
          auth.userId,
          auth.email.split('@')[0],
          auth.email,
          'kimi-k2.5',
        ]);
        user = { tokens: 1000 };
      }

      if (tokensSpent > user.tokens) {
        return c.json(
          {
            error: `Insufficient tokens. Need ${tokensSpent}, have ${user.tokens}`,
          },
          402,
        );
      }

      const storyId = randomId('story');

      if (tokensSpent > 0) {
        database.run('UPDATE users SET tokens = tokens - ? WHERE id = ?', [tokensSpent, auth.userId]);
        const txId = randomId('tx');
        database.run(
          'INSERT INTO token_transactions (id, user_id, amount, type, description, story_id) VALUES (?, ?, ?, ?, ?, ?)',
          [txId, auth.userId, -tokensSpent, 'spend', 'Character extension for story', storyId],
        );
      }

      database.run(
        `INSERT INTO stories (id, title, content, author_id, model_used, character_count, tokens_spent, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [storyId, title, content, auth.userId, modelUsed, characterCount, tokensSpent],
      );

      const usageId = randomId('usage');
      database.run(
        'INSERT INTO api_usage (id, user_id, model, endpoint, tokens_input, tokens_output, latency_ms, success) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [usageId, auth.userId, modelUsed, '/api/stories', characterCount, 0, Date.now() - startTime, true],
      );

      const story = database.query('SELECT * FROM stories WHERE id = ?').get(storyId) as any;

      return c.json(
        {
          story: {
            id: story.id,
            title: story.title,
            content: story.content,
            authorId: story.author_id,
            modelUsed: story.model_used,
            characterCount: story.character_count,
            tokensSpent: story.tokens_spent,
            createdAt: story.created_at,
          },
        },
        201,
      );
    } catch (error) {
      console.error('[CREATE STORY ERROR]', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  return c.json({ error: 'Method not allowed' }, 405);
}
