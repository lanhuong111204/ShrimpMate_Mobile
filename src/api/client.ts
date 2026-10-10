import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { ApiError, ApiResponse } from '@/types/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  timeout?: number;
  _isRetry?: boolean;
}

type SessionExpiredListener = () => void;

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private sessionExpiredListeners: SessionExpiredListener[] = [];

  constructor(baseUrl: string = AppConfig.apiBaseUrl) {
    this.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  /**
   * Đăng ký lắng nghe sự kiện phiên làm việc hết hạn (Refresh Token không hợp lệ)
   */
  onSessionExpired(listener: SessionExpiredListener): () => void {
    this.sessionExpiredListeners.push(listener);
    return () => {
      this.sessionExpiredListeners = this.sessionExpiredListeners.filter((l) => l !== listener);
    };
  }

  private notifySessionExpired() {
    this.sessionExpiredListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.warn('SessionExpiredListener error:', err);
      }
    });
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await Storage.getItem(AppConfig.storageKeys.authToken);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(
      endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
    );
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  /**
   * Cơ chế Silent Token Refresh sử dụng Promise Mutex để chống spam request
   */
  private async performSilentRefresh(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const storedRefreshToken = await Storage.getItem(AppConfig.storageKeys.refreshToken);
        if (!storedRefreshToken) {
          this.notifySessionExpired();
          return null;
        }

        const refreshUrl = this.buildUrl('/auth/refresh-token');
        const res = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (!res.ok) {
          // Refresh token đã hết hạn hoặc bị thu hồi -> Xóa storage & phát sự kiện
          await Storage.removeItem(AppConfig.storageKeys.authToken);
          await Storage.removeItem(AppConfig.storageKeys.refreshToken);
          await Storage.removeItem(AppConfig.storageKeys.userData);
          this.notifySessionExpired();
          return null;
        }

        const data = await res.json();
        // Backend NestJS trả về: { accessToken, refreshToken, user }
        const newAccessToken = data.accessToken || data.data?.accessToken;
        const newRefreshToken = data.refreshToken || data.data?.refreshToken;
        const user = data.user || data.data?.user;

        if (newAccessToken) {
          await Storage.setItem(AppConfig.storageKeys.authToken, newAccessToken);
          if (newRefreshToken) {
            await Storage.setItem(AppConfig.storageKeys.refreshToken, newRefreshToken);
          }
          if (user) {
            await Storage.setJSON(AppConfig.storageKeys.userData, user);
          }
          return newAccessToken;
        }

        this.notifySessionExpired();
        return null;
      } catch {
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      params,
      skipAuth = false,
      timeout = AppConfig.requestTimeoutMs,
      headers,
      _isRetry = false,
      body,
      ...customConfig
    } = options;

    const authHeaders = skipAuth ? {} : await this.getAuthHeader();
    const url = this.buildUrl(endpoint, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Xử lý linh hoạt Multipart FormData (upload ảnh) vs JSON
    const isFormData =
      body &&
      typeof body === 'object' &&
      ((typeof FormData !== 'undefined' && body instanceof FormData) || '_parts' in (body as any));
    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...authHeaders,
      ...(headers as Record<string, string>),
    };

    if (!isFormData) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...customConfig,
        body,
        signal: controller.signal,
        headers: requestHeaders,
      });

      clearTimeout(timeoutId);

      const isAuthBypassEndpoint =
        endpoint.includes('/auth/login') ||
        endpoint.includes('/auth/register') ||
        endpoint.includes('/auth/refresh-token') ||
        endpoint.includes('/auth/forgot-password') ||
        endpoint.includes('/auth/resend-otp') ||
        endpoint.includes('/auth/verify-reset-otp') ||
        endpoint.includes('/auth/reset-password');

      // Bắt mã 401 Unauthorized và tự động Silent Refresh ngầm
      if (response.status === 401 && !isAuthBypassEndpoint && !_isRetry) {
        const newAccessToken = await this.performSilentRefresh();
        if (newAccessToken) {
          return this.request<T>(endpoint, {
            ...options,
            _isRetry: true,
          });
        }
      }

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        let errorMsg = `Lỗi máy chủ (${response.status})`;
        if (data && typeof data === 'object') {
          if (Array.isArray(data.message)) {
            errorMsg = data.message.join(', ');
          } else if (typeof data.message === 'string') {
            errorMsg = data.message;
          } else if (typeof data.error === 'string') {
            errorMsg = data.error;
          }
        } else if (typeof data === 'string' && data.length > 0) {
          errorMsg = data;
        }

        const error: ApiError = {
          statusCode: response.status,
          message: errorMsg,
          details: typeof data === 'object' ? data : undefined,
        };
        throw error;
      }

      // Chuẩn hóa dữ liệu trả về
      if (data && typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>;
      }

      return {
        success: true,
        data: data as T,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw {
          message: 'Hết thời gian yêu cầu máy chủ (Timeout). Vui lòng kiểm tra kết nối mạng.',
          statusCode: 408,
        } as ApiError;
      }
      if (err?.statusCode) {
        throw err;
      }
      // Lỗi kết nối mạng vật lý (Network connection failure)
      throw {
        message: `Không thể kết nối đến máy chủ Backend (${this.baseUrl}). Vui lòng đảm bảo backend đang hoạt động.`,
        statusCode: 503,
      } as ApiError;
    }
  }

  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Phương thức tải tệp/ảnh Multipart (FormData) chuyên dụng cho Camera FIS và Avatar
   */
  upload<T>(endpoint: string, formData: FormData, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }
}

export const apiClient = new ApiClient();
