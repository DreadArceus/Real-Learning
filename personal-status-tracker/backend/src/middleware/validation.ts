import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const validateStatusData = (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  const { lastWaterIntake, altitude } = req.body;

  // Validate lastWaterIntake
  if (lastWaterIntake !== undefined) {
    if (typeof lastWaterIntake !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'lastWaterIntake must be a string'
      });
    }

    // Check if it's a valid ISO date string
    const date = new Date(lastWaterIntake);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'lastWaterIntake must be a valid ISO date string'
      });
    }
  }

  // Validate altitude
  if (altitude !== undefined) {
    if (typeof altitude !== 'number' || !Number.isInteger(altitude)) {
      return res.status(400).json({
        success: false,
        error: 'altitude must be an integer'
      });
    }

    if (altitude < 1 || altitude > 10) {
      return res.status(400).json({
        success: false,
        error: 'altitude must be between 1 and 10'
      });
    }
  }

  next();
};

export const validateCreateStatus = (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  const { lastWaterIntake, altitude } = req.body;

  // Both fields are required for creation
  if (!lastWaterIntake || altitude === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Both lastWaterIntake and altitude are required'
    });
  }

  validateStatusData(req, res, next);
};