#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LOG_DIR = join(homedir(), ".z", "self-improvement");
const LOG_FILE = join(LOG_DIR, "learnings.json");
const PATTERNS_FILE = join(LOG_DIR, "patterns.json");

interface Learning {
  id: string;
  timestamp: string;
  type: "mistake" | "success" | "pattern";
  context: string;
  what_happened: string;
  lesson: string;
  applied_count: number;
  tags: string[];
}

interface Pattern {
  pattern: string;
  solution: string;
  occurrences: number;
  last_seen: string;
  confidence: "low" | "medium" | "high";
}

function ensureDir() {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

function loadLearnings(): Learning[] {
  ensureDir();
  if (!existsSync(LOG_FILE)) return [];
  try {
    return JSON.parse(readFileSync(LOG_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveLearnings(learnings: Learning[]) {
  ensureDir();
  writeFileSync(LOG_FILE, JSON.stringify(learnings, null, 2));
}

function loadPatterns(): Pattern[] {
  ensureDir();
  if (!existsSync(PATTERNS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(PATTERNS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function savePatterns(patterns: Pattern[]) {
  ensureDir();
  writeFileSync(PATTERNS_FILE, JSON.stringify(patterns, null, 2));
}

function generateId(): string {
  return `learn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function logLearning(
  type: Learning["type"],
  context: string,
  what_happened: string,
  lesson: string,
  tags: string[] = []
): void {
  const learnings = loadLearnings();
  const newLearning: Learning = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type,
    context,
    what_happened,
    lesson,
    applied_count: 0,
    tags,
  };
  learnings.push(newLearning);
  saveLearnings(learnings);
  
  console.log(`✓ Logged ${type}:`);
  console.log(`  Context: ${context}`);
  console.log(`  Lesson: ${lesson}`);
  
  // Check if this forms a pattern
  checkForPatterns(learnings, tags);
}

function checkForPatterns(learnings: Learning[], tags: string[]) {
  const patterns = loadPatterns();
  
  // Find similar mistakes/successes
  const similar = learnings.filter(
    (l) => l.tags.some((t) => tags.includes(t)) && l.type !== "pattern"
  );
  
  if (similar.length >= 3) {
    // Pattern detected
    const patternKey = tags.sort().join(",");
    const existingPattern = patterns.find((p) => p.pattern === patternKey);
    
    if (existingPattern) {
      existingPattern.occurrences++;
      existingPattern.last_seen = new Date().toISOString();
      if (existingPattern.occurrences >= 5) existingPattern.confidence = "high";
      else if (existingPattern.occurrences >= 3) existingPattern.confidence = "medium";
    } else {
      // Extract common lesson
      const lessons = similar.map((s) => s.lesson);
      const commonLesson = lessons[lessons.length - 1]; // Most recent
      
      patterns.push({
        pattern: patternKey,
        solution: commonLesson,
        occurrences: similar.length,
        last_seen: new Date().toISOString(),
        confidence: "low",
      });
    }
    
    savePatterns(patterns);
    console.log(`\n⚡ Pattern detected: ${patternKey}`);
  }
}

function listLearnings(type?: string, limit: number = 10): void {
  const learnings = loadLearnings();
  let filtered = type
    ? learnings.filter((l) => l.type === type)
    : learnings;
  
  filtered = filtered.slice(-limit).reverse();
  
  if (filtered.length === 0) {
    console.log("No learnings found.");
    return;
  }
  
  console.log(`\n=== LEARNINGS (${filtered.length}) ===\n`);
  filtered.forEach((l, i) => {
    const icon = l.type === "mistake" ? "✗" : l.type === "success" ? "✓" : "⚡";
    console.log(`${icon} [${l.type.toUpperCase()}] ${l.context}`);
    console.log(`   What: ${l.what_happened}`);
    console.log(`   Lesson: ${l.lesson}`);
    console.log(`   Tags: ${l.tags.join(", ")}`);
    console.log(`   Applied: ${l.applied_count}x`);
    if (i < filtered.length - 1) console.log("");
  });
}

function listPatterns(): void {
  const patterns = loadPatterns();
  
  if (patterns.length === 0) {
    console.log("No patterns detected yet.");
    console.log("Patterns emerge after 3+ similar learnings.");
    return;
  }
  
  console.log(`\n=== DETECTED PATTERNS ===\n`);
  patterns
    .sort((a, b) => b.occurrences - a.occurrences)
    .forEach((p) => {
      const confIcon = p.confidence === "high" ? "●" : p.confidence === "medium" ? "◐" : "○";
      console.log(`${confIcon} ${p.pattern}`);
      console.log(`   Solution: ${p.solution}`);
      console.log(`   Seen: ${p.occurrences}x | Confidence: ${p.confidence}`);
      console.log("");
    });
}

function applyPattern(tags: string[]): string | null {
  const patterns = loadPatterns();
  const patternKey = tags.sort().join(",");
  
  const match = patterns.find((p) => p.pattern === patternKey);
  if (match && match.confidence !== "low") {
    // Update applied count in learnings
    const learnings = loadLearnings();
    learnings.forEach((l) => {
      if (l.tags.some((t) => tags.includes(t))) {
        l.applied_count++;
      }
    });
    saveLearnings(learnings);
    
    return match.solution;
  }
  return null;
}

function suggestForContext(context: string): void {
  const learnings = loadLearnings();
  const patterns = loadPatterns();
  
  // Find relevant learnings by context similarity
  const relevant = learnings
    .filter((l) => context.toLowerCase().includes(l.context.toLowerCase().split(" ")[0]))
    .slice(-5);
  
  if (relevant.length > 0 || patterns.length > 0) {
    console.log("\n=== SUGGESTIONS ===\n");
    
    if (relevant.length > 0) {
      console.log("Past learnings:");
      relevant.forEach((l) => {
        console.log(`  • ${l.lesson}`);
      });
    }
    
    if (patterns.length > 0) {
      console.log("\nKnown patterns:");
      patterns
        .filter((p) => p.confidence !== "low")
        .slice(0, 3)
        .forEach((p) => {
          console.log(`  • ${p.pattern}: ${p.solution}`);
        });
    }
  } else {
    console.log("No relevant suggestions found.");
  }
}

const { values } = parseArgs({
  options: {
    mistake: { type: "boolean", short: "m" },
    success: { type: "boolean", short: "s" },
    pattern: { type: "boolean", short: "p" },
    context: { type: "string", short: "c" },
    what: { type: "string", short: "w" },
    lesson: { type: "string", short: "l" },
    tags: { type: "string", short: "t" },
    list: { type: "boolean", short: "L" },
    patterns: { type: "boolean", short: "P" },
    suggest: { type: "string", short: "S" },
    limit: { type: "string", default: "10" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Self-Improvement - Learn from mistakes and successes

Usage:
  self-improve --mistake --context "..." --what "..." --lesson "..." --tags "..."
  self-improve --success --context "..." --what "..." --lesson "..." --tags "..."
  self-improve --list [--mistake|--success] [--limit N]
  self-improve --patterns
  self-improve --suggest "current context"

Logging Options:
  -m, --mistake          Log a mistake
  -s, --success          Log a success
  -p, --pattern          Log a pattern discovery
  -c, --context <text>   Brief context (e.g., "API call", "file write")
  -w, --what <text>      What happened
  -l, --lesson <text>    What was learned
  -t, --tags <text>      Comma-separated tags for pattern detection

Query Options:
  -L, --list             List recent learnings
  -P, --patterns         Show detected patterns
  -S, --suggest <text>   Get suggestions for current context
  --limit <n>            Max items to show (default: 10)

Examples:
  self-improve -m -c "npm install" -w "Package not found" -l "Check package name spelling" -t "npm,install"
  self-improve -s -c "API call" -w "Added retry logic" -l "Retries handle transient failures" -t "api,retry"
  self-improve --list --mistake
  self-improve --patterns
  self-improve --suggest "working with APIs"
`);
  process.exit(0);
}

const limit = parseInt(values.limit || "10", 10);

if (values.list) {
  const type = values.mistake ? "mistake" : values.success ? "success" : undefined;
  listLearnings(type, limit);
} else if (values.patterns) {
  listPatterns();
} else if (values.suggest) {
  suggestForContext(values.suggest);
} else if ((values.mistake || values.success || values.pattern) && values.context && values.lesson) {
  const type = values.mistake ? "mistake" : values.success ? "success" : "pattern";
  const tags = (values.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  logLearning(type, values.context, values.what || "", values.lesson, tags);
} else {
  console.log("Use --help for usage information");
}
