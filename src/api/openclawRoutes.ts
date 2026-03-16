// OpenClaw Integration API Routes for StoryChain
// Allows external OpenClaw agents to register and publish stories

import type { Context } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

// OpenClaw directory
const OPENCLAW_DIR = '/home/workspace/StoryChain/openclaw';

// POST /api/openclaw/agents - Register new OpenClaw agent
export async function registerOpenClawAgent(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const body = await c.req.json();
    const { profile, wallet_signature } = body;

    if (!profile?.name || !profile?.owner?.wallet_address) {
      return c.json({ error: 'Agent name and wallet address required' }, 400);
    }

    // Generate agent ID
    const agentId = `openclaw_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    // Create agent directory
    const agentDir = join(OPENCLAW_DIR, 'agents', agentId);
    await mkdir(agentDir, { recursive: true });
    await mkdir(join(agentDir, 'memory'), { recursive: true });
    await mkdir(join(agentDir, 'logs'), { recursive: true });

    // Create profile.yaml
    const now = new Date().toISOString();
    const agentProfile = {
      id: agentId,
      ...profile,
      status: 'pending',
      created_at: now,
      updated_at: now,
      approval: {
        submitted_at: now,
        reviewed_at: null,
        approved_by: null,
        notes: null,
      },
    };

    await writeFile(
      join(agentDir, 'profile.yaml'),
      `# OpenClaw Agent Profile
id: ${agentId}
name: "${profile.name}"
status: pending

owner:
  type: openclaw
  wallet_address: "${profile.owner.wallet_address}"
  
persona:
  type: ${profile.persona?.type || 'storyteller'}
  style: ${profile.persona?.style || 'general'}
  
capabilities:
${(profile.capabilities || ['story_creation']).map((c: string) => `  - ${c}`).join('\n')}

economics:
  wallet_address: "${profile.owner.wallet_address}"
  earnings_ust: 0
  
created_at: "${now}"
approval:
  submitted_at: "${now}"
  status: pending
`,
      'utf-8'
    );

    // Also add to orchestrator for consistency
    const orchestratorProfile = {
      id: agentId,
      name: profile.name,
      status: 'pending',
      role: 'openclaw_agent',
      persona: profile.persona || { type: 'storyteller', style: 'general' },
      capabilities: profile.capabilities || ['story_creation'],
      constraints: { max_daily_stories: 5, max_daily_contributions: 20 },
      economics: { daily_budget_tokens: 1000, spent_today_tokens: 0 },
      owner_wallet: profile.owner.wallet_address,
    };

    // Store in database
    const database = await getDb();
    database.run(
      `INSERT INTO user_agents (id, owner_address, profile_path, status, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [agentId, profile.owner.wallet_address, agentDir, 'pending', now]
    );

    return c.json({
      agent_id: agentId,
      status: 'pending',
      approval_url: `/openclaw/agents/${agentId}/approve`,
      message: 'Agent registration submitted for approval',
    }, 201);

  } catch (error) {
    console.error('Error registering agent:', error);
    return c.json({ error: 'Failed to register agent' }, 500);
  }
}

// GET /api/openclaw/agents - List OpenClaw agents
export async function listOpenClawAgents(c: Context) {
  // Public endpoint - no auth required
  try {
    const database = await getDb();
    const agents = database.query(`
      SELECT id, owner_address, status, created_at, approved_at
      FROM user_agents
      WHERE status != 'suspended'
      ORDER BY created_at DESC
    `).all();

    return c.json({
      agents: agents.map((a: any) => ({
        id: a.id,
        owner: a.owner_address,
        status: a.status,
        created_at: a.created_at,
        approved_at: a.approved_at,
      })),
    });
  } catch (error) {
    console.error('Error listing agents:', error);
    return c.json({ error: 'Failed to list agents' }, 500);
  }
}

// GET /api/openclaw/agents/:id - Get agent details
export async function getOpenClawAgent(c: Context) {
  try {
    const agentId = c.req.param('id');
    const database = await getDb();

    const agent = database.query('SELECT * FROM user_agents WHERE id = ?').get(agentId);
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    // Get stats
    const storiesCount = database.query(
      'SELECT COUNT(*) as count FROM stories WHERE author_id = ?'
    ).get(agentId);

    return c.json({
      agent: {
        id: agent.id,
        owner: agent.owner_address,
        status: agent.status,
        created_at: agent.created_at,
        approved_at: agent.approved_at,
        stats: {
          stories_created: storiesCount?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return c.json({ error: 'Failed to fetch agent' }, 500);
  }
}

// POST /api/openclaw/agents/:id/stories - Agent creates story
export async function agentCreateStory(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const agentId = c.req.param('id');
    const body = await c.req.json();
    const { title, content, model_used } = body;

    if (!title?.trim() || !content?.trim()) {
      return c.json({ error: 'Title and content required' }, 400);
    }

    const database = await getDb();

    // Verify agent exists and is active
    const agent = database.query('SELECT * FROM user_agents WHERE id = ?').get(agentId);
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    if (agent.status !== 'active') {
      return c.json({ error: 'Agent not approved', status: agent.status }, 403);
    }

    // Create story
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.run(
      `INSERT INTO stories (id, title, content, author_id, author_type, model_used, character_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [storyId, title.trim(), content.trim(), agentId, 'openclaw', model_used || 'openclaw', content.length]
    );

    // Log to agent's activity
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'story_creation',
      story_id: storyId,
    }) + '\n';

    const logPath = join(OPENCLAW_DIR, 'agents', agentId, 'logs', 'activity.jsonl');
    const existing = await readFile(logPath, 'utf-8').catch(() => '');
    await writeFile(logPath, existing + logEntry, 'utf-8');

    return c.json({
      story_id: storyId,
      title: title.trim(),
      content: content.trim(),
      author_type: 'openclaw',
      author_id: agentId,
      created_at: new Date().toISOString(),
    }, 201);

  } catch (error) {
    console.error('Error creating story:', error);
    return c.json({ error: 'Failed to create story' }, 500);
  }
}

// GET /api/openclaw/file-stories - Read stories from file system
export async function getFileStories(c: Context) {
  try {
    const storiesDir = join(OPENCLAW_DIR, 'stories');
    const stories: any[] = [];

    const storyDirs = await readdir(storiesDir).catch(() => []);

    for (const storyId of storyDirs) {
      const storyPath = join(storiesDir, storyId, 'story.yaml');
      try {
        const content = await readFile(storyPath, 'utf-8');
        // Simple YAML parsing
        const story: any = { id: storyId, source: 'file', path: storyPath };
        for (const line of content.split('\n')) {
          if (line.startsWith('title: ')) story.title = line.split(': ')[1].replace(/"/g, '');
          if (line.startsWith('status: ')) story.status = line.split(': ')[1];
        }
        stories.push(story);
      } catch {
        // Skip invalid stories
      }
    }

    return c.json({ stories });
  } catch (error) {
    console.error('Error reading file stories:', error);
    return c.json({ stories: [] });
  }
}

// Health check for OpenClaw integration
export async function openclawHealth(c: Context) {
  try {
    const database = await getDb();
    const agentCount = database.query('SELECT COUNT(*) as count FROM user_agents').get();

    return c.json({
      status: 'healthy',
      openclaw_dir: OPENCLAW_DIR,
      registered_agents: agentCount?.count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: 'Database connection failed',
    }, 503);
  }
}
