export const AppConfig = {
  appName: 'ShrimpMate Mobile',
  version: '1.0.0',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.shrimpmate.vn/v1',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || 'wss://api.shrimpmate.vn/ws',
  requestTimeoutMs: 15000,
  storageKeys: {
    authToken: '@shrimpmate_auth_token',
    refreshToken: '@shrimpmate_refresh_token',
    userData: '@shrimpmate_user_data',
    userPreferences: '@shrimpmate_user_preferences',
  },
  // Default ideal aquaculture water metric thresholds (Litopenaeus vannamei - tôm thẻ chân trắng)
  defaultThresholds: {
    temperature: { min: 26.0, max: 32.0, unit: '°C' },
    ph: { min: 7.5, max: 8.5, unit: 'pH' },
    do: { min: 4.0, max: 8.0, unit: 'mg/L' }, // Dissolved Oxygen (Oxy hòa tan)
    salinity: { min: 10.0, max: 25.0, unit: 'ppt' }, // Độ mặn
    nh3: { min: 0.0, max: 0.1, unit: 'mg/L' }, // Khí độc Amoniac
    orp: { min: 200, max: 400, unit: 'mV' }, // Thế oxy hóa khử
  },
} as const;
