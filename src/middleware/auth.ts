// Shared auth middleware — replaces all per-file requireAuth stubs
import type { Context } from 'hono';
import { verifyJwt, type TokenPayload } from '../services/tokenService.js';

/**
 * Extract and verify JWT from Authorization header.
 * Returns TokenPayload on success, null on failure.
 * Usage in route handlers:
 *   const auth = await requireAuth(c);
 *   if (!auth) return c.json({ error: 'Unauthorized' }, 401);
 */
export async function requireAuth(c: Context): Promise<TokenPayload | null> {
  const header = c.req.header('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return verifyJwt(header.slice(7));
}

/**
 * Same as requireAuth but also accepts the old stub token format
 * (any 20+ char token) so existing sessions keep working after upgrade.
 * Remove this once all clients have re-logged in with real JWTs.
 */
export async function requireAuthCompat(c: Context): Promise<TokenPayload | null> {
  const header = c.req.header('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);

  // Try real JWT first
  const payload = await verifyJwt(token);
  if (payload) return payload;

  // Fall back to stub: any token ≥ 20 chars → derive userId from last 16 chars
  if (token.length >= 20) {
    return { userId: 'user_' + token.slice(-16), role: 'writer' };
  }
  return null;
}

/** Check that the authenticated user has one of the specified roles. */
export function hasRole(auth: TokenPayload, ...roles: string[]): boolean {
  return auth.role === 'admin' || roles.includes(auth.role);
}
