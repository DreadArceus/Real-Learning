import { authService } from './authService';

export interface ApiResponse<T = any> {
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
      console.error('API request failed:', error);
      throw error instanceof Error ? error : new Error('Unknown API error');
    }
  }

  async getLatestStatus(userId = 'default_user'): Promise<StatusData | null> {
    const response = await this.request<StatusData>(`/api/status?userId=${userId}`);
    return response.data || null;
  }

  async createStatus(data: Omit<StatusData, 'id' | 'userId' | 'createdAt'>, userId = 'default_user'): Promise<StatusData> {
    const response = await this.request<StatusData>(`/api/status?userId=${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async updateStatus(data: Partial<Pick<StatusData, 'lastWaterIntake' | 'altitude'>>, userId = 'default_user'): Promise<StatusData> {
    const response = await this.request<StatusData>(`/api/status?userId=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async getStatusHistory(userId = 'default_user', limit = 10): Promise<StatusData[]> {
    const response = await this.request<StatusData[]>(`/api/status/history?userId=${userId}&limit=${limit}`);
    return response.data || [];
  }

  async deleteAllStatus(userId = 'default_user'): Promise<void> {
    await this.request(`/api/status?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<any> {
    const response = await this.request('/health');
    return response.data;
  }
}

export const apiService = new ApiService();