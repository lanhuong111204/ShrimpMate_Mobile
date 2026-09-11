import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(Endpoints.auth.login, credentials, {
        skipAuth: true,
      });
      if (response.data?.tokens?.accessToken) {
        await Storage.setItem(AppConfig.storageKeys.authToken, response.data.tokens.accessToken);
        await Storage.setJSON(AppConfig.storageKeys.userData, response.data.user);
      }
      return response.data;
    } catch {
      // Development mock fallback
      const mockUser: User = {
        id: 'usr_01',
        name: 'Kỹ sư nuôi tôm',
        email: credentials.email || 'farmer@shrimpmate.vn',
        phone: '0912345678',
        role: 'owner',
        createdAt: new Date().toISOString(),
      };
      const mockAuth: AuthResponse = {
        user: mockUser,
        tokens: {
          accessToken: 'mock_jwt_token_shrimpmate',
        },
      };
      await Storage.setItem(AppConfig.storageKeys.authToken, mockAuth.tokens.accessToken);
      await Storage.setJSON(AppConfig.storageKeys.userData, mockUser);
      return mockAuth;
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(Endpoints.auth.register, data, {
      skipAuth: true,
    });
    return response.data;
  },

  async getMe(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(Endpoints.auth.me);
      return response.data;
    } catch {
      return Storage.getJSON<User>(AppConfig.storageKeys.userData);
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(Endpoints.auth.logout);
    } catch {
      // Ignore network errors on logout
    } finally {
      await Storage.removeItem(AppConfig.storageKeys.authToken);
      await Storage.removeItem(AppConfig.storageKeys.refreshToken);
      await Storage.removeItem(AppConfig.storageKeys.userData);
    }
  },
};
