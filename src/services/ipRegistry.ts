import { DatabaseConnection } from '../database/connection';
import { generateUUID } from '../utils/book-ids';

export interface IPOwnership {
  user_id: number;
  ownership_percentage: number;
  role: string;
  verified: boolean;
  signature?: string;
}

export interface IPRegistryEntry {
  id?: number;
  story_id: number;
  isbn?: string;
  content_hash: string;
  registration_date?: string;
  commercial_rights_enabled: boolean;
  licensing_terms: string;
  nft_contract_address?: string;
  nft_token_id?: string;
  status: 'active' | 'disputed' | 'revoked';
}

export class IPRegistryService {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async registerIP(entry: Omit<IPRegistryEntry, 'id' | 'registration_date'>): Promise<IPRegistryEntry> {
    const sql = `
      INSERT INTO ip_registry (story_id, isbn, content_hash, commercial_rights_enabled, licensing_terms, nft_contract_address, nft_token_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
    const result = await this.db.run(sql, [
      entry.story_id,
      entry.isbn || null,
      entry.content_hash,
      entry.commercial_rights_enabled,
      entry.licensing_terms || 'all_rights_reserved',
      entry.nft_contract_address || null,
      entry.nft_token_id || null,
      entry.status || 'active'
    ]);
    
    return result[0];
  }

  async addOwnership(ipRegistryId: number, ownership: IPOwnership): Promise<void> {
    const sql = `
      INSERT INTO ip_ownership (ip_registry_id, user_id, ownership_percentage, role, verified, signature)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.run(sql, [
      ipRegistryId,
      ownership.user_id,
      ownership.ownership_percentage,
      ownership.role,
      ownership.verified,
      ownership.signature || null
    ]);
  }

  async getIPByStoryId(storyId: number): Promise<IPRegistryEntry | null> {
    const sql = `SELECT * FROM ip_registry WHERE story_id = ?`;
    const results = await this.db.query(sql, [storyId]);
    return results[0] || null;
  }

  async getOwners(ipRegistryId: number): Promise<(IPOwnership & { username: string; wallet_address: string })[]> {
    const sql = `
      SELECT io.*, u.username, uw.address as wallet_address
      FROM ip_ownership io
      JOIN users u ON io.user_id = u.id
      LEFT JOIN user_wallets_v3 uw ON io.user_id = uw.user_id AND uw.is_primary = 1
      WHERE io.ip_registry_id = ?
      ORDER BY io.ownership_percentage DESC
    `;
    
    return await this.db.query(sql, [ipRegistryId]);
  }

  async transferOwnership(ipRegistryId: number, fromUserId: number, toUserId: number, percentage: number): Promise<void> {
    const db = this.db;
    
    await db.transaction(async (trx) => {
      const fromSql = `
        UPDATE ip_ownership 
        SET ownership_percentage = ownership_percentage - ?
        WHERE ip_registry_id = ? AND user_id = ? AND ownership_percentage >= ?
      `;
      const fromResult = await trx.run(fromSql, [percentage, ipRegistryId, fromUserId, percentage]);
      
      if (fromResult.changes === 0) {
        throw new Error('Insufficient ownership percentage to transfer');
      }
      
      const existingSql = `SELECT * FROM ip_ownership WHERE ip_registry_id = ? AND user_id = ?`;
      const existing = await trx.query(existingSql, [ipRegistryId, toUserId]);
      
      if (existing.length > 0) {
        const updateSql = `
          UPDATE ip_ownership 
          SET ownership_percentage = ownership_percentage + ?
          WHERE ip_registry_id = ? AND user_id = ?
        `;
        await trx.run(updateSql, [percentage, ipRegistryId, toUserId]);
      } else {
        const insertSql = `
          INSERT INTO ip_ownership (ip_registry_id, user_id, ownership_percentage, role, verified)
          VALUES (?, ?, ?, 'contributor', false)
        `;
        await trx.run(insertSql, [ipRegistryId, toUserId, percentage]);
      }
    });
  }

  async generateContentHash(content: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async verifyOwnership(ipRegistryId: number, userId: number, signature: string): Promise<void> {
    const sql = `
      UPDATE ip_ownership 
      SET verified = true, signature = ?
      WHERE ip_registry_id = ? AND user_id = ?
    `;
    
    await this.db.run(sql, [signature, ipRegistryId, userId]);
  }
}
