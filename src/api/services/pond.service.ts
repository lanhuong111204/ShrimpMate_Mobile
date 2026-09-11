import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { Pond, PondDevice, PondTelemetryLog } from '@/types/pond';

export const INITIAL_MOCK_PONDS: Pond[] = [
  {
    id: 'pond-1',
    name: 'Ao số 1 (Ao nuôi chính)',
    code: 'A01-VANNA',
    areaM2: 2500,
    depthM: 1.6,
    shrimpCount: 150000,
    shrimpAgeDays: 45,
    species: 'Tôm thẻ chân trắng (Vannamei)',
    status: 'active',
    latestMetrics: [
      {
        type: 'temperature',
        name: 'Nhiệt độ',
        value: 29.2,
        unit: '°C',
        status: 'optimal',
        minThreshold: 26,
        maxThreshold: 32,
        lastUpdated: new Date().toISOString(),
      },
      {
        type: 'do',
        name: 'Oxy hòa tan',
        value: 5.8,
        unit: 'mg/L',
        status: 'optimal',
        minThreshold: 4.0,
        maxThreshold: 8.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        type: 'ph',
        name: 'Độ pH',
        value: 7.8,
        unit: 'pH',
        status: 'optimal',
        minThreshold: 7.5,
        maxThreshold: 8.5,
        lastUpdated: new Date().toISOString(),
      },
      {
        type: 'salinity',
        name: 'Độ mặn',
        value: 18.5,
        unit: 'ppt',
        status: 'optimal',
        minThreshold: 10,
        maxThreshold: 25,
        lastUpdated: new Date().toISOString(),
      },
      {
        type: 'nh3',
        name: 'Khí độc NH3',
        value: 0.05,
        unit: 'mg/L',
        status: 'optimal',
        minThreshold: 0.0,
        maxThreshold: 0.1,
        lastUpdated: new Date().toISOString(),
      },
    ],
    devices: [
      { id: 'dev-1', name: 'Quạt nước 01 (Cánh quạt 4 cánh)', type: 'aerator', status: 'on', autoMode: true, powerWatt: 1500 },
      { id: 'dev-2', name: 'Máy cho ăn tự động 01', type: 'feeder', status: 'off', autoMode: true, powerWatt: 300 },
      { id: 'dev-3', name: 'Bơm cấp nước sạch', type: 'pump', status: 'off', autoMode: false, powerWatt: 2200 },
    ],
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pond-2',
    name: 'Ao số 2 (Ao giống)',
    code: 'A02-NURSERY',
    areaM2: 1200,
    depthM: 1.4,
    shrimpCount: 220000,
    shrimpAgeDays: 15,
    species: 'Tôm thẻ chân trắng (Vannamei)',
    status: 'active',
    latestMetrics: [
      {
        type: 'temperature',
        name: 'Nhiệt độ',
        value: 30.5,
        unit: '°C',
        status: 'optimal',
        minThreshold: 26,
        maxThreshold: 32,
        lastUpdated: new Date().toISOString(),
      },
      {
        type: 'do',
        name: 'Oxy hòa tan',
        value: 3.6,
        unit: 'mg/L',
        status: 'warning',
        minThreshold: 4.0,
        maxThreshold: 8.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        type: 'ph',
        name: 'Độ pH',
        value: 8.6,
        unit: 'pH',
        status: 'warning',
        minThreshold: 7.5,
        maxThreshold: 8.5,
        lastUpdated: new Date().toISOString(),
      },
      {
        type: 'salinity',
        name: 'Độ mặn',
        value: 20.0,
        unit: 'ppt',
        status: 'optimal',
        minThreshold: 10,
        maxThreshold: 25,
        lastUpdated: new Date().toISOString(),
      },
      {
        type: 'nh3',
        name: 'Khí độc NH3',
        value: 0.12,
        unit: 'mg/L',
        status: 'critical',
        minThreshold: 0.0,
        maxThreshold: 0.1,
        lastUpdated: new Date().toISOString(),
      },
    ],
    devices: [
      { id: 'dev-4', name: 'Quạt nước ao 2', type: 'aerator', status: 'on', autoMode: true, powerWatt: 1100 },
      { id: 'dev-5', name: 'Sục khí đáy ao 2', type: 'aerator', status: 'on', autoMode: true, powerWatt: 1500 },
    ],
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

let pondsState = [...INITIAL_MOCK_PONDS];

export const pondService = {
  async getPonds(): Promise<Pond[]> {
    try {
      const response = await apiClient.get<Pond[]>(Endpoints.ponds.list);
      return response.data;
    } catch {
      return pondsState;
    }
  },

  async getPondById(id: string): Promise<Pond | null> {
    try {
      const response = await apiClient.get<Pond>(Endpoints.ponds.detail(id));
      return response.data;
    } catch {
      return pondsState.find((p) => p.id === id) ?? null;
    }
  },

  async toggleDevice(pondId: string, deviceId: string): Promise<PondDevice | null> {
    try {
      const response = await apiClient.post<PondDevice>(Endpoints.ponds.toggleDevice(pondId, deviceId));
      return response.data;
    } catch {
      // Local state update fallback
      const pond = pondsState.find((p) => p.id === pondId);
      if (pond && pond.devices) {
        const device = pond.devices.find((d) => d.id === deviceId);
        if (device) {
          device.status = device.status === 'on' ? 'off' : 'on';
          device.lastToggled = new Date().toISOString();
          return { ...device };
        }
      }
      return null;
    }
  },

  async getTelemetryLogs(pondId: string): Promise<PondTelemetryLog[]> {
    try {
      const response = await apiClient.get<PondTelemetryLog[]>(Endpoints.ponds.telemetryHistory(pondId));
      return response.data;
    } catch {
      // Mock 12 hours telemetry
      const logs: PondTelemetryLog[] = [];
      const now = Date.now();
      for (let i = 12; i >= 0; i--) {
        logs.push({
          id: `log-${i}`,
          pondId,
          timestamp: new Date(now - i * 3600 * 1000).toISOString(),
          metrics: {
            temperature: 28.5 + Math.sin(i / 2) * 1.5,
            do: 5.2 + Math.cos(i / 2) * 1.0,
            ph: 7.9 + Math.sin(i / 3) * 0.3,
            salinity: 18.0 + (i % 2 === 0 ? 0.5 : 0),
            nh3: 0.04 + (i === 0 ? 0.01 : 0),
            orp: 280 + i * 5,
            turbidity: 35 + i * 2,
          },
        });
      }
      return logs;
    }
  },
};
