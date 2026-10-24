import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { AlertItem, AlertStatus, AlertSummary } from '@/types/alert';

export const INITIAL_MOCK_ALERTS: AlertItem[] = [
  {
    id: 'alt-1',
    pondId: 'pond-2',
    pondName: 'Ao số 2 (Ao giống)',
    type: 'WATER_QUALITY_CRITICAL',
    metricType: 'nh3',
    title: 'Khí độc NH3 vượt ngưỡng nguy cấp!',
    message: 'Nồng độ NH3 đo được 0.12 mg/L (ngưỡng an toàn < 0.05 mg/L, nguy hiểm > 0.10 mg/L). Cần xử lý men vi sinh và thay nước khẩn cấp.',
    severity: 3,
    status: 'open',
    isRead: false,
    triggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    suggestedAction: 'Bật sục khí đáy và tạt vi sinh xử lý đáy ao.',
  },
  {
    id: 'alt-2',
    pondId: 'pond-2',
    pondName: 'Ao số 2 (Ao giống)',
    type: 'DO_LOW_WARNING',
    metricType: 'do',
    title: 'Oxy hòa tan giảm vào ngưỡng cần chú ý',
    message: 'Oxy hòa tan đạt 4.1 mg/L (ngưỡng an toàn >= 5.0 mg/L, nguy cấp < 3.5 mg/L).',
    severity: 2,
    status: 'acknowledged',
    isRead: false,
    acknowledgedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    triggeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    suggestedAction: 'Bật thêm quạt nước tăng cường oxy.',
  },
  {
    id: 'alt-3',
    pondId: 'pond-1',
    pondName: 'Ao số 1 (Ao nuôi chính)',
    type: 'CAMERA_FEEDING_ANOMALY',
    metricType: 'device',
    title: 'Đã hoàn tất kiểm tra sàng ăn cữ sáng',
    message: 'Camera AI ghi nhận FIS = 0.82 (Ăn mạnh - Mức 3), thức ăn còn dư 6%.',
    severity: 1,
    status: 'resolved',
    isRead: true,
    resolvedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    triggeredAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
];

let alertsState: AlertItem[] = [...INITIAL_MOCK_ALERTS];

function computeSummaryFromList(items: AlertItem[]): AlertSummary {
  const open = items.filter((a) => !a.status || a.status === 'open').length;
  const acknowledged = items.filter((a) => a.status === 'acknowledged').length;
  const resolved = items.filter((a) => a.status === 'resolved').length;
  const critical = items.filter(
    (a) => (a.severity === 3 || a.severity === 'critical') && a.status !== 'resolved'
  ).length;
  const warning = items.filter(
    (a) => (a.severity === 2 || a.severity === 'warning') && a.status !== 'resolved'
  ).length;
  const monitoring = items.filter(
    (a) => (a.severity === 1 || a.severity === 'monitoring' || a.severity === 'info') && a.status !== 'resolved'
  ).length;

  return {
    total: items.length,
    open,
    acknowledged,
    resolved,
    bySeverity: {
      critical,
      warning,
      monitoring,
    },
  };
}

export const alertService = {
  /**
   * 13.1. Tổng kết số lượng cảnh báo (GET /alerts/summary?pondId=...)
   */
  async getAlertSummary(pondId?: string): Promise<AlertSummary> {
    try {
      const response = await apiClient.get<AlertSummary>(Endpoints.alerts.summary(pondId));
      if (response.data && typeof response.data.total === 'number') {
        return response.data;
      }
      return computeSummaryFromList(alertsState);
    } catch {
      const cached = await Storage.getJSON<AlertItem[]>(
        pondId ? `${AppConfig.storageKeys.cachedAlerts}_${pondId}` : AppConfig.storageKeys.cachedAlerts
      );
      return computeSummaryFromList(cached || alertsState);
    }
  },

  /**
   * 13.2. Lấy danh sách toàn bộ cảnh báo (GET /alerts)
   */
  async getAlerts(params?: {
    status?: AlertStatus;
    severity?: 1 | 2 | 3;
    pondId?: string;
    page?: number;
    limit?: number;
  }): Promise<AlertItem[]> {
    try {
      const response = await apiClient.get<any>(Endpoints.alerts.list, { params });
      const raw = response.data;
      const list: AlertItem[] = Array.isArray(raw)
        ? raw
        : raw && Array.isArray(raw.data)
        ? raw.data
        : [];
      if (list.length > 0) {
        alertsState = list;
        await Storage.setJSON(AppConfig.storageKeys.cachedAlerts, list);
      }
      return list;
    } catch {
      const cached = await Storage.getJSON<AlertItem[]>(AppConfig.storageKeys.cachedAlerts);
      return cached || alertsState;
    }
  },

  /**
   * 13.3. Lấy danh sách cảnh báo theo từng ao cụ thể (GET /ponds/:pondId/alerts)
   */
  async getPondAlerts(pondId: string, status?: AlertStatus): Promise<AlertItem[]> {
    try {
      const response = await apiClient.get<any>(Endpoints.alerts.pondAlerts(pondId), {
        params: status ? { status } : undefined,
      });
      const raw = response.data;
      const list: AlertItem[] = Array.isArray(raw)
        ? raw
        : raw && Array.isArray(raw.data)
        ? raw.data
        : [];
      await Storage.setJSON(`${AppConfig.storageKeys.cachedAlerts}_${pondId}`, list);
      return list;
    } catch {
      const cached = await Storage.getJSON<AlertItem[]>(`${AppConfig.storageKeys.cachedAlerts}_${pondId}`);
      if (cached) return cached;
      return alertsState;
    }
  },

  /**
   * 13.4. Xác nhận đã tiếp nhận sự cố ngoài bờ ao (PATCH /alerts/:id/acknowledge)
   */
  async acknowledgeAlert(id: string): Promise<AlertItem | null> {
    const now = new Date().toISOString();
    try {
      const response = await apiClient.patch<AlertItem>(Endpoints.alerts.acknowledge(id));
      alertsState = alertsState.map((a) =>
        a.id === id ? { ...a, ...(response.data || {}), status: 'acknowledged', acknowledgedAt: now } : a
      );
      return response.data;
    } catch {
      // Fallback cập nhật trạng thái cục bộ khi mất sóng bờ ao
      let updated: AlertItem | null = null;
      alertsState = alertsState.map((a) => {
        if (a.id === id) {
          updated = { ...a, status: 'acknowledged', acknowledgedAt: now, isRead: true };
          return updated;
        }
        return a;
      });
      return updated;
    }
  },

  /**
   * 13.5. Xác nhận đã khắc phục sự cố xong tại bờ ao (PATCH /alerts/:id/resolve)
   */
  async resolveAlert(id: string): Promise<AlertItem | null> {
    const now = new Date().toISOString();
    try {
      const response = await apiClient.patch<AlertItem>(Endpoints.alerts.resolve(id));
      alertsState = alertsState.map((a) =>
        a.id === id ? { ...a, ...(response.data || {}), status: 'resolved', resolvedAt: now } : a
      );
      return response.data;
    } catch {
      let updated: AlertItem | null = null;
      alertsState = alertsState.map((a) => {
        if (a.id === id) {
          updated = { ...a, status: 'resolved', resolvedAt: now, isRead: true };
          return updated;
        }
        return a;
      });
      return updated;
    }
  },

  // Giữ tương thích ngược
  async markAsRead(id: string): Promise<boolean> {
    await this.acknowledgeAlert(id);
    return true;
  },

  async markAllAsRead(): Promise<boolean> {
    alertsState = alertsState.map((a) => ({ ...a, isRead: true, status: 'acknowledged' }));
    return true;
  },
};
