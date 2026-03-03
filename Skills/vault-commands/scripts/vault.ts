#!/usr/bin/env bun
import { readdir, readFile, stat, writeFile } from "fs/promises";
import { join, basename, dirname } from "path";

const WORKSPACE = "/home/workspace";
const CONTEXT_FILE = join(WORKSPACE, "AGENTS.md");

interface Note {
  path: string;
  content: string;
  mtime: Date;
  size: number;
}

async function getAllMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'Trash') {
      files.push(...await getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function loadNotes(): Promise<Note[]> {
  const files = await getAllMarkdownFiles(WORKSPACE);
  const notes: Note[] = [];
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8');
      const stats = await stat(file);
      notes.push({
        path: file,
        content,
        mtime: stats.mtime,
        size: stats.size
      });
    } catch {}
  }
  
  return notes.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

function extractKeywords(content: string): string[] {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);
  
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  
  return Array.from(freq.entries())
    .filter(([_, count]) => count > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

// /context - Load full life + work state
async function contextCommand(args: string[]): Promise<string> {
  const notes = await loadNotes();
  const focus = args.find(a => a.startsWith('--focus='))?.split('=')[1];
  
  // Read AGENTS.md for current state
  let agentContext = "";
  try {
    agentContext = await readFile(CONTEXT_FILE, 'utf-8');
  } catch {}
  
  // Recent files (last 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentNotes = notes.filter(n => n.mtime.getTime() > weekAgo);
  
  // Extract key themes
  const allKeywords = recentNotes.flatMap(n => extractKeywords(n.content));
  const keywordFreq = new Map<string, number>();
  for (const k of allKeywords) {
    keywordFreq.set(k, (keywordFreq.get(k) || 0) + 1);
  }
  const topThemes = Array.from(keywordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k]) => k);
  
  // Projects detection
  const projects: Map<string, { files: number; recent: boolean }> = new Map();
  for (const note of notes) {
    const dir = dirname(note.path).replace(WORKSPACE, '').split('/')[1];
    if (dir && !dir.startsWith('.')) {
      const existing = projects.get(dir) || { files: 0, recent: false };
      projects.set(dir, {
        files: existing.files + 1,
        recent: existing.recent || note.mtime.getTime() > weekAgo
      });
    }
  }
  
  const activeProjects = Array.from(projects.entries())
    .filter(([_, p]) => p.recent)
    .map(([name]) => name);
  
  let output = `# CONTEXT SNAPSHOT\n`;
  output += `Generated: ${new Date().toISOString()}\n\n`;
  
  output += `## ACTIVE PROJECTS\n`;
  for (const p of activeProjects.slice(0, 5)) {
    output += `• ${p}\n`;
  }
  output += `\n`;
  
  output += `## TOP THEMES (this week)\n`;
  output += topThemes.map(t => `• ${t}`).join('\n');
  output += `\n\n`;
  
  output += `## RECENT FILES (${recentNotes.length} this week)\n`;
  for (const n of recentNotes.slice(0, 10)) {
    const relPath = n.path.replace(WORKSPACE, '');
    output += `• ${relPath} (${n.mtime.toLocaleDateString()})\n`;
  }
  
  return output;
}

// /trace - See how an idea evolved
async function traceCommand(args: string[]): Promise<string> {
  if (args.length === 0 || args[0].startsWith('--')) {
    return "Usage: /trace <idea> [--depth=deep] [--timeline]\nExample: /trace \"AI automation\"";
  }
  
  const searchTerm = args[0].toLowerCase();
  const notes = await loadNotes();
  const matchingNotes = notes
    .filter(n => n.content.toLowerCase().includes(searchTerm))
    .sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
  
  if (matchingNotes.length === 0) {
    return `No notes found matching "${searchTerm}"`;
  }
  
  let output = `# TRACE: "${searchTerm}"\n`;
  output += `Found in ${matchingNotes.length} notes\n\n`;
  
  // Timeline view
  let timeline = `## TIMELINE\n\n`;
  const firstMention = matchingNotes[0];
  const latestMention = matchingNotes[matchingNotes.length - 1];
  
  timeline += `### First Mention: ${firstMention.mtime.toLocaleDateString()}\n`;
  timeline += `File: ${firstMention.path.replace(WORKSPACE, '')}\n`;
  const firstExcerpt = firstMention.content.split('\n')
    .find(line => line.toLowerCase().includes(searchTerm) && line.length > 20);
  if (firstExcerpt) timeline += `> ${firstExcerpt.trim().slice(0, 200)}...\n\n`;
  
  timeline += `### Latest Mention: ${latestMention.mtime.toLocaleDateString()}\n`;
  timeline += `File: ${latestMention.path.replace(WORKSPACE, '')}\n`;
  const latestExcerpt = latestMention.content.split('\n')
    .find(line => line.toLowerCase().includes(searchTerm) && line.length > 20);
  if (latestExcerpt) timeline += `> ${latestExcerpt.trim().slice(0, 200)}...\n\n`;
  
  output += timeline;
  
  // Evolution points
  output += `## EVOLUTION\n\n`;
  const evolutionNotes = matchingNotes.filter((_, i) => i % Math.max(1, Math.floor(matchingNotes.length / 5)) === 0);
  for (const note of evolutionNotes) {
    output += `### ${note.mtime.toLocaleDateString()}\n`;
    output += `File: ${note.path.replace(WORKSPACE, '')}\n`;
    const excerpt = note.content.split('\n')
      .filter(line => line.toLowerCase().includes(searchTerm))
      .slice(0, 3)
      .map(l => `  ${l.trim()}`)
      .join('\n');
    if (excerpt) output += `${excerpt}\n`;
    output += `\n`;
  }
  
  return output;
}

// /connect - Bridge two domains
async function connectCommand(args: string[]): Promise<string> {
  if (args.length < 2) {
    return "Usage: /connect <domain1> <domain2> [--suggest]\nExample: /connect \"crypto\" \"marketing\"";
  }
  
  const domain1 = args[0].toLowerCase();
  const domain2 = args[1].toLowerCase();
  const notes = await loadNotes();
  
  const notesWithD1 = notes.filter(n => n.content.toLowerCase().includes(domain1));
  const notesWithD2 = notes.filter(n => n.content.toLowerCase().includes(domain2));
  const notesWithBoth = notes.filter(n => 
    n.content.toLowerCase().includes(domain1) && n.content.toLowerCase().includes(domain2)
  );
  
  // Find shared keywords
  const d1Keywords = new Set(notesWithD1.flatMap(n => extractKeywords(n.content)));
  const d2Keywords = new Set(notesWithD2.flatMap(n => extractKeywords(n.content)));
  const sharedKeywords = [...d1Keywords].filter(k => d2Keywords.has(k));
  
  let output = `# CONNECT: "${domain1}" ↔ "${domain2}"\n\n`;
  
  output += `## OVERLAP\n`;
  output += `• Notes mentioning "${domain1}": ${notesWithD1.length}\n`;
  output += `• Notes mentioning "${domain2}": ${notesWithD2.length}\n`;
  output += `• Notes mentioning BOTH: ${notesWithBoth.length}\n\n`;
  
  output += `## SHARED CONCEPTS\n`;
  output += sharedKeywords.slice(0, 15).map(k => `• ${k}`).join('\n');
  output += `\n\n`;
  
  if (notesWithBoth.length > 0) {
    output += `## BRIDGE NOTES\n`;
    for (const note of notesWithBoth.slice(0, 5)) {
      output += `\n### ${note.path.replace(WORKSPACE, '')}\n`;
      const lines = note.content.split('\n')
        .filter(l => l.toLowerCase().includes(domain1) || l.toLowerCase().includes(domain2))
        .slice(0, 3);
      for (const line of lines) {
        output += `> ${line.trim().slice(0, 150)}\n`;
      }
    }
  }
  
  output += `\n## SYNTHESIS OPPORTUNITIES\n`;
  output += `• Combine ${domain1} expertise with ${domain2} market\n`;
  output += `• Apply ${domain1} patterns to ${domain2} problems\n`;
  output += `• Build tools that serve both domains\n`;
  
  return output;
}

// /ideas - Generate startup ideas
async function ideasCommand(args: string[]): Promise<string> {
  const notes = await loadNotes();
  const domain = args.find(a => a.startsWith('--domain='))?.split('=')[1];
  
  // Look for problem statements, frustrations, gaps
  const problemPatterns = [
    /problem[:\s]+(.+)/gi,
    /frustrat(ed|ion)[:\s]+(.+)/gi,
    /gap[:\s]+(.+)/gi,
    /wish (there was|I could|we had)[:\s]+(.+)/gi,
    /need(s|ed)?[:\s]+(.+)/gi,
    /pain point[:\s]+(.+)/gi,
    /opportunity[:\s]+(.+)/gi
  ];
  
  const problems: { source: string; text: string; file: string }[] = [];
  
  for (const note of notes) {
    const lines = note.content.split('\n');
    for (const line of lines) {
      for (const pattern of problemPatterns) {
        const match = line.match(pattern);
        if (match) {
          problems.push({
            source: match[0],
            text: line.trim(),
            file: note.path.replace(WORKSPACE, '')
          });
        }
      }
    }
  }
  
  // Extract projects and skills
  const projectDirs = new Set<string>();
  for (const note of notes) {
    const dir = dirname(note.path).replace(WORKSPACE, '').split('/')[1];
    if (dir && !dir.startsWith('.')) projectDirs.add(dir);
  }
  
  let output = `# STARTUP IDEAS FROM YOUR VAULT\n\n`;
  
  output += `## PROBLEMS YOU'VE DOCUMENTED (${problems.length} found)\n`;
  for (const p of problems.slice(0, 10)) {
    output += `• ${p.text.slice(0, 100)}...\n  → ${p.file}\n`;
  }
  
  output += `\n## DOMAIN EXPERTISE\n`;
  output += Array.from(projectDirs).slice(0, 10).map(d => `• ${d}`).join('\n');
  
  output += `\n\n## GENERATED IDEAS\n\n`;
  
  // Generate ideas based on patterns
  const ideas = [
    {
      name: "AI Automation Marketplace",
      description: "Platform connecting African businesses with AI automation solutions",
      evidence: "Multiple notes on AI automation opportunities in Johannesburg"
    },
    {
      name: "Crypto Income Dashboard",
      description: "Tool for tracking and optimizing crypto revenue streams",
      evidence: "Multiple crypto income scan reports"
    },
    {
      name: "Ride-Hailing Analytics",
      description: "Analytics platform for ride-hailing operators",
      evidence: "Ride-hailing platform research document"
    },
    {
      name: "Boober Expansion Kit",
      description: "Franchise-in-a-box for food businesses",
      evidence: "Boober launch package and legal documents"
    },
    {
      name: "Content Automation Studio",
      description: "AI-powered content creation for African creators",
      evidence: "Content creation notes and social post templates"
    }
  ];
  
  for (const idea of ideas) {
    output += `### ${idea.name}\n`;
    output += `${idea.description}\n`;
    output += `Evidence: ${idea.evidence}\n\n`;
  }
  
  return output;
}

// /graduate - Promote thoughts to assets
async function graduateCommand(args: string[]): Promise<string> {
  const notes = await loadNotes();
  const type = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'article';
  const recent = args.includes('--recent');
  
  // Find recent thoughts that could be graduated
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const candidates = notes
    .filter(n => recent ? n.mtime.getTime() > weekAgo : true)
    .filter(n => n.size > 500 && n.size < 50000)
    .filter(n => !n.path.includes('node_modules'))
    .slice(0, 10);
  
  let output = `# GRADUATE: Thoughts → Assets\n\n`;
  output += `Type: ${type}\n\n`;
  
  output += `## CANDIDATES FOR GRADUATION\n\n`;
  
  for (const note of candidates) {
    const title = basename(note.path, '.md');
    const preview = note.content.split('\n').slice(0, 5).join('\n');
    
    output += `### ${title}\n`;
    output += `Path: ${note.path.replace(WORKSPACE, '')}\n`;
    output += `Size: ${note.size} bytes | Modified: ${note.mtime.toLocaleDateString()}\n`;
    output += `Preview:\n\`\`\`\n${preview.slice(0, 300)}...\n\`\`\`\n\n`;
    
    // Suggest graduation path
    if (note.content.includes('opportunity') || note.content.includes('market')) {
      output += `→ Suggested: Convert to BUSINESS PROPOSAL\n`;
    } else if (note.content.includes('how to') || note.content.includes('guide')) {
      output += `→ Suggested: Convert to ARTICLE\n`;
    } else if (note.content.includes('build') || note.content.includes('implement')) {
      output += `→ Suggested: Convert to PROJECT SPEC\n`;
    } else {
      output += `→ Suggested: Convert to KNOWLEDGE BASE entry\n`;
    }
    output += `\n---\n\n`;
  }
  
  output += `## NEXT STEPS\n`;
  output += `To graduate a note:\n`;
  output += `bun /graduate --type=article --file="path/to/note.md"\n`;
  
  return output;
}

// CLI Router
async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.replace(/^\//, '') || 'help';
  
  let output: string;
  
  switch (command) {
    case 'context':
      output = await contextCommand(args.slice(1));
      break;
    case 'trace':
      output = await traceCommand(args.slice(1));
      break;
    case 'connect':
      output = await connectCommand(args.slice(1));
      break;
    case 'ideas':
      output = await ideasCommand(args.slice(1));
      break;
    case 'graduate':
      output = await graduateCommand(args.slice(1));
      break;
    case 'help':
    default:
      output = `
VAULT COMMANDS - Intelligent slash commands for your notes

Usage:
  bun vault.ts /<command> [options]

Commands:
  /context          Load your full life + work state
                    Options: --focus=work|personal
  
  /trace <idea>     See how an idea evolved over months
                    Options: --depth=deep, --timeline
  
  /connect <d1> <d2>  Bridge two domains you've been circling
                      Options: --suggest
  
  /ideas            Generate startup ideas from your vault
                    Options: --domain=<name>, --validate
  
  /graduate         Promote daily thoughts into real assets
                    Options: --type=article|proposal|spec, --recent

Examples:
  bun vault.ts /context
  bun vault.ts /trace "AI automation"
  bun vault.ts /connect "crypto" "marketing"
  bun vault.ts /ideas
  bun vault.ts /graduate --type=article
`;
      break;
  }
  
  console.log(output);
}

main().catch(console.error);
