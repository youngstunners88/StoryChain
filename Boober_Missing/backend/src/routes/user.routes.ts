import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  updateLocation,
  getRideHistory,
  getFavorites,
  addFavorite,
  removeFavorite,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  deleteAccount,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.post('/location', updateLocation);

// Ride history
router.get('/rides', getRideHistory);

// Favorites
router.get('/favorites', getFavorites);
router.post('/favorites', addFavorite);
router.delete('/favorites/:id', removeFavorite);

// Payment methods
router.get('/payment-methods', getPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.delete('/payment-methods/:id', removePaymentMethod);

// Account
router.delete('/account', deleteAccount);

export default router;
