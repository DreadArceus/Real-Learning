import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
export declare const validateStatusData: (req: Request, res: Response<ApiResponse>, next: NextFunction) => Response<ApiResponse<any>, Record<string, any>> | undefined;
export declare const validateCreateStatus: (req: Request, res: Response<ApiResponse>, next: NextFunction) => Response<ApiResponse<any>, Record<string, any>> | undefined;
//# sourceMappingURL=validation.d.ts.map