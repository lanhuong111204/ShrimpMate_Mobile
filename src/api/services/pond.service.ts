import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { Pond, PondDevice, PondTelemetryLog, StatusLevel } from '@/types/pond';
import { TelemetryHistoryQuery, TelemetryReading } from '@/types/telemetry';
import { AppetiteLevel, CameraAnalyzePayload, LatestFisResponse } from '@/types/camera';
import {
  AiRecommendation,
  PredictFeedOverrideDto,
  PredictFeedResponse,
  PredictedTrendsResponse,
} from '@/types/ai';
import { FeedingRecord, FeedingSchedule, TriggerFeedingRequest } from '@/types/feeding';
import { EvaluateSafetyRequest, EvaluateSafetyResponse } from '@/types/safety-rule';
import { Device, EmergencyStopResponse } from '@/types/device';
import { CropSeason, CropSeasonStatistics } from '@/types/crop-season';

export type WaterMetricType = 'do' | 'ph' | 'nh3' | 'temperature' | 'salinity' | 'turbidity';

export interface WaterStatusColorSet {
  status: StatusLevel | 'empty';
  color: string;
  bgPill: string;
  textColor: string;
  borderColor: string;
  label: string;
}

const APPETITE_DESCRIPTIONS: Record<AppetiteLevel, string> = {
  0: 'Không ăn (Dư cám nhiều)',
  1: 'Ăn yếu (Sót cám nhá)',
  2: 'Bình thường (Tiêu thụ ổn)',
  3: 'Ăn mạnh (Sạch nhá)',
};

const DEFAULT_LEFTOVER_BY_APPETITE: Record<AppetiteLevel, number> = {
  0: 45,
  1: 25,
  2: 10,
  3: 3,
};

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampAppetiteLevel(value: number): AppetiteLevel {
  const rounded = Math.round(value);
  if (rounded <= 0) return 0;
  if (rounded === 1) return 1;
  if (rounded === 2) return 2;
  return 3;
}

function normalizeAiRecommendation(raw: any): AiRecommendation | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw?.recommendation || raw?.data?.recommendation || raw?.data || raw;
  if (
    !item ||
    typeof item !== 'object' ||
    item.predictedFeedAmountKg === undefined ||
    item.predictedFeedAmountKg === null ||
    isNaN(Number(item.predictedFeedAmountKg))
  ) {
    return null;
  }
  return {
    ...item,
    predictedFeedAmountKg: Number(item.predictedFeedAmountKg),
    safeAllowedAmountKg:
      item.safeAllowedAmountKg !== undefined && item.safeAllowedAmountKg !== null
        ? Number(item.safeAllowedAmountKg)
        : undefined,
    spreadRateKgPerMinute:
      item.spreadRateKgPerMinute !== undefined && item.spreadRateKgPerMinute !== null
        ? Number(item.spreadRateKgPerMinute)
        : undefined,
    appetiteLevel:
      item.appetiteLevel !== undefined && item.appetiteLevel !== null
        ? Number(item.appetiteLevel)
        : undefined,
    biomassKg:
      item.biomassKg !== undefined && item.biomassKg !== null ? Number(item.biomassKg) : undefined,
    feedRatePercent:
      item.feedRatePercent !== undefined && item.feedRatePercent !== null
        ? Number(item.feedRatePercent)
        : undefined,
    anomalyScore:
      item.anomalyScore !== undefined && item.anomalyScore !== null
        ? Number(item.anomalyScore)
        : undefined,
    confidence:
      item.confidence !== undefined && item.confidence !== null
        ? Number(item.confidence)
        : undefined,
  };
}

function normalizeFeedingRecords(items: any[]): FeedingRecord[] {
  return items.map((rec) => ({
    ...rec,
    requestedAmountKg: Number(rec.requestedAmountKg) || 0,
    actualAmountKg: Number(rec.actualAmountKg) || 0,
    leftoverPercent:
      rec.leftoverPercent !== undefined && rec.leftoverPercent !== null
        ? Number(rec.leftoverPercent)
        : undefined,
    appetiteLevel:
      rec.appetiteLevel !== undefined && rec.appetiteLevel !== null
        ? Number(rec.appetiteLevel)
        : undefined,
  }));
}

function normalizeFisPayload(raw: any): LatestFisResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw.data && typeof raw.data === 'object' && 'hasData' in raw.data ? raw.data : raw;
  if (typeof data.hasData !== 'boolean') return null;
  if (data.status) {
    data.status = {
      ...data.status,
      fisScore: Number(data.status.fisScore) || 0,
      appetiteLevel: clampAppetiteLevel(Number(data.status.appetiteLevel) || 0),
      remainingFeedPercent: Number(data.status.remainingFeedPercent) || 0,
      shrimpDensity: Number(data.status.shrimpDensity) || 0,
      consumptionVelocity: Number(data.status.consumptionVelocity) || 0,
      ageSeconds: Number(data.status.ageSeconds) || 0,
    };
    if (data.status.ageSeconds > 120) {
      data.status.isStale = true;
    }
  }
  return data as LatestFisResponse;
}

function buildSynthesizedFis(
  pondId: string,
  aiRec: AiRecommendation | null,
  records: FeedingRecord[],
  markFresh = false
): LatestFisResponse {
  const sortedRecords = [...records].sort((a, b) => {
    const tA = new Date(a.startedAt || 0).getTime() || 0;
    const tB = new Date(b.startedAt || 0).getTime() || 0;
    return tB - tA;
  });

  const latestRecord =
    sortedRecords.find(
      (r) =>
        (r.appetiteLevel !== undefined && r.appetiteLevel !== null) ||
        (r.leftoverPercent !== undefined && r.leftoverPercent !== null)
    ) ||
    sortedRecords[0] ||
    null;

  if (!aiRec && !latestRecord) {
    return { hasData: false, pondId };
  }

  let appetiteLevel: AppetiteLevel = 2;
  if (
    latestRecord?.appetiteLevel !== undefined &&
    latestRecord.appetiteLevel !== null &&
    !isNaN(Number(latestRecord.appetiteLevel))
  ) {
    appetiteLevel = clampAppetiteLevel(Number(latestRecord.appetiteLevel));
  } else if (
    aiRec?.appetiteLevel !== undefined &&
    aiRec.appetiteLevel !== null &&
    !isNaN(Number(aiRec.appetiteLevel))
  ) {
    appetiteLevel = clampAppetiteLevel(Number(aiRec.appetiteLevel));
  } else if (
    latestRecord?.leftoverPercent !== undefined &&
    latestRecord.leftoverPercent !== null &&
    !isNaN(Number(latestRecord.leftoverPercent))
  ) {
    const leftover = Number(latestRecord.leftoverPercent);
    appetiteLevel = leftover <= 5 ? 3 : leftover <= 15 ? 2 : leftover <= 35 ? 1 : 0;
  }

  const remainingFeedPercent =
    latestRecord?.leftoverPercent !== undefined &&
    latestRecord.leftoverPercent !== null &&
    !isNaN(Number(latestRecord.leftoverPercent))
      ? Math.max(0, Math.min(100, Math.round(Number(latestRecord.leftoverPercent))))
      : DEFAULT_LEFTOVER_BY_APPETITE[appetiteLevel];

  const fisScore = Math.max(
    0,
    Math.min(
      1,
      Number((((100 - remainingFeedPercent) / 100) * 0.4 + (appetiteLevel / 3) * 0.6).toFixed(2))
    )
  );

  const rawTimestamp = markFresh
    ? new Date().toISOString()
    : latestRecord?.startedAt || aiRec?.createdAt || new Date().toISOString();
  const parsedTime = new Date(rawTimestamp).getTime();
  const ageSeconds = markFresh
    ? 1
    : Number.isFinite(parsedTime)
    ? Math.max(0, Math.floor((Date.now() - parsedTime) / 1000))
    : 0;

  return {
    hasData: true,
    pondId,
    status: {
      fisScore,
      appetiteLevel,
      appetiteLevelDescription: APPETITE_DESCRIPTIONS[appetiteLevel],
      remainingFeedPercent,
      shrimpDensity: Number((aiRec as any)?.shrimpDensity ?? (latestRecord as any)?.shrimpDensity ?? 0) || 0,
      consumptionVelocity:
        Number(aiRec?.spreadRateKgPerMinute ?? (latestRecord as any)?.consumptionVelocity ?? 0) || 0,
      timestamp: rawTimestamp,
      ageSeconds,
      isStale: ageSeconds > 120,
    },
  };
}

async function synthesizeFisFromPondData(
  pondId: string,
  markFresh: boolean
): Promise<LatestFisResponse> {
  const [aiResult, recordsResult] = await Promise.allSettled([
    apiClient.get<any>(Endpoints.ai.recommendationsLatest(pondId)),
    apiClient.get<any>(Endpoints.feedings.records(pondId)),
  ]);

  const aiRec =
    aiResult.status === 'fulfilled'
      ? normalizeAiRecommendation(aiResult.value.data)
      : normalizeAiRecommendation(
          await Storage.getJSON<any>(`${AppConfig.storageKeys.cachedAiRec}_${pondId}`)
        );

  let records: FeedingRecord[] = [];
  if (recordsResult.status === 'fulfilled') {
    const raw = recordsResult.value.data;
    const list: any[] = Array.isArray(raw)
      ? raw
      : raw && Array.isArray(raw.data)
      ? raw.data
      : [];
    records = normalizeFeedingRecords(list);
  } else {
    const cachedRecs = await Storage.getJSON<any[]>(
      `${AppConfig.storageKeys.cachedRecords}_${pondId}`
    );
    records = Array.isArray(cachedRecs) ? normalizeFeedingRecords(cachedRecs) : [];
  }

  if (
    !markFresh &&
    aiResult.status === 'rejected' &&
    recordsResult.status === 'rejected' &&
    !aiRec &&
    records.length === 0
  ) {
    const cachedFis = await Storage.getJSON<any>(`${AppConfig.storageKeys.cachedFis}_${pondId}`);
    const normalized = normalizeFisPayload(cachedFis);
    if (normalized) {
      if (normalized.status?.timestamp) {
        const ageSec = Math.max(
          0,
          Math.floor((Date.now() - new Date(normalized.status.timestamp).getTime()) / 1000)
        );
        normalized.status.ageSeconds = ageSec;
        normalized.status.isStale = ageSec > 120;
      }
      return normalized;
    }
    return { hasData: false, pondId };
  }

  const synthesized = buildSynthesizedFis(pondId, aiRec, records, markFresh);
  if (synthesized.hasData) {
    await Storage.setJSON(`${AppConfig.storageKeys.cachedFis}_${pondId}`, synthesized);
  }
  return synthesized;
}

/**
 * Đánh giá trạng thái an toàn sinh học của 6 chỉ số nước theo chuẩn Chương 7 PDF:
 * - DO: xanh (optimal) >= 5.0, vàng (warning) 3.5 - 5.0, đỏ (critical) < 3.5 mg/L
 * - pH: xanh (optimal) 7.5 - 8.5, vàng (warning) 7.0 - 7.5 hoặc 8.5 - 9.0, đỏ (critical) < 7.0 hoặc > 9.0
 * - Temp: thích hợp (optimal) 28 - 32°C
 * - Salinity: thích hợp (optimal) 10 - 25 ppt
 * - NH3: nguy hiểm (critical) > 0.3 mg/L, cần chú ý (warning) 0.05 - 0.3 mg/L
 * - Turbidity: thích hợp (optimal) 10 - 40 NTU
 */
export function evaluateWaterMetricStatus(type: WaterMetricType, value: number): StatusLevel {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'unknown';
  }
  switch (type) {
    case 'do':
      if (value < 3.5) return 'critical';
      if (value < 5.0) return 'warning';
      return 'optimal';
    case 'ph':
      if (value < 7.0 || value > 9.0) return 'critical';
      if (value < 7.5 || value > 8.5) return 'warning';
      return 'optimal';
    case 'nh3':
      if (value > 0.3) return 'critical';
      if (value >= 0.05) return 'warning';
      return 'optimal';
    case 'temperature':
      if (value < 24.0 || value > 34.0) return 'critical';
      if (value < 28.0 || value > 32.0) return 'warning';
      return 'optimal';
    case 'salinity':
      if (value < 5.0 || value > 35.0) return 'critical';
      if (value < 10.0 || value > 25.0) return 'warning';
      return 'optimal';
    case 'turbidity':
      if (value < 5.0 || value > 80.0) return 'critical';
      if (value < 10.0 || value > 40.0) return 'warning';
      return 'optimal';
    default:
      return 'optimal';
  }
}

/**
 * Helper trả về bộ màu sắc chuẩn Chương 7 PDF theo mức độ an toàn sinh học
 */
export function getWaterStatusColor(status: StatusLevel | 'empty'): WaterStatusColorSet {
  switch (status) {
    case 'critical':
      return {
        status: 'critical',
        color: '#BA1A1A',
        bgPill: '#FFDAD6',
        textColor: '#BA1A1A',
        borderColor: '#BA1A1A',
        label: 'NGUY HIỂM',
      };
    case 'warning':
      return {
        status: 'warning',
        color: '#F59E0B',
        bgPill: '#FEF3C7',
        textColor: '#B45309',
        borderColor: '#F59E0B',
        label: 'CẦN CHÚ Ý',
      };
    case 'unknown':
    case 'empty':
      return {
        status,
        color: '#64748B',
        bgPill: '#F1F5F9',
        textColor: '#64748B',
        borderColor: '#E2E8F0',
        label: 'Chưa có dữ liệu',
      };
    case 'optimal':
    default:
      return {
        status: 'optimal',
        color: '#006E2D',
        bgPill: '#E8F5E9',
        textColor: '#006E2D',
        borderColor: '#7CF994',
        label: 'AN TOÀN',
      };
  }
}

export function getWaterMetricColors(
  type: WaterMetricType,
  value: number | null | undefined
): WaterStatusColorSet {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return getWaterStatusColor('empty');
  }
  return getWaterStatusColor(evaluateWaterMetricStatus(type, Number(value)));
}

export const pondService = {
  /**
   * 10.1. Lấy chỉ số môi trường nước mới nhất (6 Gauges: pH, DO, Nhiệt độ, Độ mặn, NH3, Độ đục)
   * Endpoint: GET /ponds/:pondId/telemetry/latest
   */
  async getLatestTelemetry(pondId: string): Promise<TelemetryReading | null> {
    const normalizeTelemetry = (raw: any): TelemetryReading | null => {
      if (!raw || typeof raw !== 'object') return null;
      const item = raw.data && typeof raw.data === 'object' ? raw.data : raw;
      if (item.ph === undefined || item.ph === null || isNaN(Number(item.ph))) return null;
      return {
        ...item,
        ph: Number(item.ph),
        dissolvedOxygenMgL: Number(item.dissolvedOxygenMgL ?? item.do ?? 0),
        temperatureC: Number(item.temperatureC ?? item.temperature ?? 0),
        salinityPpt: Number(item.salinityPpt ?? item.salinity ?? 0),
        ammoniaMgL: Number(item.ammoniaMgL ?? item.nh3 ?? 0),
        turbidityNtu: Number(item.turbidityNtu ?? item.turbidity ?? 0),
      };
    };

    try {
      const response = await apiClient.get<any>(Endpoints.telemetry.latest(pondId));
      const normalized = normalizeTelemetry(response.data);
      if (normalized) {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedTelemetry}_${pondId}`, normalized);
        return normalized;
      }
      return null;
    } catch {
      const cached = await Storage.getJSON<any>(
        `${AppConfig.storageKeys.cachedTelemetry}_${pondId}`
      );
      return normalizeTelemetry(cached);
    }
  },

  /**
   * 10.2. Lịch sử đo môi trường nước (GET /ponds/:pondId/telemetry/history)
   */
  async getTelemetryHistory(pondId: string, query?: TelemetryHistoryQuery): Promise<TelemetryReading[]> {
    try {
      const response = await apiClient.get<any>(Endpoints.telemetry.history(pondId), {
        params: query as any,
      });
      const raw = response.data;
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray(raw.data)) return raw.data;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Tổng hợp chỉ số cường độ bắt mồi FIS từ /ponds/:pondId/ai/recommendations/latest
   * và /ponds/:pondId/feeding-records (không gọi /camera/* gây 404).
   */
  async getLatestFis(pondId: string): Promise<LatestFisResponse> {
    return synthesizeFisFromPondData(pondId, false);
  },

  /**
   * Làm mới đánh giá nhá ăn / FIS tổng hợp từ /ponds/:pondId/ai/recommendations/latest
   * và /ponds/:pondId/feeding-records (không gọi /camera/analyze gây 404).
   */
  async analyzeCameraFrame(payload: CameraAnalyzePayload): Promise<LatestFisResponse> {
    return synthesizeFisFromPondData(payload.pondId, true);
  },

  /**
   * 12.1. Lấy khuyến nghị AI mới nhất cho ao nuôi
   * Endpoint: GET /ponds/:pondId/ai/recommendations/latest (trả về { recommendation })
   */
  async getLatestAiRecommendation(pondId: string): Promise<AiRecommendation | null> {
    try {
      const response = await apiClient.get<any>(Endpoints.ai.recommendationsLatest(pondId));
      const normalized = normalizeAiRecommendation(response.data);
      if (normalized) {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedAiRec}_${pondId}`, normalized);
        return normalized;
      }
      return null;
    } catch {
      try {
        const alt = await apiClient.get<any>(Endpoints.ai.legacyRecommendations(pondId));
        const normalizedAlt = normalizeAiRecommendation(alt.data);
        if (normalizedAlt) {
          await Storage.setJSON(`${AppConfig.storageKeys.cachedAiRec}_${pondId}`, normalizedAlt);
          return normalizedAlt;
        }
      } catch {
        // Ignore
      }
      const cached = await Storage.getJSON<any>(`${AppConfig.storageKeys.cachedAiRec}_${pondId}`);
      return normalizeAiRecommendation(cached);
    }
  },

  /**
   * 12.2. Dự báo khẩu phần ăn bằng AI theo nhu cầu (POST /ponds/:pondId/ai/predict-feed)
   */
  async predictFeedDemand(
    pondId: string,
    overrideDto?: PredictFeedOverrideDto
  ): Promise<PredictFeedResponse> {
    const response = await apiClient.post<any>(
      Endpoints.ai.predictFeed(pondId),
      overrideDto ?? {}
    );
    const raw = response.data;
    const item =
      raw?.data &&
      typeof raw.data === 'object' &&
      ('recommendationId' in raw.data || 'predictedFeedAmountKg' in raw.data)
        ? raw.data
        : raw;

    return {
      recommendationId: String(item?.recommendationId ?? item?.id ?? ''),
      pondId: String(item?.pondId ?? pondId),
      predictedFeedAmountKg: Number(item?.predictedFeedAmountKg) || 0,
      safeAllowedAmountKg: Number(item?.safeAllowedAmountKg ?? item?.predictedFeedAmountKg) || 0,
      biomassKg: Number(item?.biomassKg) || 0,
      feedRatePercent: Number(item?.feedRatePercent) || 0,
      safetyDecision: item?.safetyDecision ?? 'allowed',
      safetyReasons: Array.isArray(item?.safetyReasons) ? item.safetyReasons : [],
      explanation: String(item?.explanation ?? ''),
      createdAt: String(item?.createdAt ?? new Date().toISOString()),
    };
  },

  /**
   * 12.3. Lấy xu hướng dự báo DO & khuyến nghị thích ứng AI (GET /ponds/:pondId/ai/predicted-trends)
   */
  async getPredictedTrends(pondId: string): Promise<PredictedTrendsResponse | null> {
    const normalizeTrends = (raw: any): PredictedTrendsResponse | null => {
      if (!raw || typeof raw !== 'object') return null;
      const item =
        raw?.data &&
        typeof raw.data === 'object' &&
        ('currentDo' in raw.data || 'riskLevel' in raw.data || 'predictedDo1h' in raw.data)
          ? raw.data
          : raw;
      if (
        !item ||
        typeof item !== 'object' ||
        (!('riskLevel' in item) && !('currentDo' in item) && !('predictedDo1h' in item))
      ) {
        return null;
      }
      return {
        pondId: String(item.pondId ?? pondId),
        currentDo: toNullableNumber(item.currentDo),
        predictedDo1h: toNullableNumber(item.predictedDo1h),
        predictedDo2h: toNullableNumber(item.predictedDo2h),
        riskLevel: String(item.riskLevel ?? 'low'),
        adaptiveAction: String(item.adaptiveAction ?? ''),
        decision: item.decision ?? 'allowed',
        reasons: Array.isArray(item.reasons) ? item.reasons : [],
        recommendation: normalizeAiRecommendation(item.recommendation),
      };
    };

    try {
      const response = await apiClient.get<any>(Endpoints.ai.predictedTrends(pondId));
      const normalized = normalizeTrends(response.data);
      if (normalized) {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedAiRec}_trends_${pondId}`, normalized);
        return normalized;
      }
      return null;
    } catch {
      const cached = await Storage.getJSON<any>(
        `${AppConfig.storageKeys.cachedAiRec}_trends_${pondId}`
      );
      return normalizeTrends(cached);
    }
  },

  /**
   * 7.1. Lấy danh sách thiết bị IoT thuộc ao nuôi (GET /devices)
   */
  async getDevicesByPond(pondId: string): Promise<Device[]> {
    try {
      const response = await apiClient.get<any>(Endpoints.devices.list);
      const raw = response.data;
      const allDevices: Device[] = Array.isArray(raw)
        ? raw
        : raw && Array.isArray(raw.data)
        ? raw.data
        : [];
      const pondDevices = allDevices.filter((d) => d.pondId === pondId);
      await Storage.setJSON(`${AppConfig.storageKeys.cachedDevices}_${pondId}`, pondDevices);
      return pondDevices;
    } catch {
      const cached = await Storage.getJSON<Device[]>(
        `${AppConfig.storageKeys.cachedDevices}_${pondId}`
      );
      return cached || [];
    }
  },

  /**
   * 9.1. Danh sách lịch cho ăn của ao (GET /ponds/:pondId/feeding-schedules)
   */
  async getFeedingSchedules(pondId: string): Promise<FeedingSchedule[]> {
    const normalizeSchedules = (items: any[]): FeedingSchedule[] =>
      items.map((sch) => ({
        ...sch,
        feedAmountKg: Number(sch.feedAmountKg) || 0,
        spreadRateKgPerMinute:
          sch.spreadRateKgPerMinute !== undefined ? Number(sch.spreadRateKgPerMinute) || 0 : 1.5,
      }));

    try {
      const response = await apiClient.get<any>(Endpoints.feedings.schedules(pondId));
      const raw = response.data;
      const list: any[] = Array.isArray(raw)
        ? raw
        : raw && Array.isArray(raw.data)
        ? raw.data
        : [];
      const normalized = normalizeSchedules(list);
      if (normalized.length > 0) {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedSchedules}_${pondId}`, normalized);
      }
      return normalized;
    } catch {
      const cached = await Storage.getJSON<any[]>(
        `${AppConfig.storageKeys.cachedSchedules}_${pondId}`
      );
      return Array.isArray(cached) ? normalizeSchedules(cached) : [];
    }
  },

  /**
   * 9.4. Lịch sử nhật ký các lần cho ăn (GET /ponds/:pondId/feeding-records)
   */
  async getFeedingRecords(pondId: string): Promise<FeedingRecord[]> {
    try {
      const response = await apiClient.get<any>(Endpoints.feedings.records(pondId));
      const raw = response.data;
      const list: any[] = Array.isArray(raw)
        ? raw
        : raw && Array.isArray(raw.data)
        ? raw.data
        : [];
      const normalized = normalizeFeedingRecords(list);
      if (normalized.length > 0) {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedRecords}_${pondId}`, normalized);
      }
      return normalized;
    } catch {
      const cached = await Storage.getJSON<any[]>(
        `${AppConfig.storageKeys.cachedRecords}_${pondId}`
      );
      return Array.isArray(cached) ? normalizeFeedingRecords(cached) : [];
    }
  },

  /**
   * 14.4. Thử nghiệm đánh giá an toàn trước khi cho ăn (Preview Safety Evaluation)
   * Endpoint: POST /ponds/:pondId/safety-rules/evaluate
   * Quy tắc 2: Bắt buộc gọi trước khi xả thức ăn thủ công!
   */
  async evaluateSafetyBeforeFeed(
    pondId: string,
    payload: EvaluateSafetyRequest,
    fallbackTelemetry?: TelemetryReading | null
  ): Promise<EvaluateSafetyResponse> {
    try {
      const response = await apiClient.post<EvaluateSafetyResponse>(
        Endpoints.safetyRules.evaluate(pondId),
        payload
      );
      if (response.data && response.data.decision) {
        return response.data;
      }
      throw new Error('Invalid safety evaluate response');
    } catch {
      // Đánh giá an toàn cục bộ theo đúng ngưỡng sinh học khi có dữ liệu đo mới nhất trong cache
      if (!fallbackTelemetry || typeof fallbackTelemetry.dissolvedOxygenMgL !== 'number') {
        return {
          decision: 'blocked',
          allowedAmountKg: 0,
          requestedAmountKg: payload.requestedAmountKg,
          reasons: [
            'Chưa có dữ liệu cảm biến môi trường nước cho ao này để đánh giá an toàn sinh học.',
          ],
          appliedRules: ['NO_TELEMETRY_DATA'],
        };
      }
      const doVal = fallbackTelemetry.dissolvedOxygenMgL;
      const phVal = fallbackTelemetry.ph;
      const nh3Val = fallbackTelemetry.ammoniaMgL;
      const tempVal = fallbackTelemetry.temperatureC;

      const reasons: string[] = [];
      const appliedRules: string[] = [];

      if (doVal < 3.5) {
        reasons.push(
          `Nồng độ oxy hòa tan (DO = ${doVal} mg/L) quá thấp (< 3.5 mg/L). Cấm cho ăn để tránh tôm bị ngạt và ô nhiễm đáy ao.`
        );
        appliedRules.push('DO_CRITICAL_BLOCKED');
      }
      if (phVal < 7.0 || phVal > 9.0) {
        reasons.push(
          `Độ pH nước (${phVal}) vượt ngưỡng nguy hiểm (< 7.0 hoặc > 9.0). Cấm xả thức ăn.`
        );
        appliedRules.push('PH_CRITICAL_BLOCKED');
      }
      if (nh3Val > 0.3) {
        reasons.push(
          `Khí độc NH3 (${nh3Val} mg/L) vượt ngưỡng nguy hiểm (> 0.3 mg/L). Cấm xả thức ăn.`
        );
        appliedRules.push('NH3_CRITICAL_BLOCKED');
      }

      if (reasons.length > 0) {
        return {
          decision: 'blocked',
          allowedAmountKg: 0,
          requestedAmountKg: payload.requestedAmountKg,
          reasons,
          appliedRules,
          telemetrySnapshot: {
            dissolvedOxygenMgL: doVal,
            ph: phVal,
            temperatureC: tempVal,
          },
        };
      }

      if (doVal < 5.0 || phVal < 7.5 || phVal > 8.5 || nh3Val >= 0.05) {
        const adjustedKg = Number((payload.requestedAmountKg * 0.7).toFixed(1));
        return {
          decision: 'adjusted',
          allowedAmountKg: adjustedKg,
          requestedAmountKg: payload.requestedAmountKg,
          reasons: [
            `Oxy hòa tan (${doVal} mg/L) hoặc chỉ số nước ở mức cần chú ý (3.5 - 5.0 mg/L). Hệ thống tự động giảm 30% khẩu phần xuống ${adjustedKg} kg để đảm bảo an toàn.`,
          ],
          appliedRules: ['DO_WARNING_ADJUSTED_70_PERCENT'],
          telemetrySnapshot: {
            dissolvedOxygenMgL: doVal,
            ph: phVal,
            temperatureC: tempVal,
          },
        };
      }

      return {
        decision: 'allowed',
        allowedAmountKg: payload.requestedAmountKg,
        requestedAmountKg: payload.requestedAmountKg,
        reasons: ['Các chỉ số môi trường nước nằm trong ngưỡng tối ưu. Cho phép xả 100% khẩu phần.'],
        appliedRules: [],
        telemetrySnapshot: {
          dissolvedOxygenMgL: doVal,
          ph: phVal,
          temperatureC: tempVal,
        },
      };
    }
  },

  /**
   * 9.5. Kích hoạt cữ cho ăn mới (Tự động bảo vệ qua Safety Rule Engine)
   * Endpoint: POST /ponds/:pondId/feeding-records
   */
  async triggerFeedingRecord(
    pondId: string,
    payload: TriggerFeedingRequest
  ): Promise<FeedingRecord> {
    const response = await apiClient.post<FeedingRecord>(
      Endpoints.feedings.triggerRecord(pondId),
      payload
    );
    return response.data;
  },

  /**
   * 7.8. Kích hoạt Dừng khẩn cấp (1-Tap Emergency Stop)
   * Endpoint: POST /devices/:id/emergency-stop
   */
  async triggerEmergencyStop(deviceId: string): Promise<EmergencyStopResponse> {
    const response = await apiClient.post<EmergencyStopResponse>(
      Endpoints.devices.emergencyStop(deviceId)
    );
    return response.data;
  },

  /**
   * 7.6. Cập nhật chế độ thiết bị (PATCH /devices/:id)
   */
  async updateDeviceMode(
    deviceId: string,
    mode: 'automatic' | 'manual' | 'emergency_stop'
  ): Promise<Device> {
    const response = await apiClient.patch<Device>(Endpoints.devices.update(deviceId), { mode });
    return response.data;
  },

  /**
   * 8.1 & 8.4. Lấy vụ nuôi hiện tại và thống kê FCR của ao
   */
  async getActiveCropSeasonStats(
    pondId: string
  ): Promise<{ season: CropSeason | null; stats: CropSeasonStatistics | null }> {
    try {
      const res = await apiClient.get<any>(Endpoints.cropSeasons.listByPond(pondId));
      const raw = res.data;
      const list: CropSeason[] = Array.isArray(raw)
        ? raw
        : raw && Array.isArray(raw.data)
        ? raw.data
        : [];
      const active = list.find((s) => s.status === 'active') || list[0] || null;
      if (!active) return { season: null, stats: null };

      try {
        const statsRes = await apiClient.get<CropSeasonStatistics>(
          Endpoints.cropSeasons.statistics(active.id)
        );
        return { season: active, stats: statsRes.data || null };
      } catch {
        return { season: active, stats: null };
      }
    } catch {
      return { season: null, stats: null };
    }
  },

  // Giữ tương thích ngược
  async getPonds(): Promise<Pond[]> {
    try {
      const response = await apiClient.get<Pond[]>(Endpoints.ponds.list);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  async getPondById(id: string): Promise<Pond | null> {
    try {
      const response = await apiClient.get<Pond>(Endpoints.ponds.detail(id));
      return response.data || null;
    } catch {
      return null;
    }
  },

  async toggleDevice(pondId: string, deviceId: string): Promise<PondDevice | null> {
    try {
      const response = await apiClient.post<PondDevice>(
        Endpoints.ponds.toggleDevice(pondId, deviceId)
      );
      return response.data;
    } catch {
      return null;
    }
  },

  async getTelemetryLogs(pondId: string): Promise<PondTelemetryLog[]> {
    const history = await this.getTelemetryHistory(pondId, { limit: 12 });
    return history.map((item) => ({
      id: item.id,
      pondId: item.pondId,
      timestamp: item.measuredAt,
      metrics: {
        temperature: item.temperatureC,
        do: item.dissolvedOxygenMgL,
        ph: item.ph,
        salinity: item.salinityPpt,
        nh3: item.ammoniaMgL,
        turbidity: item.turbidityNtu,
        orp: 300,
      },
    }));
  },
};
