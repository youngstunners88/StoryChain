#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LEARNING_DIR = join(homedir(), ".z", "learning");
const LEARNING_FILE = join(LEARNING_DIR, "self-improvement.jsonl");
const SESSION_FILE = join(LEARNING_DIR, "session-summary.md");

interface LearningEntry {
  timestamp: string;
  type: "success" | "failure" | "pattern" | "insight" | "optimization";
  task: string;
  context: string;
  outcome: string;
  lessons: string[];
  reusable: boolean;
  tags: string[];
}

function ensureDir() {
  if (!existsSync(LEARNING_DIR)) {
    mkdirSync(LEARNING_DIR, { recursive: true });
  }
}

function logEntry(entry: LearningEntry): void {
  ensureDir();
  appendFileSync(LEARNING_FILE, JSON.stringify(entry) + "\n");
  console.log(`✓ Logged ${entry.type}: ${entry.task.substring(0, 50)}...`);
}

function formatLessons(lessons: string[]): string {
  return lessons.map((l, i) => `  ${i + 1}. ${l}`).join("\n");
}

function logSuccess(task: string, context: string, outcome: string, lessons: string[], tags: string[] = []): void {
  logEntry({
    timestamp: new Date().toISOString(),
    type: "success",
    task,
    context,
    outcome,
    lessons,
    reusable: true,
    tags,
  });
  console.log(`\n📚 Success logged. Lessons:\n${formatLessons(lessons)}`);
}

function logFailure(task: string, context: string, outcome: string, lessons: string[], tags: string[] = []): void {
  logEntry({
    timestamp: new Date().toISOString(),
    type: "failure",
    task,
    context,
    outcome,
    lessons,
    reusable: true,
    tags,
  });
  console.log(`\n⚠️ Failure logged. Lessons:\n${formatLessons(lessons)}`);
}

function logPattern(name: string, description: string, example: string, tags: string[] = []): void {
  logEntry({
    timestamp: new Date().toISOString(),
    type: "pattern",
    task: name,
    context: description,
    outcome: example,
    lessons: [],
    reusable: true,
    tags,
  });
  console.log(`✓ Pattern logged: ${name}`);
}

function logInsight(insight: string, context: string, tags: string[] = []): void {
  logEntry({
    timestamp: new Date().toISOString(),
    type: "insight",
    task: insight,
    context,
    outcome: "",
    lessons: [],
    reusable: true,
    tags,
  });
  console.log(`💡 Insight logged: ${insight.substring(0, 60)}...`);
}

function getRecent(count: number = 10): LearningEntry[] {
  if (!existsSync(LEARNING_FILE)) return [];
  const lines = readFileSync(LEARNING_FILE, "utf-8").trim().split("\n");
  return lines.slice(-count).map((l) => JSON.parse(l));
}

function searchLearning(query: string): LearningEntry[] {
  if (!existsSync(LEARNING_FILE)) return [];
  const lines = readFileSync(LEARNING_FILE, "utf-8").trim().split("\n");
  const entries = lines.map((l) => JSON.parse(l));
  const lowerQuery = query.toLowerCase();
  return entries.filter(
    (e) =>
      e.task.toLowerCase().includes(lowerQuery) ||
      e.context.toLowerCase().includes(lowerQuery) ||
      e.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
      e.lessons.some((l) => l.toLowerCase().includes(lowerQuery))
  );
}

function generateSessionSummary(): void {
  const recent = getRecent(20);
  if (recent.length === 0) {
    console.log("No learning entries found.");
    return;
  }

  const successes = recent.filter((e) => e.type === "success");
  const failures = recent.filter((e) => e.type === "failure");
  const patterns = recent.filter((e) => e.type === "pattern");

  const summary = `# Self-Improvement Session Summary

Generated: ${new Date().toISOString()}

## Stats
- Total entries: ${recent.length}
- Successes: ${successes.length}
- Failures: ${failures.length}
- Patterns discovered: ${patterns.length}

## Recent Successes
${successes
  .slice(-5)
  .map((s) => `- **${s.task.substring(0, 50)}**\n  - ${s.lessons[0] || s.outcome}`)
  .join("\n")}

## Failures to Learn From
${failures
  .slice(-5)
  .map((f) => `- **${f.task.substring(0, 50)}**\n  - Lesson: ${f.lessons[0] || "Analyze this failure"}`)
  .join("\n")}

## Discovered Patterns
${patterns.map((p) => `- **${p.task}**: ${p.context}`).join("\n")}

## Suggested Improvements
1. Review failure patterns for automation opportunities
2. Apply successful patterns to similar tasks
3. Update skill configurations based on lessons
`;

  writeFileSync(SESSION_FILE, summary);
  console.log(`✓ Session summary written to ${SESSION_FILE}`);
}

const { values } = parseArgs({
  options: {
    success: { type: "boolean", short: "s" },
    failure: { type: "boolean", short: "f" },
    pattern: { type: "boolean", short: "p" },
    insight: { type: "boolean", short: "i" },
    task: { type: "string" },
    context: { type: "string" },
    outcome: { type: "string" },
    lessons: { type: "string" },
    tags: { type: "string" },
    search: { type: "string" },
    recent: { type: "string" },
    summary: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Learning Log - Self-improvement tracking for AI agents

Usage:
  learning-log --success --task "Task" --context "Context" --outcome "Result" --lessons "Lesson1|Lesson2"
  learning-log --failure --task "Task" --context "Context" --outcome "Result" --lessons "Lesson1|Lesson2"
  learning-log --pattern --task "Pattern name" --context "Description" --outcome "Example"
  learning-log --insight --task "Insight" --context "Context"
  learning-log --search "query"
  learning-log --recent 10
  learning-log --summary

Options:
  -s, --success      Log a successful outcome
  -f, --failure      Log a failed outcome
  -p, --pattern      Log a discovered pattern
  -i, --insight      Log an insight
  --task <text>      Task description
  --context <text>   Context/background
  --outcome <text>   Result/outcome
  --lessons <text>   Pipe-separated lessons
  --tags <text>      Pipe-separated tags
  --search <query>   Search learning history
  --recent <n>       Show recent N entries
  --summary          Generate session summary
  -h, --help         Show this help
`);
  process.exit(0);
}

if (values.search) {
  const results = searchLearning(values.search);
  console.log(`\n=== Found ${results.length} entries ===\n`);
  results.slice(0, 10).forEach((e) => {
    console.log(`[${e.type.toUpperCase()}] ${e.task.substring(0, 60)}`);
    if (e.lessons.length > 0) console.log(`  → ${e.lessons[0]}`);
  });
} else if (values.recent) {
  const entries = getRecent(parseInt(values.recent) || 10);
  console.log(`\n=== Recent ${entries.length} entries ===\n`);
  entries.forEach((e) => {
    const icon = { success: "✓", failure: "✗", pattern: "◈", insight: "💡", optimization: "⚡" }[e.type];
    console.log(`${icon} [${e.type}] ${e.task.substring(0, 50)}`);
  });
} else if (values.summary) {
  generateSessionSummary();
} else if (values.success) {
  if (!values.task || !values.context) {
    console.error("Error: --task and --context required");
    process.exit(1);
  }
  logSuccess(
    values.task,
    values.context,
    values.outcome || "",
    values.lessons?.split("|") || [],
    values.tags?.split("|") || []
  );
} else if (values.failure) {
  if (!values.task || !values.context) {
    console.error("Error: --task and --context required");
    process.exit(1);
  }
  logFailure(
    values.task,
    values.context,
    values.outcome || "",
    values.lessons?.split("|") || [],
    values.tags?.split("|") || []
  );
} else if (values.pattern) {
  if (!values.task || !values.context) {
    console.error("Error: --task and --context required");
    process.exit(1);
  }
  logPattern(values.task, values.context, values.outcome || "", values.tags?.split("|") || []);
} else if (values.insight) {
  if (!values.task) {
    console.error("Error: --task required");
    process.exit(1);
  }
  logInsight(values.task, values.context || "", values.tags?.split("|") || []);
} else {
  console.log("Use --help for usage information");
}
