export type DeviceType = 'feeder' | 'sensor_node' | 'camera' | 'edge_gateway';
export type DeviceStatus = 'online' | 'offline' | 'error' | 'maintenance';
export type DeviceMode = 'automatic' | 'manual' | 'emergency_stop';

export interface Device {
  id: string;
  pondId: string | null;
  deviceUid: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  mode?: DeviceMode;
  firmwareVersion: string;
  lastSeenAt: string | null;
  metadata?: Record<string, any>;
}

export interface ClaimDeviceRequest {
  deviceUid: string;
  pondId: string;
}

export interface UpdateDeviceRequest {
  name?: string;
  mode?: DeviceMode;
  metadata?: Record<string, any>;
}

export interface EmergencyStopResponse {
  id: string;
  mode: 'emergency_stop';
  status: DeviceStatus;
}
