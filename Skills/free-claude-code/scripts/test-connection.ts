#!/usr/bin/env bun
/**
 * Test Ollama connection and verify models are available
 */

const OLLAMA_BASE = "http://localhost:11434";

async function testConnection() {
  console.log("Testing Ollama connection...\n");

  try {
    // Test basic connectivity
    const versionRes = await fetch(`${OLLAMA_BASE}/api/version`);
    if (!versionRes.ok) {
      console.error("✗ Ollama not responding");
      process.exit(1);
    }
    const version = await versionRes.json();
    console.log(`✓ Ollama version: ${version.version}`);

    // Test Anthropic-compatible endpoint
    const modelsRes = await fetch(`${OLLAMA_BASE}/v1/models`);
    if (!modelsRes.ok) {
      console.error("✗ Anthropic API compatibility not available");
      process.exit(1);
    }
    const models = await modelsRes.json();
    console.log(`✓ Anthropic API compatibility: Available\n`);

    // List available models
    console.log("Available models:");
    console.log("-----------------");
    
    const recommendedModels = [
      { id: "qwen2.5-coder:7b", best: "All-around code generation" },
      { id: "deepseek-coder:6.7b", best: "Debugging & refactoring" },
      { id: "qwen3:latest", best: "General reasoning" },
      { id: "llama3.2:latest", best: "Quick tasks" },
    ];

    for (const model of models.data) {
      const recommended = recommendedModels.find(r => r.id === model.id);
      if (recommended) {
        console.log(`★ ${model.id}`);
        console.log(`  Best for: ${recommended.best}`);
      } else {
        console.log(`  ${model.id}`);
      }
    }

    // Test a simple completion
    console.log("\nTesting code generation...");
    const testRes = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder:7b",
        messages: [{ role: "user", content: "Say 'ready' if you can help with code" }],
        max_tokens: 10,
      }),
    });

    if (testRes.ok) {
      console.log("✓ Model inference working\n");
    } else {
      console.log("✗ Model inference failed\n");
    }

    console.log("Ready to use Claude Code for FREE!");
    console.log("\nUsage:");
    console.log("  bun /home/workspace/Skills/free-claude-code/scripts/claude-local.ts");

  } catch (error) {
    console.error("✗ Connection failed:", error);
    console.log("\nMake sure Ollama is running:");
    console.log("  ollama serve");
    process.exit(1);
  }
}

testConnection();
