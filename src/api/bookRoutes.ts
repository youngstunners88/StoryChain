// Book Routes — completed story as full book with cover, foreword, copyright
import type { Context } from 'hono';
import { getDb } from '../database/connection.js';
import { generateRequestId } from '../utils/errorHandler.js';

function requireAuth(c: Context): { userId: string } | null {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  if (!token || token.length < 20) return null;
  return { userId: 'user_' + token.slice(-16) };
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// GET /api/stories/:id/book
export async function getBook(c: Context) {
  const storyId = c.req.param('id');
  if (!storyId) return c.json({ error: 'Story ID required' }, 400);

  try {
    const database = await getDb();

    const story = database.query(`
      SELECT s.*, u.username as author_name
      FROM stories s JOIN users u ON s.author_id = u.id
      WHERE s.id = ?
    `).get(storyId) as any;

    if (!story) return c.json({ error: 'Story not found' }, 404);

    const chapters = database.query(`
      SELECT c.*, u.username as author_name
      FROM contributions c JOIN users u ON c.author_id = u.id
      WHERE c.story_id = ?
      ORDER BY c.created_at ASC
    `).all(storyId) as any[];

    // Build contributors map
    const contribMap: Record<string, { authorId: string; authorName: string; contributionCount: number; isAgent: boolean }> = {};
    for (const ch of chapters) {
      if (!contribMap[ch.author_id]) {
        contribMap[ch.author_id] = {
          authorId: ch.author_id,
          authorName: ch.author_name,
          contributionCount: 0,
          isAgent: ch.author_id.startsWith('agent_') || ch.author_id.startsWith('fa_'),
        };
      }
      contribMap[ch.author_id].contributionCount++;
    }
    const contributors = Object.values(contribMap).sort((a, b) => b.contributionCount - a.contributionCount);

    const year = new Date(story.created_at).getFullYear();
    const contribNames = contributors.map(c => c.authorName).join(', ');
    const autoCopyright = `© ${year} ${story.author_name}. A StoryChain collaborative work.${contributors.length > 0 ? ` Contributors: ${contribNames}.` : ''} All rights reserved.`;

    const allText = [story.content, ...chapters.map(ch => ch.content)].join(' ');
    const totalWords = wordCount(allText);

    return c.json({
      book: {
        id: story.id,
        title: story.title,
        opening: story.content,
        authorId: story.author_id,
        authorName: story.author_name,
        modelUsed: story.model_used,
        createdAt: story.created_at,
        isCompleted: story.is_completed === 1,
        coverUrl: story.cover_url ?? null,
        foreword: story.foreword ?? null,
        copyrightText: story.copyright_text ?? autoCopyright,
        dedication: story.dedication ?? null,
        bookPublished: story.book_published === 1,
        contributors,
        chapters: chapters.map((ch, i) => ({
          id: ch.id,
          chapterNumber: i + 1,
          content: ch.content,
          authorId: ch.author_id,
          authorName: ch.author_name,
          isAgent: ch.author_id.startsWith('agent_') || ch.author_id.startsWith('fa_'),
          modelUsed: ch.model_used,
          createdAt: ch.created_at,
        })),
        totalChapters: chapters.length,
        totalWords,
      },
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return c.json({ error: 'Failed to fetch book' }, 500);
  }
}

// PUT /api/stories/:id/book
export async function updateBook(c: Context) {
  const storyId = c.req.param('id');
  const auth = requireAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const database = await getDb();
    const story = database.query('SELECT author_id FROM stories WHERE id = ?').get(storyId) as any;
    if (!story) return c.json({ error: 'Story not found' }, 404);
    if (story.author_id !== auth.userId) return c.json({ error: 'Only the author can edit book details' }, 403);

    const body = await c.req.json();
    const { coverUrl, foreword, copyrightText, dedication, bookPublished } = body;

    database.run(
      `UPDATE stories SET
        cover_url = COALESCE(?, cover_url),
        foreword = COALESCE(?, foreword),
        copyright_text = COALESCE(?, copyright_text),
        dedication = COALESCE(?, dedication),
        book_published = COALESCE(?, book_published),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [coverUrl ?? null, foreword ?? null, copyrightText ?? null,
       dedication ?? null, bookPublished != null ? (bookPublished ? 1 : 0) : null, storyId]
    );

    return c.json({ success: true, requestId: generateRequestId() });
  } catch (error) {
    console.error('Error updating book:', error);
    return c.json({ error: 'Failed to update book' }, 500);
  }
}

// POST /api/stories/:id/book/cover-prompt  — returns a free Pollinations.ai URL
export async function generateCoverPrompt(c: Context) {
  const storyId = c.req.param('id');
  try {
    const database = await getDb();
    const story = database.query(`
      SELECT s.title, s.model_used, wp.genre, wp.genre_label
      FROM stories s
      LEFT JOIN writer_profiles wp ON wp.user_id = s.author_id
      WHERE s.id = ?
    `).get(storyId) as any;

    if (!story) return c.json({ error: 'Story not found' }, 404);

    const genre = story.genre_label ?? story.genre ?? 'literary fiction';
    const seed = Math.floor(Math.random() * 9999);
    const prompt = `book cover art for "${story.title}", ${genre} genre, dramatic cinematic lighting, professional illustration, rich deep colors, painterly style, no text, no title`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=1024&nologo=true&seed=${seed}`;

    return c.json({ coverPromptUrl: url, title: story.title, genre, seed });
  } catch (error) {
    return c.json({ error: 'Failed to generate cover prompt' }, 500);
  }
}

// GET /api/stories/completed — list all completed stories
export async function getCompletedStories(c: Context) {
  try {
    const database = await getDb();
    const stories = database.query(`
      SELECT s.*, u.username as author_name,
        (SELECT COUNT(*) FROM contributions c WHERE c.story_id = s.id) as chapter_count,
        (SELECT COUNT(*) FROM likes l WHERE l.story_id = s.id) as like_count
      FROM stories s JOIN users u ON s.author_id = u.id
      WHERE s.is_completed = 1
      ORDER BY s.updated_at DESC
    `).all() as any[];

    return c.json({
      stories: stories.map(s => ({
        id: s.id,
        title: s.title,
        excerpt: s.content?.slice(0, 160) + '…',
        authorId: s.author_id,
        authorName: s.author_name,
        modelUsed: s.model_used,
        coverUrl: s.cover_url ?? null,
        chapterCount: s.chapter_count,
        likeCount: s.like_count,
        bookPublished: s.book_published === 1,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch completed stories' }, 500);
  }
}
