export interface AiRecommendation {
  id: string;
  pondId: string;
  modelName: string;
  modelVersion: string;
  predictedFeedAmountKg: number;
  spreadRateKgPerMinute: number;
  appetiteLevel: number;
  biomassKg: number;
  anomalyScore: number;
  confidence: number;
  safetyDecision: 'allowed' | 'adjusted' | 'blocked';
  safetyReason: string | null;
  explanation: string;
  createdAt?: string;
}
