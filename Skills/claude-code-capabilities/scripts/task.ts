#!/usr/bin/env bun

import { parseArgs } from "node:util";

const ZO_ASK_API = "https://api.zo.computer/zo/ask";
const MODEL_NAME = "openrouter:z-ai/glm-5";

interface TaskResult {
  output: string;
  success: boolean;
  error?: string;
}

async function runTask(
  description: string,
  prompt: string,
  type: string
): Promise<TaskResult> {
  const identityToken = process.env.ZO_CLIENT_IDENTITY_TOKEN;
  
  if (!identityToken) {
    return {
      output: "",
      success: false,
      error: "ZO_CLIENT_IDENTITY_TOKEN not found in environment",
    };
  }

  const fullPrompt = `You are a ${type} agent. Your task: ${description}\n\nInstructions:\n${prompt}\n\nProvide a concise, direct response. Focus on the specific task.`;

  try {
    const response = await fetch(ZO_ASK_API, {
      method: "POST",
      headers: {
        "authorization": identityToken,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        input: fullPrompt,
        model_name: MODEL_NAME,
      }),
    });

    if (!response.ok) {
      return {
        output: "",
        success: false,
        error: `API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      output: data.output || "",
      success: true,
    };
  } catch (error) {
    return {
      output: "",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runParallelTasks(tasks: Array<{ description: string; prompt: string; type: string }>): Promise<void> {
  const results = await Promise.all(
    tasks.map(async (task, index) => {
      const result = await runTask(task.description, task.prompt, task.type);
      return { index, task, result };
    })
  );

  results.forEach(({ index, task, result }) => {
    console.log(`\n=== Task ${index + 1}: ${task.description} ===`);
    if (result.success) {
      console.log(result.output);
    } else {
      console.error(`Error: ${result.error}`);
    }
  });
}

const { values } = parseArgs({
  options: {
    description: { type: "string", short: "d" },
    prompt: { type: "string", short: "p" },
    type: { type: "string", short: "t", default: "general-purpose" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Task - Spawn sub-agents for parallel work

Usage:
  task --description "Brief description" --prompt "Full instructions" [--type agent-type]

Options:
  -d, --description <text>    Short 3-5 word description of the task
  -p, --prompt <text>         Full task instructions for the agent
  -t, --type <type>           Agent type (default: general-purpose)
  -h, --help                  Show this help

Agent Types:
  general-purpose    Complex research, code search, multi-step tasks

Examples:
  task -d "Search codebase" -p "Find all fetch() calls and list files"
  task -d "Research topic" -p "Research async patterns in TypeScript"

Notes:
  - Each task runs as an independent Zo session
  - Tasks have no context from parent conversation
  - Include ALL context needed in your prompt
  - Results returned via stdout
`);
  process.exit(0);
}

if (!values.description || !values.prompt) {
  console.error("Error: --description and --prompt are required");
  console.error("Use --help for usage information");
  process.exit(1);
}

console.log(`Starting task: ${values.description}`);
console.log(`Type: ${values.type}`);
console.log("");

const result = await runTask(
  values.description,
  values.prompt,
  values.type
);

if (result.success) {
  console.log(result.output);
} else {
  console.error(`Task failed: ${result.error}`);
  process.exit(1);
}
