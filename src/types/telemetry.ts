export interface TelemetryReading {
  id: string;
  pondId: string;
  deviceId: string;
  measuredAt: string;
  ph: number;
  dissolvedOxygenMgL: number;
  temperatureC: number;
  salinityPpt: number;
  ammoniaMgL: number;
  turbidityNtu: number;
}

export interface TelemetryHistoryQuery {
  startDate?: string;
  endDate?: string;
  deviceId?: string;
  page?: number;
  limit?: number;
}

export interface TelemetryIngestPayload {
  deviceId: string;
  ph: number;
  dissolvedOxygenMgL: number;
  temperatureC: number;
  salinityPpt: number;
  ammoniaMgL: number;
  turbidityNtu: number;
}
