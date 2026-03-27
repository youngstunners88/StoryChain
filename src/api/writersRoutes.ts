// Writers Directory API Routes
import type { Context } from 'hono';
import { getDb } from '../database/connection.js';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { generateRequestId } from '../utils/errorHandler.js';

// ─── Genre colour map ─────────────────────────────────────────────────────────

export const GENRE_COLORS: Record<string, { primary: string; bg: string; border: string }> = {
  mystery:   { primary: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.22)' },
  noir:      { primary: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.22)' },
  scifi:     { primary: '#2dd4bf', bg: 'rgba(45,212,191,0.1)',  border: 'rgba(45,212,191,0.22)'  },
  romance:   { primary: '#fb7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.22)' },
  adventure: { primary: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.22)'  },
  comedy:    { primary: '#a3e635', bg: 'rgba(163,230,53,0.1)',  border: 'rgba(163,230,53,0.22)'  },
  horror:    { primary: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.22)' },
  default:   { primary: '#c9a84c', bg: 'rgba(201,168,76,0.1)',  border: 'rgba(201,168,76,0.22)'  },
  human:     { primary: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.22)'  },
};

function genreColor(genre?: string) {
  return GENRE_COLORS[genre?.toLowerCase() ?? ''] ?? GENRE_COLORS.default;
}

// ─── Load agent profiles from YAML ───────────────────────────────────────────

async function loadAgentProfiles(): Promise<any[]> {
  const agentsDir = join(process.cwd(), 'orchestrator', 'memory', 'agents');
  let files: string[] = [];
  try { files = await readdir(agentsDir); } catch { return []; }

  const agents = [];
  for (const file of files.filter(f => f.endsWith('.yaml'))) {
    try {
      const raw = await readFile(join(agentsDir, file), 'utf-8');
      const data = parseYaml(raw) as any;
      if (data?.id && data?.status === 'active') agents.push(data);
    } catch {}
  }
  return agents;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireAuth(c: Context): { userId: string } | null {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  if (!token || token.length < 20) return null;
  return { userId: 'user_' + token.slice(-16) };
}

async function ensureAgentProfilesInDb(database: any, agents: any[]): Promise<void> {
  for (const agent of agents) {
    const userId = agent.id;

    // Ensure user row exists
    const userExists = database.query('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userExists) {
      database.run(
        'INSERT OR IGNORE INTO users (id, username, email, preferred_model) VALUES (?, ?, ?, ?)',
        [userId, agent.name, `${userId}@storychain.local`, 'nemotron-super']
      );
    }

    // Upsert writer_profile from YAML identity block
    const id = agent.identity;
    if (!id) continue;

    const existing = database.query('SELECT user_id FROM writer_profiles WHERE user_id = ?').get(userId);
    const favLit = JSON.stringify(id.favorite_literature ?? []);
    const socialLinks = JSON.stringify(id.social_links ?? {});
    const genre = agent.persona?.style ?? 'default';

    if (existing) {
      database.run(
        `UPDATE writer_profiles SET
          display_name=?, age=?, country=?, about=?, favorite_literature=?,
          social_links=?, genre=?, genre_label=?, avatar_color=?, avatar_emoji=?,
          is_agent=1, updated_at=CURRENT_TIMESTAMP
         WHERE user_id=?`,
        [agent.name, id.age ?? null, id.country_of_origin ?? null, id.about ?? null,
         favLit, socialLinks, genre, id.genre_label ?? genre, id.avatar_color ?? '#c9a84c',
         id.avatar_emoji ?? '🤖', userId]
      );
    } else {
      database.run(
        `INSERT INTO writer_profiles
          (user_id, display_name, age, country, about, favorite_literature,
           social_links, genre, genre_label, avatar_color, avatar_emoji, is_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [userId, agent.name, id.age ?? null, id.country_of_origin ?? null, id.about ?? null,
         favLit, socialLinks, genre, id.genre_label ?? genre,
         id.avatar_color ?? '#c9a84c', id.avatar_emoji ?? '🤖']
      );
    }
  }
}

// ─── GET /api/writers ─────────────────────────────────────────────────────────

export async function getWriters(c: Context) {
  try {
    const database = await getDb();
    const agents = await loadAgentProfiles();
    await ensureAgentProfilesInDb(database, agents);

    // Pull all writer profiles joined with user stats
    const writers = database.query(`
      SELECT
        wp.*,
        u.username,
        u.created_at as joined_at,
        (SELECT COUNT(*) FROM stories s WHERE s.author_id = wp.user_id) as story_count,
        (SELECT COUNT(*) FROM contributions c WHERE c.author_id = wp.user_id) as contribution_count,
        (SELECT COUNT(*) FROM likes l JOIN stories s ON l.story_id = s.id WHERE s.author_id = wp.user_id) as total_likes
      FROM writer_profiles wp
      JOIN users u ON wp.user_id = u.id
      ORDER BY wp.is_agent DESC, total_likes DESC, story_count DESC
    `).all();

    const requestId = generateRequestId();
    return c.json({
      writers: writers.map((w: any) => ({
        id: w.user_id,
        name: w.display_name || w.username,
        age: w.age,
        country: w.country,
        about: w.about,
        favoriteLiterature: tryParseJson(w.favorite_literature, []),
        socialLinks: tryParseJson(w.social_links, {}),
        genre: w.genre,
        genreLabel: w.genre_label,
        avatarUrl: w.avatar_url,
        avatarColor: w.avatar_color || '#c9a84c',
        avatarEmoji: w.avatar_emoji || '✍',
        isAgent: w.is_agent === 1,
        storyCount: w.story_count,
        contributionCount: w.contribution_count,
        totalLikes: w.total_likes,
        joinedAt: w.joined_at,
        colors: genreColor(w.genre),
      })),
      requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching writers:', error);
    return c.json({ error: 'Failed to fetch writers' }, 500);
  }
}

// ─── GET /api/writers/:id ─────────────────────────────────────────────────────

export async function getWriter(c: Context) {
  const writerId = c.req.param('id');
  if (!writerId) return c.json({ error: 'Writer ID required' }, 400);

  try {
    const database = await getDb();

    // Sync agent profiles first if this is an agent
    if (writerId.startsWith('agent_')) {
      const agents = await loadAgentProfiles();
      await ensureAgentProfilesInDb(database, agents);
    }

    const w = database.query(`
      SELECT wp.*, u.username, u.created_at as joined_at
      FROM writer_profiles wp
      JOIN users u ON wp.user_id = u.id
      WHERE wp.user_id = ?
    `).get(writerId) as any;

    if (!w) return c.json({ error: 'Writer not found' }, 404);

    // Get their stories
    const stories = database.query(`
      SELECT s.id, s.title, s.content, s.created_at,
        (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) as contribution_count,
        (SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) as like_count
      FROM stories s
      WHERE s.author_id = ?
      ORDER BY s.created_at DESC
      LIMIT 12
    `).all(writerId);

    const stats = {
      storyCount: (database.query('SELECT COUNT(*) as n FROM stories WHERE author_id=?').get(writerId) as any)?.n ?? 0,
      contributionCount: (database.query('SELECT COUNT(*) as n FROM contributions WHERE author_id=?').get(writerId) as any)?.n ?? 0,
      totalLikes: (database.query(`SELECT COUNT(*) as n FROM likes l JOIN stories s ON l.story_id=s.id WHERE s.author_id=?`).get(writerId) as any)?.n ?? 0,
    };

    return c.json({
      writer: {
        id: w.user_id,
        name: w.display_name || w.username,
        age: w.age,
        country: w.country,
        about: w.about,
        favoriteLiterature: tryParseJson(w.favorite_literature, []),
        socialLinks: tryParseJson(w.social_links, {}),
        genre: w.genre,
        genreLabel: w.genre_label,
        avatarUrl: w.avatar_url,
        avatarColor: w.avatar_color || '#c9a84c',
        avatarEmoji: w.avatar_emoji || '✍',
        isAgent: w.is_agent === 1,
        joinedAt: w.joined_at,
        colors: genreColor(w.genre),
        stats,
        stories: stories.map((s: any) => ({
          id: s.id,
          title: s.title,
          excerpt: s.content?.slice(0, 120) + '…',
          contributionCount: s.contribution_count,
          likeCount: s.like_count,
          createdAt: s.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching writer:', error);
    return c.json({ error: 'Failed to fetch writer' }, 500);
  }
}

// ─── PUT /api/writers/me ──────────────────────────────────────────────────────

export async function updateWriterProfile(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json();
    const { displayName, age, country, about, favoriteLiterature, socialLinks, genreLabel, genre, avatarUrl } = body;

    const database = await getDb();

    // Ensure user exists
    const userExists = database.query('SELECT id FROM users WHERE id = ?').get(auth.userId);
    if (!userExists) return c.json({ error: 'User not found' }, 404);

    const existing = database.query('SELECT user_id FROM writer_profiles WHERE user_id=?').get(auth.userId);

    if (existing) {
      database.run(
        `UPDATE writer_profiles SET
          display_name=COALESCE(?,display_name), age=COALESCE(?,age), country=COALESCE(?,country),
          about=COALESCE(?,about), favorite_literature=COALESCE(?,favorite_literature),
          social_links=COALESCE(?,social_links), genre_label=COALESCE(?,genre_label),
          genre=COALESCE(?,genre), avatar_url=COALESCE(?,avatar_url),
          updated_at=CURRENT_TIMESTAMP
         WHERE user_id=?`,
        [displayName ?? null, age ?? null, country ?? null, about ?? null,
         favoriteLiterature ? JSON.stringify(favoriteLiterature) : null,
         socialLinks ? JSON.stringify(socialLinks) : null,
         genreLabel ?? null, genre ?? null, avatarUrl ?? null, auth.userId]
      );
    } else {
      database.run(
        `INSERT INTO writer_profiles
          (user_id, display_name, age, country, about, favorite_literature, social_links,
           genre_label, genre, avatar_url, avatar_color, avatar_emoji, is_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '#38bdf8', '✍', 0)`,
        [auth.userId, displayName ?? null, age ?? null, country ?? null, about ?? null,
         JSON.stringify(favoriteLiterature ?? []), JSON.stringify(socialLinks ?? {}),
         genreLabel ?? null, genre ?? null, avatarUrl ?? null]
      );
    }

    return c.json({ success: true, requestId: generateRequestId() });
  } catch (error) {
    console.error('Error updating writer profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
}

// ─── POST /api/writers/me/avatar ──────────────────────────────────────────────

export async function uploadAvatar(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const formData = await c.req.formData();
    const file = formData.get('avatar') as File | null;
    if (!file) return c.json({ error: 'No file provided' }, 400);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Only JPEG, PNG, GIF, or WebP images are allowed' }, 400);
    }
    if (file.size > 2 * 1024 * 1024) {
      return c.json({ error: 'Image must be under 2MB' }, 400);
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const filename = `${auth.userId}_${Date.now()}.${ext}`;
    const avatarsDir = join(process.cwd(), 'data', 'avatars');
    const filePath = join(avatarsDir, filename);

    const buffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));

    const avatarUrl = `/avatars/${filename}`;
    const database = await getDb();

    const existing = database.query('SELECT user_id FROM writer_profiles WHERE user_id=?').get(auth.userId);
    if (existing) {
      database.run('UPDATE writer_profiles SET avatar_url=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?',
        [avatarUrl, auth.userId]);
    } else {
      database.run(
        `INSERT INTO writer_profiles (user_id, avatar_url, avatar_color, avatar_emoji, is_agent)
         VALUES (?, ?, '#38bdf8', '✍', 0)`,
        [auth.userId, avatarUrl]
      );
    }

    return c.json({ avatarUrl, requestId: generateRequestId() });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return c.json({ error: 'Failed to upload avatar' }, 500);
  }
}

// ─── GET /api/writers/me/profile — ensure human profile exists ────────────────

export async function ensureMyProfile(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const database = await getDb();

    // Ensure user row exists
    const user = database.query('SELECT id, username FROM users WHERE id = ?').get(auth.userId) as any;
    if (!user) return c.json({ error: 'User not found — write a story first' }, 404);

    // Auto-create writer profile if missing
    const existing = database.query('SELECT user_id FROM writer_profiles WHERE user_id=?').get(auth.userId);
    if (!existing) {
      database.run(
        `INSERT INTO writer_profiles
          (user_id, display_name, avatar_color, avatar_emoji, is_agent,
           favorite_literature, social_links)
         VALUES (?, ?, '#38bdf8', '✍', 0, '[]', '{}')`,
        [auth.userId, user.username]
      );
    }

    return c.json({ success: true, writerId: auth.userId });
  } catch (error) {
    return c.json({ error: 'Failed to ensure profile' }, 500);
  }
}

// ─── Foreign agents ───────────────────────────────────────────────────────────

export async function getForeignAgents(c: Context) {
  try {
    const database = await getDb();
    const agents = database.query(`
      SELECT fa.*, u.username as owner_name
      FROM foreign_agents fa
      JOIN users u ON fa.owner_id = u.id
      WHERE fa.is_approved = 1
      ORDER BY fa.created_at DESC
    `).all() as any[];

    return c.json({
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        ownerName: a.owner_name,
        about: a.about,
        genre: a.genre,
        genreLabel: a.genre_label,
        avatarUrl: a.avatar_url,
        avatarColor: a.avatar_color,
        avatarEmoji: a.avatar_emoji,
        hasEndpoint: !!a.endpoint_url,
        createdAt: a.created_at,
        colors: genreColor(a.genre),
      })),
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch foreign agents' }, 500);
  }
}

export async function registerForeignAgent(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json();
    const { name, about, genre, genreLabel, endpointUrl, avatarColor, avatarEmoji, avatarUrl } = body;

    if (!name?.trim()) return c.json({ error: 'Agent name is required' }, 400);

    const database = await getDb();

    // Ensure owner user exists
    const user = database.query('SELECT id, username FROM users WHERE id = ?').get(auth.userId) as any;
    if (!user) {
      database.run(
        'INSERT INTO users (id, username, email, preferred_model) VALUES (?, ?, ?, ?)',
        [auth.userId, `user_${auth.userId.slice(-8)}`, `${auth.userId}@storychain.local`, 'nemotron-super']
      );
    }

    const agentId = `fa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const resolvedColor = avatarColor ?? '#c9a84c';
    const resolvedEmoji = avatarEmoji ?? '🤖';
    const resolvedGenre = genre ?? 'default';
    const resolvedLabel = genreLabel ?? genre ?? 'Writer';
    database.run(
      `INSERT INTO foreign_agents
        (id, name, owner_id, endpoint_url, about, genre, genre_label, avatar_url, avatar_color, avatar_emoji)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [agentId, name.trim(), auth.userId, endpointUrl ?? null, about ?? null,
       resolvedGenre, resolvedLabel, avatarUrl ?? null, resolvedColor, resolvedEmoji]
    );

    return c.json({
      success: true,
      agent: {
        id: agentId, name: name.trim(),
        ownerId: auth.userId, ownerName: user?.username ?? null,
        endpointUrl: endpointUrl ?? null, about: about ?? null,
        genre: resolvedGenre, genreLabel: resolvedLabel,
        avatarUrl: avatarUrl ?? null, avatarColor: resolvedColor, avatarEmoji: resolvedEmoji,
        isApproved: true, createdAt: new Date().toISOString(),
      },
      requestId: generateRequestId(),
    }, 201);
  } catch (error) {
    console.error('Error registering foreign agent:', error);
    return c.json({ error: 'Failed to register agent' }, 500);
  }
}

export async function uploadForeignAgentAvatar(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  const agentId = c.req.param('id');

  try {
    const database = await getDb();
    const agent = database.query('SELECT owner_id FROM foreign_agents WHERE id = ?').get(agentId) as any;
    if (!agent) return c.json({ error: 'Agent not found' }, 404);
    if (agent.owner_id !== auth.userId) return c.json({ error: 'Not your agent' }, 403);

    const formData = await c.req.formData();
    const file = formData.get('avatar') as File | null;
    if (!file) return c.json({ error: 'No file provided' }, 400);
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(file.type))
      return c.json({ error: 'Only JPEG, PNG, GIF or WebP allowed' }, 400);
    if (file.size > 2 * 1024 * 1024) return c.json({ error: 'Max 2MB' }, 400);

    const ext = file.type.split('/')[1].replace('jpeg','jpg');
    const filename = `${agentId}_${Date.now()}.${ext}`;
    const filePath = join(process.cwd(), 'data', 'avatars', filename);
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    const avatarUrl = `/avatars/${filename}`;

    database.run('UPDATE foreign_agents SET avatar_url=? WHERE id=?', [avatarUrl, agentId]);
    return c.json({ avatarUrl });
  } catch (error) {
    return c.json({ error: 'Failed to upload avatar' }, 500);
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function tryParseJson(val: any, fallback: any) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}
