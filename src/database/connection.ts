// Database Connection and Initialization
import { Database } from 'bun:sqlite';
import { config } from '../config/index.js';

// Database instance
let db: Database | null = null;

// Initialize database connection
export async function getDb(): Promise<Database> {
  if (!db) {
    db = new Database(config.database.path);
    db.run('PRAGMA foreign_keys = ON');
    db.run('PRAGMA journal_mode = WAL'); // Better concurrency
    console.log(`[Database] Connected to ${config.database.path}`);
  }
  return db;
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  const database = await getDb();

  // Core tables
  database.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      tokens INTEGER DEFAULT 1000,
      preferred_model TEXT DEFAULT 'kimi-k2.5',
      auto_purchase_extensions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Stories table
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      model_used TEXT NOT NULL,
      character_count INTEGER DEFAULT 0,
      tokens_spent INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      is_premium INTEGER DEFAULT 0,
      max_contributions INTEGER DEFAULT 50,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    -- Contributions table
    CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      model_used TEXT NOT NULL,
      character_count INTEGER DEFAULT 0,
      tokens_spent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    -- Likes table
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(story_id, user_id),
      FOREIGN KEY (story_id) REFERENCES stories(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Follows table
    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id)
    );

    -- Token transactions table
    CREATE TABLE IF NOT EXISTS token_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      story_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (story_id) REFERENCES stories(id)
    );

    -- API usage tracking
    CREATE TABLE IF NOT EXISTS api_usage (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      model TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      tokens_input INTEGER DEFAULT 0,
      tokens_output INTEGER DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      success INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- API token registry (hashed external tokens / integration keys)
    CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      label TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      revoked_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id);
    CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created_at);
    CREATE INDEX IF NOT EXISTS idx_contributions_story ON contributions(story_id);
    CREATE INDEX IF NOT EXISTS idx_likes_story ON likes(story_id);
    CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON token_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at);
    CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_tokens_expires ON api_tokens(expires_at);
  `);

  console.log('[Database] Tables initialized successfully');
}

// Close database connection
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[Database] Connection closed');
  }
}

// Health check
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const database = await getDb();
    database.query('SELECT 1').get();
    return { healthy: true };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

export default { getDb, initializeDatabase, closeDatabase, checkDatabaseHealth };
