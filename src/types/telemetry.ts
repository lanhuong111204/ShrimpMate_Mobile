export interface TelemetryReading {
  id: string;
  pondId: string;
  deviceId: string;
  measuredAt: string;
  ph?: number | null;
  dissolvedOxygenMgL?: number | null;
  temperatureC?: number | null;
  salinityPpt?: number | null;
  ammoniaMgL?: number | null;
  turbidityNtu?: number | null;
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
