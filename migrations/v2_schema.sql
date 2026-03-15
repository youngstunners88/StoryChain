-- StoryChain Database Schema v2
-- Migration: Multi-LLM Support + Token-Based Character Extensions

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Users table with token balance
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tokens INTEGER DEFAULT 100 NOT NULL,
    preferred_model TEXT DEFAULT 'kimi-k2.5',
    auto_purchase_extensions BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stories table with model tracking
CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    model_used TEXT NOT NULL,
    character_count INTEGER NOT NULL,
    tokens_spent INTEGER DEFAULT 0,
    parent_id TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES stories(id) ON DELETE SET NULL
);

-- Contributions table with detailed tracking
CREATE TABLE IF NOT EXISTS contributions (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    model_used TEXT NOT NULL,
    character_count INTEGER NOT NULL,
    tokens_spent INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Token transactions for audit trail
CREATE TABLE IF NOT EXISTS token_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('purchase', 'spend', 'refund', 'bonus')),
    description TEXT,
    story_id TEXT,
    contribution_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL,
    FOREIGN KEY (contribution_id) REFERENCES contributions(id) ON DELETE SET NULL
);

-- Error logs for monitoring
CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY,
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    user_id TEXT,
    story_id TEXT,
    request_data TEXT,
    stack_trace TEXT,
    context TEXT,
    severity TEXT DEFAULT 'error' CHECK(severity IN ('info', 'warning', 'error', 'critical')),
    resolved BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    model TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    tokens_input INTEGER NOT NULL,
    tokens_output INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_parent ON stories(parent_id);
CREATE INDEX IF NOT EXISTS idx_contributions_story ON contributions(story_id);
CREATE INDEX IF NOT EXISTS idx_contributions_author ON contributions(author_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_model ON api_usage(model);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_stories_timestamp 
AFTER UPDATE ON stories
BEGIN
    UPDATE stories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Migration tracking
CREATE TABLE IF NOT EXISTS migrations (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Insert migration record
INSERT OR IGNORE INTO migrations (version, description) VALUES (2, 'Multi-LLM support and token-based character extensions');
