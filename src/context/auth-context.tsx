import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/api/services/auth.service';
import {
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
} from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOfflineMode: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  forgotPassword: (identifier: string) => Promise<string>;
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
    async function initAuth() {
      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (identifier: string): Promise<string> => {
    const res = await authService.forgotPassword(identifier);
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
