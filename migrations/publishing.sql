-- StoryChain Publishing System Migration
-- Creates tables for e-book publishing, editor reviews, and store

-- Publication tiers for users
CREATE TABLE IF NOT EXISTS publication_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly INTEGER NOT NULL, -- in cents
    max_submissions_per_month INTEGER NOT NULL,
    editor_feedback_enabled BOOLEAN DEFAULT 0,
    revenue_share_percent INTEGER DEFAULT 70, -- author keeps this %
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default tiers
INSERT OR IGNORE INTO publication_tiers (id, name, description, price_monthly, max_submissions_per_month, editor_feedback_enabled, revenue_share_percent) VALUES
(1, 'reader', 'Story readers, no publishing', 0, 0, 0, 0),
(2, 'writer', 'Basic writer, self-publish only', 0, 0, 0, 70),
(3, 'author', 'Serious author with editor support', 999, 3, 1, 75),
(4, 'publisher', 'Professional publishing tier', 2999, 10, 1, 80);

-- User tier subscriptions
CREATE TABLE IF NOT EXISTS user_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    tier_id INTEGER NOT NULL REFERENCES publication_tiers(id),
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    active BOOLEAN DEFAULT 1,
    UNIQUE(user_id, tier_id)
);

-- Story publication submissions
CREATE TABLE IF NOT EXISTS publication_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER NOT NULL REFERENCES stories(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    tier_id INTEGER NOT NULL REFERENCES publication_tiers(id),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, in_review, approved, rejected, published
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    published_at DATETIME,
    price_cents INTEGER DEFAULT 499, -- default $4.99
    isbn TEXT, -- generated ISBN for published books
    sales_count INTEGER DEFAULT 0,
    revenue_total_cents INTEGER DEFAULT 0,
    UNIQUE(story_id)
);

-- Editor agent reviews
CREATE TABLE IF NOT EXISTS editor_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL REFERENCES publication_submissions(id),
    editor_agent_name TEXT NOT NULL, -- e.g., 'plot_editor', 'grammar_editor'
    category TEXT NOT NULL, -- plot, characters, grammar, pacing, engagement
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    feedback TEXT NOT NULL,
    suggestions TEXT, -- JSON array of specific suggestions
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated editor verdict
CREATE TABLE IF NOT EXISTS editor_verdicts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL REFERENCES publication_submissions(id),
    overall_score REAL NOT NULL, -- average of all category scores
    recommendation TEXT NOT NULL, -- approve, reject, revise
    summary TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id)
);

-- E-book purchases
CREATE TABLE IF NOT EXISTS ebook_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publication_id INTEGER NOT NULL REFERENCES publication_submissions(id),
    buyer_id INTEGER NOT NULL REFERENCES users(id),
    price_paid_cents INTEGER NOT NULL,
    author_earnings_cents INTEGER NOT NULL,
    platform_earnings_cents INTEGER NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    download_url TEXT,
    UNIQUE(publication_id, buyer_id)
);

-- User library (purchased books)
CREATE TABLE IF NOT EXISTS user_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    publication_id INTEGER NOT NULL REFERENCES publication_submissions(id),
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_read_at DATETIME,
    reading_progress_percent INTEGER DEFAULT 0,
    UNIQUE(user_id, publication_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_submissions_status ON publication_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON publication_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_editor_reviews_submission ON editor_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON ebook_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_publication ON ebook_purchases(publication_id);
CREATE INDEX IF NOT EXISTS idx_library_user ON user_library(user_id);

-- Migration tracking
INSERT OR IGNORE INTO migrations (name) VALUES ('publishing');
