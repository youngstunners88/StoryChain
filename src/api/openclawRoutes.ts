// OpenClaw Integration API Routes for StoryChain
// Allows external OpenClaw agents to register and publish stories
// With OpenClaw-inspired error handling

import type { Context } from 'hono';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getDb as getSharedDb } from '../database/connection.js';
import { requireAuth as requireBaseAuth } from './routes.js';
import {
  handleApiError,
  createStoryChainError,
  createValidationError,
  createNotFoundError,
  generateRequestId,
} from '../utils/errorHandler';

async function getDb() {
  return getSharedDb();
}

async function requireAuth(c: Context): Promise<{ userId: string; email: string } | Response> {
  return requireBaseAuth(c);
}

// OpenClaw directory
const OPENCLAW_DIR = join(process.cwd(), 'openclaw');

// POST /api/openclaw/agents - Register new OpenClaw agent
export async function registerOpenClawAgent(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const body = await c.req.json();
    const { profile, wallet_signature } = body;

    if (!profile?.name || !profile?.owner?.wallet_address) {
      throw createValidationError('Agent name and wallet address are required', 'profile', {
        required: ['profile.name', 'profile.owner.wallet_address'],
        received: Object.keys(profile || {}),
      });
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

    // Store in database
    const database = await getDb();
    database.run(
      `INSERT INTO user_agents (id, owner_address, profile_path, status, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [agentId, profile.owner.wallet_address, agentDir, 'pending', now]
    );

    const requestId = generateRequestId();
    return c.json(
      {
        agent_id: agentId,
        status: 'pending',
        approval_url: `/openclaw/agents/${agentId}/approve`,
        message: 'Agent registration submitted for approval',
        requestId,
        timestamp: now,
      },
      201,
      { 'X-Request-Id': requestId }
    );

  } catch (error) {
    return handleApiError(c, error, 'registerOpenClawAgent', { userId: auth.userId });
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

    const requestId = generateRequestId();
    return c.json(
      {
        agents: agents.map((a: any) => ({
          id: a.id,
          owner: a.owner_address,
          status: a.status,
          created_at: a.created_at,
          approved_at: a.approved_at,
        })),
        requestId,
        timestamp: new Date().toISOString(),
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'listOpenClawAgents');
  }
}

// GET /api/openclaw/agents/:id - Get agent details
export async function getOpenClawAgent(c: Context) {
  try {
    const agentId = c.req.param('id');
    if (!agentId) {
      throw createValidationError('Agent id is required', 'id');
    }
    const database = await getDb();

    const agent = database.query('SELECT * FROM user_agents WHERE id = ?').get(agentId) as any;
    if (!agent) {
      throw createNotFoundError('Agent', agentId);
    }

    // Get stats
    const storiesCount = database.query(
      'SELECT COUNT(*) as count FROM stories WHERE author_id = ?'
    ).get(agentId) as { count: number } | null;

    const requestId = generateRequestId();
    return c.json(
      {
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
        requestId,
        timestamp: new Date().toISOString(),
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'getOpenClawAgent');
  }
}

// POST /api/openclaw/agents/:id/stories - Agent creates story
export async function agentCreateStory(c: Context) {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const agentId = c.req.param('id');
    if (!agentId) {
      throw createValidationError('Agent id is required', 'id');
    }
    const body = await c.req.json();
    const { title, content, model_used } = body;

    if (!title?.trim() || !content?.trim()) {
      throw createValidationError('Title and content are required', 'body', {
        received: { hasTitle: !!title, hasContent: !!content },
      });
    }

    const database = await getDb();

    // Verify agent exists and is active
    const agent = database.query('SELECT * FROM user_agents WHERE id = ?').get(agentId) as any;
    if (!agent) {
      throw createNotFoundError('Agent', agentId);
    }
    if (agent.status !== 'active') {
      throw createStoryChainError(
        new Error(`Agent not approved: ${agent.status}`),
        'AGENT_NOT_ACTIVE',
        { agentId, currentStatus: agent.status }
      );
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

    const requestId = generateRequestId();
    return c.json(
      {
        story_id: storyId,
        title: title.trim(),
        content: content.trim(),
        author_type: 'openclaw',
        author_id: agentId,
        created_at: new Date().toISOString(),
        requestId,
        timestamp: new Date().toISOString(),
      },
      201,
      { 'X-Request-Id': requestId }
    );

  } catch (error) {
    return handleApiError(c, error, 'agentCreateStory', { userId: auth.userId });
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
          if (line.startsWith('title: ')) {
            story.title = (line.split(': ')[1] ?? '').replace(/"/g, '');
          }
          if (line.startsWith('status: ')) {
            story.status = line.split(': ')[1] ?? 'unknown';
          }
        }
        stories.push(story);
      } catch {
        // Skip invalid stories
      }
    }

    const requestId = generateRequestId();
    return c.json(
      {
        stories,
        count: stories.length,
        requestId,
        timestamp: new Date().toISOString(),
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'getFileStories');
  }
}

// Health check for OpenClaw integration
export async function openclawHealth(c: Context) {
  try {
    const database = await getDb();
    const agentCount = database.query('SELECT COUNT(*) as count FROM user_agents').get() as { count: number } | null;

    const requestId = generateRequestId();
    return c.json(
      {
        status: 'healthy',
        openclaw_dir: OPENCLAW_DIR,
        registered_agents: agentCount?.count || 0,
        timestamp: new Date().toISOString(),
        requestId,
      },
      200,
      { 'X-Request-Id': requestId }
    );
  } catch (error) {
    return handleApiError(c, error, 'openclawHealth');
  }
}
