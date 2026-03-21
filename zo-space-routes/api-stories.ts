import type { Context } from "hono";
import { Database } from "bun:sqlite";
import { timingSafeEqual } from "node:crypto";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = new Database("/home/workspace/StoryChain/data/storychain.db");
    db.run("PRAGMA foreign_keys = ON");
    db.run("PRAGMA journal_mode = WAL");
  }
  return db;
}

function requireAuth(c: Context): { userId: string; email: string } | Response {
  const auth = c.req.header("authorization");
  
  console.log("[AUTH] Authorization header:", auth ? `Present (${auth.length} chars)` : "Missing");
  
  if (!auth || auth.trim() === "" || auth.trim() === "Bearer") {
    console.log("[AUTH] No auth header or empty - allowing anonymous");
    return { userId: "anonymous", email: "anon@storychain.local" };
  }
  
  if (!auth.startsWith("Bearer ")) {
    console.log("[AUTH] Invalid auth format");
    return c.json({ error: "Invalid authorization format" }, 401);
  }
  
  const token = auth.slice(7).trim();
  if (!token) {
    console.log("[AUTH] Empty token - allowing anonymous");
    return { userId: "anonymous", email: "anon@storychain.local" };
  }
  
  const expectedToken = process.env.ZO_CLIENT_IDENTITY_TOKEN;
  if (!expectedToken) {
    console.log("[AUTH] No server token configured - accepting token");
    return { userId: "user_" + token.slice(-16), email: "user@storychain.local" };
  }
  
  const aBytes = Buffer.from(token);
  const bBytes = Buffer.from(expectedToken);
  
  if (aBytes.length !== bBytes.length) {
    console.log("[AUTH] Token length mismatch - using anonymous");
    return { userId: "anonymous", email: "anon@storychain.local" };
  }
  
  if (!timingSafeEqual(aBytes, bBytes)) {
    console.log("[AUTH] Token mismatch - using anonymous");
    return { userId: "anonymous", email: "anon@storychain.local" };
  }
  
  console.log("[AUTH] Token validated");
  return { userId: "user_" + token.slice(-16), email: "user@storychain.local" };
}

// Ensure anonymous user exists in the database
async function ensureAnonymousUser(database: Database): Promise<void> {
  const user = database.query("SELECT id FROM users WHERE id = ?").get("anonymous") as any;
  if (!user) {
    console.log("[ENSURE USER] Creating anonymous user");
    try {
      database.run(
        "INSERT INTO users (id, username, email, tokens, preferred_model) VALUES (?, ?, ?, ?, ?)",
        ["anonymous", "anon", "anon@storychain.local", 1000, "kimi-k2.5"]
      );
      console.log("[ENSURE USER] Anonymous user created");
    } catch (err) {
      // User might already exist (race condition)
      console.log("[ENSURE USER] User may already exist:", err);
    }
  } else {
    console.log("[ENSURE USER] Anonymous user exists");
  }
}

export default async function handler(c: Context) {
  const database = await getDb();
  
  // Handle GET - List stories
  if (c.req.method === "GET") {
    try {
      const sort = c.req.query("sort") || "newest";
      const limit = parseInt(c.req.query("limit") || "12");
      
      let orderBy = "s.created_at DESC";
      if (sort === "popular") orderBy = "likeCount DESC";
      if (sort === "oldest") orderBy = "s.created_at ASC";
      
      const stories = database.query(`
        SELECT s.*, u.username as authorName,
               (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) as contributionCount,
               (SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) as likeCount
        FROM stories s
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.is_completed = FALSE
        ORDER BY ${orderBy}
        LIMIT ?
      `).all(limit) as any[];
      
      return c.json({ stories: stories.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content,
        authorId: s.author_id,
        authorName: s.authorName,
        modelUsed: s.model_used,
        characterCount: s.character_count,
        contributionCount: s.contributionCount,
        likeCount: s.likeCount,
        createdAt: s.created_at,
      })) });
    } catch (error) {
      console.error("[LIST STORIES ERROR]", error);
      return c.json({ error: "Failed to load stories" }, 500);
    }
  }
  
  // Handle POST - Create story
  if (c.req.method === "POST") {
    console.log("[CREATE STORY] ========== START ==========");
    
    const auth = requireAuth(c);
    if (auth instanceof Response) {
      console.log("[CREATE STORY] Auth failed");
      return auth;
    }

    console.log("[CREATE STORY] User:", auth.userId);
    const startTime = Date.now();

    try {
      const body = await c.req.json();
      console.log("[CREATE STORY] Body:", { 
        title: body?.title, 
        hasContent: !!body?.content,
        contentLength: body?.content?.length,
        modelUsed: body?.modelUsed,
        ai_persona: body?.ai_persona
      });
      
      const { 
        title, 
        content, 
        modelUsed, 
        ai_persona,
        tokensSpent: requestedTokensSpent 
      } = body;

      // Validate title
      if (!title?.trim()) {
        console.log("[CREATE STORY] Validation failed: missing title");
        return c.json({ error: "Title is required" }, 400);
      }
      
      // Detect AI mode
      const isAIMode = !!ai_persona;
      console.log("[CREATE STORY] Mode:", isAIMode ? "AI" : "Manual");
      
      // For manual mode, content is required
      if (!isAIMode && !content?.trim()) {
        console.log("[CREATE STORY] Validation failed: manual mode requires content");
        return c.json({ error: "Content is required for manual stories" }, 400);
      }

      const characterCount = content?.length || 0;
      const tokensSpent = requestedTokensSpent || 0;
      const maxCharacters = 10000;

      if (characterCount > maxCharacters) {
        return c.json({
          error: `Content exceeds limit: ${characterCount} > ${maxCharacters}`,
        }, 400);
      }

      // Ensure anonymous user exists BEFORE starting transaction
      if (auth.userId === "anonymous") {
        await ensureAnonymousUser(database);
      }

      // Get or create user
      let user = database.query("SELECT * FROM users WHERE id = ?").get(auth.userId) as any;
      console.log("[CREATE STORY] User lookup:", user ? "Found" : "Not found");

      if (!user) {
        console.log("[CREATE STORY] Creating user:", auth.userId);
        try {
          database.run(
            "INSERT INTO users (id, username, email, tokens, preferred_model) VALUES (?, ?, ?, ?, ?)",
            [auth.userId, auth.email.split("@")[0], auth.email, 1000, modelUsed || "kimi-k2.5"]
          );
          user = { tokens: 1000 };
          console.log("[CREATE STORY] User created");
        } catch (userErr) {
          console.error("[CREATE STORY] User creation error:", userErr);
          // Try to fetch again in case of race condition
          user = database.query("SELECT * FROM users WHERE id = ?").get(auth.userId) as any;
        }
      }

      if (!user) {
        console.error("[CREATE STORY] User still not found after creation attempt");
        return c.json({ error: "Failed to create user" }, 500);
      }

      // Check tokens
      const currentTokens = user.tokens || 0;
      console.log("[CREATE STORY] Tokens - have:", currentTokens, "need:", tokensSpent);
      
      if (tokensSpent > currentTokens) {
        return c.json({
          error: `Insufficient tokens. Need ${tokensSpent}, have ${currentTokens}`,
        }, 402);
      }

      const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use explicit transaction with deferred foreign keys
      database.run("BEGIN TRANSACTION");
      
      try {
        // Temporarily disable foreign key checks during transaction
        database.run("PRAGMA defer_foreign_keys = ON");
        
        if (tokensSpent > 0) {
          console.log("[CREATE STORY] Deducting tokens:", tokensSpent);
          database.run("UPDATE users SET tokens = tokens - ? WHERE id = ?", [tokensSpent, auth.userId]);
          
          const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log("[CREATE STORY] Recording transaction:", txId);
          database.run(
            "INSERT INTO token_transactions (id, user_id, amount, type, description, story_id) VALUES (?, ?, ?, ?, ?, ?)",
            [txId, auth.userId, -tokensSpent, "spend", "Story creation", storyId]
          );
        }

        console.log("[CREATE STORY] Inserting story:", storyId);
        database.run(
          `INSERT INTO stories (id, title, content, author_id, model_used, character_count, tokens_spent, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [storyId, title.trim(), content?.trim() || "", auth.userId, modelUsed || "kimi-k2.5", characterCount, tokensSpent]
        );
        
        database.run("COMMIT");
        console.log("[CREATE STORY] Transaction committed");
      } catch (txError) {
        database.run("ROLLBACK");
        console.error("[CREATE STORY] Transaction failed:", txError);
        throw txError;
      }

      // Log API usage
      try {
        const usageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        database.run(
          "INSERT INTO api_usage (id, user_id, model, endpoint, tokens_input, tokens_output, latency_ms, success) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [usageId, auth.userId, modelUsed || "kimi-k2.5", "/api/stories", characterCount, 0, Date.now() - startTime, true]
        );
      } catch (usageErr) {
        // Non-critical, just log
        console.log("[CREATE STORY] API usage log failed:", usageErr);
      }

      const story = database.query("SELECT * FROM stories WHERE id = ?").get(storyId) as any;
      console.log("[CREATE STORY] ========== SUCCESS ==========", storyId);
      
      return c.json({
        story: {
          id: story.id,
          title: story.title,
          content: story.content,
          authorId: story.author_id,
          modelUsed: story.model_used,
          characterCount: story.character_count,
          tokensSpent: story.tokens_spent,
          createdAt: story.created_at,
        },
      }, 201);
    } catch (error) {
      console.error("[CREATE STORY] ========== ERROR ==========", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
  
  return c.json({ error: "Method not allowed" }, 405);
}
