#!/usr/bin/env bun
/**
 * Log a conversation memory to AGENTS.md
 * Usage: bun log-memory.ts "Summary of conversation"
 */

import { appendFile, readFile } from "fs/promises";

const MEMORY_FILE = "/home/workspace/AGENTS.md";
const MEMORY_SECTION = "## Conversation Memory";

function formatDate(): string {
  const now = new Date();
  // SAST is UTC+2
  const sast = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const day = days[sast.getUTCDay()];
  const date = sast.getUTCDate();
  const month = months[sast.getUTCMonth()];
  const year = sast.getUTCFullYear();
  const hours = sast.getUTCHours().toString().padStart(2, "0");
  const minutes = sast.getUTCMinutes().toString().padStart(2, "0");
  
  return `${day} ${date} ${month} ${year} ${hours}:${minutes} SAST`;
}

async function logMemory(summary: string) {
  const content = await readFile(MEMORY_FILE, "utf-8");
  
  // Find the Conversation Memory section
  const sectionIndex = content.indexOf(MEMORY_SECTION);
  
  if (sectionIndex === -1) {
    // Section doesn't exist, create it
    const newSection = `\n\n## Conversation Memory\n\n### ${formatDate()}\n${summary}\n`;
    await appendFile(MEMORY_FILE, newSection);
  } else {
    // Find where to insert (after the section header)
    const afterSection = content.substring(sectionIndex + MEMORY_SECTION.length);
    const firstEntryIndex = afterSection.indexOf("###");
    
    const timestamp = formatDate();
    const entry = `\n\n### ${timestamp}\n${summary}`;
    
    if (firstEntryIndex === -1) {
      // No entries yet, append after header
      const beforeInsert = content.substring(0, sectionIndex + MEMORY_SECTION.length);
      const newContent = beforeInsert + entry + afterSection;
      await import("fs/promises").then(fs => fs.writeFile(MEMORY_FILE, newContent));
    } else {
      // Insert before first existing entry
      const insertPos = sectionIndex + MEMORY_SECTION.length + firstEntryIndex;
      const newContent = content.substring(0, insertPos) + entry + "\n" + content.substring(insertPos);
      await import("fs/promises").then(fs => fs.writeFile(MEMORY_FILE, newContent));
    }
  }
  
  console.log(`✓ Memory logged: ${formatDate()}`);
}

const summary = process.argv[2];
if (!summary) {
  console.error("Usage: bun log-memory.ts \"Summary of conversation\"");
  process.exit(1);
}

logMemory(summary).catch(console.error);
