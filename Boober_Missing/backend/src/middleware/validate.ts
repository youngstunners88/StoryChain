import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map((error) => ({
      field: error.type === 'field' ? (error as any).path : undefined,
      message: error.msg,
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages,
    });
  };
};

// Common validation rules
export const commonValidations = {
  email: {
    isEmail: {
      errorMessage: 'Please provide a valid email',
    },
    normalizeEmail: true,
  },
  password: {
    isLength: {
      options: { min: 8 },
      errorMessage: 'Password must be at least 8 characters',
    },
  },
  phone: {
    isMobilePhone: {
      options: ['any', { strictMode: true }],
      errorMessage: 'Please provide a valid phone number',
    },
  },
  latitude: {
    isFloat: {
      options: { min: -90, max: 90 },
      errorMessage: 'Invalid latitude',
    },
  },
  longitude: {
    isFloat: {
      options: { min: -180, max: 180 },
      errorMessage: 'Invalid longitude',
    },
  },
};
