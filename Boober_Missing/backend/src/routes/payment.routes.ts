import { Router } from 'express';
import {
  getWallet,
  topUpWallet,
  withdrawFromWallet,
  getTransactionHistory,
  getWalletTransactions,
  processPayment,
  getPaymentStatus,
  initiateRefund,
  linkPaymentMethod,
  unlinkPaymentMethod,
  getLinkedPaymentMethods,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Wallet
router.get('/wallet', getWallet);
router.post('/wallet/topup', topUpWallet);
router.post('/wallet/withdraw', withdrawFromWallet);

// Transactions
router.get('/transactions', getTransactionHistory);
router.get('/wallet/transactions', getWalletTransactions);

// Payments
router.post('/process', processPayment);
router.get('/status/:paymentId', getPaymentStatus);
router.post('/refund', initiateRefund);

// Payment methods
router.get('/methods', getLinkedPaymentMethods);
router.post('/methods', linkPaymentMethod);
router.delete('/methods/:id', unlinkPaymentMethod);

export default router;
