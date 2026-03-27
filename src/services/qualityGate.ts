// Quality Gate — validates and auto-fixes LLM-generated story segments
// Catches word merges, spacing errors, truncation, meta-leaks before they persist

export type QualityErrorType =
  | 'missing_space_after_punctuation'
  | 'missing_space_after_comma'
  | 'likely_word_merge'
  | 'truncated_sentence'
  | 'too_short'
  | 'too_long'
  | 'heading_leaked'
  | 'meta_commentary'
  | 'double_space';

export interface QualityError {
  type: QualityErrorType;
  description: string;
  example?: string;
}

export interface QualityReport {
  original: string;
  fixed: string;
  errors: QualityError[];
  score: number; // 0–100
  passed: boolean;
  wordCount: number;
}

// ─── Core validator ───────────────────────────────────────────────────────────

export function validateContent(raw: string): QualityReport {
  const errors: QualityError[] = [];
  let fixed = raw.trim();
  let score = 100;

  // 1. Strip leaked segment/chapter labels at the start
  const headingRe = /^(\[?(?:segment|chapter|part|section)\s*\d+\]?[:.\s]*)/im;
  if (headingRe.test(fixed)) {
    fixed = fixed.replace(headingRe, '').trim();
    errors.push({ type: 'heading_leaked', description: 'Segment/chapter label stripped from output start' });
    score -= 5;
  }

  // 2. Strip meta-commentary openers
  const metaRe = /^(here is|as requested|note:|this is segment|continuing the story|writing the next|in this segment)[^\n]{0,120}\n?/im;
  if (metaRe.test(fixed)) {
    fixed = fixed.replace(metaRe, '').trim();
    errors.push({ type: 'meta_commentary', description: 'Meta-commentary opener removed from output' });
    score -= 10;
  }

  // 3. Fix missing space after sentence-ending punctuation before capital
  const before3 = fixed;
  fixed = fixed.replace(/([.!?])([A-Z][a-z])/g, '$1 $2');
  if (fixed !== before3) {
    errors.push({ type: 'missing_space_after_punctuation', description: 'Added missing spaces after sentence-ending punctuation' });
    score -= 15;
  }

  // 4. Fix missing space after commas
  const before4 = fixed;
  fixed = fixed.replace(/,([a-zA-Z0-9])/g, ', $1');
  if (fixed !== before4) {
    errors.push({ type: 'missing_space_after_comma', description: 'Added missing spaces after commas' });
    score -= 10;
  }

  // 5. Fix double spaces
  fixed = fixed.replace(/  +/g, ' ');

  // 6. Detect and fix word merges: lowercase immediately followed by uppercase mid-word
  // Pattern: 2+ lowercase chars followed by uppercase char NOT at sentence boundary
  const mergePat = /(?<![.!?'"\s])([a-z]{2,})([A-Z][a-z]{2,})/g;
  const mergeMatches = [...fixed.matchAll(mergePat)];
  if (mergeMatches.length > 0) {
    const examples = mergeMatches.slice(0, 3).map(m => `"${m[0]}"`).join(', ');
    errors.push({
      type: 'likely_word_merge',
      description: 'Word merge detected — inserted spaces between merged words',
      example: examples,
    });
    fixed = fixed.replace(mergePat, '$1 $2');
    score -= 25;
  }

  // 7. Check for truncation — last meaningful character must close a sentence
  const tail = fixed.replace(/["'»\s]+$/, '');
  if (tail.length > 0 && !/[.!?]$/.test(tail)) {
    errors.push({
      type: 'truncated_sentence',
      description: `Possible truncation — ends without sentence-closing punctuation: "…${tail.slice(-25)}"`,
    });
    score -= 25;
  }

  // 8. Word count validation
  const wordCount = fixed.split(/\s+/).filter(Boolean).length;
  if (wordCount < 80) {
    errors.push({ type: 'too_short', description: `Only ${wordCount} words — minimum target is 140` });
    score -= 30;
  } else if (wordCount > 480) {
    errors.push({ type: 'too_long', description: `${wordCount} words — target is 180–280` });
    score -= 10;
    // Trim at last sentence boundary within ~350 words
    const words = fixed.split(/\s+/);
    let cut = 350;
    while (cut < words.length && !/[.!?]$/.test(words[cut - 1].replace(/["'»)]/g, ''))) cut++;
    fixed = words.slice(0, Math.min(cut, 400)).join(' ');
  }

  score = Math.max(0, score);

  return {
    original: raw.trim(),
    fixed: fixed.trim(),
    errors,
    score,
    // Fail if truncated AND score is low — allow truncation if rest is clean
    passed: score >= 55,
    wordCount,
  };
}

// ─── Error correction prompt block ───────────────────────────────────────────

export function buildCorrectionInstruction(errors: QualityError[]): string {
  if (errors.length === 0) return '';

  const seen = new Set<QualityErrorType>();
  const lines: string[] = [];

  for (const e of errors) {
    if (seen.has(e.type)) continue;
    seen.add(e.type);

    switch (e.type) {
      case 'likely_word_merge':
        lines.push(`• CRITICAL SPACING: Do NOT merge words. "The cat" not "Thecat". Every word separated by a space.${e.example ? ` You wrote: ${e.example}` : ''}`);
        break;
      case 'truncated_sentence':
        lines.push(`• COMPLETE ALL SENTENCES: Never leave a sentence unfinished. End every segment with proper punctuation (.!?)`);
        break;
      case 'missing_space_after_punctuation':
        lines.push(`• After every period, exclamation, or question mark — add a space before the next word.`);
        break;
      case 'missing_space_after_comma':
        lines.push(`• After every comma — add a space: "yes, and" not "yes,and"`);
        break;
      case 'heading_leaked':
        lines.push(`• Do NOT write "Segment X:" or "Chapter Y:" — begin directly with story prose`);
        break;
      case 'meta_commentary':
        lines.push(`• Do NOT start with "Here is...", "As requested...", or any explanation. Begin with the story immediately.`);
        break;
      case 'too_short':
        lines.push(`• Write at least 160 words of story content. Your previous output was too brief.`);
        break;
    }
  }

  if (lines.length === 0) return '';
  return `\n⚠️  CRITICAL — MISTAKES YOU MADE PREVIOUSLY. DO NOT REPEAT:\n${lines.join('\n')}\n`;
}
