export type FeedingSource = 'schedule' | 'manual' | 'ai';
export type FeedingStatus = 'running' | 'completed' | 'stopped' | 'failed';
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
  deviceId: string;
  startedAt: string;
  requestedAmountKg: number;
  actualAmountKg: number;
  source: FeedingSource;
  status: FeedingStatus;
  safetyDecision: SafetyDecision;
  safetyReason: string | null;
  leftoverPercent?: number;
  appetiteLevel?: number;
}

export interface TriggerFeedingRequest {
  deviceId: string;
  scheduleId?: string;
  requestedAmountKg: number;
  source: FeedingSource;
}

export interface UpdateFeedingProgressRequest {
  status?: FeedingStatus;
  actualAmountKg?: number;
  leftoverPercent?: number;
  appetiteLevel?: number;
}
