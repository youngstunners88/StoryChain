-- ============================================
-- STORYCHAIN V3 - CATEGORIES & CHARACTER PRICING
-- ============================================

-- Content Categories (NOT genres - no creative constraints)
CREATE TABLE IF NOT EXISTS content_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    avg_word_count INTEGER, -- Typical length for this category
    icon TEXT, -- Lucide icon name
    color TEXT, -- Category color (hex)
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert categories (format only, NO genre constraints)
INSERT INTO content_categories (slug, name, description, avg_word_count, icon, color) VALUES
('novel', 'Novel', 'Long-form fiction, typically 50,000+ words. Stories that unfold across chapters.', 80000, 'book-open', '#3b82f6'),
('novella', 'Novella', 'Medium fiction, 17,000-50,000 words. Between short story and novel.', 30000, 'book-marked', '#8b5cf6'),
('short_story', 'Short Story', 'Brief fiction, under 17,000 words. Complete narratives in compact form.', 5000, 'feather', '#10b981'),
('magazine_article', 'Magazine Article', 'Journalistic or feature writing. Non-fiction storytelling.', 2000, 'newspaper', '#f59e0b'),
('blog_post', 'Blog Post', 'Informal, episodic content. Personal essays and serialized thoughts.', 1000, 'file-text', '#ec4899'),
('screenplay', 'Screenplay', 'Script format for film/TV. Dialogue and scene directions.', 15000, 'clapperboard', '#6366f1'),
('poetry', 'Poetry', 'Verse and poetic forms. Rhyme, rhythm, and creative expression.', 500, 'sparkles', '#f472b6'),
('anthology', 'Anthology', 'Collection of works by multiple authors. Curated compilations.', 50000, 'library', '#14b8a6'),
('interactive', 'Interactive Story', 'Choose-your-path narrative. Branching storylines.', 10000, 'git-branch', '#84cc16');

-- Link stories to categories (stories can have ONE category but ANY genre)
ALTER TABLE stories ADD COLUMN category_slug TEXT;
ALTER TABLE stories ADD COLUMN FOREIGN KEY (category_slug) REFERENCES content_categories(slug);

-- Character-based pricing tiers (user-specified amounts)
CREATE TABLE IF NOT EXISTS character_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tier_name TEXT UNIQUE NOT NULL,
    min_chars INTEGER NOT NULL,
    max_chars INTEGER NOT NULL,
    price_cusd REAL NOT NULL,
    price_eth REAL,
    price_sol REAL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User-specified pricing tiers
INSERT INTO character_pricing (tier_name, min_chars, max_chars, price_cusd, price_eth, price_sol, description) VALUES
('free', 0, 300, 0.00, 0.000000, 0.000000, 'Free tier - quick thoughts and ideas'),
('short', 301, 700, 0.50, 0.000150, 0.003500, 'Short paragraphs - developing ideas'),
('scene', 701, 1600, 1.00, 0.000300, 0.007000, 'Full scene - character development'),
('chapter', 1601, 3900, 2.50, 0.000750, 0.017500, 'Chapter segment - substantial content'),
('extended', 3901, 4700, 3.00, 0.000900, 0.021000, 'Extended content - deep storytelling');

-- Track character usage per user per day
CREATE TABLE IF NOT EXISTS user_character_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL, -- YYYY-MM-DD format
    tier_free_used INTEGER DEFAULT 0, -- chars at free tier
    tier_short_used INTEGER DEFAULT 0, -- chars at $0.50 tier
    tier_scene_used INTEGER DEFAULT 0, -- chars at $1.00 tier
    tier_chapter_used INTEGER DEFAULT 0, -- chars at $2.50 tier
    tier_extended_used INTEGER DEFAULT 0, -- chars at $3.00 tier
    total_spent_cusd REAL DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, date)
);

-- Track individual agent submissions with pricing
CREATE TABLE IF NOT EXISTS agent_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    story_id INTEGER NOT NULL,
    session_id INTEGER, -- Reference to user_time_sessions
    content TEXT NOT NULL,
    character_count INTEGER NOT NULL,
    tier_id INTEGER NOT NULL,
    price_paid_cusd REAL NOT NULL,
    was_free_period BOOLEAN DEFAULT FALSE,
    model_used TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (story_id) REFERENCES stories(id),
    FOREIGN KEY (tier_id) REFERENCES character_pricing(id),
    FOREIGN KEY (session_id) REFERENCES user_time_sessions(id)
);

-- Category browsing stats (for discovery)
CREATE TABLE IF NOT EXISTS category_stats (
    category_slug TEXT PRIMARY KEY,
    total_stories INTEGER DEFAULT 0,
    total_contributions INTEGER DEFAULT 0,
    avg_contributions_per_story REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_slug) REFERENCES content_categories(slug)
);

-- Initialize stats for all categories
INSERT OR IGNORE INTO category_stats (category_slug) 
SELECT slug FROM content_categories;

-- Index for fast category lookups
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category_slug);
CREATE INDEX IF NOT EXISTS idx_agent_submissions_user_date ON agent_submissions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_character_usage_date ON user_character_usage(user_id, date);
