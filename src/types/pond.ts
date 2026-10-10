export type MetricType = 'temperature' | 'ph' | 'do' | 'salinity' | 'orp' | 'turbidity' | 'nh3';

export type StatusLevel = 'optimal' | 'warning' | 'critical' | 'unknown';

export interface SensorMetric {
  type: MetricType;
  name: string;
  value: number;
  unit: string;
  status: StatusLevel;
  minThreshold: number;
  maxThreshold: number;
  lastUpdated: string;
}

export interface PondDevice {
  id: string;
  name: string;
  type: 'aerator' | 'feeder' | 'pump' | 'light' | 'other';
  status: 'on' | 'off' | 'error' | 'auto';
  autoMode: boolean;
  powerWatt?: number;
  lastToggled?: string;
}

export interface Pond {
  id: string;
  farmId?: string;
  name: string;
  code: string;
  areaM2: number;
  depthM?: number;
  shrimpCount?: number;
  shrimpAgeDays?: number;
  species?: 'Vannamei' | 'Monodon' | string;
  status: 'active' | 'harvesting' | 'preparing' | 'empty' | 'inactive' | 'maintenance' | string;
  latestMetrics?: SensorMetric[];
  devices?: PondDevice[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePondRequest {
  code: string;
  name: string;
  areaM2: number;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface UpdatePondRequest {
  name?: string;
  areaM2?: number;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface PondTelemetryLog {
  id: string;
  pondId: string;
  timestamp: string;
  metrics: Record<MetricType, number>;
}
