export type FeedingSource = 'schedule' | 'manual' | 'ai';
export type FeedingStatus = 'requested' | 'running' | 'completed' | 'stopped' | 'failed';
export type SafetyDecision = 'allowed' | 'adjusted' | 'blocked';

export interface FeedingSchedule {
  id: string;
  pondId: string;
  name: string;
  timeOfDay: string; // HH:mm
  feedAmountKg: number;
  spreadRateKgPerMinute: number;
  daysOfWeek: number[]; // [1, 2, 3, 4, 5, 6, 0]
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFeedingScheduleRequest {
  name: string;
  timeOfDay: string;
  feedAmountKg: number;
  spreadRateKgPerMinute: number;
  daysOfWeek: number[];
  isEnabled?: boolean;
}

export interface FeedingRecord {
  id: string;
  pondId: string;
  deviceId?: string | null;
  scheduleId?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  requestedAmountKg: number;
  actualAmountKg: number | null;
  source: FeedingSource;
  status: FeedingStatus;
  safetyDecision: SafetyDecision | null;
  safetyReason: string | null;
  stoppedReason?: string | null;
  useAiPrediction?: boolean;
  leftoverPercent?: number | null;
  appetiteLevel?: number | null;
}

export interface TriggerFeedingRequest {
  deviceId?: string | null;
  scheduleId?: string | null;
  requestedAmountKg: number;
  source: FeedingSource;
  useAiPrediction?: boolean;
  stoppedReason?: string | null;
}

export interface FeedingScheduleRecommendation {
  hasActiveSeason: boolean;
  message?: string;
  pondId: string;
  cropSeasonId?: string;
  daysOfCulture: number;
  estimatedAverageWeightG?: number;
  estimatedBiomassKg: number;
  feedLimits: {
    dailyDemandRatePercent?: number;
    dailyDemandKg: number;
    maxDailyLimitKg: number;
    minDailyLimitKg: number;
    totalFedTodayKg: number;
    remainingAllowanceTodayKg: number;
  };
  scheduleRecommendation: {
    existingScheduleCount: number;
    suggestedMealCount: number;
    suggestedAmountPerMealKg: number;
    minSafeMealKg: number;
    maxSafeMealKg: number;
    suggestedSpreadRate: number;
  };
}

export interface UpdateFeedingProgressRequest {
  status?: FeedingStatus;
  actualAmountKg?: number;
  leftoverPercent?: number;
  appetiteLevel?: number;
}
