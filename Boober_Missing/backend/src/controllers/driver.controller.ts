import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../utils/logger';
import { getWebSocketService } from '../services/websocket.service';

export const getDriverProfile = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;

    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        rating: true,
        isVerified: true,
        createdAt: true,
        wallet: true,
        vehicle: true,
        driverStats: true,
        _count: {
          select: {
            ridesAsDriver: true,
          },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found',
      });
    }

    res.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    logger.error('Get driver profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get driver profile',
    });
  }
};

export const updateDriverProfile = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { name, phone, avatar } = req.body;

    const driver = await prisma.user.update({
      where: { id: driverId },
      data: { name, phone, avatar },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        rating: true,
      },
    });

    res.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    logger.error('Update driver profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};

export const updateAvailability = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { isAvailable, latitude, longitude } = req.body;

    // Update Redis
    await redis.hset(`driver_location:${driverId}`, {
      isAvailable: isAvailable.toString(),
      ...(latitude && { latitude: latitude.toString() }),
      ...(longitude && { longitude: longitude.toString() }),
      lastUpdate: Date.now().toString(),
    });

    // If driver is going offline, remove from active drivers
    if (!isAvailable) {
      await redis.expire(`driver_location:${driverId}`, 300);
    }

    res.json({
      success: true,
      message: isAvailable ? 'You are now online' : 'You are now offline',
    });
  } catch (error) {
    logger.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability',
    });
  }
};

export const toggleOnline = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;

    // Check current status
    const currentStatus = await redis.hget(`driver_location:${driverId}`, 'isAvailable');
    const newStatus = currentStatus === 'true' ? false : true;

    await redis.hset(`driver_location:${driverId}`, {
      isAvailable: newStatus.toString(),
      lastUpdate: Date.now().toString(),
    });

    if (!newStatus) {
      await redis.expire(`driver_location:${driverId}`, 300);
    }

    res.json({
      success: true,
      data: { isOnline: newStatus },
    });
  } catch (error) {
    logger.error('Toggle online error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle online status',
    });
  }
};

export const getDriverStats = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;

    const stats = await prisma.driverStats.findUnique({
      where: { driverId },
    });

    // Get today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRides = await prisma.ride.aggregate({
      where: {
        driverId,
        status: 'COMPLETED',
        completedAt: { gte: today },
      },
      _sum: { fare: true },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        totalRides: stats?.totalRides || 0,
        totalEarnings: stats?.totalEarnings || 0,
        totalDistance: stats?.totalDistance || 0,
        rating: stats?.rating || 0,
        todayRides: todayRides._count,
        todayEarnings: todayRides._sum.fare || 0,
      },
    });
  } catch (error) {
    logger.error('Get driver stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
};

export const getDriverEarnings = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { period = 'week' } = req.query;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const rides = await prisma.ride.findMany({
      where: {
        driverId,
        status: 'COMPLETED',
        completedAt: { gte: startDate },
      },
      select: {
        id: true,
        fare: true,
        distance: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    const totalEarnings = rides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalDistance = rides.reduce((sum, ride) => sum + (ride.distance || 0), 0);

    res.json({
      success: true,
      data: {
        period,
        rides,
        totalEarnings,
        totalDistance,
        rideCount: rides.length,
      },
    });
  } catch (error) {
    logger.error('Get driver earnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get earnings',
    });
  }
};

export const getDriverRides = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { status, limit = 20, offset = 0 } = req.query;

    const rides = await prisma.ride.findMany({
      where: {
        driverId,
        ...(status && { status: status as string }),
      },
      include: {
        passenger: {
          select: { id: true, name: true, phone: true, avatar: true, rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: rides,
    });
  } catch (error) {
    logger.error('Get driver rides error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rides',
    });
  }
};

export const getVehicleInfo = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;

    const vehicle = await prisma.vehicle.findUnique({
      where: { driverId },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
    }

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    logger.error('Get vehicle info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vehicle info',
    });
  }
};

export const updateVehicleInfo = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { make, model, year, color, plateNumber, vehicleType, capacity } = req.body;

    const vehicle = await prisma.vehicle.upsert({
      where: { driverId },
      create: {
        driverId,
        make,
        model,
        year,
        color,
        plateNumber,
        vehicleType,
        capacity,
      },
      update: {
        make,
        model,
        year,
        color,
        plateNumber,
        vehicleType,
        capacity,
      },
    });

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    logger.error('Update vehicle info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle info',
    });
  }
};

export const acceptRide = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { id } = req.params;

    // Check if driver is available
    const driverStatus = await redis.hget(`driver_location:${driverId}`, 'isAvailable');
    if (driverStatus !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'You are not available to accept rides',
      });
    }

    // Check ride status
    const ride = await prisma.ride.findUnique({
      where: { id },
    });

    if (!ride || ride.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Ride not available',
      });
    }

    // Accept ride
    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        driverId,
        acceptedAt: new Date(),
      },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
      },
    });

    // Remove from pending rides
    await redis.hdel('pending_rides', id);

    // Mark driver as unavailable
    await redis.hset(`driver_location:${driverId}`, 'isAvailable', 'false');

    // Notify passenger
    const ws = getWebSocketService();
    if (ws) {
      ws.emitToUser(ride.passengerId, 'ride:accepted', {
        rideId: id,
        driverId,
        driverName: req.user?.name,
      });
    }

    res.json({
      success: true,
      data: updatedRide,
    });
  } catch (error) {
    logger.error('Accept ride error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept ride',
    });
  }
};

export const rejectRide = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    // Log rejection
    logger.info(`Driver ${driverId} rejected ride ${id}: ${reason}`);

    // In production, you might want to track rejections for analytics
    // and possibly adjust matching algorithm

    res.json({
      success: true,
      message: 'Ride rejected',
    });
  } catch (error) {
    logger.error('Reject ride error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject ride',
    });
  }
};

export const completeRide = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { id } = req.params;

    const ride = await prisma.ride.findFirst({
      where: { id, driverId, status: 'IN_PROGRESS' },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found or not in progress',
      });
    }

    const completedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Mark driver as available
    await redis.hset(`driver_location:${driverId}`, 'isAvailable', 'true');

    // Update driver stats
    await prisma.driverStats.upsert({
      where: { driverId },
      create: {
        driverId,
        totalRides: 1,
        totalEarnings: ride.fare,
        totalDistance: ride.distance || 0,
      },
      update: {
        totalRides: { increment: 1 },
        totalEarnings: { increment: ride.fare },
        totalDistance: { increment: ride.distance || 0 },
      },
    });

    // Update driver wallet
    await prisma.wallet.upsert({
      where: { userId: driverId },
      create: {
        userId: driverId,
        balance: ride.fare,
      },
      update: {
        balance: { increment: ride.fare },
      },
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        walletId: (await prisma.wallet.findUnique({ where: { userId: driverId } }))!.id,
        type: 'CREDIT',
        amount: ride.fare,
        description: `Ride completed: ${id}`,
        rideId: id,
      },
    });

    res.json({
      success: true,
      data: completedRide,
    });
  } catch (error) {
    logger.error('Complete ride error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete ride',
    });
  }
};

export const getDriverReviews = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { limit = 20, offset = 0 } = req.query;

    const reviews = await prisma.rating.findMany({
      where: { toUserId: driverId },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        ride: {
          select: {
            pickupAddress: true,
            dropoffAddress: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    logger.error('Get driver reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reviews',
    });
  }
};
