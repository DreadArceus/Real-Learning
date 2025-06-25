import { User } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      rateInfo?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };
    }
  }
}

export {};