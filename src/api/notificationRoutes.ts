// Notification Routes
import type { Context } from 'hono';
import { getDb } from '../database/connection.js';
import { generateRequestId } from '../utils/errorHandler.js';

function requireAuth(c: Context): { userId: string } | null {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  if (!token || token.length < 20) return null;
  return { userId: 'user_' + token.slice(-16) };
}

// GET /api/notifications
export async function getNotifications(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const db = await getDb();
    const notifications = db.query(`
      SELECT id, type, title, body, link, from_id as fromId, from_name as fromName,
             is_read as isRead, created_at as createdAt
      FROM notifications
      WHERE recipient_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(auth.userId) as any[];
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;
    return c.json({ notifications, unreadCount });
  } catch (err) {
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
}

// PATCH /api/notifications/:id/read
export async function markNotificationRead(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  try {
    const db = await getDb();
    db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?`, [id, auth.userId]);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to mark read' }, 500);
  }
}

// PATCH /api/notifications/read-all
export async function markAllNotificationsRead(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const db = await getDb();
    db.run(`UPDATE notifications SET is_read = 1 WHERE recipient_id = ?`, [auth.userId]);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to mark all read' }, 500);
  }
}

// POST /api/notifications — internal helper (also exposed for agent→human notifications)
export async function createNotification(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const body = await c.req.json();
    const { recipientId, type, title, body: bodyText, link, fromId, fromName } = body;
    if (!recipientId || !type || !title) return c.json({ error: 'recipientId, type, title required' }, 400);
    const db = await getDb();
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.run(
      `INSERT INTO notifications (id, recipient_id, type, title, body, link, from_id, from_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, recipientId, type, title, bodyText ?? null, link ?? null, fromId ?? auth.userId, fromName ?? null]
    );
    return c.json({ success: true, notificationId: id, requestId: generateRequestId() }, 201);
  } catch (err) {
    return c.json({ error: 'Failed to create notification' }, 500);
  }
}

// POST /api/collab-invites — send collaboration invite
export async function sendCollabInvite(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const body = await c.req.json();
    const { storyId, storyTitle, inviteeName, inviteeId, message } = body;
    if (!storyId || !inviteeId) return c.json({ error: 'storyId and inviteeId required' }, 400);

    const db = await getDb();
    const inviter = db.query<{username:string},[string]>('SELECT username FROM users WHERE id=?').get(auth.userId) as any;
    const inviterName = inviter?.username ?? 'A writer';

    const id = `collab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.run(
      `INSERT INTO collab_invites (id, story_id, story_title, inviter_id, inviter_name, invitee_id, invitee_name, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, storyId, storyTitle ?? 'Untitled', auth.userId, inviterName, inviteeId, inviteeName ?? 'Writer', message ?? null]
    );

    // Notification for invitee
    if (!inviteeId.startsWith('agent_')) {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      db.run(
        `INSERT INTO notifications (id, recipient_id, type, title, body, link, from_id, from_name) VALUES (?, ?, 'collab_invite', ?, ?, ?, ?, ?)`,
        [notifId, inviteeId, `${inviterName} invited you to collaborate`, `On: "${storyTitle}"`, `#story/${storyId}`, auth.userId, inviterName]
      );
    }

    return c.json({ success: true, inviteId: id, requestId: generateRequestId() }, 201);
  } catch (err) {
    return c.json({ error: 'Failed to send invite' }, 500);
  }
}

// GET /api/collab-invites — my pending invites
export async function getCollabInvites(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const db = await getDb();
    const invites = db.query(`
      SELECT id, story_id as storyId, story_title as storyTitle,
             inviter_id as inviterId, inviter_name as inviterName,
             status, message, created_at as createdAt
      FROM collab_invites WHERE invitee_id = ? ORDER BY created_at DESC LIMIT 20
    `).all(auth.userId) as any[];
    return c.json({ invites });
  } catch (err) {
    return c.json({ error: 'Failed to fetch invites' }, 500);
  }
}
