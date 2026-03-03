#!/usr/bin/env bun
/**
 * GitHub Push - Generate, Review, and Push Flawless Code
 * Ensures all code is reviewed and polished before pushing to GitHub
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const OLLAMA_API = "http://localhost:11434/v1/chat/completions";

async function callOllama(prompt: string): Promise<string> {
  const response = await fetch(OLLAMA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5-coder:0.5b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.5, // Lower temp for more consistent output
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${await response.text()}`);
  }

  return (await response.json()).choices[0].message.content;
}

// Extract code from LLM response
function extractCode(response: string): string {
  // Try to find code blocks
  const codeMatch = response.match(/```(?:typescript|tsx|ts|javascript|jsx|js)?\n([\s\S]*?)```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }
  // Return as-is if no code blocks
  return response;
}

// Generate flawless code with multiple passes
async function generateFlawless(prompt: string, filePath: string) {
  console.log(`\n🎯 Generating flawless code for: ${filePath}`);
  console.log("━".repeat(50));

  // Pass 1: Initial generation
  console.log("\n📝 Pass 1: Initial generation...");
  const genPrompt = `Generate production-ready TypeScript code for:

${prompt}

Requirements:
- Clean, readable code
- Proper TypeScript types
- Error handling
- Comments for complex logic
- Modern best practices

Provide only the code, no explanations.`;

  let code = extractCode(await callOllama(genPrompt));

  // Pass 2: Self-review
  console.log("🔍 Pass 2: Self-review...");
  const reviewPrompt = `Review this code and identify any issues:

\`\`\`typescript
${code}
\`\`\`

List issues in this format:
ISSUE: [description]
LINE: [line number or range]
FIX: [how to fix]

If no issues, respond with: NO_ISSUES`;

  const review = await callOllama(reviewPrompt);
  console.log("Review findings:", review.split("\n").slice(0, 5).join("\n"));

  // Pass 3: Apply fixes if needed
  if (!review.includes("NO_ISSUES")) {
    console.log("🔧 Pass 3: Applying fixes...");
    const fixPrompt = `Fix all issues in this code based on the review:

Original code:
\`\`\`typescript
${code}
\`\`\`

Review findings:
${review}

Provide the corrected code with all issues fixed.`;

    code = extractCode(await callOllama(fixPrompt));
  } else {
    console.log("✅ No issues found!");
  }

  // Pass 4: Final polish
  console.log("✨ Pass 4: Final polish...");
  const polishPrompt = `Polish this code to be flawless:

\`\`\`typescript
${code}
\`\`\`

Ensure:
- Consistent formatting
- Complete type annotations
- All edge cases handled
- No console.logs except errors
- Proper exports

Provide only the final polished code.`;

  code = extractCode(await callOllama(polishPrompt));

  // Save to file
  writeFileSync(filePath, code);
  console.log(`\n✅ Flawless code saved to: ${filePath}`);

  return code;
}

// Review existing file
async function reviewFile(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  console.log(`\n🔍 Reviewing: ${filePath}`);
  console.log("━".repeat(50));

  const code = readFileSync(filePath, "utf-8");

  const reviewPrompt = `You are a strict code reviewer. Review this code:

\`\`\`typescript
${code}
\`\`\`

Check for:
1. Bugs and logic errors
2. Type safety issues
3. Security vulnerabilities
4. Performance problems
5. Missing error handling
6. Code style issues

Rate the code quality: A, B, C, D, or F

For each issue found, provide:
SEVERITY: [Critical/High/Medium/Low]
LINE: [line number]
ISSUE: [description]
FIX: [suggested fix]

If quality is A or B, respond with: QUALITY_PASSED
Otherwise, list all issues.`;

  const review = await callOllama(reviewPrompt);
  console.log(review);

  const passed = review.includes("QUALITY_PASSED");
  
  if (passed) {
    console.log("\n✅ Code quality check passed!");
  } else {
    console.log("\n⚠️ Code needs improvement before pushing");
  }

  return passed;
}

// Push to GitHub with quality check
async function pushToGitHub(commitMessage: string, files: string[]) {
  console.log("\n🚀 Preparing to push to GitHub...");
  console.log("━".repeat(50));

  // Review all files first
  let allPassed = true;
  for (const file of files) {
    const passed = await reviewFile(file);
    if (!passed) allPassed = false;
  }

  if (!allPassed) {
    console.log("\n❌ Some files need fixes. Not pushing.");
    console.log("Fix the issues and run again.");
    return false;
  }

  // Git operations
  try {
    console.log("\n📦 Staging files...");
    for (const file of files) {
      execSync(`git add "${file}"`, { stdio: "inherit" });
    }

    console.log(`\n💾 Committing: ${commitMessage}`);
    execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });

    console.log("\n🌐 Pushing to GitHub...");
    execSync("git push", { stdio: "inherit" });

    console.log("\n✅ Successfully pushed to GitHub!");
    return true;
  } catch (error) {
    console.error("\n❌ Git error:", error);
    return false;
  }
}

// CLI
async function main() {
  const args = Bun.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
🚀 GitHub Push - Flawless Code Generator

Commands:
  generate <prompt> <file>    Generate flawless code and save to file
  review <file>               Review file quality
  push <message> <files...>   Review and push files to GitHub

Examples:
  bun github.ts generate "Create a useDelivery hook" src/hooks/useDelivery.ts
  bun github.ts review src/App.tsx
  bun github.ts push "Add delivery tracking" src/tracking.ts src/hooks/useTrack.ts
`);
    return;
  }

  try {
    switch (command) {
      case "generate":
        await generateFlawless(args[1], args[2]);
        break;
      case "review":
        await reviewFile(args[1]);
        break;
      case "push":
        await pushToGitHub(args[1], args.slice(2));
        break;
      default:
        console.log(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
  }
}

main();
