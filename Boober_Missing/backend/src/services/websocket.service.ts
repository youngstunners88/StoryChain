import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { redis } from '../lib/redis';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: 'PASSENGER' | 'DRIVER';
}

class WebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token (you'd use your actual JWT verification here)
        // For now, we'll trust the token payload
        const payload = this.verifyToken(token);
        if (!payload) {
          return next(new Error('Invalid token'));
        }

        socket.userId = payload.userId;
        socket.userType = payload.userType;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private verifyToken(token: string): { userId: string; userType: 'PASSENGER' | 'DRIVER' } | null {
    // Simplified - in production, use proper JWT verification
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload;
    } catch {
      return null;
    }
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Socket connected: ${socket.id}, User: ${socket.userId}`);

      // Track user sockets
      if (socket.userId) {
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId)!.add(socket.id);

        // Join user-specific room
        socket.join(`user:${socket.userId}`);
      }

      // Handle location updates from drivers
      socket.on('driver:location', async (data) => {
        try {
          if (socket.userType !== 'DRIVER') {
            socket.emit('error', { message: 'Only drivers can update location' });
            return;
          }

          const { latitude, longitude, heading, speed } = data;

          // Store in Redis for quick access
          await redis.hset(`driver_location:${socket.userId}`, {
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            heading: (heading || 0).toString(),
            speed: (speed || 0).toString(),
            lastUpdate: Date.now().toString(),
          });

          // Broadcast to any passengers watching this driver
          socket.broadcast.emit(`driver:${socket.userId}:location`, {
            latitude,
            longitude,
            heading,
            speed,
            timestamp: Date.now(),
          });
        } catch (error) {
          logger.error('Driver location update error:', error);
        }
      });

      // Handle ride requests from passengers
      socket.on('ride:request', async (data) => {
        try {
          if (socket.userType !== 'PASSENGER') {
            socket.emit('error', { message: 'Only passengers can request rides' });
            return;
          }

          // Broadcast ride request to nearby drivers
          // In production, you'd query Redis for nearby drivers and emit to them
          this.io.emit('ride:new', {
            rideId: data.rideId,
            pickup: data.pickup,
            dropoff: data.dropoff,
            fare: data.fare,
            passengerId: socket.userId,
          });
        } catch (error) {
          logger.error('Ride request error:', error);
        }
      });

      // Handle ride acceptance by driver
      socket.on('ride:accept', async (data) => {
        try {
          const { rideId, passengerId } = data;

          // Notify passenger
          this.io.to(`user:${passengerId}`).emit('ride:accepted', {
            rideId,
            driverId: socket.userId,
          });
        } catch (error) {
          logger.error('Ride acceptance error:', error);
        }
      });

      // Handle ride status updates
      socket.on('ride:status', async (data) => {
        try {
          const { rideId, status, passengerId, driverId } = data;

          // Notify both parties
          if (passengerId) {
            this.io.to(`user:${passengerId}`).emit('ride:status', { rideId, status });
          }
          if (driverId) {
            this.io.to(`user:${driverId}`).emit('ride:status', { rideId, status });
          }
        } catch (error) {
          logger.error('Ride status update error:', error);
        }
      });

      // Handle chat messages
      socket.on('chat:message', async (data) => {
        try {
          const { rideId, message, recipientId } = data;

          // Save message to database
          const chatMessage = await prisma.chatMessage.create({
            data: {
              rideId,
              senderId: socket.userId!,
              message,
            },
          });

          // Send to recipient
          this.io.to(`user:${recipientId}`).emit('chat:message', {
            id: chatMessage.id,
            rideId,
            senderId: socket.userId,
            message,
            timestamp: chatMessage.createdAt,
          });
        } catch (error) {
          logger.error('Chat message error:', error);
        }
      });

      // Handle emergency alerts
      socket.on('emergency:alert', async (data) => {
        try {
          const { rideId, latitude, longitude, type } = data;

          // Log emergency
          logger.error(`Emergency alert from user ${socket.userId} on ride ${rideId}`);

          // Notify emergency contacts
          const ride = await prisma.ride.findUnique({
            where: { id: rideId },
            include: { passenger: true, driver: true },
          });

          if (ride) {
            // Notify the other party in the ride
            const otherUserId = socket.userId === ride.passengerId ? ride.driverId : ride.passengerId;
            if (otherUserId) {
              this.io.to(`user:${otherUserId}`).emit('emergency:alert', {
                rideId,
                userId: socket.userId,
                latitude,
                longitude,
                type,
              });
            }
          }
        } catch (error) {
          logger.error('Emergency alert error:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);

        if (socket.userId) {
          const userSocketSet = this.userSockets.get(socket.userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });
    });
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Emit to all connected clients
  broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

let websocketService: WebSocketService | null = null;

export const initWebSocket = (httpServer: HttpServer): WebSocketService => {
  if (!websocketService) {
    websocketService = new WebSocketService(httpServer);
  }
  return websocketService;
};

export const getWebSocketService = (): WebSocketService | null => websocketService;
