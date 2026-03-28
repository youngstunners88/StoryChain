// JWT service — HS256 via Web Crypto API (no external deps, native in Bun)
import { Buffer } from 'node:buffer';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

function encode(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function decode(b64url: string): unknown {
  return JSON.parse(Buffer.from(b64url, 'base64url').toString('utf8'));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signJwt(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  expiresInMs: number,
  secret = config.security.jwtSecret,
): Promise<string> {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const now = Math.floor(Date.now() / 1000);
  const body = encode({
    ...payload,
    iat: now,
    exp: Math.floor((Date.now() + expiresInMs) / 1000),
  });
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${Buffer.from(sig).toString('base64url')}`;
}

export async function verifyJwt(
  token: string,
  secret = config.security.jwtSecret,
): Promise<TokenPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      Buffer.from(sig, 'base64url'),
      new TextEncoder().encode(`${header}.${body}`),
    );
    if (!valid) return null;
    const payload = decode(body) as TokenPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function issueTokens(userId: string, role: string) {
  const [accessToken, refreshToken] = await Promise.all([
    signJwt({ userId, role }, config.security.jwtAccessTtlMs),
    signJwt({ userId, role }, config.security.jwtRefreshTtlMs),
  ]);
  return {
    accessToken,
    refreshToken,
    expiresIn: config.security.jwtAccessTtlMs / 1000,
  };
}
