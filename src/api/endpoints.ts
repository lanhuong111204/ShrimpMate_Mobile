export const Endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refreshToken: '/auth/refresh',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  ponds: {
    list: '/ponds',
    detail: (id: string) => `/ponds/${id}`,
    metrics: (id: string) => `/ponds/${id}/metrics`,
    telemetryHistory: (id: string) => `/ponds/${id}/telemetry`,
    devices: (id: string) => `/ponds/${id}/devices`,
    toggleDevice: (pondId: string, deviceId: string) => `/ponds/${pondId}/devices/${deviceId}/toggle`,
  },
  alerts: {
    list: '/alerts',
    unreadCount: '/alerts/unread-count',
    markRead: (id: string) => `/alerts/${id}/read`,
    markAllRead: '/alerts/read-all',
  },
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
  },
} as const;
