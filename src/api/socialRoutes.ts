// Social Features API Routes for StoryChain
// Likes, follows, trending, and user interactions

import type { Context } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { getDb } from '../database/connection.js';

import { requireAuthCompat as requireAuth } from '../middleware/auth.js';

// GET /api/stories - Feed with filters and pagination (PUBLIC - no auth required)
export async function getStories(c: Context) {
  // Try to get auth, but don't require it
  const auth = await requireAuth(c);

  try {
    const { sort = 'newest', filter = 'all', page = '1', limit = '12', q, model } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const database = await getDb();

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Filter conditions
    if (filter === 'completed') {
      whereClause += ' AND s.is_completed = 1';
    } else if (filter === 'ongoing') {
      whereClause += ' AND s.is_completed = 0';
    } else if (filter === 'my-stories' && auth) {
      whereClause += ' AND s.author_id = ?';
      params.push(auth.userId);
    }

    // Model filter
    if (model && model !== 'all') {
      whereClause += ' AND s.model_used = ?';
      params.push(model);
    }

    // Search query
    if (q) {
      whereClause += ' AND (s.title LIKE ? OR s.content LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    // Sort options - WHITELIST VALIDATION to prevent SQL injection
    const VALID_SORT_COLUMNS: Record<string, string> = {
      'newest': 's.created_at DESC',
      'oldest': 's.created_at ASC',
      'trending': '(SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) * 2 + (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) DESC',
      'most-liked': '(SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) DESC',
      'most-contributions': '(SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) DESC',
    };

    // Validate sort parameter against whitelist
    const orderBy = VALID_SORT_COLUMNS[sort] || VALID_SORT_COLUMNS['newest'];

    // Main query
    const query = `
      SELECT 
        s.*,
        u.username as author_name,
        (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) as contribution_count,
        (SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) as like_count
      FROM stories s
      JOIN users u ON s.author_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    let stories = database.query(query).all(...params);

    // If no stories exist, create demo stories
    if (stories.length === 0 && parseInt(page) === 1) {
      await createDemoStories(database);
      stories = database.query(query).all(...params);
    }

    return c.json({
      stories: stories.map((s: any) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        authorId: s.author_id,
        authorName: s.author_name,
        modelUsed: s.model_used,
        characterCount: s.character_count,
        isCompleted: s.is_completed === 1,
        isPremium: s.is_premium === 1,
        maxContributions: s.max_contributions ?? 50,
        contributionCount: s.contribution_count,
        likeCount: s.like_count,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return c.json({ error: 'Failed to fetch stories' }, 500);
  }
}

// Helper function to create demo stories - UPDATED: removed tokens
async function createDemoStories(database: any) {
  const demoStories = [
    {
      id: 'demo_001',
      title: 'The Last Library',
      content: 'In a world where digital archives had replaced every book, Maya discovered a hidden cellar beneath the old university. Dust motes danced in the sliver of light from her flashlight, illuminating shelves that stretched into darkness. The smell of paper and binding glue hit her like a memory from a childhood she never had. She reached for the nearest spine, hands trembling...',
      author: 'DemoUser',
      model: 'kimi-k2.5',
    },
    {
      id: 'demo_002',
      title: 'Echoes of Tomorrow',
      content: 'The time machine hummed to life, its quantum coils glowing with a light that shouldn\'t exist in three dimensions. Dr. Chen checked her watch one last time. 11:59 PM, December 31st, 2024. In sixty seconds, she would either prove her theories correct or disappear from history entirely. The countdown began...',
      author: 'StoryWeaver',
      model: 'gemini-pro',
    },
    {
      id: 'demo_003',
      title: 'Midnight at the Café',
      content: 'They say the Coffee Ghost only appears to those who truly need guidance. At 3:33 AM, when the espresso machine gurgles its last drops, a silhouette forms in the steam. Tonight, it materialized for Marcus, a failed musician with nothing left but a guitar and a broken dream. "Play," the ghost whispered...',
      author: 'NarrativeCraft',
      model: 'llama-3.1',
    },
  ];

  for (const story of demoStories) {
    // Check if demo story already exists
    const existing = database.query('SELECT 1 FROM stories WHERE id = ?').get(story.id);
    if (!existing) {
      // Create demo user if not exists - NO TOKENS
      const demoUserId = `user_${story.author.toLowerCase()}`;
      const userExists = database.query('SELECT 1 FROM users WHERE id = ?').get(demoUserId);
      if (!userExists) {
        database.run(
          'INSERT INTO users (id, username, email, preferred_model) VALUES (?, ?, ?, ?)',
          [demoUserId, story.author, `${story.author.toLowerCase()}@demo.local`, 'kimi-k2.5']
        );
      }

      // Insert story - NO TOKENS_SPENT
      database.run(
        `INSERT INTO stories (id, title, content, author_id, model_used, character_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [story.id, story.title, story.content, demoUserId, story.model, story.content.length]
      );
    }
  }
}

// GET /api/stories/:id - Get single story with details (PUBLIC)
export async function getStory(c: Context) {
  const storyId = c.req.param('id');
  if (!storyId) {
    return c.json({ error: 'Story ID required' }, 400);
  }

  try {
    const database = await getDb();

    // Get story with author info
    const story = database.query(`
      SELECT s.*, u.username as author_name
      FROM stories s
      JOIN users u ON s.author_id = u.id
      WHERE s.id = ?
    `).get(storyId);

    if (!story) {
      return c.json({ error: 'Story not found' }, 404);
    }

    // Get contributions with author info
    const contributions = database.query(`
      SELECT c.*, u.username as author_name
      FROM contributions c
      JOIN users u ON c.author_id = u.id
      WHERE c.story_id = ?
      ORDER BY c.created_at ASC
    `).all(storyId);

    // Get like count
    const likeCount = database.query('SELECT COUNT(*) as count FROM likes WHERE story_id = ?').get(storyId);

    return c.json({
      story: {
        id: story.id,
        title: story.title,
        content: story.content,
        authorId: story.author_id,
        authorName: story.author_name,
        modelUsed: story.model_used,
        characterCount: story.character_count,
        isCompleted: story.is_completed === 1,
        isPremium: story.is_premium === 1,
        maxContributions: story.max_contributions ?? 50,
        likes: likeCount?.count || 0,
        contributions: contributions.map((c: any) => ({
          id: c.id,
          storyId: c.story_id,
          authorId: c.author_id,
          authorName: c.author_name,
          content: c.content,
          modelUsed: c.model_used,
          createdAt: c.created_at,
        })),
        createdAt: story.created_at,
        updatedAt: story.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    return c.json({ error: 'Failed to fetch story' }, 500);
  }
}

// POST /api/stories/:id/like - Like a story (PUBLIC - no auth required, session-based)
export async function likeStory(c: Context) {
  const storyId = c.req.param('id');
  if (!storyId) {
    return c.json({ error: 'Story ID required' }, 400);
  }

  try {
    const database = await getDb();

    // Get or create session-based user ID
    let userId = c.req.header('x-session-id');
    if (!userId) {
      userId = 'session_' + Math.random().toString(36).substr(2, 9);
    }

    // Ensure user exists in users table (required by FK constraint)
    const userExists = database.query('SELECT 1 FROM users WHERE id = ?').get(userId);
    if (!userExists) {
      const uniqueSuffix = userId.slice(-8);
      database.run(
        'INSERT INTO users (id, username, email, preferred_model) VALUES (?, ?, ?, ?)',
        [userId, `guest_${uniqueSuffix}`, `${userId}@storychain.local`, 'nemotron-super']
      );
    }

    // Check if already liked
    const existingLike = database.query(
      'SELECT 1 FROM likes WHERE story_id = ? AND user_id = ?'
    ).get(storyId, userId);

    if (existingLike) {
      // Unlike
      database.run('DELETE FROM likes WHERE story_id = ? AND user_id = ?', [storyId, userId]);
    } else {
      // Like
      const likeId = `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      database.run(
        'INSERT INTO likes (id, story_id, user_id, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [likeId, storyId, userId]
      );
    }

    // Get new like count
    const likeCount = database.query('SELECT COUNT(*) as count FROM likes WHERE story_id = ?').get(storyId);

    return c.json({
      liked: !existingLike,
      likes: likeCount?.count || 0,
      sessionId: userId,
    });
  } catch (error) {
    console.error('Error liking story:', error);
    return c.json({ error: 'Failed to like story' }, 500);
  }
}

// POST /api/stories/:id/contributions - Add contribution (PUBLIC - supports anonymous, agent, and authenticated)
export async function addContribution(c: Context) {
  const storyId = c.req.param('id');
  if (!storyId) {
    return c.json({ error: 'Story ID required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { content, authorId, authorName } = body;

    if (!content?.trim()) {
      return c.json({ error: 'Content is required' }, 400);
    }

    const database = await getDb();

    // Verify story exists
    const story = database.query('SELECT * FROM stories WHERE id = ?').get(storyId);
    if (!story) {
      return c.json({ error: 'Story not found' }, 404);
    }

    // Determine author
    let finalAuthorId: string;
    let finalAuthorName: string;

    if (authorId) {
      // Provided author (agent or anonymous)
      finalAuthorId = authorId;
      finalAuthorName = authorName || (authorId.startsWith('agent_') ? 'Agent' : 'Anonymous');
    } else {
      // Generate anonymous user with unique ID
      const anonSuffix = Math.random().toString(36).substr(2, 9);
      finalAuthorId = 'anon_' + anonSuffix;
      finalAuthorName = authorName || 'Anonymous';
    }

    // Create/get user in database
    const user = database.query('SELECT * FROM users WHERE id = ?').get(finalAuthorId);
    if (!user) {
      // Always use ID-based unique username/email to avoid UNIQUE constraint violations
      const uniqueSuffix = finalAuthorId.slice(-8);
      const uniqueUsername = `${finalAuthorName}_${uniqueSuffix}`;
      database.run(
        'INSERT INTO users (id, username, email, preferred_model) VALUES (?, ?, ?, ?)',
        [finalAuthorId, uniqueUsername, `${finalAuthorId}@storychain.local`, 'kimi-k2.5']
      );
    }

    // Create contribution
    const contributionId = `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.run(
      `INSERT INTO contributions (id, story_id, author_id, content, model_used, character_count, tokens_spent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [contributionId, storyId, finalAuthorId, content.trim(), 'manual', content.length, 0]
    );

    return c.json({
      contribution: {
        id: contributionId,
        storyId,
        authorId: finalAuthorId,
        authorName: finalAuthorName,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      },
    }, 201);
  } catch (error) {
    console.error('Error adding contribution:', error);
    return c.json({ error: 'Failed to add contribution' }, 500);
  }
}

// GET /api/stories/:id/comments - Fetch comments for a story (PUBLIC)
export async function getComments(c: Context) {
  const storyId = c.req.param('id');
  if (!storyId) return c.json({ error: 'Story ID required' }, 400);

  try {
    const database = await getDb();
    const comments = database.query(`
      SELECT id, story_id, author_id, author_name, content, created_at
      FROM comments
      WHERE story_id = ?
      ORDER BY created_at ASC
    `).all(storyId);

    return c.json({ comments: comments.map((cm: any) => ({
      id: cm.id,
      storyId: cm.story_id,
      authorId: cm.author_id,
      authorName: cm.author_name,
      content: cm.content,
      createdAt: cm.created_at,
    })) });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return c.json({ error: 'Failed to fetch comments' }, 500);
  }
}

// POST /api/stories/:id/comments - Add a comment (PUBLIC)
export async function addComment(c: Context) {
  const storyId = c.req.param('id');
  if (!storyId) return c.json({ error: 'Story ID required' }, 400);

  try {
    const body = await c.req.json();
    const { content, authorName } = body;

    if (!content?.trim()) return c.json({ error: 'Comment content is required' }, 400);
    if (content.trim().length > 1000) return c.json({ error: 'Comment must be under 1000 characters' }, 400);

    const database = await getDb();

    const story = database.query('SELECT id FROM stories WHERE id = ?').get(storyId);
    if (!story) return c.json({ error: 'Story not found' }, 404);

    // Derive author from session or header
    const sessionId = c.req.header('x-session-id') || `anon_${Math.random().toString(36).substr(2, 9)}`;
    const displayName = authorName?.trim() || 'Anonymous';
    const authorId = 'user_' + sessionId.slice(-16).padStart(16, '0');

    const userExists = database.query('SELECT 1 FROM users WHERE id = ?').get(authorId);
    if (!userExists) {
      database.run(
        'INSERT INTO users (id, username, email, preferred_model) VALUES (?, ?, ?, ?)',
        [authorId, displayName, `${authorId}@storychain.local`, 'nemotron-super']
      );
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    database.run(
      `INSERT INTO comments (id, story_id, author_id, author_name, content, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [commentId, storyId, authorId, displayName, content.trim()]
    );

    return c.json({
      comment: {
        id: commentId,
        storyId,
        authorId,
        authorName: displayName,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      },
    }, 201);
  } catch (error) {
    console.error('Error adding comment:', error);
    return c.json({ error: 'Failed to add comment' }, 500);
  }
}

// GET /api/users/:id - Get user profile
export async function getUser(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);

  const userId = c.req.param('id');
  if (!userId) {
    return c.json({ error: 'User ID required' }, 400);
  }

  try {
    const database = await getDb();

    const user = database.query('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get stats
    const storiesCount = database.query('SELECT COUNT(*) as count FROM stories WHERE author_id = ?').get(userId);
    const contributionsCount = database.query('SELECT COUNT(*) as count FROM contributions WHERE author_id = ?').get(userId);
    const totalLikes = database.query(`
      SELECT COUNT(*) as count FROM likes l
      JOIN stories s ON l.story_id = s.id
      WHERE s.author_id = ?
    `).get(userId);
    const followersCount = database.query('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(userId);
    const followingCount = database.query('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(userId);

    // Check if current user is following
    const isFollowing = database.query(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
    ).get(auth.userId, userId);

    return c.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        preferredModel: user.preferred_model,
        createdAt: user.created_at,
        storiesCount: storiesCount?.count || 0,
        contributionsCount: contributionsCount?.count || 0,
        totalLikes: totalLikes?.count || 0,
        followersCount: followersCount?.count || 0,
        followingCount: followingCount?.count || 0,
        isFollowing: !!isFollowing,
        isCurrentUser: userId === auth.userId,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
}

// GET /api/users/:id/stories - Get user's stories
export async function getUserStories(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);

  const userId = c.req.param('id');
  if (!userId) {
    return c.json({ error: 'User ID required' }, 400);
  }

  try {
    const database = await getDb();

    const stories = database.query(`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) as contribution_count,
        (SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) as like_count
      FROM stories s
      WHERE s.author_id = ?
      ORDER BY s.created_at DESC
    `).all(userId);

    return c.json({
      stories: stories.map((s: any) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        authorId: s.author_id,
        modelUsed: s.model_used,
        characterCount: s.character_count,
        contributionCount: s.contribution_count,
        likeCount: s.like_count,
        createdAt: s.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching user stories:', error);
    return c.json({ error: 'Failed to fetch stories' }, 500);
  }
}

// GET /api/users/:id/contributions - Get user's contributions
export async function getUserContributions(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);

  const userId = c.req.param('id');
  if (!userId) {
    return c.json({ error: 'User ID required' }, 400);
  }

  try {
    const database = await getDb();

    const contributions = database.query(`
      SELECT c.*, s.title as story_title
      FROM contributions c
      JOIN stories s ON c.story_id = s.id
      WHERE c.author_id = ?
      ORDER BY c.created_at DESC
    `).all(userId);

    return c.json({
      stories: contributions.map((c: any) => ({
        id: c.story_id,
        title: c.story_title,
        content: c.content,
        authorId: c.author_id,
        modelUsed: c.model_used,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching user contributions:', error);
    return c.json({ error: 'Failed to fetch contributions' }, 500);
  }
}

// GET /api/users/:id/liked - Get stories liked by user
export async function getUserLikedStories(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);

  const userId = c.req.param('id');
  if (!userId) {
    return c.json({ error: 'User ID required' }, 400);
  }

  try {
    const database = await getDb();

    const stories = database.query(`
      SELECT 
        s.*,
        u.username as author_name,
        (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) as contribution_count
      FROM stories s
      JOIN likes l ON s.id = l.story_id
      JOIN users u ON s.author_id = u.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `).all(userId);

    return c.json({
      stories: stories.map((s: any) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        authorId: s.author_id,
        authorName: s.author_name,
        modelUsed: s.model_used,
        contributionCount: s.contribution_count,
        createdAt: s.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching liked stories:', error);
    return c.json({ error: 'Failed to fetch liked stories' }, 500);
  }
}

// POST /api/users/:id/follow - Follow/unfollow a user
export async function followUser(c: Context) {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);

  const userId = c.req.param('id');
  if (!userId) {
    return c.json({ error: 'User ID required' }, 400);
  }

  if (userId === auth.userId) {
    return c.json({ error: 'Cannot follow yourself' }, 400);
  }

  try {
    const database = await getDb();

    // Check if already following
    const existingFollow = database.query(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
    ).get(auth.userId, userId);

    if (existingFollow) {
      // Unfollow
      database.run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [auth.userId, userId]);
    } else {
      // Follow
      const followId = `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      database.run(
        'INSERT INTO follows (id, follower_id, following_id, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [followId, auth.userId, userId]
      );
    }

    // Get new follower count
    const followersCount = database.query('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(userId);

    return c.json({
      following: !existingFollow,
      followersCount: followersCount?.count || 0,
    });
  } catch (error) {
    console.error('Error following user:', error);
    return c.json({ error: 'Failed to follow user' }, 500);
  }
}

// GET /api/trending - Get trending stories (PUBLIC - no auth required)
export async function getTrending(c: Context) {
  // Try to get auth, but don't require it
  const auth = await requireAuth(c);

  try {
    const database = await getDb();

    // Get stories from last 7 days, ordered by engagement
    const stories = database.query(`
      SELECT 
        s.*,
        u.username as author_name,
        (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) as contribution_count,
        (SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) as like_count,
        ((SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) * 2 + 
         (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id)) as score
      FROM stories s
      JOIN users u ON s.author_id = u.id
      WHERE s.created_at > datetime('now', '-7 days')
      ORDER BY score DESC
      LIMIT 10
    `).all();

    return c.json({
      stories: stories.map((s: any) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        authorId: s.author_id,
        authorName: s.author_name,
        modelUsed: s.model_used,
        contributionCount: s.contribution_count,
        likeCount: s.like_count,
        createdAt: s.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching trending:', error);
    return c.json({ error: 'Failed to fetch trending stories' }, 500);
  }
}