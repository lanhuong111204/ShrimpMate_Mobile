export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'owner' | 'technician' | 'worker';
  avatarUrl?: string;
  createdAt: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
