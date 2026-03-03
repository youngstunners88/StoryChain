#!/usr/bin/env bun
/**
 * Get detailed information about a specific skill
 * 
 * Usage:
 *   bun get-skill.ts <skill-name>
 *   bun get-skill.ts video-generation
 */

const args = process.argv.slice(2);
const skillName = args[0];

if (!skillName) {
  console.log("Usage: bun get-skill.ts <skill-name>");
  console.log("\nList available skills: bun list-skills.ts");
  process.exit(1);
}

const skillMdPath = `/home/workspace/Skills/agentskillos-repo/data/skill_seeds/${skillName}/SKILL.md`;

try {
  const content = await Bun.file(skillMdPath).text();
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📦 ${skillName}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(content);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
} catch {
  console.log(`❌ Skill not found: ${skillName}`);
  console.log("\nList available skills: bun list-skills.ts");
  process.exit(1);
}
