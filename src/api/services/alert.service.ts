import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AlertItem } from '@/types/alert';

export const INITIAL_MOCK_ALERTS: AlertItem[] = [
  {
    id: 'alt-1',
    pondId: 'pond-2',
    pondName: 'Ao số 2 (Ao giống)',
    metricType: 'nh3',
    title: 'Khí độc NH3 vượt ngưỡng cảnh báo!',
    message: 'Nồng độ NH3 đo được 0.12 mg/L (ngưỡng tối đa: 0.10 mg/L). Cần xử lý men vi sinh và thay nước khẩn cấp.',
    severity: 'critical',
    isRead: false,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    suggestedAction: 'Bật sục khí đáy và tạt vi sinh xử lý đáy ao.',
  },
  {
    id: 'alt-2',
    pondId: 'pond-2',
    pondName: 'Ao số 2 (Ao giống)',
    metricType: 'do',
    title: 'Oxy hòa tan giảm thấp',
    message: 'Oxy hòa tan đạt 3.6 mg/L (ngưỡng khuyến nghị >= 4.0 mg/L).',
    severity: 'warning',
    isRead: false,
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    suggestedAction: 'Bật thêm quạt nước tăng cường oxy.',
  },
  {
    id: 'alt-3',
    pondId: 'pond-1',
    pondName: 'Ao số 1 (Ao nuôi chính)',
    metricType: 'device',
    title: 'Lịch cho ăn tự động hoàn tất',
    message: 'Máy cho ăn tự động 01 đã xả 25kg thức ăn số 3 theo đúng lịch trình.',
    severity: 'info',
    isRead: true,
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
];

let alertsState = [...INITIAL_MOCK_ALERTS];

export const alertService = {
  async getAlerts(): Promise<AlertItem[]> {
    try {
      const response = await apiClient.get<AlertItem[]>(Endpoints.alerts.list);
      return response.data;
    } catch {
      return alertsState;
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    try {
      await apiClient.post(Endpoints.alerts.markRead(id));
      return true;
    } catch {
      const alert = alertsState.find((a) => a.id === id);
      if (alert) alert.isRead = true;
      return true;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    try {
      await apiClient.post(Endpoints.alerts.markAllRead);
      return true;
    } catch {
      alertsState = alertsState.map((a) => ({ ...a, isRead: true }));
      return true;
    }
  },
};
