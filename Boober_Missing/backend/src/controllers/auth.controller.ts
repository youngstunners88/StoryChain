import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { generateOTP, hashOTP, verifyOTP } from '../utils/otp';
import { sendEmail } from '../utils/email';
import { sendSMS } from '../utils/sms';

const prisma = new PrismaClient();

interface RegisterInput {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'PASSENGER' | 'DRIVER';
}

interface LoginInput {
  email: string;
  password: string;
}

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { id: userId, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, password, firstName, lastName, role }: RegisterInput = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('Email already registered');
      }
      throw new ConflictError('Phone number already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        firstName,
        lastName,
        role: role || 'PASSENGER',
      },
    });

    // Create passenger profile if role is PASSENGER
    if (user.role === 'PASSENGER') {
      await prisma.passengerProfile.create({
        data: { userId: user.id },
      });
    }

    // Create driver profile if role is DRIVER
    if (user.role === 'DRIVER') {
      await prisma.driverProfile.create({
        data: { userId: user.id },
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    // Send verification email
    const emailToken = jwt.sign({ id: user.id }, config.jwt.secret, { expiresIn: '24h' });
    await sendEmail({
      to: user.email,
      subject: 'Verify your Boober account',
      template: 'verify-email',
      data: {
        name: user.firstName,
        verificationLink: `${config.frontendUrl}/verify-email?token=${emailToken}`,
      },
    });

    // Send OTP for phone verification
    const otp = generateOTP();
    await sendSMS(phone, `Your Boober verification code is: ${otp}`);

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful. Please verify your email and phone.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: LoginInput = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a more complex setup, you would invalidate the refresh token in Redis
    res.json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const decoded = jwt.verify(refreshToken, config.jwt.secret) as { id: string; type: string };

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const tokens = generateTokens(user.id, user.email, user.role);

    res.json({
      status: 'success',
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: { isEmailVerified: true },
    });

    logger.info(`Email verified for user: ${user.email}`);

    res.json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired verification token'));
  }
};

export const verifyPhone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;

    // In production, verify OTP from Redis or database
    const isValid = await verifyOTP(phone, otp);

    if (!isValid) {
      throw new UnauthorizedError('Invalid OTP');
    }

    const user = await prisma.user.update({
      where: { phone },
      data: { isPhoneVerified: true },
    });

    logger.info(`Phone verified for user: ${user.email}`);

    res.json({
      status: 'success',
      message: 'Phone verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        status: 'success',
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    const resetToken = jwt.sign({ id: user.id }, config.jwt.secret, { expiresIn: '1h' });

    await sendEmail({
      to: user.email,
      subject: 'Reset your Boober password',
      template: 'reset-password',
      data: {
        name: user.firstName,
        resetLink: `${config.frontendUrl}/reset-password?token=${resetToken}`,
      },
    });

    logger.info(`Password reset requested for: ${user.email}`);

    res.json({
      status: 'success',
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };

    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash },
    });

    logger.info(`Password reset for user: ${decoded.id}`);

    res.json({
      status: 'success',
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired reset token'));
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        profileImage: true,
        createdAt: true,
        passengerProfile: true,
        driverProfile: {
          include: {
            vehicle: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    logger.info(`Password updated for user: ${user.email}`);

    res.json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  verifyPhone,
  requestPasswordReset,
  resetPassword,
  getCurrentUser,
  updatePassword,
};
