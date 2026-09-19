export interface User {
  id: string;
  email: string;
  phoneNumber?: string | null;
  phone?: string;
  fullName: string;
  name?: string;
  role: 'admin' | 'farmer' | string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  identifier: string; // Email hoặc Số điện thoại
  password: string;
  email?: string;
  phone?: string;
}

export interface ForgotPasswordRequest {
  identifier: string;
}

export interface ResetPasswordRequest {
  identifier: string;
  otp: string; // 6 chữ số
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  phone?: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  tokens?: AuthTokens;
}
