import { Router } from 'express';
import {
  getDriverProfile,
  updateDriverProfile,
  updateAvailability,
  toggleOnline,
  getDriverStats,
  getDriverEarnings,
  getDriverRides,
  getVehicleInfo,
  updateVehicleInfo,
  acceptRide,
  rejectRide,
  completeRide,
  getDriverReviews,
} from '../controllers/driver.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication and driver role
router.use(authenticate);
router.use(authorize('DRIVER'));

// Profile
router.get('/profile', getDriverProfile);
router.put('/profile', updateDriverProfile);

// Availability
router.post('/availability', updateAvailability);
router.post('/toggle-online', toggleOnline);

// Stats and earnings
router.get('/stats', getDriverStats);
router.get('/earnings', getDriverEarnings);
router.get('/rides', getDriverRides);

// Vehicle
router.get('/vehicle', getVehicleInfo);
router.put('/vehicle', updateVehicleInfo);

// Ride actions
router.post('/rides/:id/accept', acceptRide);
router.post('/rides/:id/reject', rejectRide);
router.post('/rides/:id/complete', completeRide);

// Reviews
router.get('/reviews', getDriverReviews);

export default router;
