import { DatabaseConnection } from '../database/connection';

export interface ContentCategory {
  id?: number;
  slug: string;
  name: string;
  description: string;
  avg_word_count: number;
}

export interface StoryCategory {
  story_id: number;
  category_slug: string;
  assigned_at?: string;
}

export class ContentCategoriesService {
  private db: DatabaseConnection;
  private cache: ContentCategory[] | null = null;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async getCategories(): Promise<ContentCategory[]> {
    if (this.cache) {
      return this.cache;
    }

    const sql = `SELECT * FROM content_categories ORDER BY avg_word_count ASC`;
    const categories = await this.db.query(sql);
    
    this.cache = categories;
    return categories;
  }

  async getCategoryBySlug(slug: string): Promise<ContentCategory | null> {
    const sql = `SELECT * FROM content_categories WHERE slug = ?`;
    const results = await this.db.query(sql, [slug]);
    return results[0] || null;
  }

  async setStoryCategory(storyId: number, categorySlug: string): Promise<void> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) {
      throw new Error(`Invalid category: ${categorySlug}`);
    }

    const existing = await this.db.query(
      'SELECT * FROM story_categories WHERE story_id = ?',
      [storyId]
    );

    if (existing.length > 0) {
      await this.db.run(
        'UPDATE story_categories SET category_slug = ? WHERE story_id = ?',
        [categorySlug, storyId]
      );
    } else {
      await this.db.run(
        'INSERT INTO story_categories (story_id, category_slug) VALUES (?, ?)',
        [storyId, categorySlug]
      );
    }
  }

  async getStoryCategory(storyId: number): Promise<ContentCategory | null> {
    const sql = `
      SELECT cc.* 
      FROM content_categories cc
      JOIN story_categories sc ON cc.slug = sc.category_slug
      WHERE sc.story_id = ?
    `;
    
    const results = await this.db.query(sql, [storyId]);
    return results[0] || null;
  }

  async getStoriesByCategory(categorySlug: string, limit: number = 20, offset: number = 0): Promise<Array<{ story_id: number; title: string; created_at: string }>> {
    const sql = `
      SELECT s.id as story_id, s.title, s.created_at
      FROM stories s
      JOIN story_categories sc ON s.id = sc.story_id
      WHERE sc.category_slug = ?
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    return await this.db.query(sql, [categorySlug, limit, offset]);
  }

  async suggestCategory(wordCount: number): Promise<ContentCategory | null> {
    const categories = await this.getCategories();
    
    let bestMatch = categories[0];
    let minDiff = Math.abs(wordCount - bestMatch.avg_word_count);

    for (const category of categories) {
      const diff = Math.abs(wordCount - category.avg_word_count);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = category;
      }
    }

    return bestMatch;
  }

  async getCategoryStats(): Promise<Array<{ category: ContentCategory; story_count: number }>> {
    const sql = `
      SELECT cc.*, COUNT(sc.story_id) as story_count
      FROM content_categories cc
      LEFT JOIN story_categories sc ON cc.slug = sc.category_slug
      GROUP BY cc.slug
      ORDER BY story_count DESC
    `;
    
    return await this.db.query(sql);
  }

  invalidateCache(): void {
    this.cache = null;
  }
}
