import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});

const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 SMS requests per hour
  message: {
    success: false,
    error: 'Too many SMS requests, please try again later.',
  },
});

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/login-phone', authLimiter, authController.loginWithPhone);
router.post('/verify-phone', smsLimiter, authController.verifyPhone);
router.post('/resend-verification', smsLimiter, authController.resendVerification);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

// Driver registration
router.post('/register-driver', authenticate, authController.registerDriver);

// Admin routes
router.get('/users', authenticate, authorize('ADMIN'), authController.getAllUsers);

export default router;
