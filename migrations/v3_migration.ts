#!/usr/bin/env bun
/**
 * StoryChain v3 Migration
 * Creates categories, character pricing, and session tracking tables
 */

import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = '/home/workspace/StoryChain/data/storychain.db';

async function migrate() {
  console.log('🚀 StoryChain v3 Migration Starting...\n');
  
  const db = new Database(DB_PATH);
  db.run('PRAGMA foreign_keys = ON');
  
  try {
    // Run categories and pricing schema
    const schemaPath = join(import.meta.dir, '..', 'database', 'schema-v3-categories.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf-8');
    
    console.log('📊 Creating categories and pricing tables...');
    
    // Split and execute statements
    const statements = schemaSQL.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          db.run(statement);
        } catch (e: any) {
          // Ignore "already exists" errors
          if (!e.message.includes('already exists') && !e.message.includes('duplicate column')) {
            console.log(`  ⚠️  ${e.message}`);
          }
        }
      }
    }
    
    console.log('  ✅ Categories table created');
    console.log('  ✅ Character pricing table created');
    console.log('  ✅ Agent submissions tracking created');
    console.log('  ✅ User usage stats tracking created\n');
    
    // Verify inserts
    const categoryCount = db.query('SELECT COUNT(*) as count FROM content_categories').get();
    console.log(`📁 Categories inserted: ${categoryCount?.count || 0}`);
    
    const pricingCount = db.query('SELECT COUNT(*) as count FROM character_pricing').get();
    console.log(`💰 Pricing tiers inserted: ${pricingCount?.count || 0}\n`);
    
    // Show pricing tiers
    console.log('💵 Character Pricing Tiers:');
    const tiers = db.query('SELECT tier_name, min_chars, max_chars, price_cusd FROM character_pricing ORDER BY min_chars').all();
    for (const tier of tiers) {
      const price = tier.price_cusd === 0 ? 'FREE' : `$${tier.price_cusd.toFixed(2)} cUSD`;
      console.log(`   • ${tier.tier_name}: ${tier.min_chars}-${tier.max_chars} chars = ${price}`);
    }
    
    console.log('\n📚 Content Categories (Format, NOT Genre):');
    const categories = db.query('SELECT name, description FROM content_categories ORDER BY name').all();
    for (const cat of categories) {
      console.log(`   • ${cat.name}: ${cat.description}`);
    }
    
    console.log('\n✅ Migration complete!\n');
    console.log('Next steps:');
    console.log('  1. Run the server: bun run dev');
    console.log('  2. Test categories: GET /api/categories');
    console.log('  3. Test pricing: GET /api/pricing/tiers');
    console.log('  4. Test agent status: GET /api/agents/status (auth required)');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate();
