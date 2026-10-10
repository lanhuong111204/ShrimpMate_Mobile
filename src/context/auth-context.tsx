import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { authService } from '@/api/services/auth.service';
import {
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
  VerifyResetOtpRequest,
  VerifyResetOtpResponse,
} from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOfflineMode: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  forgotPassword: (identifier: string) => Promise<string>;
  verifyResetOtp: (data: VerifyResetOtpRequest) => Promise<VerifyResetOtpResponse>;
  resendOtp: (identifier: string) => Promise<string>;
  resetPassword: (data: ResetPasswordRequest) => Promise<string>;
  changePassword: (data: ChangePasswordRequest) => Promise<string>;
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  refreshUserProfile: () => Promise<User | null>;
  loginOffline: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Đăng ký lắng nghe sự kiện hết hạn phiên đăng nhập từ ApiClient (401 refresh failed)
    const unsubscribeSession = apiClient.onSessionExpired(() => {
      setUser(null);
    });

    async function initAuth() {
      try {
        const currentUser = await authService.getMe();
        if (currentUser) {
          // Cold boot guard: Nếu user là admin thì lập tức hủy phiên
          if (currentUser.role === 'admin') {
            await authService.logout();
            setUser(null);
          } else {
            // Xác thực quyền farmer với backend
            try {
              await authService.checkFarmerRole();
              setUser(currentUser);
            } catch (err: any) {
              if (err?.statusCode === 403 || err?.response?.status === 403) {
                await authService.logout();
                setUser(null);
              } else {
                // Lỗi mạng hoặc offline, tin tưởng dữ liệu farmer đã lưu trong cache
                setUser(currentUser);
              }
            }
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      unsubscribeSession();
    };
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      
      // RBAC Guard: Bắt buộc gọi GET /auth/farmer-check để kiểm tra quyền Người nuôi
      try {
        await authService.checkFarmerRole();
        setUser(response.user);
      } catch (checkErr: any) {
        // Nếu trả về 403 Forbidden (tài khoản Admin)
        await authService.logout();
        setUser(null);
        const forbiddenError = new Error(
          checkErr?.message ||
          'Tài khoản Quản trị viên (Admin) không được phép truy cập ứng dụng di động. Vui lòng sử dụng Web Dashboard.'
        );
        (forbiddenError as any).statusCode = 403;
        (forbiddenError as any).isForbiddenAdmin = true;
        throw forbiddenError;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      // Mặc định tài khoản đăng ký mới là farmer
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (identifier: string): Promise<string> => {
    const res = await authService.forgotPassword(identifier);
    return res.message;
  };

  const verifyResetOtp = async (data: VerifyResetOtpRequest): Promise<VerifyResetOtpResponse> => {
    return await authService.verifyResetOtp(data);
  };

  const resendOtp = async (identifier: string): Promise<string> => {
    const res = await authService.resendOtp(identifier);
    return res.message;
  };

  const resetPassword = async (data: ResetPasswordRequest): Promise<string> => {
    const res = await authService.resetPassword(data);
    return res.message;
  };

  const changePassword = async (data: ChangePasswordRequest): Promise<string> => {
    const res = await authService.changePassword(data);
    return res.message;
  };

  const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
    return updatedUser;
  };

  const refreshUserProfile = async (): Promise<User | null> => {
    try {
      const updatedUser = await authService.getMe();
      if (updatedUser) {
        setUser(updatedUser);
      }
      return updatedUser;
    } catch {
      return user;
    }
  };

  const loginOffline = async () => {
    setIsLoading(true);
    try {
      const response = await authService.loginOffline();
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isOfflineMode: user?.role === 'guest_offline',
        login,
        register,
        forgotPassword,
        verifyResetOtp,
        resendOtp,
        resetPassword,
        changePassword,
        updateProfile,
        refreshUserProfile,
        loginOffline,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
