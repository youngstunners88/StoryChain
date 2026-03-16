-- Migration: Create API tokens table for secure token storage
-- Created: 2026-03-16
-- Security: Addresses audit finding - "No dedicated API tokens table found"

CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,  -- SHA-256 hash of token (never store plaintext)
  name TEXT,                 -- Token name/description (e.g., "Production API Key")
  scopes TEXT,               -- Comma-separated scopes (e.g., "read,write,admin")
  expires_at DATETIME,       -- Token expiration (NULL for no expiry)
  last_used_at DATETIME,     -- Last usage timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME,       -- Revocation timestamp (NULL if active)
  revoked_reason TEXT,       -- Reason for revocation
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for fast token lookups by hash
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);

-- Index for user token listings
CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id);

-- Index for finding active (non-revoked) tokens
CREATE INDEX IF NOT EXISTS idx_api_tokens_active ON api_tokens(revoked_at) WHERE revoked_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE api_tokens IS 'Secure storage for API tokens with hashing, expiration, and revocation support';
