import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { Pond, PondDevice, PondTelemetryLog, StatusLevel } from '@/types/pond';
import { TelemetryHistoryQuery, TelemetryReading } from '@/types/telemetry';
import {
  AiRecommendation,
  FeatureContribution,
  PredictFeedOverrideDto,
  PredictFeedResponse,
  PredictedTrendsResponse,
} from '@/types/ai';
import {
  FeedingRecord,
  FeedingSchedule,
  FeedingScheduleRecommendation,
  TriggerFeedingRequest,
} from '@/types/feeding';
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

function toOptionalNum(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
  const snapshot =
    item.inputSnapshot && typeof item.inputSnapshot === 'object' ? item.inputSnapshot : undefined;
  const rawBaseValue = item.baseValueKg ?? snapshot?.baseValueKg;
  const rawContributions: FeatureContribution[] | undefined = Array.isArray(item.featureContributions)
    ? item.featureContributions
    : Array.isArray(snapshot?.featureContributions)
    ? snapshot.featureContributions
    : undefined;

  return {
    ...item,
    predictedFeedAmountKg: Number(item.predictedFeedAmountKg),
    safeAllowedAmountKg:
      item.safeAllowedAmountKg !== undefined && item.safeAllowedAmountKg !== null
        ? Number(item.safeAllowedAmountKg)
        : undefined,
    baseValueKg: toNullableNumber(rawBaseValue),
    spreadRateKgPerMinute: toNullableNumber(item.spreadRateKgPerMinute),
    appetiteLevel: toNullableNumber(item.appetiteLevel),
    biomassKg: toNullableNumber(item.biomassKg),
    feedRatePercent: toNullableNumber(item.feedRatePercent),
    anomalyScore: toNullableNumber(item.anomalyScore),
    confidence: toNullableNumber(item.confidence),
    featureContributions: rawContributions,
    inputSnapshot: snapshot,
  };
}

function normalizeFeedingRecords(items: any[]): FeedingRecord[] {
  return items.map((rec) => ({
    ...rec,
    requestedAmountKg: Number(rec.requestedAmountKg) || 0,
    actualAmountKg:
      rec.actualAmountKg !== undefined && rec.actualAmountKg !== null
        ? Number(rec.actualAmountKg) || 0
        : 0,
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

/**
 * Đánh giá trạng thái an toàn sinh học của 6 chỉ số nước — đồng bộ 100% với Backend WATER_QUALITY_THRESHOLDS:
 * - DO: an toàn (optimal) >= 4.0 (tối ưu >= 5.0), cảnh báo 3.5 - < 4.0, nguy hiểm (critical) < 3.5 mg/L
 * - pH: an toàn 7.2 - 8.8 (tối ưu 7.5 - 8.5), cảnh báo 7.0 - < 7.2 hoặc > 8.8 - 9.0, nguy hiểm < 7.0 hoặc > 9.0
 * - Temp: an toàn 26.0 - 33.5°C (tối ưu 28.0 - 32.0°C), cảnh báo 22.0 - < 26.0 hoặc > 33.5 - 35.0°C, nguy hiểm < 22.0 hoặc > 35.0°C
 * - Salinity: an toàn 5.0 - 30.0‰ (tối ưu 10.0 - 25.0‰), cảnh báo 2.0 - < 5.0 hoặc > 30.0 - 35.0‰, nguy hiểm < 2.0 hoặc > 35.0‰
 * - NH3: an toàn <= 0.1 mg/L (tối ưu <= 0.05 mg/L), cảnh báo > 0.1 - 0.3 mg/L, nguy hiểm > 0.3 mg/L
 * - Turbidity: an toàn <= 60.0 NTU (tối ưu 20.0 - 40.0 NTU), cảnh báo > 60.0 - 80.0 NTU, nguy hiểm > 80.0 NTU
 */
export function evaluateWaterMetricStatus(type: WaterMetricType, value: number): StatusLevel {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'unknown';
  }
  switch (type) {
    case 'do':
      if (value < 3.5) return 'critical';
      if (value < 4.0) return 'warning';
      return 'optimal';
    case 'ph':
      if (value < 7.0 || value > 9.0) return 'critical';
      if (value < 7.2 || value > 8.8) return 'warning';
      return 'optimal';
    case 'nh3':
      if (value > 0.3) return 'critical';
      if (value > 0.1) return 'warning';
      return 'optimal';
    case 'temperature':
      if (value < 22.0 || value > 35.0) return 'critical';
      if (value < 26.0 || value > 33.5) return 'warning';
      return 'optimal';
    case 'salinity':
      if (value < 2.0 || value > 35.0) return 'critical';
      if (value < 5.0 || value > 30.0) return 'warning';
      return 'optimal';
    case 'turbidity':
      if (value > 80.0) return 'critical';
      if (value > 60.0) return 'warning';
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
      const ph = toOptionalNum(item.ph);
      const dissolvedOxygenMgL = toOptionalNum(item.dissolvedOxygenMgL ?? item.do);
      const temperatureC = toOptionalNum(item.temperatureC ?? item.temperature);
      const salinityPpt = toOptionalNum(item.salinityPpt ?? item.salinity);
      const ammoniaMgL = toOptionalNum(item.ammoniaMgL ?? item.nh3);
      const turbidityNtu = toOptionalNum(item.turbidityNtu ?? item.turbidity);

      const hasAnyMetric =
        ph !== undefined ||
        dissolvedOxygenMgL !== undefined ||
        temperatureC !== undefined ||
        salinityPpt !== undefined ||
        ammoniaMgL !== undefined ||
        turbidityNtu !== undefined;

      if (!item.id && !hasAnyMetric) return null;

      return {
        ...item,
        ph: ph ?? null,
        dissolvedOxygenMgL: dissolvedOxygenMgL ?? null,
        temperatureC: temperatureC ?? null,
        salinityPpt: salinityPpt ?? null,
        ammoniaMgL: ammoniaMgL ?? null,
        turbidityNtu: turbidityNtu ?? null,
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
      modelName: item?.modelName ? String(item.modelName) : undefined,
      modelVersion: item?.modelVersion ? String(item.modelVersion) : undefined,
      predictedFeedAmountKg: Number(item?.predictedFeedAmountKg) || 0,
      safeAllowedAmountKg: Number(item?.safeAllowedAmountKg ?? item?.predictedFeedAmountKg) || 0,
      baseValueKg: toNullableNumber(item?.baseValueKg),
      biomassKg: Number(item?.biomassKg) || 0,
      feedRatePercent: Number(item?.feedRatePercent) || 0,
      safetyDecision: item?.safetyDecision ?? 'allowed',
      safetyReasons: Array.isArray(item?.safetyReasons) ? item.safetyReasons : [],
      explanation: String(item?.explanation ?? ''),
      featureContributions: Array.isArray(item?.featureContributions)
        ? item.featureContributions
        : undefined,
      inputSnapshot:
        item?.inputSnapshot && typeof item.inputSnapshot === 'object'
          ? item.inputSnapshot
          : item?.featureBreakdown && typeof item.featureBreakdown === 'object'
          ? item.featureBreakdown
          : undefined,
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
        recommendation:
          typeof item.recommendation === 'string'
            ? item.recommendation
            : normalizeAiRecommendation(item.recommendation),
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
   * 9.1b. Lấy ngưỡng thức ăn giới hạn & gợi ý lập lịch cho ăn (GET /ponds/:pondId/feeding-schedules/recommendation)
   */
  async getFeedingScheduleRecommendation(
    pondId: string
  ): Promise<FeedingScheduleRecommendation | null> {
    try {
      const res = await apiClient.get<any>(Endpoints.feedings.scheduleRecommendation(pondId));
      return (res.data?.data ?? res.data) || null;
    } catch {
      return null;
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
    const body: EvaluateSafetyRequest = {
      requestedAmountKg: payload.requestedAmountKg,
      ...(isValidUuid(payload.deviceId) ? { deviceId: payload.deviceId.trim() } : {}),
    };

    try {
      const response = await apiClient.post<EvaluateSafetyResponse>(
        Endpoints.safetyRules.evaluate(pondId),
        body
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
      const phVal = fallbackTelemetry.ph ?? undefined;
      const nh3Val = fallbackTelemetry.ammoniaMgL ?? undefined;
      const tempVal = fallbackTelemetry.temperatureC ?? undefined;

      const reasons: string[] = [];
      const appliedRules: string[] = [];

      if (doVal < 3.5) {
        reasons.push(
          `Nồng độ oxy hòa tan (DO = ${doVal} mg/L) quá thấp (< 3.5 mg/L). Cấm cho ăn để tránh tôm bị ngạt và ô nhiễm đáy ao.`
        );
        appliedRules.push('DO_CRITICAL_BLOCKED');
      }
      if (phVal !== undefined && (phVal < 7.0 || phVal > 9.0)) {
        reasons.push(
          `Độ pH nước (${phVal}) vượt ngưỡng nguy hiểm (< 7.0 hoặc > 9.0). Cấm xả thức ăn.`
        );
        appliedRules.push('PH_CRITICAL_BLOCKED');
      }
      if (nh3Val !== undefined && nh3Val > 0.3) {
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

      if (
        doVal < 4.0 ||
        (phVal !== undefined && (phVal < 7.2 || phVal > 8.8)) ||
        (nh3Val !== undefined && nh3Val > 0.1)
      ) {
        const adjustedKg = Number((payload.requestedAmountKg * 0.7).toFixed(1));
        return {
          decision: 'adjusted',
          allowedAmountKg: adjustedKg,
          requestedAmountKg: payload.requestedAmountKg,
          reasons: [
            `Oxy hòa tan (${doVal} mg/L) hoặc chỉ số nước ở mức cần chú ý. Hệ thống tự động giảm 30% khẩu phần xuống ${adjustedKg} kg để đảm bảo an toàn.`,
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
        reasons: ['Các chỉ số môi trường nước nằm trong ngưỡng an toàn. Cho phép xả 100% khẩu phần.'],
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
    const body: TriggerFeedingRequest = {
      requestedAmountKg: payload.requestedAmountKg,
      source: payload.source,
      ...(isValidUuid(payload.deviceId) ? { deviceId: payload.deviceId.trim() } : {}),
      ...(isValidUuid(payload.scheduleId) ? { scheduleId: payload.scheduleId.trim() } : {}),
      ...(payload.useAiPrediction !== undefined ? { useAiPrediction: payload.useAiPrediction } : {}),
      ...(payload.stoppedReason !== undefined ? { stoppedReason: payload.stoppedReason } : {}),
    };
    const response = await apiClient.post<FeedingRecord>(
      Endpoints.feedings.triggerRecord(pondId),
      body
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
        temperature: Number(item.temperatureC ?? 0),
        do: Number(item.dissolvedOxygenMgL ?? 0),
        ph: Number(item.ph ?? 0),
        salinity: Number(item.salinityPpt ?? 0),
        nh3: Number(item.ammoniaMgL ?? 0),
        turbidity: Number(item.turbidityNtu ?? 0),
        orp: 300,
      },
    }));
  },
};
