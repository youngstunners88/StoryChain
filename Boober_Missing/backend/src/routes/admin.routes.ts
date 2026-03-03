import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllRides,
  getRideById,
  getRevenueReport,
  getDriversReport,
  getPendingVerifications,
  verifyDriver,
  getSystemSettings,
  updateSystemSettings,
  sendNotification,
  broadcastNotification,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);

// Rides
router.get('/rides', getAllRides);
router.get('/rides/:id', getRideById);

// Reports
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/drivers', getDriversReport);

// Verifications
router.get('/verifications', getPendingVerifications);
router.post('/verifications/:id', verifyDriver);

// Settings
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

// Notifications
router.post('/notifications', sendNotification);
router.post('/notifications/broadcast', broadcastNotification);

export default router;
