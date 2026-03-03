import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../utils/logger';
import { config } from '../config';
import { Prisma } from '@prisma/client';

// Fare calculation constants for South Africa
const BASE_FARE = 15.00; // R15 base fare
const PER_KM_RATE = 8.50; // R8.50 per km
const PER_MINUTE_RATE = 1.50; // R1.50 per minute
const SURGE_MULTIPLIER = 1.0; // Default surge
const MINIMUM_FARE = 25.00; // R25 minimum

// Calculate distance between two points (Haversine formula)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Estimate travel time (simplified - would use Google Maps API in production)
const estimateTravelTime = (distance: number): number => {
  // Assume average speed of 30 km/h in South African cities
  return Math.round((distance / 30) * 60); // minutes
};

// Calculate fare
const calculateFare = (distance: number, duration: number, surge = SURGE_MULTIPLIER): number => {
  const fare = (BASE_FARE + distance * PER_KM_RATE + duration * PER_MINUTE_RATE) * surge;
  return Math.max(fare, MINIMUM_FARE);
};

// Get or generate ride ID
const generateRideId = (): string => {
  return `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Geohash encoding for location indexing
const encodeGeohash = (latitude: number, longitude: number, precision = 6): string => {
  const chars = '0123456789bcdefghjkmnpqrstuvwxyz';
  let hash = '';
  let lat = [-90, 90];
  let lon = [-180, 180];
  let bit = 0;
  let ch = 0;

  while (hash.length < precision) {
    if (bit % 2 === 0) {
      const mid = (lon[0] + lon[1]) / 2;
      if (longitude > mid) {
        ch |= 1 << (4 - (bit % 5));
        lon[0] = mid;
      } else {
        lon[1] = mid;
      }
    } else {
      const mid = (lat[0] + lat[1]) / 2;
      if (latitude > mid) {
        ch |= 1 << (4 - (bit % 5));
        lat[0] = mid;
      } else {
        lat[1] = mid;
      }
    }

    bit++;
    if (bit % 5 === 0) {
      hash += chars[ch];
      ch = 0;
    }
  }

  return hash;
};

// Create a new ride request
export const createRide = async (req: Request, res: Response) => {
  try {
    const passengerId = req.user?.id;
    const {
      pickup,
      dropoff,
      passengerCount = 1,
      paymentMethod = 'CASH',
      notes,
    } = req.body;

    // Check for active ride
    const activeRide = await prisma.ride.findFirst({
      where: {
        passengerId,
        status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
      },
    });

    if (activeRide) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active ride',
        ride: activeRide,
      });
    }

    // Calculate distance and fare
    const distance = calculateDistance(
      pickup.latitude,
      pickup.longitude,
      dropoff.latitude,
      dropoff.longitude
    );
    const duration = estimateTravelTime(distance);
    const fare = calculateFare(distance, duration);

    // Create ride
    const ride = await prisma.ride.create({
      data: {
        passengerId,
        pickupLat: pickup.latitude,
        pickupLng: pickup.longitude,
        pickupAddress: pickup.address,
        dropoffLat: dropoff.latitude,
        dropoffLng: dropoff.longitude,
        dropoffAddress: dropoff.address,
        distance,
        duration,
        fare,
        surgeMultiplier: SURGE_MULTIPLIER,
        status: 'PENDING',
        passengerCount,
        paymentMethod,
        notes,
        geohash: encodeGeohash(pickup.latitude, pickup.longitude),
      },
      include: {
        passenger: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });

    // Cache ride in Redis for quick driver matching
    await redis.hset('pending_rides', ride.id, JSON.stringify({
      pickupLat: pickup.latitude,
      pickupLng: pickup.longitude,
      pickupAddress: pickup.address,
      fare,
      passengerId,
      createdAt: Date.now(),
    }));

    // Publish ride request for driver notifications
    await redis.publish('ride_requests', JSON.stringify({
      rideId: ride.id,
      pickup,
      dropoff,
      fare,
      distance,
      passengerCount,
    }));

    logger.info(`Ride created: ${ride.id} by passenger ${passengerId}`);

    res.status(201).json({
      success: true,
      data: ride,
    });
  } catch (error) {
    logger.error('Create ride error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ride request',
    });
  }
};

// Get nearby drivers
export const getNearbyDrivers = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const radiusKm = parseFloat(radius as string);

    // Get all active drivers from Redis
    const driverKeys = await redis.keys('driver_location:*');
    const nearbyDrivers = [];

    for (const key of driverKeys) {
      const locationData = await redis.hgetall(key);
      if (!locationData || !locationData.isAvailable) continue;

      const driverLat = parseFloat(locationData.latitude);
      const driverLng = parseFloat(locationData.longitude);
      const distance = calculateDistance(lat, lng, driverLat, driverLng);

      if (distance <= radiusKm) {
        nearbyDrivers.push({
          driverId: key.replace('driver_location:', ''),
          latitude: driverLat,
          longitude: driverLng,
          distance: Math.round(distance * 100) / 100,
          vehicleType: locationData.vehicleType,
          rating: parseFloat(locationData.rating) || 4.5,
          eta: Math.round((distance / 30) * 60), // Estimated arrival time in minutes
        });
      }
    }

    // Sort by distance
    nearbyDrivers.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: nearbyDrivers.slice(0, 20), // Return top 20 nearest drivers
    });
  } catch (error) {
    logger.error('Get nearby drivers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get nearby drivers',
    });
  }
};

// Estimate fare
export const estimateFare = async (req: Request, res: Response) => {
  try {
    const { pickup, dropoff } = req.body;

    const distance = calculateDistance(
      pickup.latitude,
      pickup.longitude,
      dropoff.latitude,
      dropoff.longitude
    );
    const duration = estimateTravelTime(distance);
    const fare = calculateFare(distance, duration);

    res.json({
      success: true,
      data: {
        distance: Math.round(distance * 100) / 100,
        duration,
        fare: Math.round(fare * 100) / 100,
        breakdown: {
          baseFare: BASE_FARE,
          distanceCharge: Math.round(distance * PER_KM_RATE * 100) / 100,
          timeCharge: Math.round(duration * PER_MINUTE_RATE * 100) / 100,
          surgeMultiplier: SURGE_MULTIPLIER,
        },
        currency: 'ZAR',
      },
    });
  } catch (error) {
    logger.error('Estimate fare error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate fare',
    });
  }
};

// Accept ride (Driver)
export const acceptRide = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { id } = req.params;

    // Check if driver is available
    const driverLocation = await redis.hgetall(`driver_location:${driverId}`);
    if (!driverLocation || driverLocation.isAvailable !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'You are not available to accept rides',
      });
    }

    // Check if ride exists and is pending
    const ride = await prisma.ride.findUnique({
      where: { id },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found',
      });
    }

    if (ride.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Ride is no longer available',
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
        driver: { select: { id: true, name: true, phone: true, avatar: true } },
      },
    });

    // Remove from pending rides
    await redis.hdel('pending_rides', id);

    // Mark driver as unavailable
    await redis.hset(`driver_location:${driverId}`, 'isAvailable', 'false');

    logger.info(`Ride ${id} accepted by driver ${driverId}`);

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

// Start ride (Driver)
export const startRide = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { id } = req.params;

    const ride = await prisma.ride.findFirst({
      where: { id, driverId, status: 'ACCEPTED' },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found or not in accepted status',
      });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    logger.info(`Ride ${id} started by driver ${driverId}`);

    res.json({
      success: true,
      data: updatedRide,
    });
  } catch (error) {
    logger.error('Start ride error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start ride',
    });
  }
};

// Complete ride (Driver)
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

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Mark driver as available again
    await redis.hset(`driver_location:${driverId}`, 'isAvailable', 'true');

    // Update driver stats
    await prisma.driverStats.upsert({
      where: { driverId },
      create: {
        driverId,
        totalRides: 1,
        totalEarnings: ride.fare,
      },
      update: {
        totalRides: { increment: 1 },
        totalEarnings: { increment: ride.fare },
      },
    });

    logger.info(`Ride ${id} completed by driver ${driverId}`);

    res.json({
      success: true,
      data: updatedRide,
    });
  } catch (error) {
    logger.error('Complete ride error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete ride',
    });
  }
};

// Cancel ride
export const cancelRide = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    const ride = await prisma.ride.findFirst({
      where: {
        id,
        OR: [{ passengerId: userId }, { driverId: userId }],
      },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found',
      });
    }

    if (!['PENDING', 'ACCEPTED'].includes(ride.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel ride at this stage',
      });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    // Remove from pending rides if there
    await redis.hdel('pending_rides', id);

    // If driver had accepted, mark them available again
    if (ride.driverId) {
      await redis.hset(`driver_location:${ride.driverId}`, 'isAvailable', 'true');
    }

    logger.info(`Ride ${id} cancelled by user ${userId}`);

    res.json({
      success: true,
      data: updatedRide,
    });
  } catch (error) {
    logger.error('Cancel ride error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel ride',
    });
  }
};

// Get ride by ID
export const getRide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const ride = await prisma.ride.findFirst({
      where: {
        id,
        OR: [{ passengerId: userId }, { driverId: userId }],
      },
      include: {
        passenger: { select: { id: true, name: true, phone: true, avatar: true } },
        driver: { select: { id: true, name: true, phone: true, avatar: true, vehicle: true } },
      },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found',
      });
    }

    res.json({
      success: true,
      data: ride,
    });
  } catch (error) {
    logger.error('Get ride error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ride',
    });
  }
};

// Get user's rides
export const getRides = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, limit = 20, offset = 0 } = req.query;

    const where: Prisma.RideWhereInput = {
      OR: [{ passengerId: userId }, { driverId: userId }],
    };

    if (status) {
      where.status = status as string;
    }

    const rides = await prisma.ride.findMany({
      where,
      include: {
        passenger: { select: { id: true, name: true, avatar: true } },
        driver: { select: { id: true, name: true, avatar: true } },
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
    logger.error('Get rides error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rides',
    });
  }
};

// Get active ride for current user
export const getActiveRide = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const ride = await prisma.ride.findFirst({
      where: {
        OR: [{ passengerId: userId }, { driverId: userId }],
        status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
      },
      include: {
        passenger: { select: { id: true, name: true, phone: true, avatar: true } },
        driver: { select: { id: true, name: true, phone: true, avatar: true, vehicle: true } },
      },
    });

    res.json({
      success: true,
      data: ride,
    });
  } catch (error) {
    logger.error('Get active ride error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active ride',
    });
  }
};

// Update driver location
export const updateDriverLocation = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.id;
    const { latitude, longitude } = req.body;

    // Store driver location in Redis with TTL
    await redis.hset(`driver_location:${driverId}`, {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      lastUpdate: Date.now().toString(),
      isAvailable: 'true',
      geohash: encodeGeohash(latitude, longitude),
    });

    // Set expiry for stale location cleanup
    await redis.expire(`driver_location:${driverId}`, 300); // 5 minutes

    res.json({
      success: true,
      message: 'Location updated',
    });
  } catch (error) {
    logger.error('Update driver location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
    });
  }
};

// Rate ride
export const rateRide = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { score, comment } = req.body;

    const ride = await prisma.ride.findFirst({
      where: {
        id,
        OR: [{ passengerId: userId }, { driverId: userId }],
        status: 'COMPLETED',
      },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found or not completed',
      });
    }

    // Check if already rated
    const existingRating = await prisma.rating.findFirst({
      where: { rideId: id },
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: 'Ride already rated',
      });
    }

    // Create rating
    const rating = await prisma.rating.create({
      data: {
        rideId: id,
        fromUserId: userId,
        toUserId: ride.passengerId === userId ? ride.driverId! : ride.passengerId,
        score,
        comment,
      },
    });

    // Update user's average rating
    const avgRating = await prisma.rating.aggregate({
      where: { toUserId: rating.toUserId },
      _avg: { score: true },
    });

    await prisma.user.update({
      where: { id: rating.toUserId },
      data: { rating: avgRating._avg.score || 0 },
    });

    res.json({
      success: true,
      data: rating,
    });
  } catch (error) {
    logger.error('Rate ride error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rate ride',
    });
  }
};
