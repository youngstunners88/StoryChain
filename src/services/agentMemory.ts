// Agent Memory Service — persistent error logs + craft reflections for each agent
// Errors get fed back into prompts so agents learn from their own mistakes

import { Database } from 'bun:sqlite';
import type { QualityError } from './qualityGate.js';

export interface StoredError {
  id: string;
  agentId: string;
  storyId: string | null;
  errorType: string;
  description: string;
  example: string | null;
  createdAt: string;
}

export interface StoredReflection {
  id: string;
  agentId: string;
  reflectionType: string;
  content: string;
  createdAt: string;
}

// ─── Error logging ────────────────────────────────────────────────────────────

export function logErrors(
  db: Database,
  agentId: string,
  storyId: string,
  errors: QualityError[]
): void {
  for (const err of errors) {
    const id = `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      db.run(
        `INSERT INTO agent_errors (id, agent_id, story_id, error_type, description, example)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, agentId, storyId, err.type, err.description, err.example ?? null]
      );
    } catch (_) {
      // Table might not exist yet — migrations run on server start
    }
  }
}

export function getRecentErrors(db: Database, agentId: string, limit = 8): StoredError[] {
  try {
    return db.query<StoredError, [string, number]>(
      `SELECT id, agent_id as agentId, story_id as storyId,
              error_type as errorType, description, example, created_at as createdAt
       FROM agent_errors
       WHERE agent_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    ).all(agentId, limit);
  } catch (_) {
    return [];
  }
}

// ─── Reflection storage ───────────────────────────────────────────────────────

export function saveReflection(
  db: Database,
  agentId: string,
  type: 'craft' | 'research' | 'style',
  content: string
): void {
  const id = `refl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  try {
    db.run(
      `INSERT INTO agent_reflections (id, agent_id, reflection_type, content)
       VALUES (?, ?, ?, ?)`,
      [id, agentId, type, content]
    );
  } catch (_) {}
}

export function getLatestReflection(db: Database, agentId: string): StoredReflection | null {
  try {
    return db.query<StoredReflection, [string]>(
      `SELECT id, agent_id as agentId, reflection_type as reflectionType,
              content, created_at as createdAt
       FROM agent_reflections
       WHERE agent_id = ?
       ORDER BY created_at DESC
       LIMIT 1`
    ).get(agentId) ?? null;
  } catch (_) {
    return null;
  }
}

export function shouldRunResearchCycle(db: Database, agentId: string): boolean {
  // Run research ~1 in every 8 heartbeat cycles for this agent
  try {
    const latest = db.query<{ created_at: string }, [string]>(
      `SELECT created_at FROM agent_reflections WHERE agent_id = ? ORDER BY created_at DESC LIMIT 1`
    ).get(agentId);
    if (!latest) return true; // Never run — do it now
    const hoursSince = (Date.now() - new Date(latest.created_at).getTime()) / 3_600_000;
    return hoursSince > 12; // Refresh craft reflection every 12 hours
  } catch (_) {
    return false;
  }
}

// ─── Prompt context builders ──────────────────────────────────────────────────

export function buildErrorCorrectionBlock(errors: StoredError[]): string {
  if (errors.length === 0) return '';

  const seen = new Set<string>();
  const lines: string[] = [];

  for (const e of errors) {
    if (seen.has(e.errorType)) continue;
    seen.add(e.errorType);

    switch (e.errorType) {
      case 'likely_word_merge':
        lines.push(`• SPACING CRITICAL: Do NOT merge words together. Write "The cat" NOT "Thecat".${e.example ? ` You previously wrote: ${e.example}` : ''}`);
        break;
      case 'truncated_sentence':
        lines.push(`• COMPLETION CRITICAL: Finish every sentence. Your segment must end with proper punctuation (.?!"`);
        break;
      case 'missing_space_after_punctuation':
        lines.push(`• Place a SPACE after every period, exclamation mark, and question mark before the next sentence.`);
        break;
      case 'missing_space_after_comma':
        lines.push(`• Place a SPACE after every comma: write "yes, and" not "yes,and".`);
        break;
      case 'heading_leaked':
        lines.push(`• Do NOT write "Segment N:", "Chapter N:", or any label. Begin writing prose immediately.`);
        break;
      case 'meta_commentary':
        lines.push(`• Do NOT start with explanations. Begin the story immediately — no preambles.`);
        break;
      case 'too_short':
        lines.push(`• Write MORE. Your segment must be 160–260 words of prose.`);
        break;
    }
  }

  if (lines.length === 0) return '';
  return `\n⚠️ YOUR ERROR HISTORY — Mistakes you made before. DO NOT repeat:\n${lines.join('\n')}\n`;
}

export function buildReflectionBlock(reflection: StoredReflection | null): string {
  if (!reflection) return '';
  return `\nCRAFT REFLECTION (your recent learning):\n${reflection.content}\n`;
}
