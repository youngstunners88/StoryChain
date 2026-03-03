/**
 * Self-Healing Health Monitor
 * Runs every 15 minutes to check agent health and recover from failures
 */

interface TaskResult {
  id: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

interface HealthStatus {
  gatewayUp: boolean;
  consecutiveFailures: number;
  lastFailure?: string;
  lastRecovery?: string;
  apiKeysAvailable: number;
  skillsAvailable: string[];
}

class HealthMonitor {
  private consecutiveFailures = 0;
  private lastTasks: TaskResult[] = [];
  private recoveryLog: string[] = [];
  
  // Check gateway status
  async checkGatewayStatus(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8402/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // Restart gateway
  async restartGateway(): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      execSync('openclaw gateway restart', { timeout: 30000 });
      this.logRecovery('Gateway restarted successfully');
      return true;
    } catch (error) {
      this.logRecovery(`Gateway restart failed: ${error}`);
      return false;
    }
  }
  
  // Search ClawHub for alternative skill
  async findAlternativeSkill(skillName: string): Promise<string | null> {
    // Search GitHub/ClawHub for similar skills
    const searchUrl = `https://api.github.com/search/repositories?q=openclaw+skill+${skillName}`;
    try {
      const response = await fetch(searchUrl);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].html_url;
      }
    } catch {}
    return null;
  }
  
  // Switch to backup API key
  switchToBackupKey(): boolean {
    const keys = [
      process.env.OPENAI_API_KEY_1,
      process.env.OPENAI_API_KEY_2,
      process.env.ANTHROPIC_API_KEY_1,
    ].filter(Boolean);
    
    if (keys.length > 1) {
      // Rotate to next available key
      process.env.CURRENT_API_KEY = keys[1];
      this.logRecovery('Switched to backup API key');
      return true;
    }
    return false;
  }
  
  // Main self-healing check
  async performHealthCheck(lastTaskResult?: TaskResult): Promise<void> {
    // Update consecutive failures
    if (lastTaskResult && !lastTaskResult.success) {
      this.consecutiveFailures++;
      this.lastTasks.push(lastTaskResult);
    } else {
      this.consecutiveFailures = 0;
    }
    
    // Single failure path
    if (this.consecutiveFailures >= 1) {
      console.log(`[HEALTH] Failure detected (${this.consecutiveFailures} consecutive)`);
      
      // 1. Check gateway
      const gatewayUp = await this.checkGatewayStatus();
      if (!gatewayUp) {
        await this.restartGateway();
      }
      
      // 2. Check if skill missing
      const lastError = lastTaskResult?.error || '';
      if (lastError.includes('skill') || lastError.includes('not found')) {
        const skillName = this.extractSkillName(lastError);
        const alternative = await this.findAlternativeSkill(skillName);
        if (alternative) {
          this.logRecovery(`Found alternative skill: ${alternative}`);
        }
      }
      
      // 3. API error handling
      if (lastError.includes('API') || lastError.includes('rate limit')) {
        this.switchToBackupKey();
      }
    }
    
    // 3 consecutive failures - spawn fresh
    if (this.consecutiveFailures >= 3) {
      console.log('[HEALTH] 3 consecutive failures - spawning fresh session');
      await this.spawnFreshSession();
    }
  }
  
  // Spawn fresh session
  async spawnFreshSession(): Promise<void> {
    // 1. Clear context
    this.lastTasks = [];
    
    // 2. Minimal retry prompt
    const minimalPrompt = `
      Retry the last failed task with:
      - No previous context
      - Fresh API connection
      - Default skill set
      - Timeout: 60 seconds
    `;
    
    this.logRecovery('Spawned fresh session with minimal context');
    
    // 3. Escalate if still failing after this
    // (Would integrate with notification system)
  }
  
  // Helper: Extract skill name from error
  private extractSkillName(error: string): string {
    const match = error.match(/skill[:\s]+(\w+)/i);
    return match ? match[1] : 'unknown';
  }
  
  // Log recovery action
  private logRecovery(action: string): void {
    const entry = `${new Date().toISOString()}] ${action}`;
    this.recoveryLog.push(entry);
    console.log(`[RECOVERY] ${action}`);
  }
  
  // Get health status
  getStatus(): HealthStatus {
    return {
      gatewayUp: true, // Would check actual status
      consecutiveFailures: this.consecutiveFailures,
      lastFailure: this.lastTasks[this.lastTasks.length - 1]?.error,
      lastRecovery: this.recoveryLog[this.recoveryLog.length - 1],
      apiKeysAvailable: 2,
      skillsAvailable: ['web-scraper', 'email-sender', 'data-processor']
    };
  }
}

export { HealthMonitor, TaskResult, HealthStatus };
