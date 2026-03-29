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

    -- Writer profiles table (both humans and agents)
    CREATE TABLE IF NOT EXISTS writer_profiles (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      age TEXT,
      country TEXT,
      about TEXT,
      favorite_literature TEXT DEFAULT '[]',
      avatar_url TEXT,
      social_links TEXT DEFAULT '{}',
      genre TEXT,
      genre_label TEXT,
      avatar_color TEXT DEFAULT '#c9a84c',
      avatar_emoji TEXT DEFAULT '✍',
      is_agent INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Comments table
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_comments_story ON comments(story_id);

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

    -- Foreign / community-registered agents
    CREATE TABLE IF NOT EXISTS foreign_agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      endpoint_url TEXT,
      about TEXT,
      genre TEXT,
      genre_label TEXT,
      avatar_url TEXT,
      avatar_color TEXT DEFAULT '#c9a84c',
      avatar_emoji TEXT DEFAULT '🤖',
      is_approved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_foreign_agents_owner ON foreign_agents(owner_id);
  `);

  // Agent memory tables (new)
  database.exec(`
    CREATE TABLE IF NOT EXISTS agent_errors (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      story_id TEXT,
      error_type TEXT NOT NULL,
      description TEXT,
      example TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_agent_errors_agent ON agent_errors(agent_id);
    CREATE INDEX IF NOT EXISTS idx_agent_errors_created ON agent_errors(created_at);

    CREATE TABLE IF NOT EXISTS agent_reflections (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      reflection_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_agent_reflections_agent ON agent_reflections(agent_id);
  `);

  // Messaging, notifications, collaboration, editorial tables
  database.exec(`
    -- Messaging
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      link TEXT,
      from_id TEXT,
      from_name TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(recipient_id, is_read);

    -- Collaboration invites
    CREATE TABLE IF NOT EXISTS collab_invites (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      story_title TEXT NOT NULL,
      inviter_id TEXT NOT NULL,
      inviter_name TEXT NOT NULL,
      invitee_id TEXT NOT NULL,
      invitee_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_collab_invites_invitee ON collab_invites(invitee_id);
    CREATE INDEX IF NOT EXISTS idx_collab_invites_story ON collab_invites(story_id);

    -- Editorial submissions
    CREATE TABLE IF NOT EXISTS editorial_submissions (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      story_title TEXT NOT NULL,
      submitter_id TEXT NOT NULL,
      submitter_name TEXT NOT NULL,
      editor_id TEXT,
      editor_name TEXT,
      status TEXT DEFAULT 'submitted',
      submission_notes TEXT,
      editor_notes TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_editorial_story ON editorial_submissions(story_id);
    CREATE INDEX IF NOT EXISTS idx_editorial_editor ON editorial_submissions(editor_id);
    CREATE INDEX IF NOT EXISTS idx_editorial_submitter ON editorial_submissions(submitter_id);

    -- Editor profiles (editors can be human, agent, or foreign)
    CREATE TABLE IF NOT EXISTS editor_profiles (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      about TEXT,
      specialties TEXT DEFAULT '[]',
      avatar_url TEXT,
      avatar_color TEXT DEFAULT '#60a5fa',
      avatar_emoji TEXT DEFAULT '✒️',
      is_agent INTEGER DEFAULT 0,
      editor_type TEXT DEFAULT 'human',
      genre_focus TEXT,
      completed_edits INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_editor_profiles_type ON editor_profiles(editor_type);
  `);

  // Auth tables (Phase 10)
  database.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_preview TEXT,
      revoked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, revoked);

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      ip TEXT,
      duration_ms INTEGER,
      status_code INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at);
  `);

  // Additional indexes added post-audit for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contributions_author ON contributions(author_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_stories_completed ON stories(is_completed, updated_at);
    CREATE INDEX IF NOT EXISTS idx_token_transactions_created ON token_transactions(created_at);
  `);

  // Migrations for existing databases (safe to run repeatedly)
  const migrations = [
    `ALTER TABLE stories ADD COLUMN cover_url TEXT`,
    `ALTER TABLE stories ADD COLUMN foreword TEXT`,
    `ALTER TABLE stories ADD COLUMN copyright_text TEXT`,
    `ALTER TABLE stories ADD COLUMN dedication TEXT`,
    `ALTER TABLE stories ADD COLUMN book_published INTEGER DEFAULT 0`,
    // Phase 10 auth
    `ALTER TABLE users ADD COLUMN password_hash TEXT`,
    `ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'writer'`,
    // Phase 11 blockchain
    `ALTER TABLE users ADD COLUMN wallet_address TEXT`,
    `ALTER TABLE users ADD COLUMN solana_wallet TEXT`,
    `ALTER TABLE users ADD COLUMN story_token_balance REAL DEFAULT 0`,
    `ALTER TABLE stories ADD COLUMN mint_address TEXT`,
    `ALTER TABLE stories ADD COLUMN arweave_uri TEXT`,
    `ALTER TABLE stories ADD COLUMN mint_tx_signature TEXT`,
    `ALTER TABLE stories ADD COLUMN minted_at DATETIME`,
    `ALTER TABLE stories ADD COLUMN bestseller_score INTEGER DEFAULT 0`,
    `ALTER TABLE stories ADD COLUMN genre TEXT`,
    `ALTER TABLE stories ADD COLUMN segment_count INTEGER DEFAULT 0`,
    `ALTER TABLE token_transactions ADD COLUMN tx_hash TEXT`,
    `ALTER TABLE token_transactions ADD COLUMN chain TEXT DEFAULT 'offchain'`,
    `ALTER TABLE token_transactions ADD COLUMN wallet_address TEXT`,
  ];
  for (const sql of migrations) {
    try { database.exec(sql); } catch (_) { /* column already exists */ }
  }

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
