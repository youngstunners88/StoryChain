#!/usr/bin/env bun
/**
 * iHhashi Code Orchestrator
 * Multi-agent code generation for flawless iHhashi delivery platform code
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const OLLAMA_API = "http://localhost:11434/v1/chat/completions";
const WORKSPACE = "/home/workspace";

// iHhashi project context
const IHHASHI_CONTEXT = `
iHhashi is a DELIVERY platform for: groceries, food, fruits, vegetables, dairy products, and personal courier services.
It is NOT a taxi app, NOT related to Boober, and has NO passenger transport functionality.

Tech Stack:
- React Native + Expo
- TypeScript
- Zustand for state management
- Supabase for backend
- Stripe for payments

Key Features:
- Order management
- Delivery tracking
- Courier assignment
- Real-time updates
- Payment processing
`;

// Call Ollama
async function callOllama(prompt: string, systemPrompt?: string): Promise<string> {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch(OLLAMA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5-coder:0.5b",
      messages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${await response.text()}`);
  }

  return (await response.json()).choices[0].message.content;
}

// Agents
const agents = {
  architect: {
    name: "Architect",
    system: `You are a senior software architect specializing in React Native and Expo apps. Design clean, scalable architectures.`,
    task: "Design the architecture for a feature or component."
  },
  coder: {
    name: "Coder",
    system: `You are an expert TypeScript/React Native developer. Write clean, type-safe, well-documented code.`,
    task: "Implement the feature following the architecture."
  },
  reviewer: {
    name: "Reviewer",
    system: `You are a meticulous code reviewer. Find bugs, security issues, and improvements.`,
    task: "Review code for issues and suggest improvements."
  },
  tester: {
    name: "Tester",
    system: `You are a TDD expert. Write comprehensive tests covering all edge cases.`,
    task: "Write tests for the implementation."
  }
};

// Orchestrate a feature development
async function developFeature(featureDescription: string, outputPath?: string) {
  console.log(`\n🎯 Developing Feature: ${featureDescription}\n`);
  console.log("━".repeat(50));

  // Step 1: Architecture
  console.log("\n📐 Step 1: Architecture Design");
  const archPrompt = `${IHHASHI_CONTEXT}

Design the architecture for: ${featureDescription}

Provide:
1. Component structure
2. State management approach (Zustand)
3. API integration plan
4. File organization`;

  const architecture = await callOllama(archPrompt, agents.architect.system);
  console.log(architecture);

  // Step 2: Implementation
  console.log("\n\n💻 Step 2: Implementation");
  const codePrompt = `${IHHASHI_CONTEXT}

Based on this architecture:
${architecture}

Implement: ${featureDescription}

Provide complete, production-ready TypeScript code with:
- Proper typing
- Error handling
- Loading states
- Comments`;

  const code = await callOllama(codePrompt, agents.coder.system);
  console.log(code);

  // Step 3: Review
  console.log("\n\n🔍 Step 3: Code Review");
  const reviewPrompt = `Review this code for iHhashi:

${code}

Check for:
1. Bugs and logic errors
2. TypeScript type safety
3. React Native best practices
4. Security issues
5. Performance concerns`;

  const review = await callOllama(reviewPrompt, agents.reviewer.system);
  console.log(review);

  // Step 4: Tests
  console.log("\n\n🧪 Step 4: Test Generation");
  const testPrompt = `Write comprehensive tests for:

${code}

Use Jest/React Native Testing Library. Cover:
1. Happy path
2. Error cases
3. Edge cases
4. Loading states`;

  const tests = await callOllama(testPrompt, agents.tester.system);
  console.log(tests);

  // Step 5: Final Polish
  console.log("\n\n✨ Step 5: Final Polish");
  const polishPrompt = `Based on the review feedback:
${review}

Polish this code to address all issues:

${code}

Provide the final, polished version.`;

  const finalCode = await callOllama(polishPrompt, agents.coder.system);

  // Save if output path provided
  if (outputPath) {
    writeFileSync(outputPath, finalCode);
    console.log(`\n✅ Final code saved to: ${outputPath}`);
  }

  console.log("\n" + "━".repeat(50));
  console.log("🎉 Feature development complete!\n");

  return { architecture, code, review, tests, finalCode };
}

// Analyze existing codebase
async function analyzeCodebase(dir: string) {
  console.log(`\n📂 Analyzing: ${dir}\n`);

  const files: string[] = [];
  
  function scan(d: string) {
    const items = readdirSync(d);
    for (const item of items) {
      if (item.startsWith(".") || item === "node_modules") continue;
      const full = join(d, item);
      if (statSync(full).isDirectory()) {
        scan(full);
      } else if (item.endsWith(".ts") || item.endsWith(".tsx")) {
        files.push(full);
      }
    }
  }

  scan(dir);

  console.log(`Found ${files.length} TypeScript files:\n`);
  
  for (const file of files.slice(0, 10)) {
    const rel = relative(WORKSPACE, file);
    console.log(`  • ${rel}`);
  }

  if (files.length > 10) {
    console.log(`  ... and ${files.length - 10} more`);
  }

  return files;
}

// Quick code generation
async function quickGen(prompt: string) {
  console.log(`\n⚡ Quick Generate: ${prompt}\n`);
  
  const result = await callOllama(
    `${IHHASHI_CONTEXT}\n\n${prompt}\n\nProvide clean, production-ready TypeScript code.`,
    agents.coder.system
  );
  
  console.log(result);
  return result;
}

// CLI
async function main() {
  const args = Bun.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
🤖 iHhashi Code Orchestrator

Commands:
  feature <description>  Develop a complete feature with architecture, code, review, tests
  analyze <dir>          Analyze a codebase directory
  quick <prompt>         Quick code generation
  status                 Check orchestrator status

Examples:
  bun orchestrate.ts feature "Delivery tracking map component"
  bun orchestrate.ts analyze /home/workspace/Projects/iHhashi
  bun orchestrate.ts quick "Create a Zustand store for cart"
`);
    return;
  }

  try {
    switch (command) {
      case "feature":
        await developFeature(args.slice(1).join(" "));
        break;
      case "analyze":
        await analyzeCodebase(args[1]);
        break;
      case "quick":
        await quickGen(args.slice(1).join(" "));
        break;
      case "status":
        console.log("✅ Orchestrator ready");
        console.log("📦 Using: qwen2.5-coder:0.5b (local, free)");
        console.log("🎯 Target: iHhashi delivery platform");
        break;
      default:
        console.log(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
  }
}

main();
