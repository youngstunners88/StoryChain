#!/usr/bin/env bun
/**
 * Antfarm - Recipe Management CLI
 * Apply battle-tested patterns to your projects
 */

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const RECIPES_DIR = "/home/workspace/Skills/antfarm/references/recipes";
const TEMPLATES_DIR = "/home/workspace/Skills/antfarm/references/templates";

interface Recipe {
  name: string;
  description: string;
  prerequisites: string[];
  steps: string[];
  files: string[];
  variables: string[];
}

async function listRecipes(): Promise<string[]> {
  try {
    const files = await readdir(RECIPES_DIR);
    return files.filter(f => f.endsWith(".md")).map(f => f.replace(".md", ""));
  } catch {
    return [];
  }
}

async function getRecipe(name: string): Promise<Recipe | null> {
  try {
    const content = await readFile(join(RECIPES_DIR, `${name}.md`), "utf-8");
    
    // Parse recipe from markdown
    const lines = content.split("\n");
    const recipe: Recipe = {
      name,
      description: "",
      prerequisites: [],
      steps: [],
      files: [],
      variables: [],
    };
    
    let section = "";
    for (const line of lines) {
      if (line.startsWith("## ")) {
        section = line.slice(3).toLowerCase();
      } else if (line.startsWith("- ")) {
        const item = line.slice(2);
        switch (section) {
          case "prerequisites":
            recipe.prerequisites.push(item);
            break;
          case "steps":
            recipe.steps.push(item);
            break;
          case "files created":
            recipe.files.push(item);
            break;
          case "variables":
            recipe.variables.push(item);
            break;
        }
      } else if (!line.startsWith("#") && recipe.description === "" && line.trim()) {
        recipe.description = line.trim();
      }
    }
    
    return recipe;
  } catch {
    return null;
  }
}

async function applyRecipe(recipeName: string, targetDir: string, variables: Record<string, string> = {}): Promise<void> {
  const recipe = await getRecipe(recipeName);
  if (!recipe) {
    console.error(`Recipe not found: ${recipeName}`);
    return;
  }
  
  console.log(`\n🔧 Applying recipe: ${recipeName}`);
  console.log(`📁 Target: ${targetDir}\n`);
  
  // Create target directory
  await mkdir(targetDir, { recursive: true });
  
  // Check prerequisites
  console.log("📋 Prerequisites:");
  recipe.prerequisites.forEach(p => console.log(`  - ${p}`));
  
  // Show steps
  console.log("\n📝 Steps:");
  recipe.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  
  // Create files from templates
  console.log("\n📄 Creating files:");
  for (const file of recipe.files) {
    const templatePath = join(TEMPLATES_DIR, recipeName, file);
    const targetPath = join(targetDir, file);
    
    try {
      let content = await readFile(templatePath, "utf-8");
      
      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`\\$${key}`, "g"), value);
      }
      
      await writeFile(targetPath, content);
      console.log(`  ✓ ${file}`);
    } catch {
      console.log(`  ⚠ ${file} (template not found, creating placeholder)`);
      await writeFile(targetPath, `// ${file} - Created by Antfarm recipe: ${recipeName}\n`);
    }
  }
  
  console.log(`\n✅ Recipe applied successfully!`);
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "list": {
    const recipes = await listRecipes();
    console.log("Available recipes:");
    recipes.forEach(r => console.log(`  - ${r}`));
    break;
  }
  
  case "info": {
    const name = args[1];
    const recipe = await getRecipe(name);
    if (!recipe) {
      console.error(`Recipe not found: ${name}`);
      break;
    }
    console.log(`\n📖 ${recipe.name}`);
    console.log(`   ${recipe.description}\n`);
    console.log("Prerequisites:", recipe.prerequisites.join(", ") || "None");
    console.log("Steps:", recipe.steps.length);
    console.log("Files:", recipe.files.length);
    break;
  }
  
  case "apply": {
    const name = args[1];
    const targetIdx = args.indexOf("--target");
    const target = targetIdx >= 0 ? args[targetIdx + 1] : ".";
    
    // Parse variables from --var KEY=VALUE
    const variables: Record<string, string> = {};
    args.filter(a => a.startsWith("--var=")).forEach(a => {
      const [key, value] = a.slice(6).split("=");
      variables[key] = value;
    });
    
    await applyRecipe(name, target, variables);
    break;
  }
  
  default:
    console.log("Antfarm - Recipe Management");
    console.log("Usage:");
    console.log("  list              - List available recipes");
    console.log("  info <recipe>     - Get recipe details");
    console.log("  apply <recipe> --target <dir> [--var KEY=VALUE]");
}
