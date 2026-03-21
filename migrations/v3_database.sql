-- StoryChain v3 Database Migration
-- Adds: IP Registry, Multi-Wallet, Time-based Freemium, Character Pricing, Categories

-- IP Registry Tables
CREATE TABLE IF NOT EXISTS ip_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER UNIQUE NOT NULL,
    isbn TEXT,
    content_hash TEXT NOT NULL,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    commercial_rights_enabled BOOLEAN DEFAULT FALSE,
    licensing_terms TEXT DEFAULT 'all_rights_reserved',
    nft_contract_address TEXT,
    nft_token_id TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (story_id) REFERENCES stories(id)
);

CREATE INDEX IF NOT EXISTS idx_ip_registry_story_id ON ip_registry(story_id);
CREATE INDEX IF NOT EXISTS idx_ip_registry_isbn ON ip_registry(isbn);

CREATE TABLE IF NOT EXISTS ip_ownership (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_registry_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    ownership_percentage REAL NOT NULL CHECK(ownership_percentage > 0 AND ownership_percentage <= 100),
    role TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ip_registry_id) REFERENCES ip_registry(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ip_ownership_registry ON ip_ownership(ip_registry_id);
CREATE INDEX IF NOT EXISTS idx_ip_ownership_user ON ip_ownership(user_id);

-- Multi-Wallet Support
CREATE TABLE IF NOT EXISTS user_wallets_v3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    wallet_type TEXT NOT NULL,
    chain TEXT NOT NULL,
    address TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, address)
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON user_wallets_v3(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets_v3(address);

-- Time-based Freemium
CREATE TABLE IF NOT EXISTS user_time_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_type TEXT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    characters_used INTEGER DEFAULT 0,
    cost_incurred REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_time_sessions_user ON user_time_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_status ON user_time_sessions(status);

-- Character Pricing Tiers
CREATE TABLE IF NOT EXISTS character_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    min_chars INTEGER NOT NULL,
    max_chars INTEGER NOT NULL,
    price_cusd REAL NOT NULL,
    description TEXT
);

-- Insert default pricing tiers
INSERT OR IGNORE INTO character_pricing (id, min_chars, max_chars, price_cusd, description) VALUES
(1, 1, 300, 0.00, 'Free tier - ideas and short thoughts'),
(2, 301, 700, 0.50, 'Short paragraphs'),
(3, 701, 1600, 1.00, 'Full scene writing'),
(4, 1601, 3900, 2.50, 'Chapter segments'),
(5, 3901, 10000, 3.00, 'Extended content');

-- Content Categories
CREATE TABLE IF NOT EXISTS content_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    avg_word_count INTEGER
);

-- Insert default categories
INSERT OR IGNORE INTO content_categories (slug, name, description, avg_word_count) VALUES
('novel', 'Novel', 'Long-form fiction, 50k+ words', 80000),
('novella', 'Novella', 'Medium fiction, 17k-50k words', 30000),
('short_story', 'Short Story', 'Brief fiction, under 17k words', 5000),
('magazine_article', 'Magazine Article', 'Journalistic or feature writing', 2000),
('blog_post', 'Blog Post', 'Informal, episodic content', 1000),
('screenplay', 'Screenplay', 'Script format for film/TV', 15000),
('poetry', 'Poetry', 'Verse and poetic forms', 500),
('anthology', 'Anthology', 'Collection of works', 50000),
('interactive', 'Interactive Story', 'Choose-your-path narrative', 10000);

-- Story Category Assignment
CREATE TABLE IF NOT EXISTS story_categories (
    story_id INTEGER PRIMARY KEY,
    category_slug TEXT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id),
    FOREIGN KEY (category_slug) REFERENCES content_categories(slug)
);

CREATE INDEX IF NOT EXISTS idx_story_categories_category ON story_categories(category_slug);

-- Migration completed marker
INSERT OR REPLACE INTO migrations (version, applied_at) VALUES ('v3', datetime('now'));
