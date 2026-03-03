#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { execSync } from "node:child_process";

// Load OpenRouter API key from secrets
const SECRETS_PATH = "/home/.z/secrets.env";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

function loadApiKey(): string {
  const secrets = readFileSync(SECRETS_PATH, "utf-8");
  const match = secrets.match(/OPENROUTER_API_KEY=(.+)/);
  if (!match) {
    throw new Error("OPENROUTER_API_KEY not found in secrets");
  }
  return match[1].trim();
}

const API_KEY = loadApiKey();

const LANGUAGE_CONFIGS: Record<string, { comment: string; name: string }> = {
  ".ts": { comment: "//", name: "TypeScript" },
  ".tsx": { comment: "//", name: "TypeScript React" },
  ".js": { comment: "//", name: "JavaScript" },
  ".jsx": { comment: "//", name: "JavaScript React" },
  ".py": { comment: "#", name: "Python" },
  ".rs": { comment: "//", name: "Rust" },
  ".go": { comment: "//", name: "Go" },
  ".java": { comment: "//", name: "Java" },
  ".c": { comment: "//", name: "C" },
  ".cpp": { comment: "//", name: "C++" },
  ".cs": { comment: "//", name: "C#" },
  ".rb": { comment: "#", name: "Ruby" },
  ".php": { comment: "//", name: "PHP" },
  ".swift": { comment: "//", name: "Swift" },
  ".kt": { comment: "//", name: "Kotlin" },
  ".scala": { comment: "//", name: "Scala" },
};

interface ReviewResult {
  issues: Array<{
    line?: number;
    severity: "critical" | "warning" | "info";
    message: string;
    suggestion?: string;
  }>;
  improved_code?: string;
  summary: string;
}

async function callLLM(prompt: string, system: string): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://zo.computer",
      "X-Title": "Zo Auto Code Reviewer",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function reviewCode(
  code: string,
  filePath: string,
  options: { autoFix: boolean; focus?: string }
): Promise<ReviewResult> {
  const ext = extname(filePath);
  const langConfig = LANGUAGE_CONFIGS[ext] || { comment: "#", name: "Unknown" };
  
  const focusPrompt = options.focus
    ? `Focus specifically on ${options.focus} issues.`
    : "";

  const system = `You are an expert code reviewer. Analyze code for:
1. Security vulnerabilities (SQL injection, XSS, hardcoded secrets, etc.)
2. Performance issues (N+1 queries, memory leaks, inefficient algorithms)
3. Code quality (duplication, complexity, naming, structure)
4. Documentation (missing comments, unclear names)
5. Error handling and edge cases

${focusPrompt}

Return your response as JSON:
{
  "issues": [{"line": number, "severity": "critical|warning|info", "message": "description", "suggestion": "how to fix"}],
  "improved_code": "the improved version of the code if autoFix is true, otherwise null",
  "summary": "brief summary of findings"
}`;

  const prompt = options.autoFix
    ? `Review this ${langConfig.name} code and provide an improved version with all issues fixed:

File: ${filePath}
\`\`\`${langConfig.name.toLowerCase()}
${code}
\`\`\`

Return the improved code in the "improved_code" field. Make all necessary improvements while preserving functionality.`
    : `Review this ${langConfig.name} code:

File: ${filePath}
\`\`\`${langConfig.name.toLowerCase()}
${code}
\`\`\`

Return issues found. Set "improved_code" to null.`;

  const response = await callLLM(prompt, system);
  
  // Parse JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse LLM response as JSON");
  }
  
  return JSON.parse(jsonMatch[0]);
}

function getGitDiff(): string {
  try {
    return execSync("git diff HEAD", { encoding: "utf-8" });
  } catch {
    return "";
  }
}

function getFilesToReview(
  target: string,
  isDir: boolean
): string[] {
  if (!isDir) {
    return [target];
  }

  const files: string[] = [];
  const exts = Object.keys(LANGUAGE_CONFIGS);

  function walk(dir: string) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!["node_modules", ".git", "dist", "build", "__pycache__"].includes(entry)) {
          walk(fullPath);
        }
      } else if (stat.isFile() && exts.includes(extname(entry))) {
        files.push(fullPath);
      }
    }
  }

  walk(target);
  return files;
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      file: { type: "string", short: "f" },
      dir: { type: "string", short: "d" },
      git: { type: "boolean", short: "g" },
      "auto-fix": { type: "boolean", short: "a" },
      focus: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    strict: false,
  });

  if (values.help) {
    console.log(`
Auto Code Reviewer - Automatically review and improve code

Usage:
  bun review.ts --file <path>        Review a single file
  bun review.ts --dir <path>         Review all code files in a directory
  bun review.ts --git                Review git diff
  bun review.ts --file <path> --auto-fix   Review and auto-apply fixes

Options:
  -f, --file <path>    File to review
  -d, --dir <path>     Directory to review
  -g, --git            Review git diff
  -a, --auto-fix       Automatically apply fixes
  --focus <area>       Focus on: security, performance, quality, documentation
  -h, --help           Show this help
`);
    process.exit(0);
  }

  const autoFix = values["auto-fix"] ?? false;

  // Review git diff
  if (values.git) {
    console.log("📝 Reviewing git diff...\n");
    const diff = getGitDiff();
    if (!diff) {
      console.log("No git changes found.");
      process.exit(0);
    }
    
    // For git diff, we review the changes
    const result = await reviewCode(diff, "git-diff", { autoFix: false, focus: values.focus });
    console.log("📊 Review Summary:", result.summary);
    console.log("\n🔍 Issues Found:");
    for (const issue of result.issues) {
      const icon = issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟡" : "ℹ️";
      console.log(`  ${icon} ${issue.message}`);
      if (issue.suggestion) {
        console.log(`     💡 ${issue.suggestion}`);
      }
    }
    process.exit(0);
  }

  // Determine target
  let target: string;
  let isDir: boolean;

  if (values.file) {
    target = values.file;
    isDir = false;
  } else if (values.dir) {
    target = values.dir;
    isDir = true;
  } else if (positionals[0]) {
    target = positionals[0];
    isDir = statSync(target).isDirectory();
  } else {
    console.error("Error: Specify --file, --dir, or --git");
    process.exit(1);
  }

  if (!existsSync(target)) {
    console.error(`Error: Path not found: ${target}`);
    process.exit(1);
  }

  const files = getFilesToReview(target, isDir);
  console.log(`📁 Found ${files.length} file(s) to review\n`);

  let totalIssues = 0;
  const criticalIssues: string[] = [];

  for (const file of files) {
    console.log(`📄 Reviewing: ${file}`);
    
    try {
      const code = readFileSync(file, "utf-8");
      const result = await reviewCode(code, file, { autoFix, focus: values.focus });
      
      totalIssues += result.issues.length;
      
      for (const issue of result.issues) {
        const icon = issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟡" : "ℹ️";
        console.log(`  ${icon} Line ${issue.line ?? "?"}: ${issue.message}`);
        
        if (issue.severity === "critical") {
          criticalIssues.push(`${file}: ${issue.message}`);
        }
      }

      if (autoFix && result.improved_code) {
        writeFileSync(file, result.improved_code, "utf-8");
        console.log(`  ✅ Applied improvements to ${file}`);
      }
      
      console.log();
    } catch (err) {
      console.error(`  ❌ Error reviewing ${file}:`, err);
    }
  }

  console.log("━".repeat(50));
  console.log(`📊 Total issues found: ${totalIssues}`);
  
  if (criticalIssues.length > 0) {
    console.log("\n🚨 Critical Issues:");
    for (const issue of criticalIssues) {
      console.log(`  • ${issue}`);
    }
  }

  if (autoFix) {
    console.log("\n✨ Auto-fix applied to all files with improvements.");
  } else if (totalIssues > 0) {
    console.log("\n💡 Run with --auto-fix to automatically apply improvements.");
  }
}

main().catch(console.error);
