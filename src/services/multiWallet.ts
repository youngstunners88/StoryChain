import { DatabaseConnection } from '../database/connection';

export type WalletType = 
  | 'metamask' | 'rabby' | 'tokenpocket' | 'safepal' | 'trust' | 'coinbase' | 'walletconnect'
  | 'phantom' | 'solflare' | 'glow'
  | 'keplr' | 'leap';

export type ChainType = 'ethereum' | 'solana' | 'cosmos';

export interface WalletConnection {
  id?: number;
  user_id: number;
  wallet_type: WalletType;
  chain: ChainType;
  address: string;
  is_primary: boolean;
  verified: boolean;
  connected_at?: string;
}

export const WALLET_CONFIG: Record<WalletType, { chain: ChainType; name: string }> = {
  metamask: { chain: 'ethereum', name: 'MetaMask' },
  rabby: { chain: 'ethereum', name: 'Rabby' },
  tokenpocket: { chain: 'ethereum', name: 'TokenPocket' },
  safepal: { chain: 'ethereum', name: 'SafePal' },
  trust: { chain: 'ethereum', name: 'Trust Wallet' },
  coinbase: { chain: 'ethereum', name: 'Coinbase Wallet' },
  walletconnect: { chain: 'ethereum', name: 'WalletConnect' },
  phantom: { chain: 'solana', name: 'Phantom' },
  solflare: { chain: 'solana', name: 'Solflare' },
  glow: { chain: 'solana', name: 'Glow' },
  keplr: { chain: 'cosmos', name: 'Keplr' },
  leap: { chain: 'cosmos', name: 'Leap' }
};

export class MultiWalletService {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async connectWallet(wallet: Omit<WalletConnection, 'id' | 'connected_at'>): Promise<WalletConnection> {
    const config = WALLET_CONFIG[wallet.wallet_type];
    if (!config) {
      throw new Error(`Unsupported wallet type: ${wallet.wallet_type}`);
    }

    const existing = await this.db.query(
      'SELECT * FROM user_wallets_v3 WHERE user_id = ? AND address = ?',
      [wallet.user_id, wallet.address]
    );

    if (existing.length > 0) {
      throw new Error('Wallet already connected for this user');
    }

    const isFirstWallet = await this.isFirstWallet(wallet.user_id);
    const isPrimary = isFirstWallet ? true : wallet.is_primary;

    if (isPrimary && !isFirstWallet) {
      await this.clearPrimaryFlag(wallet.user_id);
    }

    const sql = `
      INSERT INTO user_wallets_v3 (user_id, wallet_type, chain, address, is_primary, verified)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `;

    const result = await this.db.run(sql, [
      wallet.user_id,
      wallet.wallet_type,
      config.chain,
      wallet.address,
      isPrimary,
      false
    ]);

    return result[0];
  }

  async getUserWallets(userId: number): Promise<WalletConnection[]> {
    const sql = `
      SELECT * FROM user_wallets_v3 
      WHERE user_id = ? 
      ORDER BY is_primary DESC, connected_at DESC
    `;
    return await this.db.query(sql, [userId]);
  }

  async getPrimaryWallet(userId: number): Promise<WalletConnection | null> {
    const sql = `
      SELECT * FROM user_wallets_v3 
      WHERE user_id = ? AND is_primary = 1
      LIMIT 1
    `;
    const results = await this.db.query(sql, [userId]);
    return results[0] || null;
  }

  async setPrimaryWallet(userId: number, walletId: number): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx.run(
        'UPDATE user_wallets_v3 SET is_primary = 0 WHERE user_id = ?',
        [userId]
      );
      
      const result = await trx.run(
        'UPDATE user_wallets_v3 SET is_primary = 1 WHERE id = ? AND user_id = ?',
        [walletId, userId]
      );

      if (result.changes === 0) {
        throw new Error('Wallet not found or does not belong to user');
      }
    });
  }

  async verifyWallet(walletId: number, userId: number): Promise<void> {
    const sql = `
      UPDATE user_wallets_v3 
      SET verified = true 
      WHERE id = ? AND user_id = ?
    `;
    
    const result = await this.db.run(sql, [walletId, userId]);
    
    if (result.changes === 0) {
      throw new Error('Wallet not found or does not belong to user');
    }
  }

  async disconnectWallet(walletId: number, userId: number): Promise<void> {
    const wallet = await this.db.query(
      'SELECT * FROM user_wallets_v3 WHERE id = ? AND user_id = ?',
      [walletId, userId]
    );

    if (wallet.length === 0) {
      throw new Error('Wallet not found');
    }

    const wasPrimary = wallet[0].is_primary;

    await this.db.run(
      'DELETE FROM user_wallets_v3 WHERE id = ? AND user_id = ?',
      [walletId, userId]
    );

    if (wasPrimary) {
      const remaining = await this.db.query(
        'SELECT * FROM user_wallets_v3 WHERE user_id = ? ORDER BY connected_at DESC LIMIT 1',
        [userId]
      );
      
      if (remaining.length > 0) {
        await this.db.run(
          'UPDATE user_wallets_v3 SET is_primary = 1 WHERE id = ?',
          [remaining[0].id]
        );
      }
    }
  }

  async validateWalletOwnership(walletType: WalletType, address: string, message: string, signature: string): Promise<boolean> {
    const chain = WALLET_CONFIG[walletType].chain;
    
    try {
      if (chain === 'ethereum') {
        return await this.validateEVMSignature(address, message, signature);
      } else if (chain === 'solana') {
        return await this.validateSolanaSignature(address, message, signature);
      } else if (chain === 'cosmos') {
        return await this.validateCosmosSignature(address, message, signature);
      }
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
    
    return false;
  }

  private async validateEVMSignature(address: string, message: string, signature: string): Promise<boolean> {
    const { ethers } = await import('ethers');
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  }

  private async validateSolanaSignature(address: string, message: string, signature: string): Promise<boolean> {
    const { PublicKey, sign } = await import('@solana/web3.js');
    const { verify } = await import('@noble/ed25519');
    
    const publicKey = new PublicKey(address);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, 'base64');
    
    return await verify(signatureBytes, messageBytes, publicKey.toBytes());
  }

  private async validateCosmosSignature(address: string, message: string, signature: string): Promise<boolean> {
    const { verifyADR36Amino } = await import('@keplr-wallet/cosmos');
    return verifyADR36Amino(address, message, signature);
  }

  private async isFirstWallet(userId: number): Promise<boolean> {
    const result = await this.db.query(
      'SELECT COUNT(*) as count FROM user_wallets_v3 WHERE user_id = ?',
      [userId]
    );
    return result[0].count === 0;
  }

  private async clearPrimaryFlag(userId: number): Promise<void> {
    await this.db.run(
      'UPDATE user_wallets_v3 SET is_primary = 0 WHERE user_id = ?',
      [userId]
    );
  }

  getSupportedWallets(): { type: WalletType; name: string; chain: ChainType }[] {
    return Object.entries(WALLET_CONFIG).map(([type, config]) => ({
      type: type as WalletType,
      name: config.name,
      chain: config.chain
    }));
  }
}
