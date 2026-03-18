import type { Context } from "hono";
import { Database } from "bun:sqlite";
import { timingSafeEqual } from "node:crypto";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = new Database("/home/workspace/StoryChain/data/storychain.db");
    db.run("PRAGMA foreign_keys = ON");
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
    console.log("[AUTH] Invalid auth format - must start with 'Bearer '");
    return c.json({ error: "Invalid authorization format. Use 'Bearer <token>'" }, 401);
  }
  
  const token = auth.slice(7).trim();
  
  if (!token) {
    console.log("[AUTH] Empty token after Bearer - allowing anonymous");
    return { userId: "anonymous", email: "anon@storychain.local" };
  }
  
  const expectedToken = process.env.ZO_CLIENT_IDENTITY_TOKEN;
  
  if (!expectedToken) {
    console.log("[AUTH] No ZO_CLIENT_IDENTITY_TOKEN configured - accepting provided token");
    return { userId: "user_" + token.slice(-16), email: "user@storychain.local" };
  }
  
  const aBytes = Buffer.from(token);
  const bBytes = Buffer.from(expectedToken);
  
  if (aBytes.length !== bBytes.length) {
    console.log("[AUTH] Token length mismatch - allowing anonymous for guest mode");
    return { userId: "anonymous", email: "anon@storychain.local" };
  }
  
  if (!timingSafeEqual(aBytes, bBytes)) {
    console.log("[AUTH] Token mismatch - allowing anonymous for guest mode");
    return { userId: "anonymous", email: "anon@storychain.local" };
  }
  
  console.log("[AUTH] Token validated successfully");
  return { userId: "user_" + token.slice(-16), email: "user@storychain.local" };
}

export default async function handler(c: Context) {
  const database = await getDb();
  
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
  
  if (c.req.method === "POST") {
    console.log("[CREATE STORY] Starting request");
    
    const auth = requireAuth(c);
    if (auth instanceof Response) {
      console.log("[CREATE STORY] Auth failed, returning error response");
      return auth;
    }

    const startTime = Date.now();

    try {
      const body = await c.req.json();
      console.log("[CREATE STORY] Body received:", { title: body?.title, contentLength: body?.content?.length });
      
      const { title, content, modelUsed } = body;

      if (!title?.trim() || !content?.trim()) {
        return c.json({ error: "Title and content are required" }, 400);
      }

      const characterCount = content.length;
      const tokensSpent = 0;
      const maxCharacters = 10000;

      if (characterCount > maxCharacters) {
        return c.json({
          error: `Content exceeds character limit: ${characterCount} > ${maxCharacters}`,
        }, 400);
      }

      const validModels = ["kimi-k2.5", "reka-edge", "qwen-2.5", "mercury-2", "llama-3.1", "gemma-2", "mixtral-8x7b", "gemini-pro"];
      if (!validModels.includes(modelUsed)) {
        return c.json({ error: `Invalid model. Valid models: ${validModels.join(", ")}` }, 400);
      }

      let user = database.query("SELECT * FROM users WHERE id = ?").get(auth.userId);

      if (!user) {
        console.log("[CREATE STORY] Creating new user:", auth.userId);
        database.run(
          "INSERT INTO users (id, username, email, tokens, preferred_model) VALUES (?, ?, ?, 1000, ?)",
          [auth.userId, auth.email.split("@")[0], auth.email, "kimi-k2.5"]
        );
        user = { tokens: 1000 };
      }

      if (tokensSpent > user.tokens) {
        return c.json({
          error: `Insufficient tokens. Need ${tokensSpent}, have ${user.tokens}`,
        }, 402);
      }

      const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (tokensSpent > 0) {
        database.run("UPDATE users SET tokens = tokens - ? WHERE id = ?", [tokensSpent, auth.userId]);
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        database.run(
          "INSERT INTO token_transactions (id, user_id, amount, type, description, story_id) VALUES (?, ?, ?, ?, ?, ?)",
          [txId, auth.userId, -tokensSpent, "spend", "Character extension for story", storyId]
        );
      }

      database.run(
        `INSERT INTO stories (id, title, content, author_id, model_used, character_count, tokens_spent, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [storyId, title.trim(), content.trim(), auth.userId, modelUsed, characterCount, tokensSpent]
      );

      const usageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      database.run(
        "INSERT INTO api_usage (id, user_id, model, endpoint, tokens_input, tokens_output, latency_ms, success) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [usageId, auth.userId, modelUsed, "/api/stories", characterCount, 0, Date.now() - startTime, true]
      );

      const story = database.query("SELECT * FROM stories WHERE id = ?").get(storyId) as any;

      console.log("[CREATE STORY] Success:", storyId);
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
      console.error("[CREATE STORY ERROR]", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
  
  return c.json({ error: "Method not allowed" }, 405);
}
