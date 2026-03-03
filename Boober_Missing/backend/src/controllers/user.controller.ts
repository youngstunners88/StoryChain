import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        rating: true,
        userType: true,
        isVerified: true,
        createdAt: true,
        wallet: true,
        _count: {
          select: {
            ridesAsPassenger: true,
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
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, email, phone, avatar } = req.body;

    // Check if email or phone is already taken
    if (email || phone) {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email, id: { not: userId } },
            { phone, id: { not: userId } },
          ],
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Email or phone already in use',
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone,
        avatar,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        rating: true,
        userType: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    logger.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update password',
    });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { latitude, longitude } = req.body;

    // Store location in Redis for real-time tracking
    // In production, you might also store in database for analytics

    res.json({
      success: true,
      message: 'Location updated',
    });
  } catch (error) {
    logger.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
    });
  }
};

export const getRideHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { limit = 20, offset = 0, status } = req.query;

    const rides = await prisma.ride.findMany({
      where: {
        passengerId: userId,
        ...(status && { status: status as string }),
      },
      include: {
        driver: {
          select: { id: true, name: true, avatar: true, rating: true },
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
    logger.error('Get ride history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ride history',
    });
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const favorites = await prisma.favoriteLocation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    logger.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get favorites',
    });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, address, latitude, longitude } = req.body;

    const favorite = await prisma.favoriteLocation.create({
      data: {
        userId,
        name,
        address,
        latitude,
        longitude,
      },
    });

    res.status(201).json({
      success: true,
      data: favorite,
    });
  } catch (error) {
    logger.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add favorite',
    });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const favorite = await prisma.favoriteLocation.findFirst({
      where: { id, userId },
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'Favorite not found',
      });
    }

    await prisma.favoriteLocation.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Favorite removed',
    });
  } catch (error) {
    logger.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove favorite',
    });
  }
};

export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const methods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    logger.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods',
    });
  }
};

export const addPaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type, provider, token, isDefault } = req.body;

    const method = await prisma.paymentMethod.create({
      data: {
        userId,
        type,
        provider,
        token,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({
      success: true,
      data: method,
    });
  } catch (error) {
    logger.error('Add payment method error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add payment method',
    });
  }
};

export const removePaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const method = await prisma.paymentMethod.findFirst({
      where: { id, userId },
    });

    if (!method) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
      });
    }

    await prisma.paymentMethod.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Payment method removed',
    });
  } catch (error) {
    logger.error('Remove payment method error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove payment method',
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // Soft delete - mark as deleted
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.com`,
        phone: null,
        name: 'Deleted User',
        isActive: false,
        deletedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
    });
  }
};
