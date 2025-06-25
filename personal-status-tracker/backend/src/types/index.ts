export interface StatusData {
  id?: number;
  userId?: string;
  lastWaterIntake: string | null;
  altitude: number | null;
  lastUpdated: string;
  createdAt?: string;
}

export interface CreateStatusRequest {
  lastWaterIntake: string | null;
  altitude: number | null;
}

export interface UpdateStatusRequest {
  lastWaterIntake?: string | null;
  altitude?: number | null;
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
  privacyPolicyAccepted?: boolean;
  privacyPolicyVersion?: string;
  privacyPolicyAcceptedDate?: string;
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