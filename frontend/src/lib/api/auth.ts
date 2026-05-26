import { apiClient } from './client';
import type { LoginRequest, LoginResponse } from '@/types/auth';

interface ApiLoginResponse {
  success: boolean;
  data: {
    token: string;
    admin: {
      id: string;
      username: string;
      email: string;
    };
  };
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient<ApiLoginResponse>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return {
      token: response.data.token,
      user: response.data.admin,
    };
  },

  logout: async (): Promise<void> => {
    // Backend doesn't have logout endpoint (stateless JWT)
    // Just clear client-side token
  },
};
