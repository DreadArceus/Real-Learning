import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
export declare const errorHandler: (error: Error, req: Request, res: Response<ApiResponse>, next: NextFunction) => Response<ApiResponse<any>, Record<string, any>> | undefined;
export declare const notFoundHandler: (req: Request, res: Response<ApiResponse>) => void;
//# sourceMappingURL=errorHandler.d.ts.map