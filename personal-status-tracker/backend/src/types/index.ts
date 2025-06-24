export interface StatusData {
  id?: number;
  userId?: string;
  lastWaterIntake: string;
  altitude: number;
  lastUpdated: string;
  createdAt?: string;
}

export interface CreateStatusRequest {
  lastWaterIntake: string;
  altitude: number;
}

export interface UpdateStatusRequest {
  lastWaterIntake?: string;
  altitude?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface User {
  id?: number;
  username: string;
  password: string;
  role: 'admin' | 'viewer';
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthTokenPayload {
  userId: number;
  username: string;
  role: 'admin' | 'viewer';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}