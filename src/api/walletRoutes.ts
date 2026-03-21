import { Router } from 'express';
import { MultiWalletService, WalletType } from '../services/multiWallet';
import { DatabaseConnection } from '../database/connection';
import { authenticateUser } from '../middleware/auth';

export function createWalletRoutes(db: DatabaseConnection): Router {
  const router = Router();
  const walletService = new MultiWalletService(db);

  router.get('/supported', (req, res) => {
    const wallets = walletService.getSupportedWallets();
    res.json({ wallets });
  });

  router.post('/connect', authenticateUser, async (req, res) => {
    try {
      const { wallet_type, address, is_primary } = req.body;
      const userId = req.user!.id;

      if (!wallet_type || !address) {
        return res.status(400).json({ error: 'wallet_type and address are required' });
      }

      const wallet = await walletService.connectWallet({
        user_id: userId,
        wallet_type: wallet_type as WalletType,
        address,
        is_primary: is_primary || false,
        verified: false
      });

      res.status(201).json({
        success: true,
        wallet: {
          id: wallet.id,
          type: wallet.wallet_type,
          chain: wallet.chain,
          address: wallet.address,
          is_primary: wallet.is_primary,
          verified: wallet.verified
        },
        message: 'Wallet connected successfully'
      });
    } catch (error) {
      console.error('Wallet connection error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to connect wallet' });
    }
  });

  router.get('/', authenticateUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const wallets = await walletService.getUserWallets(userId);

      res.json({
        wallets: wallets.map(w => ({
          id: w.id,
          type: w.wallet_type,
          chain: w.chain,
          address: w.address,
          is_primary: w.is_primary,
          verified: w.verified,
          connected_at: w.connected_at
        }))
      });
    } catch (error) {
      console.error('Wallet list error:', error);
      res.status(500).json({ error: 'Failed to retrieve wallets' });
    }
  });

  router.post('/verify', authenticateUser, async (req, res) => {
    try {
      const { wallet_id, message, signature } = req.body;
      const userId = req.user!.id;

      if (!wallet_id || !message || !signature) {
        return res.status(400).json({ error: 'wallet_id, message, and signature are required' });
      }

      const wallets = await walletService.getUserWallets(userId);
      const wallet = wallets.find(w => w.id === wallet_id);

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const isValid = await walletService.validateWalletOwnership(
        wallet.wallet_type,
        wallet.address,
        message,
        signature
      );

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      await walletService.verifyWallet(wallet_id, userId);

      res.json({
        success: true,
        message: 'Wallet verified successfully'
      });
    } catch (error) {
      console.error('Wallet verification error:', error);
      res.status(500).json({ error: 'Failed to verify wallet' });
    }
  });

  router.post('/set-primary', authenticateUser, async (req, res) => {
    try {
      const { wallet_id } = req.body;
      const userId = req.user!.id;

      if (!wallet_id) {
        return res.status(400).json({ error: 'wallet_id is required' });
      }

      await walletService.setPrimaryWallet(userId, wallet_id);

      res.json({
        success: true,
        message: 'Primary wallet updated'
      });
    } catch (error) {
      console.error('Set primary wallet error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to set primary wallet' });
    }
  });

  router.delete('/:walletId', authenticateUser, async (req, res) => {
    try {
      const { walletId } = req.params;
      const userId = req.user!.id;

      await walletService.disconnectWallet(parseInt(walletId), userId);

      res.json({
        success: true,
        message: 'Wallet disconnected'
      });
    } catch (error) {
      console.error('Disconnect wallet error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to disconnect wallet' });
    }
  });

  return router;
}
