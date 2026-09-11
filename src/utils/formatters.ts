import { MetricType, StatusLevel } from '@/types/pond';

/**
 * Format date time to Vietnamese display format (e.g. 14:30 12/09/2026)
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '--';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '--';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

/**
 * Format relative time (e.g., "5 phút trước", "Vừa xong")
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '--';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '--';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return formatDateTime(isoString);
}

/**
 * Friendly metric name in Vietnamese
 */
export function getMetricLabel(type: MetricType): string {
  switch (type) {
    case 'temperature':
      return 'Nhiệt độ nước';
    case 'ph':
      return 'Độ pH';
    case 'do':
      return 'Oxy hòa tan (DO)';
    case 'salinity':
      return 'Độ mặn';
    case 'orp':
      return 'Chỉ số ORP';
    case 'turbidity':
      return 'Độ đục';
    case 'nh3':
      return 'Khí độc NH3/NH4';
    default:
      return type;
  }
}

/**
 * Unit for metric
 */
export function getMetricUnit(type: MetricType): string {
  switch (type) {
    case 'temperature':
      return '°C';
    case 'ph':
      return 'pH';
    case 'do':
      return 'mg/L';
    case 'salinity':
      return 'ppt';
    case 'orp':
      return 'mV';
    case 'turbidity':
      return 'NTU';
    case 'nh3':
      return 'mg/L';
    default:
      return '';
  }
}

/**
 * Format metric value with unit
 */
export function formatMetricValue(value: number, type: MetricType): string {
  const unit = getMetricUnit(type);
  const formattedVal = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${formattedVal} ${unit}`.trim();
}

/**
 * Get Vietnamese text for status
 */
export function getStatusText(status: StatusLevel): string {
  switch (status) {
    case 'optimal':
      return 'Tối ưu';
    case 'warning':
      return 'Cảnh báo';
    case 'critical':
      return 'Nguy hiểm';
    default:
      return 'Chưa rõ';
  }
}
