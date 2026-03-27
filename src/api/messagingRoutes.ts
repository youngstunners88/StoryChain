// Messaging Routes — DM between any two participants (human, agent, foreign agent)
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

function conversationId(a: string, b: string): string {
  return [a, b].sort().join('::');
}

// GET /api/messages — all conversations for the current user
export async function getConversations(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const db = await getDb();
    // Get the most recent message per conversation involving this user
    const rows = db.query(`
      SELECT m.conversation_id,
        m.sender_id, m.sender_name, m.content, m.created_at,
        (SELECT COUNT(*) FROM messages m2
          WHERE m2.conversation_id = m.conversation_id AND m2.is_read = 0
            AND m2.sender_id != ?) as unread_count
      FROM messages m
      WHERE m.id IN (
        SELECT id FROM messages
        WHERE conversation_id IN (
          SELECT DISTINCT conversation_id FROM messages
          WHERE conversation_id LIKE ? OR conversation_id LIKE ?
        )
        GROUP BY conversation_id
        HAVING MAX(created_at)
      )
      ORDER BY m.created_at DESC
      LIMIT 50
    `).all(auth.userId, `${auth.userId}::%`, `%::${auth.userId}`) as any[];

    return c.json({ conversations: rows });
  } catch (err) {
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
}

// GET /api/messages/:otherId — message thread with a specific person/agent
export async function getThread(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const otherId = c.req.param('otherId');
  const convId = conversationId(auth.userId, otherId);
  try {
    const db = await getDb();
    const messages = db.query(`
      SELECT id, sender_id as senderId, sender_name as senderName,
             content, is_read as isRead, created_at as createdAt
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      LIMIT 200
    `).all(convId) as any[];
    // Mark received messages as read
    db.run(
      `UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?`,
      [convId, auth.userId]
    );
    return c.json({ messages, conversationId: convId });
  } catch (err) {
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
}

// POST /api/messages — send a message
export async function sendMessage(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const body = await c.req.json();
    const { recipientId, content, senderName } = body;
    if (!recipientId || !content?.trim()) return c.json({ error: 'recipientId and content required' }, 400);
    if (content.length > 2000) return c.json({ error: 'Message too long (max 2000 chars)' }, 400);

    const db = await getDb();
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const convId = conversationId(auth.userId, recipientId);

    // Get sender name
    const user = db.query<{username:string}, [string]>('SELECT username FROM users WHERE id=?').get(auth.userId) as any;
    const name = senderName ?? user?.username ?? auth.userId.slice(-8);

    db.run(
      `INSERT INTO messages (id, conversation_id, sender_id, sender_name, content) VALUES (?, ?, ?, ?, ?)`,
      [id, convId, auth.userId, name, content.trim()]
    );

    // Create notification for recipient (if they're a real user, not an agent)
    if (!recipientId.startsWith('agent_')) {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      db.run(
        `INSERT INTO notifications (id, recipient_id, type, title, body, link, from_id, from_name)
         VALUES (?, ?, 'message', ?, ?, '#messages', ?, ?)`,
        [notifId, recipientId, `New message from ${name}`, content.trim().slice(0, 80), auth.userId, name]
      );
    }

    return c.json({ success: true, messageId: id, conversationId: convId, requestId: generateRequestId() }, 201);
  } catch (err) {
    return c.json({ error: 'Failed to send message' }, 500);
  }
}

// PATCH /api/messages/:otherId/read — mark thread as read
export async function markThreadRead(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const otherId = c.req.param('otherId');
  const convId = conversationId(auth.userId, otherId);
  try {
    const db = await getDb();
    db.run(`UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?`, [convId, auth.userId]);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to mark read' }, 500);
  }
}

// GET /api/messages/unread-count — total unread messages
export async function getUnreadCount(c: Context) {
  const auth = requireAuth(c);
  if (!auth) return c.json({ unreadMessages: 0 });
  try {
    const db = await getDb();
    const result = db.query(
      `SELECT COUNT(*) as count FROM messages
       WHERE sender_id != ? AND is_read = 0
         AND (conversation_id LIKE ? OR conversation_id LIKE ?)`
    ).get(auth.userId, `${auth.userId}::%`, `%::${auth.userId}`) as any;
    return c.json({ unreadMessages: result?.count ?? 0 });
  } catch (err) {
    return c.json({ unreadMessages: 0 });
  }
}
