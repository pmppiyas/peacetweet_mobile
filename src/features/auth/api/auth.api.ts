import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { ApiResponse } from '@/types/api.types';
import {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from '@/types/user.types';

export const authApi = {
  register: async (input: RegisterInput): Promise<ApiResponse<AuthResponse>> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.REGISTER,
      input
    );
    return data;
  },

  login: async (input: LoginInput): Promise<ApiResponse<AuthResponse>> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      input
    );
    return data;
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.AUTH.LOGOUT
    );
    return data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.get<ApiResponse<User>>(
      API_ENDPOINTS.AUTH.ME
    );
    return data;
  },
};
