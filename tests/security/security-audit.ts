#!/usr/bin/env bun
/**
 * Security Audit for StoryChain
 * Checks for vulnerabilities, access control issues, and security best practices
 */

import { readdir, readFile, stat } from "fs/promises";
import { Database } from "bun:sqlite";

const db = new Database(`${process.cwd()}/data/storychain.db");

interface SecurityIssue {
  severity: "high" | "medium" | "low";
  category: string;
  description: string;
  file?: string;
  recommendation: string;
}

const issues: SecurityIssue[] = [];

console.log("🔒 STORYCHAIN SECURITY AUDIT\n");
console.log("=" .repeat(60));

// 1. Check API Routes for Authentication
async function auditApiRoutes() {
  console.log("\n📡 Checking API Routes...");
  
  const routesDir = `${process.cwd()}/src/api";
  const files = await readdir(routesDir).catch(() => []);
  
  for (const file of files.filter(f => f.endsWith(".ts"))) {
    const content = await readFile(`${routesDir}/${file}`, "utf-8");
    
    // Check for auth middleware
    const hasAuth = content.includes("requireAuth");
    const hasPublicRoutes = content.includes("PUBLIC");
    
    // Check for SQL injection risks
    const hasRawSql = content.includes("query(") && content.includes("${");
    if (hasRawSql) {
      issues.push({
        severity: "high",
        category: "SQL Injection",
        description: `Potential SQL injection in ${file} - uses template literals in queries`,
        file,
        recommendation: "Use parameterized queries only, never string interpolation"
      });
    }
    
    // Check for timing-safe comparison
    const hasTimingSafeEqual = content.includes("timingSafeEqual");
    if (!hasTimingSafeEqual && hasAuth) {
      issues.push({
        severity: "medium",
        category: "Timing Attack",
        description: `Missing timing-safe comparison in ${file}`,
        file,
        recommendation: "Use crypto.timingSafeEqual for token comparison"
      });
    }
    
    console.log(`  ${file}: ${hasAuth ? "✓ Auth" : "✗ No Auth"} | ${hasPublicRoutes ? "Public routes" : "Private only"}`);
  }
}

// 2. Check Database Security
async function auditDatabase() {
  console.log("\n🗄️ Checking Database Security...");
  
  // Check table structure
  const tableInfo = db.query("PRAGMA table_info(users)").all();
  const columns = tableInfo.map((c: any) => c.name);
  
  console.log(`  Users table columns: ${columns.length}`);
  
  // Check for password storage
  if (columns.includes("password_hash")) {
    console.log("  ✓ Passwords hashed in database");
  } else if (columns.includes("password")) {
    issues.push({
      severity: "high",
      category: "Data Storage",
      description: "Users table has 'password' column (likely plaintext)",
      recommendation: "Migrate to password_hash with bcrypt/scrypt"
    });
    console.log("  ❌ Plaintext password column detected");
  } else {
    console.log("  ⚠️ No password column found (OAuth only?)");
  }
  
  // Check for token encryption
  const hasTokenTable = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='api_tokens'").get();
  if (!hasTokenTable) {
    issues.push({
      severity: "medium",
      category: "Token Storage",
      description: "No dedicated API tokens table found",
      recommendation: "Create encrypted token storage with expiration"
    });
  }
  
  // Check row count (sanity check)
  const userCount = db.query("SELECT COUNT(*) as count FROM users").get() as { count: number };
  console.log(`  Users in database: ${userCount.count}`);
  
  console.log("  ✓ Database connection active");
}

// 3. Check Environment Variables
async function auditEnvironment() {
  console.log("\n🔐 Checking Environment Variables...");
  
  const requiredVars = [
    "OPENROUTER_API_KEY",
  ];
  
  const optionalVars = [
    "OPENROUTER_API_KEY",
    "INCEPTION_API_KEY",
    "GROQ_API_KEY",
    "GOOGLE_API_KEY",
  ];
  
  for (const v of requiredVars) {
    if (process.env[v]) {
      console.log(`  ✓ ${v}: Set`);
    } else {
      issues.push({
        severity: "high",
        category: "Configuration",
        description: `Required environment variable ${v} is not set`,
        recommendation: `Set ${v} in Settings > Advanced`
      });
    }
  }
  
  for (const v of optionalVars) {
    if (process.env[v]) {
      console.log(`  ○ ${v}: Set (optional)`);
    }
  }
}

// 4. Check Rate Limiting
async function auditRateLimiting() {
  console.log("\n🛡️ Checking Rate Limiting...");
  
  const middlewareDir = `${process.cwd()}/src/middleware";
  const files = await readdir(middlewareDir).catch(() => []);
  
  if (files.includes("rateLimiter.ts")) {
    const content = await readFile(`${middlewareDir}/rateLimiter.ts`, "utf-8");
    const hasRateLimit = content.includes("rate limit") || content.includes("RateLimit");
    
    if (hasRateLimit) {
      console.log("  ✓ Rate limiting middleware present");
    } else {
      issues.push({
        severity: "medium",
        category: "Rate Limiting",
        description: "Rate limiter file exists but may not be implemented",
        file: "rateLimiter.ts",
        recommendation: "Verify rate limiting is applied to all API routes"
      });
    }
  } else {
    issues.push({
      severity: "medium",
      category: "Rate Limiting",
      description: "No rate limiting middleware found",
      recommendation: "Create rate limiting middleware for all API routes"
    });
  }
}

// 5. Check Input Validation
async function auditInputValidation() {
  console.log("\n📝 Checking Input Validation...");
  
  const routesDir = `${process.cwd()}/src/api";
  const files = await readdir(routesDir).catch(() => []);
  
  for (const file of files.filter(f => f.endsWith(".ts"))) {
    const content = await readFile(`${routesDir}/${file}`, "utf-8");
    
    // Check for validation
    const hasValidation = content.includes("validation") || content.includes("validate") || content.includes("zod") || content.includes("Joi");
    const hasLengthChecks = content.includes("length");
    
    if (!hasValidation && !hasLengthChecks) {
      issues.push({
        severity: "medium",
        category: "Input Validation",
        description: `Limited input validation in ${file}`,
        file,
        recommendation: "Add Zod or Joi validation for all user inputs"
      });
    }
  }
  
  console.log("  ✓ Input validation checks completed");
}

// 6. Check for Secrets in Code
async function auditSecrets() {
  console.log("\n🗝️ Checking for Hardcoded Secrets...");
  
  const forbiddenPatterns = [
    /password\s*=\s*["'][^"']+["']/i,
    /api_key\s*=\s*["'][^"']+["']/i,
    /secret\s*=\s*["'][^"']+["']/i,
    /token\s*=\s*["'][a-zA-Z0-9]{20,}["']/i,
  ];
  
  const srcDir = `${process.cwd()}/src";
  
  async function scanDirectory(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    
    for (const entry of entries) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        await scanDirectory(path);
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        const content = await readFile(path, "utf-8");
        
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(content)) {
            issues.push({
              severity: "high",
              category: "Secrets Management",
              description: `Potential hardcoded secret in ${path}`,
              file: path,
              recommendation: "Move all secrets to environment variables"
            });
          }
        }
      }
    }
  }
  
  await scanDirectory(srcDir);
  console.log("  ✓ Secret scanning completed");
}

// 7. Check CORS Configuration
async function auditCors() {
  console.log("\n🌐 Checking CORS Configuration...");
  
  const serverFile = `${process.cwd()}/src/server.ts";
  const content = await readFile(serverFile, "utf-8").catch(() => "");
  
  if (content.includes("cors") || content.includes("CORS")) {
    console.log("  ✓ CORS configured");
    
    if (content.includes("*") && content.includes("cors")) {
      issues.push({
        severity: "medium",
        category: "CORS",
        description: "Wildcard CORS origin detected",
        file: "server.ts",
        recommendation: "Restrict CORS to specific origins in production"
      });
    }
  } else {
    issues.push({
      severity: "low",
      category: "CORS",
      description: "No explicit CORS configuration found",
      recommendation: "Add CORS middleware with appropriate restrictions"
    });
  }
}

// Generate Report
function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 SECURITY AUDIT SUMMARY\n");
  
  const high = issues.filter(i => i.severity === "high");
  const medium = issues.filter(i => i.severity === "medium");
  const low = issues.filter(i => i.severity === "low");
  
  console.log(`High Severity:   ${high.length}`);
  console.log(`Medium Severity: ${medium.length}`);
  console.log(`Low Severity:    ${low.length}`);
  console.log(`Total Issues:    ${issues.length}\n`);
  
  if (high.length > 0) {
    console.log("🔴 HIGH SEVERITY ISSUES:");
    for (const issue of high) {
      console.log(`\n  [${issue.category}] ${issue.description}`);
      console.log(`  → ${issue.recommendation}`);
      if (issue.file) console.log(`  → File: ${issue.file}`);
    }
  }
  
  if (medium.length > 0) {
    console.log("\n🟡 MEDIUM SEVERITY ISSUES:");
    for (const issue of medium) {
      console.log(`\n  [${issue.category}] ${issue.description}`);
      console.log(`  → ${issue.recommendation}`);
    }
  }
  
  if (low.length > 0) {
    console.log("\n🟢 LOW SEVERITY ISSUES:");
    for (const issue of low) {
      console.log(`\n  [${issue.category}] ${issue.description}`);
      console.log(`  → ${issue.recommendation}`);
    }
  }
  
  if (issues.length === 0) {
    console.log("\n✅ No security issues found!");
  }
  
  // Save report
  const reportPath = `${process.cwd()}/logs/security-audit.jsonl";
  Bun.write(reportPath, issues.map(i => JSON.stringify(i)).join("\n") + "\n");
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Run all audits
async function main() {
  await auditApiRoutes();
  await auditDatabase();
  await auditEnvironment();
  await auditRateLimiting();
  await auditInputValidation();
  await auditSecrets();
  await auditCors();
  generateReport();
  
  db.close();
}

main().catch(console.error);
