// Messaging Routes — DM between any two participants (human, agent, foreign agent)
import type { Context } from 'hono';
import { getDb } from '../database/connection.js';
import { generateRequestId } from '../utils/errorHandler.js';
import { llmService } from '../services/llmService.js';

import { requireAuthCompat as requireAuth } from '../middleware/auth.js';

// Generate an LLM reply from an agent or editor when a human DMs them
async function triggerAgentReply(
  agentId: string,
  humanUserId: string,
  humanName: string,
  humanMessage: string,
  convId: string,
): Promise<void> {
  try {
    const db = await getDb();

    // Get persona — check writer_profiles first, then editor_profiles
    const wp = db.query('SELECT display_name, about, genre FROM writer_profiles WHERE user_id=?').get(agentId) as any;
    const ep = db.query('SELECT display_name, about FROM editor_profiles WHERE user_id=?').get(agentId) as any;
    const profile = wp ?? ep;
    if (!profile) return;

    const role = wp ? `AI ${wp.genre ?? 'literary'} story writer` : 'literary editor';
    const recentHistory = (db.query(
      `SELECT sender_name, content FROM messages WHERE conversation_id=? ORDER BY created_at DESC LIMIT 6`
    ).all(convId) as any[]).reverse().map((m: any) => `${m.sender_name}: ${m.content}`).join('\n');

    const prompt = `You are ${profile.display_name}, a ${role} on StoryChain — a collaborative AI storytelling platform.

${profile.about}

${recentHistory ? `Recent conversation:\n${recentHistory}\n\n` : ''}${humanName} just wrote: "${humanMessage}"

Reply in character as ${profile.display_name}. Be warm, specific, and genuine — like a real writer or editor would respond to a fellow writer. 2–4 sentences maximum. No markdown.

${profile.display_name}:`;

    const result = await llmService.generateContent(prompt, { maxTokens: 200 });
    const reply = result?.content?.trim();
    if (!reply) return;

    const replyId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.run(
      `INSERT INTO messages (id, conversation_id, sender_id, sender_name, content) VALUES (?, ?, ?, ?, ?)`,
      [replyId, convId, agentId, profile.display_name, reply],
    );

    // Notify the human writer
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.run(
      `INSERT INTO notifications (id, recipient_id, type, title, body, link, from_id, from_name) VALUES (?, ?, 'message', ?, ?, '#messages', ?, ?)`,
      [notifId, humanUserId, `${profile.display_name} replied`, reply.slice(0, 100), agentId, profile.display_name],
    );
  } catch (err) {
    console.error('[Messaging] Agent auto-reply failed:', err);
  }
}

function conversationId(a: string, b: string): string {
  return [a, b].sort().join('::');
}

// GET /api/messages — all conversations for the current user
export async function getConversations(c: Context) {
  const auth = await requireAuth(c);
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
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const otherId = c.req.param('partnerId') ?? c.req.param('otherId');
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
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const body = await c.req.json();
    const urlPartnerId = c.req.param('partnerId');
    const { recipientId: bodyRecipientId, content, senderName } = body;
    const recipientId = urlPartnerId ?? bodyRecipientId;
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

    // Check if recipient is an AI agent or editor
    const recipientIsAgent = (
      db.query('SELECT 1 FROM writer_profiles WHERE user_id=? AND is_agent=1').get(recipientId) ??
      db.query('SELECT 1 FROM editor_profiles WHERE user_id=? AND is_agent=1').get(recipientId)
    ) != null;

    if (recipientIsAgent) {
      // Fire agent reply asynchronously — don't block the response
      setTimeout(() => triggerAgentReply(recipientId, auth.userId, name, content.trim(), convId), 800);
    } else {
      // Notify human recipient
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
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const otherId = c.req.param('partnerId') ?? c.req.param('otherId');
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
  const auth = await requireAuth(c);
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
