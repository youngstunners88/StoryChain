import type { Context } from 'hono';
import { getDb } from '../database/connection.js';
import { resolveActorIdentity } from '../core/auth/actor.js';
import { config } from '../config/index.js';

interface CustomAgent {
  id: string;
  name: string;
  style: string;
  model: string;
  owner_id: string;
  is_active: number;
  created_at: string;
}

const STYLE_TEMPLATES: Record<string, string[]> = {
  dramatic: [
    'A silence fell across the room as the truth surfaced at last.',
    'What came next changed every promise they had made.',
    'The shadows moved first, and everyone felt it.',
  ],
  poetic: [
    'Moonlight folded itself into the edges of the sentence.',
    'Every step sounded like a memory returning home.',
    'The wind carried names no one dared to repeat.',
  ],
  concise: [
    'Everything changed in one line.',
    'No one expected that ending.',
    'The next move decided it all.',
  ],
  'plot-driven': [
    'The plan advanced exactly as written, until it didn\'t.',
    'A missing clue forced the team to improvise.',
    'With each decision, the stakes doubled.',
  ],
};

async function ensureCustomAgentsTable() {
  const db = await getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS custom_agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      style TEXT NOT NULL,
      model TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function actorFromRequest(c: Context) {
  return resolveActorIdentity({
    authorizationHeader: c.req.header('authorization'),
    sessionIdHeader: c.req.header('x-session-id'),
    expectedToken: config.authMode === 'token' ? config.zoClientIdentityToken : '',
  });
}

function makeContinuation(style: string, prompt?: string) {
  const pool = STYLE_TEMPLATES[style] || STYLE_TEMPLATES.dramatic;
  const seed = pool[Math.floor(Math.random() * pool.length)];
  if (!prompt?.trim()) return seed;
  return `${seed} ${prompt.trim()}`;
}

export async function listCustomAgents(c: Context) {
  await ensureCustomAgentsTable();
  const db = await getDb();

  const agents = db
    .query('SELECT * FROM custom_agents WHERE is_active = 1 ORDER BY created_at DESC')
    .all() as CustomAgent[];

  return c.json({
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      style: a.style,
      model: a.model,
      ownerId: a.owner_id,
      createdAt: a.created_at,
    })),
  });
}

export async function createCustomAgent(c: Context) {
  await ensureCustomAgentsTable();
  const db = await getDb();
  const actor = actorFromRequest(c);

  const body = await c.req.json().catch(() => ({}));
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const style = typeof body?.style === 'string' ? body.style.trim() : 'dramatic';
  const model = typeof body?.model === 'string' ? body.model.trim() : 'kimi-k2.5';

  if (!name) {
    return c.json({ error: 'Agent name is required' }, 400);
  }

  const agentId = `agent_custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.run(
    'INSERT INTO custom_agents (id, name, style, model, owner_id, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)',
    [agentId, name, style, model, actor.userId],
  );

  db.run(
    'INSERT OR IGNORE INTO users (id, username, email, preferred_model) VALUES (?, ?, ?, ?)',
    [agentId, name, `${agentId}@storychain.local`, model],
  );

  return c.json(
    {
      agent: {
        id: agentId,
        name,
        style,
        model,
        ownerId: actor.userId,
      },
    },
    201,
  );
}

export async function removeCustomAgent(c: Context) {
  await ensureCustomAgentsTable();
  const db = await getDb();
  const actor = actorFromRequest(c);
  const agentId = c.req.param('id');

  if (!agentId) return c.json({ error: 'Agent id required' }, 400);

  const agent = db.query('SELECT * FROM custom_agents WHERE id = ?').get(agentId) as CustomAgent | null;
  if (!agent || agent.is_active !== 1) return c.json({ error: 'Agent not found' }, 404);

  if (agent.owner_id !== actor.userId) {
    return c.json({ error: 'Only the owner can remove this agent' }, 403);
  }

  db.run('UPDATE custom_agents SET is_active = 0 WHERE id = ?', [agentId]);
  return c.json({ success: true, removedId: agentId });
}

export async function extendStoryWithAgent(c: Context) {
  await ensureCustomAgentsTable();
  const db = await getDb();
  const actor = actorFromRequest(c);

  const agentId = c.req.param('id');
  const storyId = c.req.param('storyId');

  if (!agentId || !storyId) return c.json({ error: 'Agent id and story id are required' }, 400);

  const agent = db.query('SELECT * FROM custom_agents WHERE id = ?').get(agentId) as CustomAgent | null;
  if (!agent || agent.is_active !== 1) return c.json({ error: 'Agent not found' }, 404);

  if (agent.owner_id !== actor.userId) {
    return c.json({ error: 'Only the owner can use this custom agent' }, 403);
  }

  const story = db.query('SELECT * FROM stories WHERE id = ?').get(storyId) as { id: string } | null;
  if (!story) return c.json({ error: 'Story not found' }, 404);

  const body = await c.req.json().catch(() => ({}));
  const prompt = typeof body?.prompt === 'string' ? body.prompt : undefined;
  const content = makeContinuation(agent.style, prompt);

  const contributionId = `contrib_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  db.run(
    `INSERT INTO contributions (id, story_id, author_id, content, model_used, character_count, tokens_spent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
    [contributionId, storyId, agent.id, content, agent.model, content.length],
  );

  return c.json(
    {
      contribution: {
        id: contributionId,
        storyId,
        authorId: agent.id,
        authorName: agent.name,
        content,
        modelUsed: agent.model,
      },
    },
    201,
  );
}
