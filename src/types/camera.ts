export type AppetiteLevel = 0 | 1 | 2 | 3; // 0: None, 1: Weak, 2: Normal, 3: Strong

export interface FisStatus {
  fisScore: number;
  appetiteLevel: AppetiteLevel;
  appetiteLevelDescription: string;
  remainingFeedPercent: number;
  shrimpDensity: number;
  consumptionVelocity: number;
  timestamp: string;
  ageSeconds: number;
  isStale: boolean;
}

export interface CameraDevice {
  id: string;
  name: string;
  status: string;
  lastSeenAt: string | null;
}

export interface LatestFisResponse {
  hasData: boolean;
  pondId: string;
  status?: FisStatus;
  camera?: CameraDevice;
}

export interface CameraAnalyzePayload {
  pondId: string;
  deviceId: string;
  feedingRecordId?: string;
  frameUrl?: string;
  imageBase64?: string;
  timeDeltaSeconds?: number;
  roi?: {
    x: number;
    y: number;
    width: number;
    height: number;
    resolutionWidth?: number;
    resolutionHeight?: number;
  };
}
