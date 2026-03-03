#!/usr/bin/env bun
/**
 * Search conversation memories in AGENTS.md
 * Usage: bun search-memory.ts "search term"
 */

import { readFile } from "fs/promises";

const MEMORY_FILE = "/home/workspace/AGENTS.md";

async function searchMemory(query: string) {
  const content = await readFile(MEMORY_FILE, "utf-8");
  const lines = content.split("\n");
  
  const results: { date: string; context: string; line: number }[] = [];
  let currentDate = "";
  let currentContext = "";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith("### ") && line.includes("SAST")) {
      currentDate = line.substring(4);
      currentContext = "";
    } else if (currentDate && line.trim() && !line.startsWith("#")) {
      currentContext += line + "\n";
    }
    
    if (line.toLowerCase().includes(query.toLowerCase()) && currentDate) {
      results.push({
        date: currentDate,
        context: currentContext.trim(),
        line: i + 1
      });
    }
  }
  
  if (results.length === 0) {
    console.log(`No memories found matching: "${query}"`);
    return;
  }
  
  console.log(`Found ${results.length} matching memories:\n`);
  
  const seen = new Set<string>();
  for (const result of results) {
    if (!seen.has(result.date)) {
      seen.add(result.date);
      console.log(`### ${result.date}`);
      console.log(result.context);
      console.log("---\n");
    }
  }
}

const query = process.argv[2];
if (!query) {
  console.error("Usage: bun search-memory.ts \"search term\"");
  process.exit(1);
}

searchMemory(query).catch(console.error);
