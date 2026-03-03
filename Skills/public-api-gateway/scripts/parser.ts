#!/usr/bin/env bun
/**
 * Public API Parser - Extracts all APIs from the public-apis README
 * Creates a structured JSON database for the gateway
 */

import * as fs from 'fs';
import * as path from 'path';

interface API {
  name: string;
  description: string;
  auth: string;
  https: boolean;
  cors: string;
  category: string;
  link: string;
}

interface Category {
  name: string;
  slug: string;
  apis: API[];
}

function parseReadme(content: string): Category[] {
  const categories: Category[] = [];
  const lines = content.split('\n');
  
  let currentCategory: Category | null = null;
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Category headers: ### Category Name
    if (line.startsWith('### ') && !line.includes('Index')) {
      if (currentCategory) {
        categories.push(currentCategory);
      }
      
      const categoryName = line.replace('### ', '').trim();
      currentCategory = {
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        apis: []
      };
      inTable = false;
      continue;
    }
    
    // Table headers
    if (line.startsWith('| API |') || line.startsWith('|:---|')) {
      inTable = true;
      continue;
    }
    
    // API rows
    if (inTable && currentCategory && line.startsWith('| [')) {
      const api = parseAPIRow(line, currentCategory.name);
      if (api) {
        currentCategory.apis.push(api);
      }
    }
    
    // End of table (back to index link or new category)
    if (line.includes('Back to Index') || (line.startsWith('### ') && currentCategory)) {
      inTable = false;
    }
  }
  
  // Push last category
  if (currentCategory) {
    categories.push(currentCategory);
  }
  
  return categories;
}

function parseAPIRow(line: string, category: string): API | null {
  try {
    // Parse markdown table row: | [Name](Link) | Description | Auth | HTTPS | CORS |
    const match = line.match(/\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+)\|\s*`?([^|`]+)`?\s*\|\s*([^|]+)\|\s*([^|]+)\|/);
    
    if (!match) return null;
    
    return {
      name: match[1].trim(),
      link: match[2].trim(),
      description: match[3].trim(),
      auth: match[4].trim(),
      https: match[5].trim().toLowerCase() === 'yes',
      cors: match[6].trim(),
      category
    };
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const readmePath = args[0] || '/home/.z/workspaces/con_Owptd2WnDoepknSN/public-apis/README.md';
  const outputPath = args[1] || '/home/workspace/Skills/public-api-gateway/assets/apis.json';
  
  console.log('📖 Reading README from:', readmePath);
  
  const content = fs.readFileSync(readmePath, 'utf-8');
  const categories = parseReadme(content);
  
  // Calculate stats
  const totalAPIs = categories.reduce((sum, cat) => sum + cat.apis.length, 0);
  const noAuthAPIs = categories.reduce((sum, cat) => 
    sum + cat.apis.filter(api => api.auth === 'No').length, 0);
  
  console.log('\n✅ Parsed successfully!');
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Total APIs: ${totalAPIs}`);
  console.log(`   No Auth Required: ${noAuthAPIs}`);
  
  // Save to JSON
  const output = {
    generated: new Date().toISOString(),
    source: 'https://github.com/public-apis/public-apis',
    stats: {
      categories: categories.length,
      totalAPIs,
      noAuthAPIs,
      requiresAuth: totalAPIs - noAuthAPIs
    },
    categories
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Saved to: ${outputPath}`);
  
  // Print category summary
  console.log('\n📊 Category Breakdown:');
  categories
    .sort((a, b) => b.apis.length - a.apis.length)
    .forEach(cat => {
      console.log(`   ${cat.name}: ${cat.apis.length} APIs`);
    });
}

main();
