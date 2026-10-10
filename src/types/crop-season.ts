export type CropSeasonStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface CropSeason {
  id: string;
  pondId: string;
  name: string;
  stockingDate: string;
  initialCount: number;
  stockingDensity: number;
  initialAverageWeightG: number;
  estimatedSurvivalRate: number;
  status: CropSeasonStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCropSeasonRequest {
  name: string;
  stockingDate: string;
  initialCount: number;
  stockingDensity: number;
  initialAverageWeightG: number;
  estimatedSurvivalRate: number;
  status?: CropSeasonStatus;
}

export interface CropSeasonStatistics {
  cropSeasonId: string;
  name: string;
  status: CropSeasonStatus;
  stockingDate: string;
  daysOfCulture: number; // DOC
  initialCount: number;
  estimatedSurvivingCount: number;
  survivalRatePercent: number;
  totalFeedConsumedKg: number;
  totalFeedingSessions: number;
  estimatedCurrentBiomassKg: number;
  fcr: number;
}
