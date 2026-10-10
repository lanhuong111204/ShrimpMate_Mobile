/**
 * ShrimpMate Mobile - API Endpoints Registry
 * Đầy đủ 16 Modules chuẩn theo đặc tả Backend API & RBAC
 */
export const Endpoints = {
  // 1. Health Check
  health: {
    check: '/',
  },

  // 2. Authentication & User Management (/auth)
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refreshToken: '/auth/refresh-token',
    forgotPassword: '/auth/forgot-password',
    resendOtp: '/auth/resend-otp',
    verifyResetOtp: '/auth/verify-reset-otp',
    resetPassword: '/auth/reset-password',
    me: '/auth/me',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    farmerCheck: '/auth/farmer-check',
    adminCheck: '/auth/admin-check',
  },

  // 3. Farm Management (/farms)
  farms: {
    list: '/farms',
    create: '/farms',
    detail: (id: string) => `/farms/${id}`,
    update: (id: string) => `/farms/${id}`,
    delete: (id: string) => `/farms/${id}`,
  },

  // 4. Pond Management (/farms/:farmId/ponds)
  ponds: {
    // Chuẩn theo cấu trúc phân cấp Farm
    listByFarm: (farmId: string) => `/farms/${farmId}/ponds`,
    create: (farmId: string) => `/farms/${farmId}/ponds`,
    detailInFarm: (farmId: string, id: string) => `/farms/${farmId}/ponds/${id}`,
    updateInFarm: (farmId: string, id: string) => `/farms/${farmId}/ponds/${id}`,
    deleteInFarm: (farmId: string, id: string) => `/farms/${farmId}/ponds/${id}`,

    // Giữ tương thích ngược với code cũ
    list: '/ponds',
    detail: (id: string) => `/ponds/${id}`,
    metrics: (id: string) => `/ponds/${id}/metrics`,
    telemetryHistory: (id: string) => `/ponds/${id}/telemetry`,
    devices: (id: string) => `/ponds/${id}/devices`,
    toggleDevice: (pondId: string, deviceId: string) => `/ponds/${pondId}/devices/${deviceId}/toggle`,
  },

  // 5. IoT Devices & Hardware Catalog (/devices)
  devices: {
    list: '/devices',
    claim: '/devices/claim',
    unassign: (id: string) => `/devices/${id}/unassign`,
    detail: (id: string) => `/devices/${id}`,
    update: (id: string) => `/devices/${id}`,
    emergencyStop: (id: string) => `/devices/${id}/emergency-stop`,
    heartbeat: (id: string) => `/devices/${id}/heartbeat`,
  },

  // 6. Crop Seasons & FCR Statistics (/crop-seasons & /ponds/:pondId/crop-seasons)
  cropSeasons: {
    listByPond: (pondId: string) => `/ponds/${pondId}/crop-seasons`,
    create: (pondId: string) => `/ponds/${pondId}/crop-seasons`,
    detail: (id: string) => `/crop-seasons/${id}`,
    statistics: (id: string) => `/crop-seasons/${id}/statistics`,
    update: (id: string) => `/crop-seasons/${id}`,
    delete: (id: string) => `/crop-seasons/${id}`,
  },

  // 7. Feeding Schedules & Records (/feeding-schedules & /ponds/:pondId/feeding-records)
  feedings: {
    schedules: (pondId: string) => `/ponds/${pondId}/feeding-schedules`,
    createSchedule: (pondId: string) => `/ponds/${pondId}/feeding-schedules`,
    updateSchedule: (id: string) => `/feeding-schedules/${id}`,
    deleteSchedule: (id: string) => `/feeding-schedules/${id}`,
    records: (pondId: string) => `/ponds/${pondId}/feeding-records`,
    triggerRecord: (pondId: string) => `/ponds/${pondId}/feeding-records`,
    updateRecordProgress: (id: string) => `/feeding-records/${id}`,
  },

  // 8. Water Telemetry Monitoring (/ponds/:pondId/telemetry)
  telemetry: {
    latest: (pondId: string) => `/ponds/${pondId}/telemetry/latest`,
    history: (pondId: string) => `/ponds/${pondId}/telemetry/history`,
    ingest: (pondId: string) => `/ponds/${pondId}/telemetry`,
  },

  // 9. Camera Computer Vision & Feeding Intensity (FIS) (/camera)
  camera: {
    latestFis: (pondId: string) => `/camera/ponds/${pondId}/latest-fis`,
    fisHistory: (pondId: string) => `/camera/ponds/${pondId}/fis-history`,
    devices: (pondId: string) => `/camera/ponds/${pondId}/devices`,
    analyze: '/camera/analyze',
    ingestMetrics: '/camera/ingest-metrics',
    updateRoi: (deviceId: string) => `/camera/devices/${deviceId}/roi`,
    updateWeights: (pondId: string) => `/camera/ponds/${pondId}/weights`,
  },

  // 10. AI Recommendations (/ponds/:pondId/ai)
  ai: {
    recommendationsLatest: (pondId: string) => `/ponds/${pondId}/ai/recommendations/latest`,
    recommendationsHistory: (pondId: string) => `/ponds/${pondId}/ai/recommendations`,
  },

  // 11. Alerts & Incident Handling (/alerts)
  alerts: {
    summary: (pondId?: string) => pondId ? `/alerts/summary?pondId=${pondId}` : '/alerts/summary',
    list: '/alerts',
    pondAlerts: (pondId: string) => `/ponds/${pondId}/alerts`,
    acknowledge: (id: string) => `/alerts/${id}/acknowledge`,
    resolve: (id: string) => `/alerts/${id}/resolve`,
    // Tương thích ngược
    unreadCount: '/alerts/unread-count',
    markRead: (id: string) => `/alerts/${id}/read`,
    markAllRead: '/alerts/read-all',
  },

  // 12. Safety Rule Engine (/safety-rules)
  safetyRules: {
    list: '/safety-rules',
    detail: (id: string) => `/safety-rules/${id}`,
    evaluate: (pondId: string) => `/ponds/${pondId}/safety-rules/evaluate`,
  },

  // 13. MQTT Protocol & Simulation (/mqtt)
  mqtt: {
    status: '/mqtt/status',
    feederTest: (deviceUid: string) => `/mqtt/devices/${deviceUid}/feeder-test`,
  },

  // 14. User Profile Alias (Tương thích ngược)
  users: {
    profile: '/auth/profile',
    updateProfile: '/auth/profile',
  },
} as const;
