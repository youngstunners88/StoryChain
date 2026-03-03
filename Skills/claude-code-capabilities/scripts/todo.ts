#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const TODO_FILE = join(homedir(), ".z", "workspaces", "current", "todos.json");

interface Todo {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
}

function loadTodos(): Todo[] {
  if (!existsSync(TODO_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(TODO_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]): void {
  const dir = join(homedir(), ".z", "workspaces", "current");
  if (!existsSync(dir)) {
    const { mkdirSync } = require("node:fs");
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(TODO_FILE, JSON.stringify(todos, null, 2));
}

function generateId(): string {
  return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function addTodo(content: string): void {
  const todos = loadTodos();
  const newTodo: Todo = {
    id: generateId(),
    content,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  todos.push(newTodo);
  saveTodos(todos);
  console.log(`✓ Added: ${content}`);
  console.log(`  ID: ${newTodo.id}`);
}

function listTodos(): void {
  const todos = loadTodos();
  if (todos.length === 0) {
    console.log("No todos found.");
    return;
  }
  
  console.log("\n=== TODO LIST ===\n");
  todos.forEach((todo, index) => {
    const statusIcon = {
      pending: "○",
      in_progress: "◐",
      completed: "●",
    }[todo.status];
    const statusColor = {
      pending: "\x1b[37m",
      in_progress: "\x1b[33m",
      completed: "\x1b[32m",
    }[todo.status];
    console.log(`${statusColor}${statusIcon}\x1b[0m [${index + 1}] ${todo.content}`);
    console.log(`    ID: ${todo.id} | Status: ${todo.status}`);
  });
  console.log("");
}

function updateStatus(id: string, status: Todo["status"]): void {
  const todos = loadTodos();
  const todo = todos.find((t) => t.id === id || t.id === `todo_${id}`);
  if (!todo) {
    console.error(`✗ Todo not found: ${id}`);
    process.exit(1);
  }
  todo.status = status;
  saveTodos(todos);
  console.log(`✓ Updated: ${todo.content}`);
  console.log(`  Status: ${status}`);
}

function clearCompleted(): void {
  const todos = loadTodos();
  const remaining = todos.filter((t) => t.status !== "completed");
  const cleared = todos.length - remaining.length;
  saveTodos(remaining);
  console.log(`✓ Cleared ${cleared} completed todos`);
}

const { values, positionals } = parseArgs({
  options: {
    add: { type: "string", short: "a" },
    list: { type: "boolean", short: "l" },
    complete: { type: "string", short: "c" },
    "in-progress": { type: "string", short: "i" },
    pending: { type: "string", short: "p" },
    clear: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Todo - Claude Code-style task tracking

Usage:
  todo --add "Task description"      Add a new todo
  todo --list                        List all todos
  todo --complete <id>               Mark todo as completed
  todo --in-progress <id>            Mark todo as in progress
  todo --pending <id>                Mark todo as pending
  todo --clear                       Remove completed todos

Options:
  -a, --add <text>       Add a new todo item
  -l, --list             List all todos with status
  -c, --complete <id>    Mark todo as completed (●)
  -i, --in-progress <id> Mark todo as in progress (◐)
  -p, --pending <id>     Mark todo as pending (○)
  --clear                Remove all completed todos
  -h, --help             Show this help
`);
  process.exit(0);
}

if (values.add) {
  addTodo(values.add);
} else if (values.list) {
  listTodos();
} else if (values.complete) {
  updateStatus(values.complete, "completed");
} else if (values["in-progress"]) {
  updateStatus(values["in-progress"], "in_progress");
} else if (values.pending) {
  updateStatus(values.pending, "pending");
} else if (values.clear) {
  clearCompleted();
} else {
  listTodos();
}
