import { Router } from 'express';
import authRoutes from './auth.routes';
import rideRoutes from './ride.routes';
import userRoutes from './user.routes';
import driverRoutes from './driver.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rides', rideRoutes);
router.use('/users', userRoutes);
router.use('/driver', driverRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

export default router;
