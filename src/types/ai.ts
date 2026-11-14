export type AiSafetyDecision = 'allowed' | 'adjusted' | 'blocked';

export interface AiRecommendation {
  id: string;
  pondId: string;
  modelName: string;
  modelVersion: string;
  predictedFeedAmountKg: number;
  safeAllowedAmountKg?: number;
  spreadRateKgPerMinute: number;
  appetiteLevel: number;
  biomassKg: number;
  feedRatePercent?: number;
  anomalyScore: number;
  confidence: number;
  safetyDecision: AiSafetyDecision;
  safetyReason: string | null;
  safetyReasons?: string[];
  explanation: string;
  createdAt?: string;
}

export interface PredictFeedOverrideDto {
  shrimpAgeDays?: number;
  averageWeightG?: number;
  shrimpCount?: number;
  biomassKg?: number;
  waterTemperatureC?: number;
  dissolvedOxygenMgL?: number;
  ph?: number;
  ammoniaMgL?: number;
  salinityPpt?: number;
  turbidityNtu?: number;
  appetiteLevel?: number;
  remainingFeedPercent?: number;
  [key: string]: unknown;
}

export interface PredictFeedResponse {
  recommendationId: string;
  pondId: string;
  predictedFeedAmountKg: number;
  safeAllowedAmountKg: number;
  biomassKg: number;
  feedRatePercent: number;
  safetyDecision: AiSafetyDecision;
  safetyReasons: string[];
  explanation: string;
  createdAt: string;
}

export type TrendRiskLevel = 'low' | 'medium' | 'high' | 'critical' | string;

export interface PredictedTrendsResponse {
  pondId: string;
  currentDo: number | null;
  predictedDo1h: number | null;
  predictedDo2h: number | null;
  riskLevel: TrendRiskLevel;
  adaptiveAction: string;
  decision: AiSafetyDecision;
  reasons: string[];
  recommendation: AiRecommendation | null;
}
