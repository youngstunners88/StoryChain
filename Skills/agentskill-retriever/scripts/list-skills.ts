#!/usr/bin/env bun
/**
 * List all available skills in the pool
 * 
 * Usage:
 *   bun list-skills.ts
 *   bun list-skills.ts --json
 */

import { $ } from "bun";

const args = process.argv.slice(2);
const asJson = args.includes("--json");

const skillsDir = "/home/workspace/Skills/agentskillos-repo/data/skill_seeds";

// Read all skill directories
const skillDirs = (await $`ls ${skillsDir}`.quiet()).text().trim().split("\n");

// Read skill metadata
const skills: { name: string; description: string }[] = [];

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
        description: descMatch ? descMatch[1] : ""
      });
    }
  } catch {
    // Skip if no SKILL.md
  }
}

if (asJson) {
  console.log(JSON.stringify(skills, null, 2));
} else {
  console.log(`\n📚 ${skills.length} Available Skills\n`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  for (const skill of skills) {
    console.log(`\n📦 ${skill.name}`);
    console.log(`   ${skill.description || "(no description)"}`);
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`\n💡 Get skill details: bun get-skill.ts <skill-name>`);
  console.log(`🔍 Search skills: bun retrieve.ts "your query"`);
}
