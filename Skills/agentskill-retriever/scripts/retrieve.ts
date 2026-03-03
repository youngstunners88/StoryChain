#!/usr/bin/env bun
/**
 * AgentSkill Retriever - Search for relevant skills
 * 
 * Usage:
 *   bun retrieve.ts "your task description"
 *   bun retrieve.ts "create video with subtitles" --max 5
 */

import { $ } from "bun";

const args = process.argv.slice(2);
const maxSkillsIndex = args.indexOf("--max");
const maxSkills = maxSkillsIndex > -1 ? parseInt(args[maxSkillsIndex + 1]) || 10 : 10;
const query = args.filter(a => !a.startsWith("--")).join(" ");

if (!query) {
  console.log("Usage: bun retrieve.ts \"your task description\" [--max N]");
  console.log("\nOptions:");
  console.log("  --max N    Maximum number of skills to return (default: 10)");
  process.exit(1);
}

const skillsDir = "/home/workspace/Skills/agentskillos-repo/data/skill_seeds";

// Read all skill directories
const skillDirs = (await $`ls ${skillsDir}`.quiet()).text().trim().split("\n");

// Read skill metadata
const skills: { name: string; description: string; path: string }[] = [];

for (const dir of skillDirs) {
  const skillMdPath = `${skillsDir}/${dir}/SKILL.md`;
  try {
    const content = await Bun.file(skillMdPath).text();
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const descMatch = frontmatter.match(/description:\s*["']?(.+?)["']?\n/);
      skills.push({
        name: dir,
        description: descMatch ? descMatch[1] : "",
        path: skillMdPath
      });
    }
  } catch {
    // Skip if no SKILL.md
  }
}

// Simple keyword matching for now
// In production, this would use the AgentSkillOS tree-based search
const queryLower = query.toLowerCase();
const queryWords = queryLower.split(/\s+/);

const scored = skills.map(skill => {
  const descLower = skill.description.toLowerCase();
  const nameLower = skill.name.toLowerCase();
  
  let score = 0;
  for (const word of queryWords) {
    if (nameLower.includes(word)) score += 3;
    if (descLower.includes(word)) score += 2;
  }
  
  return { ...skill, score };
});

const relevant = scored
  .filter(s => s.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxSkills);

console.log(`\n🔍 Found ${relevant.length} relevant skills for: "${query}"\n`);

if (relevant.length === 0) {
  console.log("No matching skills found. Try a different query or list all skills with:");
  console.log("  bun list-skills.ts");
} else {
  for (const skill of relevant) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 ${skill.name}`);
    console.log(`   ${skill.description}`);
    console.log(`   Path: ${skill.path}`);
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n💡 Get skill details: bun get-skill.ts <skill-name>`);
}
