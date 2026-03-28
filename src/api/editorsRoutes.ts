// Editors Routes — profiles, submissions, editorial workflow
import type { Context } from 'hono';
import { getDb } from '../database/connection.js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { generateRequestId } from '../utils/errorHandler.js';

import { requireAuthCompat as requireAuth } from '../middleware/auth.js';

async function loadEditorAgents(): Promise<any[]> {
  const dir = join(process.cwd(), 'orchestrator', 'memory', 'editors');
  try {
    const files = await readdir(dir);
    const agents = [];
    for (const f of files.filter(f => f.endsWith('.yaml'))) {
      try {
        const raw = await readFile(join(dir, f), 'utf-8');
        const d = parseYaml(raw) as any;
        if (d?.status === 'active') agents.push(d);
      } catch (_) {}
    }
    return agents;
  } catch (_) { return []; }
}

async function ensureEditorAgentsInDb(db: any, agents: any[]): Promise<void> {
  for (const agent of agents) {
    const userId = agent.id;
    const existing = db.query('SELECT id FROM users WHERE id=?').get(userId);
    if (!existing) {
      db.run('INSERT OR IGNORE INTO users (id, username, email) VALUES (?, ?, ?)',
        [userId, agent.name, `${userId}@storychain.local`]);
    }
    const ep = db.query('SELECT user_id, avatar_url FROM editor_profiles WHERE user_id=?').get(userId) as any;
    const specs = JSON.stringify(agent.identity?.specialties ?? []);
    const yamlAvatar = agent.identity?.avatar_url ?? null;
    if (ep) {
      // Only use YAML avatar if explicitly set — never overwrite a generated portrait
      const avatarToUse = yamlAvatar || ep.avatar_url;
      db.run(`UPDATE editor_profiles SET display_name=?, about=?, specialties=?, avatar_color=?, avatar_emoji=?, avatar_url=?, is_agent=1, editor_type='agent', genre_focus=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`,
        [agent.name, agent.identity?.about ?? null, specs, agent.identity?.avatar_color ?? '#60a5fa', agent.identity?.avatar_emoji ?? '✒️', avatarToUse, agent.identity?.genre_focus ?? null, userId]);
    } else {
      db.run(`INSERT INTO editor_profiles (user_id, display_name, about, specialties, avatar_color, avatar_emoji, avatar_url, is_agent, editor_type, genre_focus) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'agent', ?)`,
        [userId, agent.name, agent.identity?.about ?? null, specs, agent.identity?.avatar_color ?? '#60a5fa', agent.identity?.avatar_emoji ?? '✒️', yamlAvatar, agent.identity?.genre_focus ?? null]);
    }
  }
}

// GET /api/editors
export async function getEditors(c: Context) {
  try {
    const db = await getDb();
    const agents = await loadEditorAgents();
    await ensureEditorAgentsInDb(db, agents);
    const editors = db.query(`
      SELECT ep.*, u.username, u.created_at as joined_at
      FROM editor_profiles ep JOIN users u ON ep.user_id = u.id
      ORDER BY ep.is_agent DESC, ep.completed_edits DESC
    `).all() as any[];
    return c.json({
      editors: editors.map((e: any) => ({
        id: e.user_id, name: e.display_name || e.username,
        about: e.about, specialties: tryParse(e.specialties, []),
        avatarUrl: e.avatar_url, avatarColor: e.avatar_color || '#60a5fa',
        avatarEmoji: e.avatar_emoji || '✒️', isAgent: e.is_agent === 1,
        editorType: e.editor_type || 'human', genreFocus: e.genre_focus,
        completedEdits: e.completed_edits || 0, joinedAt: e.joined_at,
      })),
    });
  } catch (err) {
    return c.json({ error: 'Failed to fetch editors' }, 500);
  }
}

// GET /api/editors/:id
export async function getEditor(c: Context) {
  const id = c.req.param('id');
  try {
    const db = await getDb();
    const e = db.query(`SELECT ep.*, u.username, u.created_at as joined_at FROM editor_profiles ep JOIN users u ON ep.user_id = u.id WHERE ep.user_id=?`).get(id) as any;
    if (!e) return c.json({ error: 'Editor not found' }, 404);
    const queue = db.query(`SELECT id, story_id, story_title, submitter_name, status, submitted_at FROM editorial_submissions WHERE editor_id=? AND status != 'completed' ORDER BY submitted_at ASC`).all(id) as any[];
    return c.json({
      editor: {
        id: e.user_id, name: e.display_name || e.username,
        about: e.about, specialties: tryParse(e.specialties, []),
        avatarUrl: e.avatar_url, avatarColor: e.avatar_color || '#60a5fa',
        avatarEmoji: e.avatar_emoji || '✒️', isAgent: e.is_agent === 1,
        editorType: e.editor_type || 'human', genreFocus: e.genre_focus,
        completedEdits: e.completed_edits || 0, joinedAt: e.joined_at, queue,
      },
    });
  } catch (err) {
    return c.json({ error: 'Failed to fetch editor' }, 500);
  }
}

// POST /api/editors/me/ensure
export async function ensureMyEditorProfile(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const db = await getDb();
    const user = db.query<{username:string},[string]>('SELECT username FROM users WHERE id=?').get(auth.userId) as any;
    if (!user) return c.json({ error: 'User not found — write a story first' }, 404);
    const existing = db.query('SELECT user_id FROM editor_profiles WHERE user_id=?').get(auth.userId);
    if (!existing) {
      db.run(`INSERT INTO editor_profiles (user_id, display_name, avatar_color, avatar_emoji, is_agent, editor_type, specialties) VALUES (?, ?, '#60a5fa', '✒️', 0, 'human', '[]')`, [auth.userId, user.username]);
    }
    return c.json({ success: true, editorId: auth.userId });
  } catch (err) {
    return c.json({ error: 'Failed to ensure editor profile' }, 500);
  }
}

// PUT /api/editors/me
export async function updateEditorProfile(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const body = await c.req.json();
    const { displayName, about, specialties, genreFocus, avatarUrl } = body;
    const db = await getDb();
    const existing = db.query('SELECT user_id FROM editor_profiles WHERE user_id=?').get(auth.userId);
    if (existing) {
      db.run(`UPDATE editor_profiles SET display_name=COALESCE(?,display_name), about=COALESCE(?,about), specialties=COALESCE(?,specialties), genre_focus=COALESCE(?,genre_focus), avatar_url=COALESCE(?,avatar_url), updated_at=CURRENT_TIMESTAMP WHERE user_id=?`,
        [displayName??null, about??null, specialties?JSON.stringify(specialties):null, genreFocus??null, avatarUrl??null, auth.userId]);
    }
    return c.json({ success: true, requestId: generateRequestId() });
  } catch (err) {
    return c.json({ error: 'Failed to update editor profile' }, 500);
  }
}

// POST /api/editorial/submit
export async function submitForEditing(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const body = await c.req.json();
    const { storyId, storyTitle, editorId, notes } = body;
    if (!storyId) return c.json({ error: 'storyId required' }, 400);
    const db = await getDb();
    const user = db.query<{username:string},[string]>('SELECT username FROM users WHERE id=?').get(auth.userId) as any;
    const submitterName = user?.username ?? 'Author';
    let editorName = null;
    if (editorId) {
      const ep = db.query('SELECT display_name FROM editor_profiles WHERE user_id=?').get(editorId) as any;
      editorName = ep?.display_name ?? null;
    }
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.run(
      `INSERT INTO editorial_submissions (id, story_id, story_title, submitter_id, submitter_name, editor_id, editor_name, submission_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, storyId, storyTitle ?? 'Untitled', auth.userId, submitterName, editorId ?? null, editorName, notes ?? null]
    );
    // Notify editor if specified
    if (editorId && !editorId.startsWith('editor_agent_')) {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      db.run(
        `INSERT INTO notifications (id, recipient_id, type, title, body, link, from_id, from_name) VALUES (?, ?, 'edit_request', ?, ?, ?, ?, ?)`,
        [notifId, editorId, `New editorial submission from ${submitterName}`, `"${storyTitle}" submitted for editing`, `#editors`, auth.userId, submitterName]
      );
    }
    return c.json({ success: true, submissionId: id, requestId: generateRequestId() }, 201);
  } catch (err) {
    return c.json({ error: 'Failed to submit for editing' }, 500);
  }
}

// GET /api/editorial/submissions — editor's queue
export async function getEditorialQueue(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const db = await getDb();
    const subs = db.query(`
      SELECT id, story_id as storyId, story_title as storyTitle, submitter_id as submitterId,
             submitter_name as submitterName, status, submission_notes as notes,
             editor_notes as editorNotes, submitted_at as submittedAt, updated_at as updatedAt
      FROM editorial_submissions WHERE editor_id=? ORDER BY submitted_at DESC
    `).all(auth.userId) as any[];
    // Also get unassigned submissions
    const open = db.query(`
      SELECT id, story_id as storyId, story_title as storyTitle, submitter_name as submitterName,
             status, submitted_at as submittedAt
      FROM editorial_submissions WHERE editor_id IS NULL AND status='submitted'
      ORDER BY submitted_at ASC LIMIT 20
    `).all() as any[];
    return c.json({ queue: subs, open });
  } catch (err) {
    return c.json({ error: 'Failed to fetch queue' }, 500);
  }
}

// GET /api/editorial/my-submissions — writer's own submissions
export async function getMySubmissions(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const db = await getDb();
    const subs = db.query(`
      SELECT id, story_id as storyId, story_title as storyTitle, editor_id as editorId,
             editor_name as editorName, status, submission_notes as notes,
             editor_notes as editorNotes, submitted_at as submittedAt, updated_at as updatedAt
      FROM editorial_submissions WHERE submitter_id=? ORDER BY submitted_at DESC
    `).all(auth.userId) as any[];
    return c.json({ submissions: subs });
  } catch (err) {
    return c.json({ error: 'Failed to fetch submissions' }, 500);
  }
}

// PATCH /api/editorial/submissions/:id — editor updates status/notes
export async function updateSubmission(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const subId = c.req.param('id');
  try {
    const body = await c.req.json();
    const { status, editorNotes, acceptSubmission } = body;
    const db = await getDb();
    const sub = db.query(`SELECT * FROM editorial_submissions WHERE id=?`).get(subId) as any;
    if (!sub) return c.json({ error: 'Submission not found' }, 404);

    if (acceptSubmission && sub.editor_id === null) {
      const ep = db.query('SELECT display_name FROM editor_profiles WHERE user_id=?').get(auth.userId) as any;
      db.run(`UPDATE editorial_submissions SET editor_id=?, editor_name=?, status='in_review', updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [auth.userId, ep?.display_name ?? 'Editor', subId]);
      // Notify submitter
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      db.run(`INSERT INTO notifications (id, recipient_id, type, title, body, link, from_id, from_name) VALUES (?, ?, 'edit_update', ?, ?, '#editors', ?, ?)`,
        [notifId, sub.submitter_id, 'Editor accepted your submission', `"${sub.story_title}" is now in review`, auth.userId, ep?.display_name ?? 'Editor']);
    } else if (status) {
      db.run(`UPDATE editorial_submissions SET status=COALESCE(?,status), editor_notes=COALESCE(?,editor_notes), updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [status ?? null, editorNotes ?? null, subId]);
      if (status === 'completed') {
        db.run(`UPDATE editor_profiles SET completed_edits = completed_edits + 1, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`, [auth.userId]);
        // Notify submitter
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        db.run(`INSERT INTO notifications (id, recipient_id, type, title, body, link, from_id, from_name) VALUES (?, ?, 'edit_complete', ?, ?, '#library', ?, ?)`,
          [notifId, sub.submitter_id, 'Editing complete!', `"${sub.story_title}" has been edited and is ready`, auth.userId, sub.editor_name ?? 'Editor']);
      }
    }
    return c.json({ success: true, requestId: generateRequestId() });
  } catch (err) {
    return c.json({ error: 'Failed to update submission' }, 500);
  }
}

function tryParse(str: any, fallback: any): any {
  try { return JSON.parse(str); } catch (_) { return fallback; }
}
