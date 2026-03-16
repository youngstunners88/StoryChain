-- StoryChain Platform v3 Database Schema
-- IP Registry + Multi-Wallet + Time-Based Freemium + Character Pricing

-- ============================================
-- CONTENT CATEGORIES (NOT GENRES)
-- ============================================
CREATE TABLE IF NOT EXISTS content_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    avg_word_count INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO content_categories (slug, name, description, avg_word_count, sort_order) VALUES
('novel', 'Novel', 'Long-form fiction, typically 50,000+ words', 80000, 1),
('novella', 'Novella', 'Medium fiction, 17,000-50,000 words', 30000, 2),
('short_story', 'Short Story', 'Brief fiction, under 17,000 words', 5000, 3),
('magazine_article', 'Magazine Article', 'Journalistic or feature-style writing', 2000, 4),
('blog_post', 'Blog Post', 'Informal, episodic content', 1000, 5),
('screenplay', 'Screenplay', 'Script format for film/TV', 15000, 6),
('poetry', 'Poetry', 'Verse and poetic forms', 500, 7),
('anthology', 'Anthology', 'Collection of related works', 50000, 8),
('interactive', 'Interactive Story', 'Choose-your-path narrative', 10000, 9),
('serialized', 'Serialized Fiction', 'Episodic releases forming larger narrative', 3000, 10);

-- ============================================
-- CHARACTER-BASED PRICING TIERS
-- ============================================
CREATE TABLE IF NOT EXISTS character_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tier_name TEXT NOT NULL,
    min_chars INTEGER NOT NULL,
    max_chars INTEGER NOT NULL,
    price_cusd REAL NOT NULL,
    price_eth REAL DEFAULT 0,
    price_sol REAL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO character_pricing (tier_name, min_chars, max_chars, price_cusd, description) VALUES
('free', 1, 300, 0.00, 'Free tier - ideas, quick thoughts, brainstorming'),
('short', 301, 700, 0.50, 'Short paragraphs and brief scenes'),
('medium', 701, 1600, 1.00, 'Full scenes and story segments'),
('long', 1601, 3900, 2.50, 'Extended content and chapter sections'),
('extended', 3901, 10000, 3.00, 'Long-form contributions'),
('premium', 10001, 50000, 5.00, 'Premium tier for maximum length');

-- ============================================
-- MULTI-WALLET SUPPORT (v3)
-- ============================================
CREATE TABLE IF NOT EXISTS user_wallets_v3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    wallet_type TEXT NOT NULL, -- metamask, phantom, rabby, tokenpocket, safepal, etc.
    wallet_name TEXT, -- Display name (e.g., "My MetaMask")
    chain TEXT NOT NULL, -- ethereum, solana, cosmos, celo
    address TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_message TEXT, -- Message user signed to verify
    verification_signature TEXT, -- The actual signature
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, address)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON user_wallets_v3(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON user_wallets_v3(address);

-- Wallet connection nonce for verification
CREATE TABLE IF NOT EXISTS wallet_verification_nonces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    wallet_address TEXT NOT NULL,
    nonce TEXT NOT NULL,
    message TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TIME-BASED FREEMIUM SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS user_time_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_type TEXT NOT NULL, -- free_period, cooldown, paid, unlimited
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    characters_used INTEGER DEFAULT 0,
    characters_paid INTEGER DEFAULT 0,
    cost_incurred_cusd REAL DEFAULT 0,
    cost_incurred_eth REAL DEFAULT 0,
    cost_incurred_sol REAL DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, expired, completed, extended
    extended_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_time_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON user_time_sessions(status);

-- User session state cache (for fast lookups)
CREATE TABLE IF NOT EXISTS user_session_state (
    user_id INTEGER PRIMARY KEY,
    current_session_id INTEGER,
    session_type TEXT,
    free_time_remaining_minutes INTEGER DEFAULT 120,
    cooldown_time_remaining_minutes INTEGER DEFAULT 0,
    next_free_reset_at DATETIME,
    total_characters_today INTEGER DEFAULT 0,
    total_spent_today_cusd REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (current_session_id) REFERENCES user_time_sessions(id)
);

-- ============================================
-- IP REGISTRY (INTELLECTUAL PROPERTY)
-- ============================================
CREATE TABLE IF NOT EXISTS ip_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER UNIQUE NOT NULL,
    isbn TEXT, -- Kept as requested (optional)
    isbn_13 TEXT,
    isbn_10 TEXT,
    content_hash TEXT NOT NULL, -- SHA256 of final content
    content_uri TEXT, -- IPFS or Arweave URI
    title TEXT NOT NULL,
    description TEXT,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    registration_tx_hash TEXT, -- Blockchain transaction
    
    -- Commercial rights settings
    commercial_rights_enabled BOOLEAN DEFAULT FALSE,
    licensing_terms TEXT DEFAULT 'all_rights_reserved', -- all_rights, cc_by, cc_by_sa, cc_by_nc, etc.
    commercial_license_price_cusd REAL, -- Price for commercial license
    
    -- NFT/Tokenization
    nft_contract_address TEXT,
    nft_token_id TEXT,
    nft_standard TEXT, -- erc721, erc1155
    nft_minted_at DATETIME,
    
    -- Status
    status TEXT DEFAULT 'active', -- active, disputed, revoked, expired
    dispute_reason TEXT,
    
    FOREIGN KEY (story_id) REFERENCES stories(id)
);

CREATE INDEX IF NOT EXISTS idx_ip_story ON ip_registry(story_id);
CREATE INDEX IF NOT EXISTS idx_ip_isbn ON ip_registry(isbn);
CREATE INDEX IF NOT EXISTS idx_ip_hash ON ip_registry(content_hash);

-- ============================================
-- FRACTIONAL IP OWNERSHIP
-- ============================================
CREATE TABLE IF NOT EXISTS ip_ownership (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_registry_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    ownership_percentage REAL NOT NULL CHECK(ownership_percentage > 0 AND ownership_percentage <= 100),
    role TEXT NOT NULL, -- creator, contributor, editor, illustrator, translator, narrator
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at DATETIME,
    verification_signature TEXT, -- Digital signature
    verification_tx_hash TEXT, -- On-chain verification
    
    -- Commercial acknowledgment
    display_name TEXT, -- How they want to be credited
    attribution_order INTEGER, -- Order in credits (1 = first)
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ip_registry_id) REFERENCES ip_registry(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(ip_registry_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ip_ownership_registry ON ip_ownership(ip_registry_id);
CREATE INDEX IF NOT EXISTS idx_ip_ownership_user ON ip_ownership(user_id);

-- ============================================
-- COMMERCIAL LICENSES
-- ============================================
CREATE TABLE IF NOT EXISTS commercial_licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_registry_id INTEGER NOT NULL,
    licensee_user_id INTEGER, -- If user on platform
    licensee_name TEXT, -- External entity
    licensee_email TEXT,
    license_type TEXT NOT NULL, -- film, tv, game, merchandise, audiobook, translation
    license_scope TEXT, -- exclusive, non_exclusive
    license_duration TEXT, -- perpetual, limited
    license_territory TEXT, -- worldwide, regional
    
    -- Financial
    license_fee_cusd REAL NOT NULL,
    revenue_share_percentage REAL, -- If ongoing royalties
    upfront_payment_cusd REAL,
    
    -- Distribution to IP owners
    total_distributed_cusd REAL DEFAULT 0,
    distribution_status TEXT DEFAULT 'pending', -- pending, partial, complete
    
    -- Documentation
    contract_uri TEXT, -- Link to contract document
    signed_at DATETIME,
    expires_at DATETIME,
    status TEXT DEFAULT 'pending', -- pending, active, expired, terminated
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ip_registry_id) REFERENCES ip_registry(id),
    FOREIGN KEY (licensee_user_id) REFERENCES users(id)
);

-- Commercial license revenue distribution
CREATE TABLE IF NOT EXISTS commercial_revenue_distributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_id INTEGER NOT NULL,
    ip_ownership_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    ownership_percentage_at_time REAL NOT NULL,
    amount_cusd REAL NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, sent, received
    sent_at DATETIME,
    tx_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (license_id) REFERENCES commercial_licenses(id),
    FOREIGN KEY (ip_ownership_id) REFERENCES ip_ownership(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- STORY CATEGORIES (Updated stories table)
-- ============================================
-- Add category to existing stories table
ALTER TABLE stories ADD COLUMN category_slug TEXT REFERENCES content_categories(slug);
ALTER TABLE stories ADD COLUMN subcategory TEXT; -- User-defined, no constraints
ALTER TABLE stories ADD COLUMN is_ip_registered BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN ip_registry_id INTEGER REFERENCES ip_registry(id);

-- ============================================
-- AGENT USAGE TRACKING (Character-based billing)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    story_id INTEGER NOT NULL,
    session_id INTEGER,
    
    -- Content details
    content_submitted TEXT,
    character_count INTEGER NOT NULL,
    word_count INTEGER,
    
    -- Pricing applied
    pricing_tier_id INTEGER,
    price_paid_cusd REAL DEFAULT 0,
    
    -- Agent results
    agent_types_used TEXT, -- JSON array: ["grammar", "pacing"]
    agent_feedback TEXT, -- JSON object with results
    
    -- Payment
    wallet_address TEXT,
    tx_hash TEXT,
    payment_status TEXT DEFAULT 'pending', -- pending, confirmed, failed
    
    -- Free tier tracking
    was_free_tier BOOLEAN DEFAULT FALSE,
    free_chars_remaining_after INTEGER,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (story_id) REFERENCES stories(id),
    FOREIGN KEY (session_id) REFERENCES user_time_sessions(id),
    FOREIGN KEY (pricing_tier_id) REFERENCES character_pricing(id)
);

CREATE INDEX IF NOT EXISTS idx_agent_usage_user ON agent_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_story ON agent_usage_logs(story_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_date ON agent_usage_logs(created_at);

-- ============================================
-- USER PREFERENCES (Updated)
-- ============================================
ALTER TABLE users ADD COLUMN preferred_wallet_id INTEGER REFERENCES user_wallets_v3(id);
ALTER TABLE users ADD COLUMN preferred_chain TEXT DEFAULT 'ethereum';
ALTER TABLE users ADD COLUMN auto_extend_sessions BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN session_reminder_minutes INTEGER DEFAULT 10;

-- ============================================
-- VIEWS FOR CONVENIENCE
-- ============================================

-- View: Story IP summary
CREATE VIEW IF NOT EXISTS story_ip_summary AS
SELECT 
    s.id as story_id,
    s.title,
    s.category_slug,
    cc.name as category_name,
    ir.isbn,
    ir.content_hash,
    ir.commercial_rights_enabled,
    ir.nft_token_id,
    COUNT(io.user_id) as contributor_count,
    SUM(io.ownership_percentage) as total_percentage
FROM stories s
LEFT JOIN ip_registry ir ON s.id = ir.story_id
LEFT JOIN ip_ownership io ON ir.id = io.ip_registry_id
LEFT JOIN content_categories cc ON s.category_slug = cc.slug
GROUP BY s.id;

-- View: User wallet summary
CREATE VIEW IF NOT EXISTS user_wallet_summary AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(wv3.id) as wallet_count,
    GROUP_CONCAT(DISTINCT wv3.chain) as chains,
    GROUP_CONCAT(DISTINCT wv3.wallet_type) as wallet_types
FROM users u
LEFT JOIN user_wallets_v3 wv3 ON u.id = wv3.user_id
GROUP BY u.id;

-- View: User current session status
CREATE VIEW IF NOT EXISTS user_session_status AS
SELECT 
    u.id as user_id,
    u.username,
    uss.session_type,
    uss.free_time_remaining_minutes,
    uss.cooldown_time_remaining_minutes,
    uss.next_free_reset_at,
    uss.total_characters_today,
    uss.total_spent_today_cusd,
    CASE 
        WHEN uss.cooldown_time_remaining_minutes > 0 THEN 'cooldown'
        WHEN uss.free_time_remaining_minutes > 0 THEN 'free'
        ELSE 'paid'
    END as effective_status
FROM users u
LEFT JOIN user_session_state uss ON u.id = uss.user_id;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update session state when time session changes
CREATE TRIGGER IF NOT EXISTS update_session_state_on_insert
AFTER INSERT ON user_time_sessions
BEGIN
    INSERT INTO user_session_state (user_id, current_session_id, session_type, free_time_remaining_minutes, last_updated)
    VALUES (
        NEW.user_id,
        NEW.id,
        NEW.session_type,
        CASE WHEN NEW.session_type = 'free_period' THEN 120 ELSE 0 END,
        datetime('now')
    )
    ON CONFLICT(user_id) DO UPDATE SET
        current_session_id = NEW.id,
        session_type = NEW.session_type,
        free_time_remaining_minutes = CASE WHEN NEW.session_type = 'free_period' THEN 120 ELSE 0 END,
        cooldown_time_remaining_minutes = CASE WHEN NEW.session_type = 'cooldown' THEN 180 ELSE 0 END,
        last_updated = datetime('now');
END;

COMMIT;
