// Bestseller Radar — scores stories against commercial fiction patterns
// Runs every 4 segments, feeds insights back to agents

import { llmService } from './llmService.js';
import { getDb } from '../database/connection.js';

export interface BestsellerScore {
  storyId: string;
  score: number;           // 0–100
  hook: number;
  pace: number;
  character: number;
  genreClarity: number;
  originality: number;
  prose: number;
  feedback: string;        // 2–3 sentences fed back to agents
  flag: boolean;           // true if score ≥ 75 — promote in Library
}

// ─── Score a story against bestseller patterns ────────────────────────────────

export async function analyzeStory(storyId: string): Promise<BestsellerScore | null> {
  const db = await getDb();

  const story = db.query('SELECT id, title, content, genre FROM stories WHERE id=?').get(storyId) as any;
  if (!story) return null;

  const segments = db.query(
    `SELECT content FROM contributions WHERE story_id=? ORDER BY created_at ASC LIMIT 12`
  ).all(storyId) as any[];

  if (segments.length < 2) return null;

  const fullText = [story.content, ...segments.map((s: any) => s.content)].join('\n\n');

  const prompt = `You are a senior literary agent with 20 years of experience acquiring bestselling ${story.genre ?? 'commercial'} fiction.

Analyze this story excerpt and score it on 6 dimensions. Respond ONLY with valid JSON.

STORY TITLE: "${story.title}"
GENRE: ${story.genre ?? 'general fiction'}

TEXT:
${fullText.slice(0, 4000)}

Respond with this exact JSON structure (no markdown, no explanation):
{
  "hook": <0-100 integer>,
  "pace": <0-100 integer>,
  "character": <0-100 integer>,
  "genre_clarity": <0-100 integer>,
  "originality": <0-100 integer>,
  "prose": <0-100 integer>,
  "feedback": "<2-3 sentences of specific, actionable feedback for the authors>"
}

Scoring guide:
- hook (0-100): Does the opening create an urgent question? 80+ = unputdownable first line
- pace (0-100): Does tension escalate? 80+ = no sagging, every segment earns its place
- character (0-100): Is protagonist desire crystal clear and relatable? 80+ = reader is inside the character
- genre_clarity (0-100): Does story deliver genre promise (horror=dread, romance=longing)? 80+ = nails it
- originality (0-100): Does it subvert genre expectations? 80+ = feels fresh and surprising
- prose (0-100): Specific language, rhythm, no clichés? 80+ = Le Guin standard`;

  try {
    const result = await llmService.generateContent(prompt);
    if (!result?.content?.trim()) return null;

    // Parse JSON — strip any markdown fences
    const raw = result.content.trim().replace(/^```[a-z]*\n?|```$/g, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract JSON from response
      const match = raw.match(/\{[\s\S]+\}/);
      if (!match) return null;
      parsed = JSON.parse(match[0]);
    }

    const { hook, pace, character, genre_clarity, originality, prose, feedback } = parsed;

    // Weighted average
    const score = Math.round(
      hook        * 0.25 +
      pace        * 0.20 +
      character   * 0.20 +
      genre_clarity * 0.15 +
      originality * 0.10 +
      prose       * 0.10
    );

    const flag = score >= 75;

    // Persist score on stories table (add column if missing)
    try {
      db.run(`ALTER TABLE stories ADD COLUMN bestseller_score INTEGER`);
    } catch { /* column exists */ }
    try {
      db.run(`ALTER TABLE stories ADD COLUMN bestseller_feedback TEXT`);
    } catch { /* column exists */ }

    db.run(
      `UPDATE stories SET bestseller_score=?, bestseller_feedback=? WHERE id=?`,
      [score, feedback, storyId]
    );

    console.log(`[BestsellerRadar] ${story.title}: score=${score}/100 flag=${flag}`);

    return { storyId, score, hook, pace, character, genreClarity: genre_clarity, originality, prose, feedback, flag };
  } catch (err) {
    console.error('[BestsellerRadar] Analysis failed:', err);
    return null;
  }
}

// ─── Expose scores via API (called from routes) ───────────────────────────────

export async function getTopStories(limit = 10): Promise<any[]> {
  const db = await getDb();
  try {
    return db.query(
      `SELECT id, title, genre, bestseller_score, bestseller_feedback, created_at
       FROM stories WHERE bestseller_score IS NOT NULL
       ORDER BY bestseller_score DESC LIMIT ?`
    ).all(limit) as any[];
  } catch {
    return [];
  }
}
