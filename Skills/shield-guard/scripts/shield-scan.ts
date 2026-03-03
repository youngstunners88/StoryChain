#!/usr/bin/env bun
/**
 * ShieldGuard Security Scanner
 * Scans iHhashi codebase for security vulnerabilities
 */

import { $ } from "bun";

interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low";
  file: string;
  line?: number;
  description: string;
  recommendation: string;
}

const issues: SecurityIssue[] = [];

// Patterns to check
const SECURITY_PATTERNS = [
  // Hardcoded secrets
  { pattern: /password\s*=\s*["'][^"']+["']/gi, severity: "critical", desc: "Hardcoded password" },
  { pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi, severity: "critical", desc: "Hardcoded API key" },
  { pattern: /secret[_-]?key\s*=\s*["'][^"']+["']/gi, severity: "critical", desc: "Hardcoded secret key" },
  { pattern: /mongodb\+srv:\/\/[^:]+:[^@]+@/gi, severity: "high", desc: "MongoDB connection string with credentials" },
  
  // SQL injection risks
  { pattern: /f["'].*SELECT.*\{.*\}/gi, severity: "high", desc: "Potential SQL injection in f-string" },
  { pattern: /\.format\(.*request\./gi, severity: "high", desc: "SQL injection via format" },
  
  // XSS risks
  { pattern: /dangerouslySetInnerHTML/gi, severity: "medium", desc: "React dangerouslySetInnerHTML usage" },
  { pattern: /innerHTML\s*=/gi, severity: "medium", desc: "Direct innerHTML assignment" },
  
  // Authentication issues
  { pattern: /verify_signature\s*=\s*False/gi, severity: "critical", desc: "JWT verification disabled" },
  { pattern: /check_origin\s*=\s*False/gi, severity: "high", desc: "CORS origin check disabled" },
  
  // Debug settings
  { pattern: /DEBUG\s*=\s*True/gi, severity: "medium", desc: "Debug mode enabled" },
  
  // Insecure dependencies
  { pattern: /eval\s*\(/gi, severity: "high", desc: "eval() usage - potential code injection" },
  { pattern: /exec\s*\(/gi, severity: "high", desc: "exec() usage - potential code injection" },
];

// File patterns to scan
const FILE_PATTERNS = ["**/*.py", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"];

console.log("🔒 ShieldGuard Security Scanner\n");
console.log("Scanning iHhashi codebase...\n");

// Scan files
for (const pattern of FILE_PATTERNS) {
  const glob = new Bun.Glob(pattern);
  const files = [...glob.scanSync("/home/workspace/iHhashi")];
  
  for (const file of files) {
    if (file.includes("node_modules") || file.includes("__pycache__") || file.includes(".git")) continue;
    
    const fullPath = "/home/workspace/iHhashi/" + file;
    const content = await Bun.file(fullPath).text();
    const lines = content.split("\n");
    
    for (const { pattern: regex, severity, desc } of SECURITY_PATTERNS) {
      lines.forEach((line, i) => {
        const match = line.match(regex);
        if (match) {
          // Skip if it's an environment variable reference or default
          if (line.includes("env.") || line.includes("os.environ") || line.includes("Field(default")) return;
          // Skip if it's in a comment
          if (line.trim().startsWith("#") || line.trim().startsWith("//")) return;
          // Skip .env.example
          if (file.includes(".env.example")) return;
          
          issues.push({
            severity: severity as any,
            file: file.replace("/home/workspace/iHhashi/", ""),
            line: i + 1,
            description: `${desc}: ${match[0].substring(0, 50)}...`,
            recommendation: "Move to environment variables or use secure vault",
          });
        }
      });
    }
  }
}

// Check for missing security files
const missingFiles = [
  { file: ".env", severity: "medium", desc: "No .env file - create from .env.example" },
  { file: ".gitignore", severity: "high", desc: "No .gitignore - secrets may be committed" },
  { file: "backend/app/core/config.py", severity: "medium", desc: "Security config not in core/" },
];

for (const { file, severity, desc } of missingFiles) {
  if (!(await Bun.file(`/home/workspace/iHhashi/${file}`).exists())) {
    issues.push({
      severity: severity as any,
      file,
      description: desc,
      recommendation: "Create this file for security best practices",
    });
  }
}

// Check .gitignore for sensitive files
const gitignorePath = "/home/workspace/iHhashi/.gitignore";
if (await Bun.file(gitignorePath).exists()) {
  const gitignore = await Bun.file(gitignorePath).text();
  const required = [".env", "*.pem", "*.key", "secrets/", "credentials/"];
  
  for (const req of required) {
    if (!gitignore.includes(req)) {
      issues.push({
        severity: "high",
        file: ".gitignore",
        description: `Missing ${req} in .gitignore`,
        recommendation: `Add ${req} to prevent committing secrets`,
      });
    }
  }
}

// Print results
const severities = { critical: 0, high: 0, medium: 0, low: 0 };
for (const issue of issues) {
  severities[issue.severity]++;
}

console.log("═".repeat(60));
console.log(`SCAN RESULTS: ${issues.length} issues found\n`);

if (issues.length === 0) {
  console.log("✅ No security issues detected!\n");
} else {
  // Group by severity
  const grouped = {
    critical: issues.filter(i => i.severity === "critical"),
    high: issues.filter(i => i.severity === "high"),
    medium: issues.filter(i => i.severity === "medium"),
    low: issues.filter(i => i.severity === "low"),
  };
  
  for (const [sev, items] of Object.entries(grouped)) {
    if (items.length === 0) continue;
    const emoji = sev === "critical" ? "🔴" : sev === "high" ? "🟠" : sev === "medium" ? "🟡" : "🔵";
    console.log(`${emoji} ${sev.toUpperCase()}: ${items.length}`);
    
    for (const item of items.slice(0, 5)) {
      console.log(`   ${item.file}${item.line ? `:${item.line}` : ""}`);
      console.log(`   → ${item.description}`);
    }
    if (items.length > 5) {
      console.log(`   ... and ${items.length - 5} more`);
    }
    console.log();
  }
}

console.log("═".repeat(60));
console.log(`\nSUMMARY: ${severities.critical} critical, ${severities.high} high, ${severities.medium} medium, ${severities.low} low\n`);

// Exit with appropriate code
if (severities.critical > 0) {
  console.log("❌ CRITICAL issues found - must fix before deployment\n");
  process.exit(1);
} else if (severities.high > 0) {
  console.log("⚠️  HIGH severity issues found - recommend fixing\n");
  process.exit(0);
} else {
  console.log("✅ Codebase is reasonably secure for development\n");
  process.exit(0);
}
