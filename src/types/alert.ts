export type AlertSeverity = 1 | 2 | 3 | 'monitoring' | 'warning' | 'critical' | 'info';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';

export interface AlertSummary {
  total: number;
  open: number;
  acknowledged: number;
  resolved: number;
  bySeverity: {
    critical: number;
    warning: number;
    monitoring: number;
  };
}

export interface AlertItem {
  id: string;
  pondId?: string;
  pondName?: string;
  deviceId?: string;
  deviceUid?: string;
  type?: string;
  metricType?: string;
  title?: string;
  message: string;
  severity: AlertSeverity;
  status?: AlertStatus | string;
  isRead?: boolean;
  timestamp?: string;
  triggeredAt?: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  suggestedAction?: string;
}
