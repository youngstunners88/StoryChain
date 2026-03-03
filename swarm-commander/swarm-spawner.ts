/**
 * Swarm Spawner - Orchestrates parallel autonomous workers
 * Uses Zo /zo/ask API for instant worker spawning
 */

import * as fs from 'fs';
import * as path from 'path';

const SWARM_DIR = path.join(process.env.HOME || '/root', '.swarm');
const WORKERS_DIR = path.join(SWARM_DIR, 'workers');
const SHARED_DIR = path.join(SWARM_DIR, 'shared');

interface Worker {
  id: string;
  type: string;
  objective: string;
  duration: number;
  status: 'pending' | 'running' | 'done' | 'failed';
  startTime?: Date;
  endTime?: Date;
  itemsProcessed: number;
  errors: number;
}

class SwarmSpawner {
  private workers: Map<string, Worker> = new Map();
  
  constructor() {
    // Ensure directories exist
    [SWARM_DIR, WORKERS_DIR, SHARED_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  /**
   * Spawn multiple workers in parallel
   */
  async spawn(
    type: string,
    count: number,
    durationHours: number,
    objective: string
  ): Promise<string[]> {
    const workerIds: string[] = [];
    
    console.log(`[SWARM] Spawning ${count} ${type} workers for ${durationHours}h`);
    
    // Create worker configs
    const promises = [];
    for (let i = 0; i < count; i++) {
      const workerId = `worker-${Date.now()}-${i}`;
      workerIds.push(workerId);
      
      const worker: Worker = {
        id: workerId,
        type,
        objective,
        duration: durationHours,
        status: 'pending',
        itemsProcessed: 0,
        errors: 0
      };
      
      this.workers.set(workerId, worker);
      this.saveWorkerConfig(worker);
      
      // Spawn worker
      promises.push(this.spawnWorker(worker));
    }
    
    // Wait for all to start
    await Promise.allSettled(promises);
    
    return workerIds;
  }
  
  /**
   * Spawn a single worker using Zo /zo/ask API
   */
  private async spawnWorker(worker: Worker): Promise<void> {
    const prompt = this.buildWorkerPrompt(worker);
    
    worker.status = 'running';
    worker.startTime = new Date();
    this.saveWorkerConfig(worker);
    
    try {
      const response = await fetch('https://api.zo.computer/zo/ask', {
        method: 'POST',
        headers: {
          'authorization': process.env.ZO_CLIENT_IDENTITY_TOKEN || '',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          input: prompt,
          model_name: 'openrouter:z-ai/glm-5'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Save results
      this.saveWorkerResult(worker.id, result.output);
      
      worker.status = 'done';
      worker.endTime = new Date();
      this.saveWorkerConfig(worker);
      
      console.log(`[SWARM] Worker ${worker.id} completed`);
      
    } catch (error: any) {
      worker.status = 'failed';
      worker.errors++;
      this.saveWorkerConfig(worker);
      
      console.error(`[SWARM] Worker ${worker.id} failed:`, error.message);
    }
  }
  
  /**
   * Build worker prompt based on type
   */
  private buildWorkerPrompt(worker: Worker): string {
    const typePrompts: Record<string, string> = {
      'big-homes': `
You are a mobile home lead finder. Work autonomously for ${worker.duration} hours.

Objective: ${worker.objective}

Instructions:
1. Search Facebook Marketplace, Craigslist, Zillow for mobile homes under $50k
2. Extract: price, location, seller contact, photos, description
3. Score each listing 1-10 for investment potential
4. Save high-quality leads (7+) to ~/.swarm/shared/leads.jsonl

Format each lead as:
{"price": number, "location": string, "contact": string, "score": number, "url": string}
      `,
      'scraper': `
You are a web scraper. Work autonomously for ${worker.duration} hours.

Objective: ${worker.objective}

Instructions:
1. Visit target websites
2. Extract structured data
3. Handle pagination and rate limits
4. Save to ~/.swarm/shared/scraped.jsonl

Be respectful of robots.txt and rate limits.
      `,
      'researcher': `
You are a researcher. Work autonomously for ${worker.duration} hours.

Objective: ${worker.objective}

Instructions:
1. Search web for relevant information
2. Compile findings with sources
3. Save detailed report to ~/.swarm/shared/research/
      `
    };
    
    return typePrompts[worker.type] || `
Work autonomously for ${worker.duration} hours on: ${worker.objective}
Save progress to ~/.swarm/workers/${worker.id}/
    `;
  }
  
  /**
   * Save worker configuration
   */
  private saveWorkerConfig(worker: Worker): void {
    const workerDir = path.join(WORKERS_DIR, worker.id);
    if (!fs.existsSync(workerDir)) {
      fs.mkdirSync(workerDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(workerDir, 'config.json'),
      JSON.stringify(worker, null, 2)
    );
  }
  
  /**
   * Save worker results
   */
  private saveWorkerResult(workerId: string, result: any): void {
    const resultsPath = path.join(WORKERS_DIR, workerId, 'results.jsonl');
    fs.appendFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      result
    }) + '\n');
  }
  
  /**
   * Get swarm status
   */
  getStatus(): { workers: Worker[], summary: any } {
    const workers = Array.from(this.workers.values());
    
    const summary = {
      total: workers.length,
      running: workers.filter(w => w.status === 'running').length,
      done: workers.filter(w => w.status === 'done').length,
      failed: workers.filter(w => w.status === 'failed').length,
      totalItems: workers.reduce((sum, w) => sum + w.itemsProcessed, 0),
      totalErrors: workers.reduce((sum, w) => sum + w.errors, 0)
    };
    
    return { workers, summary };
  }
}

export { SwarmSpawner, Worker };
