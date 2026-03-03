import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Ride CRUD
router.post('/', rideController.createRide);
router.get('/', rideController.getRides);
router.get('/active', rideController.getActiveRide);
router.get('/nearby-drivers', rideController.getNearbyDrivers);
router.get('/estimate', rideController.estimateRide);
router.get('/:id', rideController.getRide);

// Ride actions
router.post('/:id/cancel', rideController.cancelRide);
router.post('/:id/arrive', rideController.driverArrived);
router.post('/:id/start', rideController.startRide);
router.post('/:id/complete', rideController.completeRide);
router.post('/:id/rate', rideController.rateRide);

// Driver specific
router.get('/driver/available', authorize('DRIVER'), rideController.getAvailableRides);
router.post('/:id/accept', authorize('DRIVER'), rideController.acceptRide);
router.post('/:id/reject', authorize('DRIVER'), rideController.rejectRide);

export default router;
