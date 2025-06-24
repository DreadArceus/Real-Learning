import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../types';
import { config } from '../config';

export const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(
    JSON.parse(JSON.stringify(payload)), 
    config.JWT_SECRET, 
    { expiresIn: '24h' }
  );
};

export const verifyToken = (token: string): AuthTokenPayload => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token: string): AuthTokenPayload | null => {
  try {
    return jwt.decode(token) as AuthTokenPayload;
  } catch (error) {
    return null;
  }
};