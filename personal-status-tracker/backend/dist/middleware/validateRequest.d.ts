import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
type ValidationType = 'body' | 'query' | 'params';
export declare const validateRequest: (schema: z.ZodSchema, type?: ValidationType) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validateRequest.d.ts.map