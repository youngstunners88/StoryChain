#!/usr/bin/env bun
/**
 * Agent Lightning - Learning Loop
 * Records observations, actions, and rewards for RL-based improvement
 */

const MEMORY_DIR = "/home/workspace/Skills/agent-lightning/memory";
const LEARNING_FILE = `${MEMORY_DIR}/learnings.jsonl`;

interface Learning {
  id: string;
  timestamp: number;
  observation: string;
  action: string;
  reward: number;
  context?: Record<string, unknown>;
  patterns?: string[];
}

async function recordLearning(
  observation: string,
  action: string,
  reward: number,
  context?: Record<string, unknown>
): Promise<Learning> {
  // Ensure memory directory exists
  const fs = require('fs');
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
  
  const learning: Learning = {
    id: `learn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    observation,
    action,
    reward,
    context,
  };

  const line = JSON.stringify(learning) + "\n";
  await Bun.write(LEARNING_FILE, line, { append: true });
  
  return learning;
}

async function queryLearnings(query: string, limit = 10): Promise<Learning[]> {
  try {
    const file = Bun.file(LEARNING_FILE);
    if (!(await file.exists())) return [];
    
    const content = await file.text();
    const lines = content.trim().split("\n").filter(Boolean);
    
    const learnings: Learning[] = lines
      .map(line => JSON.parse(line) as Learning)
      .filter(l => 
        l.observation.toLowerCase().includes(query.toLowerCase()) ||
        l.action.toLowerCase().includes(query.toLowerCase())
      )
      .slice(-limit);
    
    return learnings;
  } catch {
    return [];
  }
}

async function getSuggestions(context: string): Promise<string[]> {
  const learnings = await queryLearnings(context, 20);
  
  // Get high-reward actions
  const goodActions = learnings
    .filter(l => l.reward >= 0.7)
    .map(l => l.action);
  
  // Get low-reward actions to avoid
  const badActions = learnings
    .filter(l => l.reward < 0.3)
    .map(l => `Avoid: ${l.action}`);
  
  return [...goodActions.slice(-5), ...badActions.slice(-3)];
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "--observe": {
    const observation = args[1];
    const action = args[args.indexOf("--action") + 1];
    const reward = parseFloat(args[args.indexOf("--reward") + 1] || "0.5");
    
    const learning = await recordLearning(observation, action, reward);
    console.log(`✓ Learning recorded: ${learning.id}`);
    console.log(`  Observation: ${observation}`);
    console.log(`  Action: ${action}`);
    console.log(`  Reward: ${reward}`);
    break;
  }
  
  case "--query": {
    const query = args[1];
    const learnings = await queryLearnings(query);
    console.log(`Found ${learnings.length} matching learnings:`);
    learnings.forEach(l => {
      console.log(`- [${l.reward.toFixed(2)}] ${l.action}`);
    });
    break;
  }
  
  case "--suggest": {
    const context = args[1];
    const suggestions = await getSuggestions(context);
    console.log("Suggestions based on past learnings:");
    suggestions.forEach(s => console.log(`- ${s}`));
    break;
  }
  
  default:
    console.log("Agent Lightning - RL Learning Loop");
    console.log("Usage:");
    console.log("  --observe 'context' --action 'action' --reward 0.8");
    console.log("  --query 'search term'");
    console.log("  --suggest 'current context'");
}
