// Audit logging — writes every authenticated API action to audit_log table
import type { Context, Next } from 'hono';
import { getDb } from '../database/connection.js';
import { requireAuthCompat } from './auth.js';

function randomId(): string {
  return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function auditLogMiddleware(c: Context, next: Next): Promise<void> {
  const start = Date.now();
  await next();
  // Only log authenticated write operations
  const method = c.req.method;
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return;

  try {
    const auth = await requireAuthCompat(c);
    if (!auth) return;
    const db = await getDb();
    db.run(
      `INSERT INTO audit_log (id, user_id, action, resource, ip, duration_ms, status_code) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        randomId(),
        auth.userId,
        method,
        c.req.path,
        c.req.header('x-real-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown',
        Date.now() - start,
        c.res.status,
      ],
    );
  } catch {
    // Audit log failure must never break the request
  }
}
