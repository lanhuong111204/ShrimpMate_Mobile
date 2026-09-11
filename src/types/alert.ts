export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertItem {
  id: string;
  pondId?: string;
  pondName?: string;
  metricType?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  isRead: boolean;
  timestamp: string;
  suggestedAction?: string;
}
