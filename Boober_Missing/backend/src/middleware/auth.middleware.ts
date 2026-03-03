import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from './error.middleware';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Get token from header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('You are not logged in');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: string;
    };

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('You are not logged in'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to perform this action')
      );
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string;
        email: string;
        role: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    logger.warn(`Optional auth failed: ${error}`);
    next();
  }
};

export const requireDriver = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await protect(req, res, async () => {
      if (req.user?.role !== 'DRIVER') {
        return next(new ForbiddenError('This action is only available to drivers'));
      }

      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!driverProfile) {
        return next(new ForbiddenError('Driver profile not found'));
      }

      if (!driverProfile.isVerified) {
        return next(new ForbiddenError('Driver account is not verified'));
      }

      (req as any).driverProfile = driverProfile;
      next();
    });
  } catch (error) {
    next(error);
  }
};

export const requirePassenger = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await protect(req, res, async () => {
      if (req.user?.role !== 'PASSENGER') {
        return next(new ForbiddenError('This action is only available to passengers'));
      }

      next();
    });
  } catch (error) {
    next(error);
  }
};

export default protect;
