import { DatabaseConnection } from '../database/connection';

export type SessionType = 'free_period' | 'cooldown' | 'paid';
export type SessionStatus = 'active' | 'expired' | 'completed';

export interface TimeSession {
  id?: number;
  user_id: number;
  session_type: SessionType;
  started_at: string;
  expires_at: string;
  characters_used: number;
  cost_incurred: number;
  status: SessionStatus;
}

export interface FreemiumStatus {
  canUseAgents: boolean;
  sessionType: SessionType | null;
  timeRemaining: number;
  charactersUsed: number;
  nextFreeAt: Date | null;
}

export class TimeTrackerService {
  private db: DatabaseConnection;
  private readonly FREE_PERIOD_MINUTES = 120;
  private readonly COOLDOWN_MINUTES = 180;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async startFreePeriod(userId: number): Promise<TimeSession> {
    const existing = await this.getActiveSession(userId);
    if (existing) {
      throw new Error('User already has an active session');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.FREE_PERIOD_MINUTES * 60 * 1000);

    const sql = `
      INSERT INTO user_time_sessions (user_id, session_type, started_at, expires_at, characters_used, cost_incurred, status)
      VALUES (?, 'free_period', ?, ?, 0, 0, 'active')
      RETURNING *
    `;

    const result = await this.db.run(sql, [userId, now.toISOString(), expiresAt.toISOString()]);
    return result[0];
  }

  async extendSession(userId: number, characters: number, cost: number): Promise<TimeSession> {
    const activeSession = await this.getActiveSession(userId);
    
    if (activeSession && activeSession.session_type === 'paid') {
      const sql = `
        UPDATE user_time_sessions 
        SET characters_used = characters_used + ?, cost_incurred = cost_incurred + ?
        WHERE id = ?
        RETURNING *
      `;
      const result = await this.db.run(sql, [characters, cost, activeSession.id]);
      return result[0];
    }

    if (activeSession) {
      await this.endSession(activeSession.id!);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    const sql = `
      INSERT INTO user_time_sessions (user_id, session_type, started_at, expires_at, characters_used, cost_incurred, status)
      VALUES (?, 'paid', ?, ?, ?, ?, 'active')
      RETURNING *
    `;

    const result = await this.db.run(sql, [userId, now.toISOString(), expiresAt.toISOString(), characters, cost]);
    return result[0];
  }

  async getActiveSession(userId: number): Promise<TimeSession | null> {
    const sql = `
      SELECT * FROM user_time_sessions 
      WHERE user_id = ? AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;
    
    const results = await this.db.query(sql, [userId]);
    
    if (results.length === 0) {
      return null;
    }

    const session = results[0];
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (now > expiresAt) {
      await this.handleExpiredSession(session);
      return this.getActiveSession(userId);
    }

    return session;
  }

  async getFreemiumStatus(userId: number): Promise<FreemiumStatus> {
    const session = await this.getActiveSession(userId);

    if (!session) {
      const lastSession = await this.getLastCompletedSession(userId);
      
      if (lastSession && lastSession.session_type === 'free_period') {
        const cooldownEnd = new Date(new Date(lastSession.expires_at).getTime() + this.COOLDOWN_MINUTES * 60 * 1000);
        const now = new Date();
        
        if (now < cooldownEnd) {
          const remainingMs = cooldownEnd.getTime() - now.getTime();
          return {
            canUseAgents: false,
            sessionType: 'cooldown',
            timeRemaining: Math.ceil(remainingMs / 1000),
            charactersUsed: 0,
            nextFreeAt: cooldownEnd
          };
        }
      }

      return {
        canUseAgents: true,
        sessionType: null,
        timeRemaining: this.FREE_PERIOD_MINUTES * 60,
        charactersUsed: 0,
        nextFreeAt: null
      };
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime());

    return {
      canUseAgents: true,
      sessionType: session.session_type,
      timeRemaining: Math.ceil(remainingMs / 1000),
      charactersUsed: session.characters_used,
      nextFreeAt: null
    };
  }

  async canStartNewFreePeriod(userId: number): Promise<{ allowed: boolean; nextFreeAt: Date | null }> {
    const activeSession = await this.getActiveSession(userId);
    
    if (activeSession) {
      return { allowed: false, nextFreeAt: null };
    }

    const lastSession = await this.getLastCompletedSession(userId);
    
    if (!lastSession || lastSession.session_type !== 'free_period') {
      return { allowed: true, nextFreeAt: null };
    }

    const cooldownEnd = new Date(new Date(lastSession.expires_at).getTime() + this.COOLDOWN_MINUTES * 60 * 1000);
    const now = new Date();

    if (now >= cooldownEnd) {
      return { allowed: true, nextFreeAt: null };
    }

    return { allowed: false, nextFreeAt: cooldownEnd };
  }

  async useCharacters(userId: number, characters: number): Promise<void> {
    const session = await this.getActiveSession(userId);
    
    if (!session) {
      throw new Error('No active session');
    }

    const sql = `
      UPDATE user_time_sessions 
      SET characters_used = characters_used + ?
      WHERE id = ?
    `;
    
    await this.db.run(sql, [characters, session.id]);
  }

  async endSession(sessionId: number): Promise<void> {
    await this.db.run(
      'UPDATE user_time_sessions SET status = "completed" WHERE id = ?',
      [sessionId]
    );
  }

  async getSessionHistory(userId: number, limit: number = 10): Promise<TimeSession[]> {
    const sql = `
      SELECT * FROM user_time_sessions 
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `;
    
    return await this.db.query(sql, [userId, limit]);
  }

  private async handleExpiredSession(session: TimeSession): Promise<void> {
    if (session.session_type === 'free_period') {
      const sql = `
        UPDATE user_time_sessions 
        SET status = 'expired', expires_at = ?
        WHERE id = ?
      `;
      
      const cooldownEnd = new Date(new Date(session.expires_at).getTime() + this.COOLDOWN_MINUTES * 60 * 1000);
      await this.db.run(sql, [cooldownEnd.toISOString(), session.id]);
    } else {
      await this.endSession(session.id!);
    }
  }

  private async getLastCompletedSession(userId: number): Promise<TimeSession | null> {
    const sql = `
      SELECT * FROM user_time_sessions 
      WHERE user_id = ? AND status IN ('completed', 'expired')
      ORDER BY expires_at DESC
      LIMIT 1
    `;
    
    const results = await this.db.query(sql, [userId]);
    return results[0] || null;
  }
}
