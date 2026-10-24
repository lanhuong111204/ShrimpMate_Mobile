export type UserRole = 'admin' | 'manager' | 'farmer';

export interface User {
  id: string;
  email: string;
  phoneNumber?: string | null;
  phone?: string;
  fullName: string;
  name?: string;
  role: UserRole | string;
  isActive: boolean;
  avatarUrl?: string;
  managerId?: string | null;
  isFirstLogin?: boolean;
  assignedFarmsCount?: number;
  assignedPondsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface FarmerCheckResponse {
  message: string;
}

export interface ManagerCheckResponse {
  message: string;
}

export interface AdminCheckResponse {
  message: string;
}

export interface FarmerAssignment {
  id: string;
  farmerId: string;
  farmId: string;
  pondId?: string | null;
  assignedAt: string;
  assignedBy?: string;
  farmName?: string;
  pondName?: string;
}

export interface FarmerUserSummary {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  isActive: boolean;
  managerId?: string | null;
  isFirstLogin?: boolean;
  assignments?: FarmerAssignment[];
  createdAt: string;
}

export interface FirstTimePasswordChangeRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface VerifyResetOtpRequest {
  identifier: string;
  otp: string;
}

export interface VerifyResetOtpResponse {
  valid: boolean;
  message: string;
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
