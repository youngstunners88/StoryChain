#!/usr/bin/env bun
/**
 * Code review using local Ollama models
 * Perfect for reviewing iHhashi code before pushing
 * 
 * Usage:
 *   bun review.ts --project iHhashi              # Review entire project
 *   bun review.ts --files src/auth.ts src/api.ts # Review specific files
 *   bun review.ts --staged                       # Review staged changes
 */

import { $ } from "bun";

const args = process.argv.slice(2);
const opts: Record<string, string | boolean> = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const key = args[i].slice(2);
    opts[key] = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
    if (typeof opts[key] === "string") i++;
  }
}

const OLLAMA_BASE = "http://localhost:11434";
const MODEL = (opts.model as string) || "deepseek-coder:6.7b";

async function review() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              CODE REVIEW - LOCAL AI                        ║
╠════════════════════════════════════════════════════════════╣
║  Model: ${MODEL.padEnd(48)}║
╚════════════════════════════════════════════════════════════╝
`);

  // Check Ollama
  try {
    const check = await fetch(`${OLLAMA_BASE}/api/version`);
    if (!check.ok) throw new Error();
  } catch {
    console.error("✗ Ollama not running. Start with: ollama serve");
    process.exit(1);
  }

  let codeToReview = "";
  let reviewContext = "";

  // Get code based on options
  if (opts.project) {
    const projectPath = opts.project === "iHhashi" 
      ? "/home/workspace/iHhashi" 
      : `/home/workspace/${opts.project}`;
    
    console.log(`Scanning project: ${projectPath}\n`);
    
    // Get key files
    const result = Bun.spawnSync([
      "find", projectPath, 
      "-name", "*.ts", "-o", "-name", "*.js", "-o", "-name", "*.tsx", "-o", "-name", "*.jsx"
    ], { stdout: "pipe" });
    
    const files = result.stdout.toString().split("\n").filter(f => f && !f.includes("node_modules")).slice(0, 20);
    
    for (const file of files) {
      try {
        const content = Bun.file(file);
        if (await content.exists()) {
          const text = await content.text();
          codeToReview += `\n// === ${file} ===\n${text.slice(0, 2000)}\n`;
        }
      } catch {}
    }
    reviewContext = `Reviewing project: ${opts.project}`;

  } else if (opts.staged) {
    console.log("Getting staged changes...\n");
    const result = Bun.spawnSync(["git", "diff", "--staged"], { 
      cwd: "/home/workspace/iHhashi",
      stdout: "pipe" 
    });
    codeToReview = result.stdout.toString();
    reviewContext = "Reviewing staged git changes";

  } else if (opts.files) {
    const files = (opts.files as string).split(" ");
    for (const file of files) {
      try {
        const content = await Bun.file(`/home/workspace/iHhashi/${file}`).text();
        codeToReview += `\n// === ${file} ===\n${content}\n`;
      } catch {}
    }
    reviewContext = `Reviewing files: ${files.join(", ")}`;
  }

  if (!codeToReview) {
    console.log("No code to review. Use --project, --files, or --staged");
    process.exit(1);
  }

  console.log(`Context: ${reviewContext}`);
  console.log(`Code length: ${codeToReview.length} chars\n`);
  console.log("Analyzing with local model...\n");
  console.log("─".repeat(60) + "\n");

  // Call Ollama for review
  const reviewPrompt = `You are a senior code reviewer. Review this code for:

1. SECURITY VULNERABILITIES (critical)
   - SQL injection, XSS, CSRF
   - Authentication/authorization flaws
   - Sensitive data exposure
   - Input validation issues

2. PERFORMANCE ISSUES
   - Inefficient algorithms
   - Memory leaks
   - N+1 queries
   - Blocking operations

3. CODE QUALITY
   - Error handling
   - Code duplication
   - Naming conventions
   - Documentation

4. BEST PRACTICES
   - TypeScript/JavaScript specific
   - React/Node.js patterns
   - Testing coverage

Code to review:
${codeToReview.slice(0, 16000)}

Provide a concise review with:
- Critical issues (must fix before commit)
- Warnings (should fix)
- Suggestions (nice to have)
- Overall assessment`;

  try {
    const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: reviewPrompt }],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    const data = await res.json();
    const review = data.choices?.[0]?.message?.content || "No review generated";
    
    console.log(review);
    console.log("\n" + "─".repeat(60));
    console.log("\n✓ Review complete using FREE local model");

  } catch (error) {
    console.error("Review failed:", error);
    process.exit(1);
  }
}

review();
