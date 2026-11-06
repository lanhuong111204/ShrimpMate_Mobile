import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { AlertItem, AlertStatus, AlertSummary } from '@/types/alert';

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
      return computeSummaryFromList([]);
    } catch {
      const cached = await Storage.getJSON<AlertItem[]>(
        pondId ? `${AppConfig.storageKeys.cachedAlerts}_${pondId}` : AppConfig.storageKeys.cachedAlerts
      );
      return computeSummaryFromList(cached || []);
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
        await Storage.setJSON(AppConfig.storageKeys.cachedAlerts, list);
      }
      return list;
    } catch {
      const cached = await Storage.getJSON<AlertItem[]>(AppConfig.storageKeys.cachedAlerts);
      return cached || [];
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
      return cached || [];
    }
  },

  /**
   * 13.4. Xác nhận đã tiếp nhận sự cố ngoài bờ ao (PATCH /alerts/:id/acknowledge)
   */
  async acknowledgeAlert(id: string): Promise<AlertItem | null> {
    try {
      const response = await apiClient.patch<AlertItem>(Endpoints.alerts.acknowledge(id));
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * 13.5. Xác nhận đã khắc phục sự cố xong tại bờ ao (PATCH /alerts/:id/resolve)
   */
  async resolveAlert(id: string): Promise<AlertItem | null> {
    try {
      const response = await apiClient.patch<AlertItem>(Endpoints.alerts.resolve(id));
      return response.data;
    } catch {
      return null;
    }
  },

  // Giữ tương thích ngược
  async markAsRead(id: string): Promise<boolean> {
    await this.acknowledgeAlert(id);
    return true;
  },

  async markAllAsRead(): Promise<boolean> {
    return true;
  },
};
