import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../errors/AppError';

type ValidationType = 'body' | 'query' | 'params';

export const validateRequest = (
  schema: z.ZodSchema,
  type: ValidationType = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[type];
      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated data
      req[type] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        
        return next(new ValidationError(errorMessage));
      }
      
      next(error);
    }
  };
};