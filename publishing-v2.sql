-- Publishing House v2: Weighted Revenue Sharing + Celo + Custom IDs

-- Drop old tables for clean migration
DROP TABLE IF EXISTS editor_verdicts;
DROP TABLE IF EXISTS editor_reviews;
DROP TABLE IF EXISTS publication_submissions;
DROP TABLE IF EXISTS ebook_purchases;
DROP TABLE IF EXISTS user_library;
DROP TABLE IF EXISTS user_tiers;
DROP TABLE IF EXISTS publication_tiers;

-- Custom Book ID System (replaces ISBN)
CREATE TABLE book_identifiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id TEXT UNIQUE NOT NULL, -- SC-YYYY-XXXXX format
    story_id INTEGER NOT NULL,
    edition INTEGER DEFAULT 1,
    version TEXT DEFAULT '1.0.0',
    blockchain_tx_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id)
);

-- Agent Selection System (pay-per-use)
CREATE TABLE available_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_type TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_cost_celo REAL DEFAULT 0, -- Cost in cUSD or CELO
    is_premium BOOLEAN DEFAULT FALSE,
    tier_required TEXT DEFAULT 'free', -- free, author, publisher
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agent Wallet/Selections (pay to unlock)
CREATE TABLE agent_selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    story_id INTEGER NOT NULL,
    agent_type TEXT NOT NULL,
    cost_paid_celo REAL,
    payment_tx_hash TEXT,
    status TEXT DEFAULT 'active', -- active, completed, refunded
    selected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME, -- Some agents time-limited
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (story_id) REFERENCES stories(id)
);

-- User Celo Wallets
CREATE TABLE user_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    celo_address TEXT UNIQUE,
    encrypted_private_key TEXT, -- Store encrypted, not plain
    wallet_type TEXT DEFAULT 'custodial', -- custodial, external
    cusd_balance REAL DEFAULT 0,
    celo_balance REAL DEFAULT 0,
    total_earned_celo REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Contribution Weights (track % participation)
CREATE TABLE story_contribution_weights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    total_characters INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    contribution_count INTEGER DEFAULT 0,
    percentage_share REAL DEFAULT 0, -- 0.0 to 1.0
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(story_id, user_id)
);

-- Editor Reviews (linked to agent selections)
CREATE TABLE editor_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    agent_type TEXT NOT NULL,
    agent_selection_id INTEGER, -- Link to what user paid for
    score INTEGER CHECK(score >= 1 AND score <= 10),
    feedback TEXT,
    suggestions TEXT, -- JSON array of suggestions
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_selection_id) REFERENCES agent_selections(id)
);

-- Publication Submissions v2 (weighted revenue)
CREATE TABLE publication_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL,
    submitted_by INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, under_review, approved, rejected, published
    book_id TEXT, -- SC-XXXXX identifier
    price_celo REAL DEFAULT 0.99, -- Price in cUSD
    preview_pages_free INTEGER DEFAULT 3,
    preview_pages_paid INTEGER DEFAULT 10,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    published_at DATETIME,
    total_reviews_required INTEGER DEFAULT 3,
    total_reviews_completed INTEGER DEFAULT 0,
    blockchain_listing_tx TEXT,
    FOREIGN KEY (story_id) REFERENCES stories(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES book_identifiers(book_id)
);

-- E-book Purchases (Celo-based)
CREATE TABLE ebook_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id TEXT NOT NULL,
    buyer_id INTEGER NOT NULL,
    price_paid_celo REAL NOT NULL,
    platform_fee_celo REAL, -- 10% to StoryChain
    revenue_shared_celo REAL, -- 90% to contributors
    payment_tx_hash TEXT,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES book_identifiers(book_id),
    FOREIGN KEY (buyer_id) REFERENCES users(id)
);

-- Revenue Distribution (automatic weighted splits)
CREATE TABLE revenue_distributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    percentage_share REAL NOT NULL, -- Their % of story
    amount_celo REAL NOT NULL,
    distribution_tx_hash TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (purchase_id) REFERENCES ebook_purchases(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User Library (purchased books)
CREATE TABLE user_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id TEXT NOT NULL,
    purchase_id INTEGER NOT NULL,
    can_download BOOLEAN DEFAULT TRUE,
    reading_progress INTEGER DEFAULT 0, -- Page number
    last_read_at DATETIME,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES book_identifiers(book_id),
    FOREIGN KEY (purchase_id) REFERENCES ebook_purchases(id),
    UNIQUE(user_id, book_id)
);

-- Preview Access Log (track tier-based previews)
CREATE TABLE preview_access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id TEXT NOT NULL,
    pages_allowed INTEGER,
    pages_viewed INTEGER DEFAULT 0,
    tier_at_time TEXT,
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES book_identifiers(book_id)
);

-- Insert default agents
INSERT INTO available_agents (agent_type, name, description, base_cost_celo, is_premium, tier_required) VALUES
('grammar', 'Grammar Editor', 'Technical prose quality: spelling, grammar, sentence structure', 0, FALSE, 'free'),
('plot', 'Plot Editor', 'Story structure, conflict arcs, narrative flow', 2.00, TRUE, 'author'),
('character', 'Character Editor', 'Character development, dialogue, consistency', 2.00, TRUE, 'author'),
('pacing', 'Pacing Editor', 'Scene rhythm, tension management, flow', 1.50, TRUE, 'free'),
('engagement', 'Engagement Editor', 'Hooks, emotional resonance, reader retention', 3.00, TRUE, 'author'),
('marketability', 'Marketability Editor', 'Commercial potential, genre fit, market positioning', 3.50, TRUE, 'publisher');

-- Create indexes
CREATE INDEX idx_weights_story ON story_contribution_weights(story_id);
CREATE INDEX idx_weights_user ON story_contribution_weights(user_id);
CREATE INDEX idx_book_ids ON book_identifiers(story_id);
CREATE INDEX idx_agent_selections_user ON agent_selections(user_id);
CREATE INDEX idx_agent_selections_story ON agent_selections(story_id);
CREATE INDEX idx_purchases_book ON ebook_purchases(book_id);
CREATE INDEX idx_purchases_buyer ON ebook_purchases(buyer_id);
CREATE INDEX idx_revenue_dist_purchase ON revenue_distributions(purchase_id);
CREATE INDEX idx_library_user ON user_library(user_id);
CREATE INDEX idx_preview_log_user ON preview_access_log(user_id);
