import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import rideRoutes from './routes/ride.routes';
import userRoutes from './routes/user.routes';
import driverRoutes from './routes/driver.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';

// Services
import { initWebSocket } from './services/websocket.service';
import { initMatchingService } from './services/matching.service';

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
const wsService = initWebSocket(httpServer);

// Initialize matching service
const matchingService = initMatchingService();
matchingService.start();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Apply general rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Boober API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// WebSocket stats endpoint
app.get('/api/ws-stats', (req, res) => {
  res.json({
    success: true,
    data: {
      connectedUsers: wsService.getConnectedUsersCount(),
    },
  });
});

// Matching stats endpoint
app.get('/api/matching-stats', async (req, res) => {
  const stats = await matchingService.getStats();
  res.json({
    success: true,
    data: stats,
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app, httpServer };
