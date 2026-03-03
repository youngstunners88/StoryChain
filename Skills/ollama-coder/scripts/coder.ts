#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const OLLAMA_API = "http://localhost:11434/v1/chat/completions";

// Model selection based on available memory
const MODELS = {
  fast: "qwen2.5-coder:0.5b",      // 397 MB - always works
  quality: "qwen2.5-coder:7b",     // 4.7 GB - needs 8GB RAM
  debug: "deepseek-coder:6.7b",    // 3.8 GB - needs 6GB RAM
  general: "llama3.2:1b",          // 1.3 GB - general purpose
};

// Detect best model for current memory
async function detectBestModel(): Promise<string> {
  try {
    const memInfo = readFileSync("/proc/meminfo", "utf-8");
    const memAvailable = parseInt(memInfo.match(/MemAvailable:\s+(\d+)/)?.[1] || "0");
    const memGB = memAvailable / 1024 / 1024;
    
    if (memGB >= 6) return MODELS.quality;
    if (memGB >= 4) return MODELS.debug;
    return MODELS.fast;
  } catch {
    return MODELS.fast;
  }
}

// Call Ollama API
async function callOllama(prompt: string, model?: string): Promise<string> {
  const selectedModel = model || await detectBestModel();
  
  const response = await fetch(OLLAMA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: selectedModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Commands
async function generate(prompt: string, options: { model?: string; output?: string }) {
  console.log(`🚀 Generating code with ${options.model || 'auto-detected model'}...\n`);
  
  const fullPrompt = `You are an expert software developer. Generate clean, well-documented code.

${prompt}

Provide only the code with brief comments. Use modern best practices.`;

  const result = await callOllama(fullPrompt, options.model);
  
  if (options.output) {
    writeFileSync(options.output, result);
    console.log(`✅ Code saved to: ${options.output}`);
  } else {
    console.log(result);
  }
  
  return result;
}

async function review(filePath: string, options: { model?: string }) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const code = readFileSync(filePath, "utf-8");
  console.log(`🔍 Reviewing: ${filePath}\n`);

  const prompt = `You are a senior code reviewer. Analyze this code for:

1. **Bugs & Logic Errors**: Potential runtime issues
2. **Security**: Vulnerabilities or unsafe patterns
3. **Performance**: Optimization opportunities
4. **Best Practices**: Code style and maintainability
5. **Architecture**: Design pattern improvements

Code to review:
\`\`\`
${code}
\`\`\`

Provide actionable feedback with specific line references where applicable.`;

  const result = await callOllama(prompt, options.model);
  console.log(result);
  return result;
}

async function debug(filePath: string, errorDesc: string, options: { model?: string }) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const code = readFileSync(filePath, "utf-8");
  console.log(`🐛 Debugging: ${filePath}`);
  console.log(`Error: ${errorDesc}\n`);

  // Use debug model by default for debugging
  const model = options.model || MODELS.debug;

  const prompt = `You are an expert debugger. Analyze this code and error to find the root cause and fix.

**Error Description**: ${errorDesc}

**Code**:
\`\`\`
${code}
\`\`\`

Provide:
1. Root cause analysis
2. The exact fix needed
3. Corrected code snippet
4. How to prevent this issue`;

  const result = await callOllama(prompt, model);
  console.log(result);
  return result;
}

async function refactor(filePath: string, instructions: string, options: { model?: string; output?: string }) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const code = readFileSync(filePath, "utf-8");
  console.log(`🔧 Refactoring: ${filePath}`);
  console.log(`Instructions: ${instructions}\n`);

  const prompt = `You are an expert at code refactoring. Refactor this code according to the instructions.

**Refactoring Instructions**: ${instructions}

**Original Code**:
\`\`\`
${code}
\`\`\`

Provide the complete refactored code with comments explaining the changes.`;

  const result = await callOllama(prompt, options.model);
  
  if (options.output) {
    writeFileSync(options.output, result);
    console.log(`✅ Refactored code saved to: ${options.output}`);
  } else {
    console.log(result);
  }
  
  return result;
}

async function explain(filePath: string, options: { model?: string }) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const code = readFileSync(filePath, "utf-8");
  console.log(`📚 Explaining: ${filePath}\n`);

  const prompt = `You are a patient code teacher. Explain this code in simple terms:

\`\`\`
${code}
\`\`\`

Provide:
1. **Overview**: What this code does
2. **Key Components**: Main functions/classes and their purposes
3. **Data Flow**: How data moves through the code
4. **Dependencies**: External libraries/modules used
5. **Usage**: How to use this code`;

  const result = await callOllama(prompt, options.model);
  console.log(result);
  return result;
}

async function test(filePath: string, options: { model?: string; output?: string }) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const code = readFileSync(filePath, "utf-8");
  console.log(`🧪 Generating tests for: ${filePath}\n`);

  const prompt = `You are a test-driven development expert. Generate comprehensive tests for this code:

\`\`\`
${code}
\`\`\`

Generate:
1. Unit tests for all functions/methods
2. Edge case tests
3. Error handling tests
4. Use Jest or Vitest syntax
5. Include describe blocks and clear test names`;

  const result = await callOllama(prompt, options.model);
  
  if (options.output) {
    writeFileSync(options.output, result);
    console.log(`✅ Tests saved to: ${options.output}`);
  } else {
    console.log(result);
  }
  
  return result;
}

async function status() {
  console.log("📊 Ollama Coder Status\n");
  
  // Check Ollama
  try {
    const modelsRes = await fetch("http://localhost:11434/v1/models");
    const models = await modelsRes.json();
    
    console.log("✅ Ollama is running\n");
    console.log("Available models:");
    for (const model of models.data) {
      console.log(`  • ${model.id}`);
    }
  } catch {
    console.log("❌ Ollama is not running. Start with: ollama serve");
  }

  // Memory
  try {
    const memInfo = readFileSync("/proc/meminfo", "utf-8");
    const total = parseInt(memInfo.match(/MemTotal:\s+(\d+)/)?.[1] || "0");
    const available = parseInt(memInfo.match(/MemAvailable:\s+(\d+)/)?.[1] || "0");
    
    console.log(`\nMemory: ${(available / 1024 / 1024).toFixed(1)}GB available of ${(total / 1024 / 1024).toFixed(1)}GB`);
    
    const availableGB = available / 1024 / 1024;
    if (availableGB >= 6) {
      console.log("Recommended model: qwen2.5-coder:7b (best quality)");
    } else if (availableGB >= 4) {
      console.log("Recommended model: deepseek-coder:6.7b (good debugging)");
    } else {
      console.log("Recommended model: qwen2.5-coder:0.5b (fast, lightweight)");
    }
  } catch {
    console.log("Could not read memory info");
  }
}

// CLI
async function main() {
  const { positionals, values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      model: { type: "string", short: "m" },
      output: { type: "string", short: "o" },
      help: { type: "boolean", short: "h" },
    },
    strict: false,
  });

  const [command, ...args] = positionals;

  if (values.help || !command) {
    console.log(`
🤖 Ollama Coder - Free Local Code Generation

Usage:
  bun coder.ts <command> [options]

Commands:
  generate <prompt>        Generate code from a prompt
  review <file>            Review code for issues
  debug <file> <error>     Debug code with error description
  refactor <file> <instr>  Refactor code with instructions
  explain <file>           Explain how code works
  test <file>              Generate tests for code
  status                   Check Ollama status and models

Options:
  -m, --model <name>       Model to use (fast, quality, debug, general)
  -o, --output <file>      Save output to file

Examples:
  bun coder.ts generate "Create a React hook for fetching data"
  bun coder.ts review src/App.tsx
  bun coder.ts debug src/api.ts "TypeError: Cannot read property"
  bun coder.ts refactor src/utils.ts "Convert to async/await"
  bun coder.ts test src/components/Button.tsx -o Button.test.tsx
  bun coder.ts status
`);
    return;
  }

  try {
    switch (command) {
      case "generate":
        await generate(args.join(" "), { model: values.model, output: values.output });
        break;
      case "review":
        await review(args[0], { model: values.model });
        break;
      case "debug":
        await debug(args[0], args.slice(1).join(" "), { model: values.model });
        break;
      case "refactor":
        await refactor(args[0], args.slice(1).join(" "), { model: values.model, output: values.output });
        break;
      case "explain":
        await explain(args[0], { model: values.model });
        break;
      case "test":
        await test(args[0], { model: values.model, output: values.output });
        break;
      case "status":
        await status();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log("Run 'bun coder.ts --help' for usage");
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
