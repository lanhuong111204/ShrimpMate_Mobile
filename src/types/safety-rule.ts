export interface SafetyRule {
  id: string;
  code: string;
  name: string;
  priority: number;
  isEnabled: boolean;
  condition: {
    field: string;
    operator: '<' | '>' | '<=' | '>=' | '==' | '!=';
    value: number;
  };
  action: {
    decision: 'blocked' | 'adjusted' | 'allowed';
    reason: string;
  };
}

export interface EvaluateSafetyRequest {
  deviceId: string;
  requestedAmountKg: number;
}

export interface EvaluateSafetyResponse {
  decision: 'allowed' | 'adjusted' | 'blocked';
  allowedAmountKg: number;
  requestedAmountKg: number;
  reasons: string[];
  appliedRules: string[];
  telemetrySnapshot?: {
    id?: string;
    dissolvedOxygenMgL: number;
    ph: number;
    temperatureC: number;
  };
}
