import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalDrivers,
      totalRides,
      completedRides,
      pendingRides,
      todayRides,
      todayRevenue,
      totalRevenue,
      activeRides,
      cancelledRides,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { userType: 'DRIVER', isActive: true } }),
      prisma.ride.count(),
      prisma.ride.count({ where: { status: 'COMPLETED' } }),
      prisma.ride.count({ where: { status: 'PENDING' } }),
      prisma.ride.count({ where: { createdAt: { gte: today } } }),
      prisma.ride.aggregate({
        where: { status: 'COMPLETED', completedAt: { gte: today } },
        _sum: { fare: true },
      }),
      prisma.ride.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { fare: true },
      }),
      prisma.ride.count({ where: { status: { in: ['ACCEPTED', 'IN_PROGRESS'] } } }),
      prisma.ride.count({ where: { status: 'CANCELLED' } }),
    ]);

    // Get last 7 days stats
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [rides, revenue] = await Promise.all([
        prisma.ride.count({
          where: { createdAt: { gte: date, lt: nextDate } },
        }),
        prisma.ride.aggregate({
          where: { status: 'COMPLETED', completedAt: { gte: date, lt: nextDate } },
          _sum: { fare: true },
        }),
      ]);

      last7Days.push({
        date: date.toISOString().split('T')[0],
        rides,
        revenue: revenue._sum.fare || 0,
      });
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDrivers,
        totalRides,
        completedRides,
        pendingRides,
        todayRides,
        todayRevenue: todayRevenue._sum.fare || 0,
        totalRevenue: totalRevenue._sum.fare || 0,
        activeRides,
        cancelledRides,
        last7Days,
      },
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard stats',
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search, userType, status } = req.query;

    const where: Prisma.UserWhereInput = {
      ...(userType && { userType: userType as 'PASSENGER' | 'DRIVER' | 'ADMIN' }),
      ...(status === 'active' && { isActive: true }),
      ...(status === 'inactive' && { isActive: false }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          avatar: true,
          userType: true,
          isVerified: true,
          isActive: true,
          rating: true,
          createdAt: true,
          _count: {
            select: {
              ridesAsPassenger: true,
              ridesAsDriver: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        userType: true,
        isVerified: true,
        isActive: true,
        rating: true,
        createdAt: true,
        wallet: true,
        vehicle: true,
        driverStats: true,
        _count: {
          select: {
            ridesAsPassenger: true,
            ridesAsDriver: true,
            favorites: true,
            paymentMethods: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Get user by id error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, isVerified } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(isVerified !== undefined && { isVerified }),
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
    });
  }
};

export const getAllRides = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate, driverId, passengerId } = req.query;

    const where: Prisma.RideWhereInput = {
      ...(status && { status: status as string }),
      ...(driverId && { driverId: driverId as string }),
      ...(passengerId && { passengerId: passengerId as string }),
      ...(startDate && { createdAt: { gte: new Date(startDate as string) } }),
      ...(endDate && { createdAt: { lte: new Date(endDate as string) } }),
    };

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include: {
          passenger: { select: { id: true, name: true, phone: true, avatar: true } },
          driver: { select: { id: true, name: true, phone: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      }),
      prisma.ride.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        rides,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error('Get all rides error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rides',
    });
  }
};

export const getRideById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        passenger: { select: { id: true, name: true, phone: true, avatar: true, email: true } },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            email: true,
            vehicle: true,
          },
        },
        ratings: true,
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
    logger.error('Get ride by id error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ride',
    });
  }
};

export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const rides = await prisma.ride.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: start, lte: end },
      },
      select: {
        fare: true,
        distance: true,
        completedAt: true,
      },
    });

    // Group by day, week, or month
    const grouped: { [key: string]: { revenue: number; rides: number; distance: number } } = {};

    rides.forEach((ride) => {
      let key: string;
      const date = ride.completedAt!;

      switch (groupBy) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, rides: 0, distance: 0 };
      }

      grouped[key].revenue += ride.fare;
      grouped[key].rides += 1;
      grouped[key].distance += ride.distance || 0;
    });

    const report = Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        ...data,
        averageFare: data.revenue / data.rides,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalRevenue = rides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalRides = rides.length;
    const totalDistance = rides.reduce((sum, ride) => sum + (ride.distance || 0), 0);

    res.json({
      success: true,
      data: {
        report,
        summary: {
          totalRevenue,
          totalRides,
          totalDistance,
          averageFare: totalRides > 0 ? totalRevenue / totalRides : 0,
        },
      },
    });
  } catch (error) {
    logger.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue report',
    });
  }
};

export const getDriversReport = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, sortBy = 'rides', sortOrder = 'desc' } = req.query;

    const drivers = await prisma.user.findMany({
      where: { userType: 'DRIVER' },
      select: {
        id: true,
        name: true,
        avatar: true,
        rating: true,
        isVerified: true,
        isActive: true,
        vehicle: true,
        driverStats: true,
        _count: { select: { ridesAsDriver: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Sort by specified field
    drivers.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'rating':
          aVal = a.rating || 0;
          bVal = b.rating || 0;
          break;
        case 'earnings':
          aVal = a.driverStats?.totalEarnings || 0;
          bVal = b.driverStats?.totalEarnings || 0;
          break;
        case 'rides':
        default:
          aVal = a._count.ridesAsDriver;
          bVal = b._count.ridesAsDriver;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Paginate
    const paginatedDrivers = drivers.slice(
      (parseInt(page as string) - 1) * parseInt(limit as string),
      parseInt(page as string) * parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        drivers: paginatedDrivers,
        pagination: {
          total: drivers.length,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(drivers.length / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error('Get drivers report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drivers report',
    });
  }
};

export const getPendingVerifications = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const where: Prisma.DocumentWhereInput = {
      status: 'PENDING',
      ...(type && { type: type as string }),
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error('Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending verifications',
    });
  }
};

export const verifyDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        status,
        verifiedAt: status === 'APPROVED' ? new Date() : null,
      },
    });

    // If all documents are approved, verify the driver
    if (status === 'APPROVED') {
      const allDocs = await prisma.document.findMany({
        where: { userId: document.userId },
      });

      const allApproved = allDocs.every((doc) => doc.status === 'APPROVED');

      if (allApproved) {
        await prisma.user.update({
          where: { id: document.userId },
          data: { isVerified: true },
        });
      }
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logger.error('Verify driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify driver',
    });
  }
};

export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    // In production, these would be stored in database
    const settings = {
      platformFee: 15,
      minFare: 20,
      baseFare: 15,
      perKmRate: 8,
      perMinuteRate: 1.5,
      cancellationFee: 25,
      surgeMultiplier: 1.0,
      maxWaitTime: 5,
      supportEmail: 'support@boober.taxi',
      supportPhone: '+27123456789',
      maintenanceMode: false,
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings',
    });
  }
};

export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const settings = req.body;

    // In production, save to database
    // For now, just return success

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    logger.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
    });
  }
};

export const sendNotification = async (req: Request, res: Response) => {
  try {
    const { userId, title, message, type } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });

    // In production, send push notification here

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
    });
  }
};

export const broadcastNotification = async (req: Request, res: Response) => {
  try {
    const { title, message, type, target } = req.body;

    // Get target users
    const where: Prisma.UserWhereInput = {
      isActive: true,
      ...(target === 'passengers' && { userType: 'PASSENGER' }),
      ...(target === 'drivers' && { userType: 'DRIVER' }),
    };

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    // Create notifications for all users
    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        title,
        message,
        type,
      })),
    });

    res.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
    });
  } catch (error) {
    logger.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast notification',
    });
  }
};
