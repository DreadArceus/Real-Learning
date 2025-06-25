import { authService } from './authService';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StatusData {
  id?: number;
  userId?: string;
  lastWaterIntake: string;
  altitude: number;
  lastUpdated: string;
  createdAt?: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'viewer';
  createdAt: string;
  lastLogin?: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          // Token might be expired or invalid
          authService.logout();
          window.location.reload();
        }
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown API error');
    }
  }

  async getLatestStatus(userId?: string): Promise<StatusData | null> {
    const url = userId ? `/api/status?userId=${userId}` : '/api/status';
    const response = await this.request<StatusData>(url);
    return response.data || null;
  }

  async createStatus(data: Omit<StatusData, 'id' | 'userId' | 'createdAt'>): Promise<StatusData> {
    const response = await this.request<StatusData>('/api/status', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async updateStatus(data: Partial<Pick<StatusData, 'lastWaterIntake' | 'altitude'>>): Promise<StatusData> {
    const response = await this.request<StatusData>('/api/status', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async getStatusHistory(userId?: string, limit = 10): Promise<StatusData[]> {
    const url = userId ? `/api/status/history?userId=${userId}&limit=${limit}` : `/api/status/history?limit=${limit}`;
    const response = await this.request<StatusData[]>(url);
    return response.data || [];
  }

  async deleteAllStatus(): Promise<void> {
    await this.request('/api/status', {
      method: 'DELETE',
    });
  }

  async getAdminUsers(): Promise<User[]> {
    const response = await this.request<User[]>('/api/auth/admins');
    return response.data || [];
  }

  async healthCheck(): Promise<HealthCheckResponse | null> {
    const response = await this.request<HealthCheckResponse>('/health');
    return response.data || null;
  }
}

export const apiService = new ApiService();