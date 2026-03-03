import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export const getWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    logger.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet',
    });
  }
};

export const topUpWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { amount, paymentMethod } = req.body;

    // In production, integrate with payment gateway (PayFast, Paystack, etc.)
    // For now, we'll simulate the top-up

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount,
        description: `Wallet top-up via ${paymentMethod}`,
        status: 'COMPLETED',
      },
    });

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: { increment: amount },
      },
    });

    res.json({
      success: true,
      data: {
        transaction,
        wallet: updatedWallet,
      },
    });
  } catch (error) {
    logger.error('Top up wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to top up wallet',
    });
  }
};

export const withdrawFromWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { amount, bankAccountId } = req.body;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
      });
    }

    // Create withdrawal transaction
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount,
        description: `Withdrawal to bank account`,
        status: 'PENDING',
      },
    });

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
      },
    });

    res.json({
      success: true,
      data: {
        transaction,
        wallet: updatedWallet,
      },
    });
  } catch (error) {
    logger.error('Withdraw from wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw from wallet',
    });
  }
};

export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { limit = 20, offset = 0, type } = req.query;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }

    const where: Prisma.TransactionWhereInput = {
      walletId: wallet.id,
      ...(type && { type: type as 'CREDIT' | 'DEBIT' }),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.transaction.count({ where });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  } catch (error) {
    logger.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction history',
    });
  }
};

export const getWalletTransactions = async (req: Request, res: Response) => {
  return getTransactionHistory(req, res);
};

export const processPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { rideId, paymentMethod } = req.body;

    const ride = await prisma.ride.findFirst({
      where: {
        id: rideId,
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

    if (ride.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        error: 'Ride already paid',
      });
    }

    // Process payment based on method
    let paymentSuccess = false;

    switch (paymentMethod) {
      case 'WALLET':
        const wallet = await prisma.wallet.findUnique({
          where: { userId },
        });

        if (!wallet || wallet.balance < ride.fare) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient wallet balance',
          });
        }

        // Deduct from wallet
        await prisma.wallet.update({
          where: { userId },
          data: { balance: { decrement: ride.fare } },
        });

        // Create transaction
        await prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'DEBIT',
            amount: ride.fare,
            description: `Payment for ride ${rideId}`,
            rideId,
          },
        });

        paymentSuccess = true;
        break;

      case 'CASH':
        // Cash payments are marked as paid when driver confirms
        paymentSuccess = true;
        break;

      case 'CARD':
      case 'MOBILE_MONEY':
        // In production, integrate with payment gateway
        // For simulation, we'll mark as successful
        paymentSuccess = true;
        break;
    }

    if (paymentSuccess) {
      await prisma.ride.update({
        where: { id: rideId },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });

      // Credit driver's wallet
      if (ride.driverId) {
        const driverWallet = await prisma.wallet.upsert({
          where: { userId: ride.driverId },
          create: { userId: ride.driverId, balance: ride.fare },
          update: { balance: { increment: ride.fare } },
        });

        await prisma.transaction.create({
          data: {
            walletId: driverWallet.id,
            type: 'CREDIT',
            amount: ride.fare,
            description: `Earnings from ride ${rideId}`,
            rideId,
          },
        });
      }
    }

    res.json({
      success: true,
      data: {
        rideId,
        amount: ride.fare,
        paymentMethod,
        status: paymentSuccess ? 'SUCCESS' : 'FAILED',
      },
    });
  } catch (error) {
    logger.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
    });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { paymentId } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: paymentId,
        wallet: { userId },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    logger.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status',
    });
  }
};

export const initiateRefund = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { rideId, reason } = req.body;

    const ride = await prisma.ride.findFirst({
      where: {
        id: rideId,
        passengerId: userId,
        paymentStatus: 'PAID',
      },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found or not eligible for refund',
      });
    }

    // Create refund transaction
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (wallet) {
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          amount: ride.fare,
          description: `Refund for ride ${rideId}: ${reason}`,
          rideId,
        },
      });

      await prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: ride.fare } },
      });
    }

    // Update ride
    await prisma.ride.update({
      where: { id: rideId },
      data: { paymentStatus: 'REFUNDED' },
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    logger.error('Initiate refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
    });
  }
};

export const linkPaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type, provider, token, cardLast4, cardExpiry } = req.body;

    // If setting as default, unset other defaults
    if (req.body.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const method = await prisma.paymentMethod.create({
      data: {
        userId,
        type,
        provider,
        token,
        cardLast4,
        cardExpiry,
        isDefault: req.body.isDefault || false,
      },
    });

    res.status(201).json({
      success: true,
      data: method,
    });
  } catch (error) {
    logger.error('Link payment method error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link payment method',
    });
  }
};

export const unlinkPaymentMethod = async (req: Request, res: Response) => {
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
    logger.error('Unlink payment method error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlink payment method',
    });
  }
};

export const getLinkedPaymentMethods = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const methods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    logger.error('Get linked payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods',
    });
  }
};
