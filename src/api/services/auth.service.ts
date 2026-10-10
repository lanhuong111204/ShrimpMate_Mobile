import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import {
  AuthResponse,
  ChangePasswordRequest,
  FarmerCheckResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
  VerifyResetOtpRequest,
  VerifyResetOtpResponse,
} from '@/types/auth';

export const authService = {
  /**
   * Xác thực tài khoản có quyền Người nuôi (Farmer) hay không
   * Trả về 200 OK nếu là Farmer, 403 Forbidden nếu là Admin
   */
  async checkFarmerRole(): Promise<FarmerCheckResponse> {
    const response = await apiClient.get<FarmerCheckResponse>(Endpoints.auth.farmerCheck);
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const payload: UpdateProfileRequest = {};
    if (data.fullName !== undefined && data.fullName.trim() !== '') {
      payload.fullName = data.fullName.trim();
    }
    if (data.phoneNumber !== undefined && data.phoneNumber.trim() !== '') {
      payload.phoneNumber = data.phoneNumber.trim();
    }
    const response = await apiClient.patch<User>(Endpoints.auth.profile, payload);
    const updatedUser = response.data;
    if (updatedUser) {
      if (!updatedUser.name && updatedUser.fullName) updatedUser.name = updatedUser.fullName;
      if (!updatedUser.phone && updatedUser.phoneNumber) updatedUser.phone = updatedUser.phoneNumber;
      await Storage.setJSON(AppConfig.storageKeys.userData, updatedUser);
    }
    return updatedUser;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.patch<{ message: string }>(
      Endpoints.auth.changePassword,
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }
    );
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const payload = {
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phoneNumber: (data.phoneNumber || data.phone || '').trim(),
      password: data.password,
    };

    const response = await apiClient.post<AuthResponse>(Endpoints.auth.register, payload, {
      skipAuth: true,
    });

    const resData = response.data;
    if (resData?.accessToken) {
      await Storage.setItem(AppConfig.storageKeys.authToken, resData.accessToken);
      if (resData.refreshToken) {
        await Storage.setItem(AppConfig.storageKeys.refreshToken, resData.refreshToken);
      }
      if (resData.user) {
        if (!resData.user.name && resData.user.fullName) resData.user.name = resData.user.fullName;
        if (!resData.user.phone && resData.user.phoneNumber) resData.user.phone = resData.user.phoneNumber;
        await Storage.setJSON(AppConfig.storageKeys.userData, resData.user);
      }
    }
    return resData;
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const payload = {
      identifier: (credentials.identifier || credentials.email || credentials.phone || '').trim(),
      password: credentials.password,
    };

    const response = await apiClient.post<AuthResponse>(Endpoints.auth.login, payload, {
      skipAuth: true,
    });

    const data = response.data;
    if (data?.accessToken) {
      await Storage.setItem(AppConfig.storageKeys.authToken, data.accessToken);
      if (data.refreshToken) {
        await Storage.setItem(AppConfig.storageKeys.refreshToken, data.refreshToken);
      }
      if (data.user) {
        if (!data.user.name && data.user.fullName) data.user.name = data.user.fullName;
        if (!data.user.phone && data.user.phoneNumber) data.user.phone = data.user.phoneNumber;
        await Storage.setJSON(AppConfig.storageKeys.userData, data.user);
      }
    }
    return data;
  },

  async forgotPassword(identifier: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      Endpoints.auth.forgotPassword,
      { identifier: identifier.trim() },
      { skipAuth: true }
    );
    return response.data;
  },

  async resendOtp(identifier: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      Endpoints.auth.resendOtp,
      { identifier: identifier.trim() },
      { skipAuth: true }
    );
    return response.data;
  },

  async verifyResetOtp(data: VerifyResetOtpRequest): Promise<VerifyResetOtpResponse> {
    const response = await apiClient.post<VerifyResetOtpResponse>(
      Endpoints.auth.verifyResetOtp,
      {
        identifier: data.identifier.trim(),
        otp: data.otp.trim(),
      },
      { skipAuth: true }
    );
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      Endpoints.auth.resetPassword,
      {
        identifier: data.identifier.trim(),
        otp: data.otp.trim(),
        newPassword: data.newPassword,
      },
      { skipAuth: true }
    );
    return response.data;
  },

  async loginOffline(): Promise<AuthResponse> {
    const offlineUser: User = {
      id: 'usr_offline',
      email: 'offline@shrimpmate.local',
      phoneNumber: 'Ngoại tuyến',
      phone: 'Ngoại tuyến',
      fullName: 'Bà Con Đầm Tôm (Bờ Ao Ngoại Tuyến)',
      name: 'Bà Con Đầm Tôm (Bờ Ao Ngoại Tuyến)',
      role: 'farmer',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const offlineAuth: AuthResponse = {
      accessToken: 'offline_session_shrimpmate',
      refreshToken: 'offline_refresh_shrimpmate',
      user: offlineUser,
    };
    await Storage.setItem(AppConfig.storageKeys.authToken, offlineAuth.accessToken);
    await Storage.setJSON(AppConfig.storageKeys.userData, offlineUser);
    return offlineAuth;
  },

  async getMe(): Promise<User | null> {
    try {
      const response = await apiClient.get<User>(Endpoints.auth.me);
      if (response.data) {
        if (!response.data.name && response.data.fullName) response.data.name = response.data.fullName;
        if (!response.data.phone && response.data.phoneNumber) response.data.phone = response.data.phoneNumber;
        await Storage.setJSON(AppConfig.storageKeys.userData, response.data);
      }
      return response.data;
    } catch {
      return Storage.getJSON<User>(AppConfig.storageKeys.userData);
    }
  },

  async logout(): Promise<void> {
    await Storage.removeItem(AppConfig.storageKeys.authToken);
    await Storage.removeItem(AppConfig.storageKeys.refreshToken);
    await Storage.removeItem(AppConfig.storageKeys.userData);
  },
};
