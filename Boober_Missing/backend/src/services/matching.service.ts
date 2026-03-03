import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { getWebSocketService } from './websocket.service';

interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  vehicleType: string;
  rating: number;
  lastUpdate: number;
}

interface RideRequest {
  rideId: string;
  passengerId: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  fare: number;
  passengerCount: number;
  createdAt: number;
}

// Calculate distance between two points
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
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

// Geohash helpers for proximity search
const geohashChars = '0123456789bcdefghjkmnpqrstuvwxyz';

const getGeohashNeighbors = (geohash: string): string[] => {
  const neighbors: string[] = [];
  const lastChar = geohash.slice(-1);
  const prefix = geohash.slice(0, -1);
  const index = geohashChars.indexOf(lastChar);

  // Simplified neighbor calculation
  // In production, use proper geohash neighbor algorithm
  const offsets = [-1, 0, 1];
  for (const offset of offsets) {
    const newIndex = (index + offset + geohashChars.length) % geohashChars.length;
    neighbors.push(prefix + geohashChars[newIndex]);
  }

  return neighbors;
};

class MatchingService {
  private matchingInterval: NodeJS.Timeout | null = null;
  private readonly MATCH_RADIUS_KM = 5;
  private readonly DRIVER_TIMEOUT_MS = 30000; // 30 seconds for driver to accept
  private readonly RIDE_TIMEOUT_MS = 300000; // 5 minutes for ride to be matched

  start() {
    // Run matching algorithm every 5 seconds
    this.matchingInterval = setInterval(() => {
      this.processPendingRides();
    }, 5000);

    logger.info('Matching service started');
  }

  stop() {
    if (this.matchingInterval) {
      clearInterval(this.matchingInterval);
      this.matchingInterval = null;
    }
    logger.info('Matching service stopped');
  }

  private async processPendingRides() {
    try {
      // Get all pending rides
      const pendingRides = await redis.hgetall('pending_rides');
      if (!pendingRides) return;

      for (const [rideId, rideDataStr] of Object.entries(pendingRides)) {
        const rideData: RideRequest = JSON.parse(rideDataStr);

        // Check if ride has timed out
        if (Date.now() - rideData.createdAt > this.RIDE_TIMEOUT_MS) {
          await this.handleRideTimeout(rideId);
          continue;
        }

        // Find nearby drivers
        const nearbyDrivers = await this.findNearbyDrivers(
          rideData.pickupLat,
          rideData.pickupLng,
          this.MATCH_RADIUS_KM
        );

        if (nearbyDrivers.length > 0) {
          // Notify drivers about the ride
          await this.notifyDrivers(rideId, rideData, nearbyDrivers);
        }
      }
    } catch (error) {
      logger.error('Error processing pending rides:', error);
    }
  }

  private async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<DriverLocation[]> {
    try {
      const driverKeys = await redis.keys('driver_location:*');
      const nearbyDrivers: DriverLocation[] = [];

      for (const key of driverKeys) {
        const driverData = await redis.hgetall(key);
        if (!driverData || driverData.isAvailable !== 'true') continue;

        const driverLat = parseFloat(driverData.latitude);
        const driverLng = parseFloat(driverData.longitude);
        const distance = calculateDistance(latitude, longitude, driverLat, driverLng);

        if (distance <= radiusKm) {
          // Check if driver has been recently active
          const lastUpdate = parseInt(driverData.lastUpdate);
          if (Date.now() - lastUpdate < 300000) { // 5 minutes
            nearbyDrivers.push({
              driverId: key.replace('driver_location:', ''),
              latitude: driverLat,
              longitude: driverLng,
              isAvailable: true,
              vehicleType: driverData.vehicleType || 'SEDAN',
              rating: parseFloat(driverData.rating) || 4.5,
              lastUpdate,
            });
          }
        }
      }

      // Sort by distance (closest first)
      nearbyDrivers.sort((a, b) => {
        const distA = calculateDistance(latitude, longitude, a.latitude, a.longitude);
        const distB = calculateDistance(latitude, longitude, b.latitude, b.longitude);
        return distA - distB;
      });

      return nearbyDrivers;
    } catch (error) {
      logger.error('Error finding nearby drivers:', error);
      return [];
    }
  }

  private async notifyDrivers(
    rideId: string,
    rideData: RideRequest,
    drivers: DriverLocation[]
  ) {
    const ws = getWebSocketService();
    if (!ws) return;

    // Notify top 5 closest drivers
    const topDrivers = drivers.slice(0, 5);

    for (const driver of topDrivers) {
      if (ws.isUserOnline(driver.driverId)) {
        const distance = calculateDistance(
          rideData.pickupLat,
          rideData.pickupLng,
          driver.latitude,
          driver.longitude
        );

        ws.emitToUser(driver.driverId, 'ride:offer', {
          rideId,
          pickup: {
            latitude: rideData.pickupLat,
            longitude: rideData.pickupLng,
            address: rideData.pickupAddress,
          },
          dropoff: {
            latitude: rideData.dropoffLat,
            longitude: rideData.dropoffLng,
            address: rideData.dropoffAddress,
          },
          fare: rideData.fare,
          passengerCount: rideData.passengerCount,
          distance: Math.round(distance * 100) / 100,
          expiresIn: this.DRIVER_TIMEOUT_MS / 1000,
        });
      }
    }
  }

  private async handleRideTimeout(rideId: string) {
    try {
      // Remove from pending rides
      await redis.hdel('pending_rides', rideId);

      // Update ride status
      await prisma.ride.update({
        where: { id: rideId },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'No drivers available',
        },
      });

      // Notify passenger
      const ride = await prisma.ride.findUnique({
        where: { id: rideId },
      });

      if (ride) {
        const ws = getWebSocketService();
        if (ws && ws.isUserOnline(ride.passengerId)) {
          ws.emitToUser(ride.passengerId, 'ride:timeout', {
            rideId,
            message: 'No drivers available. Please try again.',
          });
        }
      }

      logger.info(`Ride ${rideId} timed out`);
    } catch (error) {
      logger.error('Error handling ride timeout:', error);
    }
  }

  // Manually trigger matching for a specific ride
  async matchRide(rideId: string) {
    const rideDataStr = await redis.hget('pending_rides', rideId);
    if (!rideDataStr) {
      logger.warn(`Ride ${rideId} not found in pending rides`);
      return false;
    }

    const rideData: RideRequest = JSON.parse(rideDataStr);
    const nearbyDrivers = await this.findNearbyDrivers(
      rideData.pickupLat,
      rideData.pickupLng,
      this.MATCH_RADIUS_KM
    );

    if (nearbyDrivers.length > 0) {
      await this.notifyDrivers(rideId, rideData, nearbyDrivers);
      return true;
    }

    return false;
  }

  // Get matching statistics
  async getStats() {
    const pendingRides = await redis.hlen('pending_rides');
    const driverKeys = await redis.keys('driver_location:*');
    let availableDrivers = 0;

    for (const key of driverKeys) {
      const isAvailable = await redis.hget(key, 'isAvailable');
      if (isAvailable === 'true') availableDrivers++;
    }

    return {
      pendingRides,
      totalDrivers: driverKeys.length,
      availableDrivers,
    };
  }
}

let matchingService: MatchingService | null = null;

export const initMatchingService = (): MatchingService => {
  if (!matchingService) {
    matchingService = new MatchingService();
  }
  return matchingService;
};

export const getMatchingService = (): MatchingService | null => matchingService;
