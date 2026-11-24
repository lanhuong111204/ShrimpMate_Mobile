export type AiSafetyDecision = 'allowed' | 'adjusted' | 'blocked';

export interface FeatureContribution {
  feature: string;
  name: string;
  value: number | string;
  impact: 'INCREASE' | 'DECREASE' | 'NEUTRAL';
  deltaKg: number;
  description: string;
}

export interface AiRecommendation {
  id: string;
  pondId: string;
  modelName: string;
  modelVersion: string;
  predictedFeedAmountKg: number;
  safeAllowedAmountKg?: number;
  baseValueKg?: number | null;
  spreadRateKgPerMinute?: number | null;
  appetiteLevel?: number | null;
  biomassKg?: number | null;
  feedRatePercent?: number | null;
  anomalyScore?: number | null;
  confidence?: number | null;
  safetyDecision: AiSafetyDecision;
  safetyReason: string | null;
  safetyReasons?: string[];
  explanation: string;
  featureContributions?: FeatureContribution[];
  inputSnapshot?: Record<string, any>;
  createdAt?: string;
}

export interface PredictFeedOverrideDto {
  doc?: number;
  avgWeightG?: number;
  doMin?: number;
  deltaTan?: number;
  morningRainMm?: number;
  prevFeedAmountKg?: number;
  waterChangeM3?: number;
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
  modelName?: string;
  modelVersion?: string;
  predictedFeedAmountKg: number;
  safeAllowedAmountKg: number;
  baseValueKg?: number | null;
  biomassKg?: number;
  feedRatePercent?: number;
  safetyDecision: AiSafetyDecision;
  safetyReasons: string[];
  explanation: string;
  featureContributions?: FeatureContribution[];
  inputSnapshot?: Record<string, any>;
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
  recommendation: string | AiRecommendation | null;
}
