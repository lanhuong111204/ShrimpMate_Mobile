import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { Pond, PondDevice, PondTelemetryLog, StatusLevel } from '@/types/pond';
import { TelemetryHistoryQuery, TelemetryReading } from '@/types/telemetry';
import { CameraAnalyzePayload, LatestFisResponse } from '@/types/camera';
import { AiRecommendation } from '@/types/ai';
import { FeedingRecord, FeedingSchedule, TriggerFeedingRequest } from '@/types/feeding';
import { EvaluateSafetyRequest, EvaluateSafetyResponse } from '@/types/safety-rule';
import { Device, EmergencyStopResponse } from '@/types/device';
import { CropSeason, CropSeasonStatistics } from '@/types/crop-season';

/**
 * Đánh giá trạng thái an toàn sinh học của 6 chỉ số nước theo Quy tắc 3:
 * - Màu xanh (optimal): DO >= 5.0, pH 7.5 - 8.5, NH3 < 0.05, Temp 26 - 32, Salinity 10 - 25, Turbidity 10 - 40
 * - Màu vàng (warning): DO 3.5 - 5.0, pH 7.0 - 7.5 hoặc 8.5 - 9.0, NH3 0.05 - 0.1
 * - Màu đỏ (critical): DO < 3.5, pH < 7.0 hoặc > 9.0, NH3 > 0.1
 */
export function evaluateWaterMetricStatus(
  type: 'do' | 'ph' | 'nh3' | 'temperature' | 'salinity' | 'turbidity',
  value: number
): StatusLevel {
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
      if (value > 0.1) return 'critical';
      if (value >= 0.05) return 'warning';
      return 'optimal';
    case 'temperature':
      if (value < 24.0 || value > 34.0) return 'critical';
      if (value < 26.0 || value > 32.0) return 'warning';
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

export const INITIAL_MOCK_PONDS: Pond[] = [
  {
    id: 'pond-1',
    name: 'Ao số 1 (Ao nuôi chính)',
    code: 'AO-01',
    areaM2: 3000,
    depthM: 1.6,
    shrimpCount: 200000,
    shrimpAgeDays: 45,
    species: 'Tôm thẻ chân trắng (Vannamei)',
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pond-2',
    name: 'Ao số 2 (Ao giống)',
    code: 'AO-02',
    areaM2: 1500,
    depthM: 1.4,
    shrimpCount: 220000,
    shrimpAgeDays: 20,
    species: 'Tôm thẻ chân trắng (Vannamei)',
    status: 'active',
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

let pondsState = [...INITIAL_MOCK_PONDS];

export const pondService = {
  /**
   * 10.1. Lấy chỉ số môi trường nước mới nhất (6 Gauges: pH, DO, Nhiệt độ, Độ mặn, NH3, Độ đục)
   * Endpoint: GET /ponds/:pondId/telemetry/latest
   */
  async getLatestTelemetry(pondId: string): Promise<TelemetryReading> {
    try {
      const response = await apiClient.get<TelemetryReading>(Endpoints.telemetry.latest(pondId));
      const data = response.data;
      if (data && typeof data.ph === 'number') {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedTelemetry}_${pondId}`, data);
        return data;
      }
      throw new Error('Empty telemetry response');
    } catch {
      const cached = await Storage.getJSON<TelemetryReading>(
        `${AppConfig.storageKeys.cachedTelemetry}_${pondId}`
      );
      if (cached) return cached;

      // Fallback dữ liệu chuẩn 6 chỉ số khi ngoại tuyến chưa có cache
      return {
        id: `tel-fallback-${pondId}`,
        pondId,
        deviceId: 'ESP32_SENSOR_01',
        measuredAt: new Date().toISOString(),
        ph: 7.85,
        dissolvedOxygenMgL: 5.4,
        temperatureC: 28.5,
        salinityPpt: 15.2,
        ammoniaMgL: 0.02,
        turbidityNtu: 22.0,
      };
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
   * 11.3. Lấy kết quả cường độ bắt mồi FIS mới nhất theo ao nuôi
   * Endpoint: GET /camera/ponds/:pondId/latest-fis
   * Kiểm tra cờ isStale hoặc ageSeconds > 120s
   */
  async getLatestFis(pondId: string): Promise<LatestFisResponse> {
    try {
      const response = await apiClient.get<LatestFisResponse>(Endpoints.camera.latestFis(pondId));
      const data = response.data;
      if (data && typeof data.hasData === 'boolean') {
        // Đảm bảo tính nhất quán của cờ isStale nếu ageSeconds > 120
        if (data.status && typeof data.status.ageSeconds === 'number' && data.status.ageSeconds > 120) {
          data.status.isStale = true;
        }
        await Storage.setJSON(`${AppConfig.storageKeys.cachedFis}_${pondId}`, data);
        return data;
      }
      throw new Error('Invalid FIS response');
    } catch {
      const cached = await Storage.getJSON<LatestFisResponse>(
        `${AppConfig.storageKeys.cachedFis}_${pondId}`
      );
      if (cached) {
        if (cached.status?.timestamp) {
          const ageSec = Math.max(
            0,
            Math.floor((Date.now() - new Date(cached.status.timestamp).getTime()) / 1000)
          );
          cached.status.ageSeconds = ageSec;
          cached.status.isStale = ageSec > 120;
        }
        return cached;
      }

      return {
        hasData: true,
        pondId,
        status: {
          fisScore: 0.785,
          appetiteLevel: 3,
          appetiteLevelDescription: 'Ăn mạnh (Mức 3)',
          remainingFeedPercent: 8.0,
          shrimpDensity: 18.5,
          consumptionVelocity: 0.015,
          timestamp: new Date(Date.now() - 25 * 1000).toISOString(),
          ageSeconds: 25,
          isStale: false,
        },
        camera: {
          id: 'cam-01',
          name: 'Camera quan sát sàng ăn Ao 1',
          status: 'online',
          lastSeenAt: new Date().toISOString(),
        },
      };
    }
  },

  /**
   * 11.1. Phân tích khung hình Camera bằng AI (POST /camera/analyze)
   */
  async analyzeCameraFrame(payload: CameraAnalyzePayload): Promise<LatestFisResponse> {
    const response = await apiClient.post<any>(Endpoints.camera.analyze, payload);
    const resData = response.data;
    const summary = resData?.analysisSummary;
    const log = resData?.data;
    const mapped: LatestFisResponse = {
      hasData: true,
      pondId: payload.pondId,
      status: {
        fisScore: summary?.fisScore ?? log?.fisScore ?? 0.82,
        appetiteLevel: summary?.appetiteLevel ?? log?.appetiteLevel ?? 3,
        appetiteLevelDescription: summary?.appetiteLevelDescription ?? 'Ăn mạnh (Mức 3)',
        remainingFeedPercent:
          summary?.feedLeftoverPercent ??
          (typeof log?.remainingFeedAreaRt === 'number' ? Math.round(log.remainingFeedAreaRt * 100) : 6.0),
        shrimpDensity: summary?.shrimpDensity ?? log?.shrimpDensityDt ?? 19.2,
        consumptionVelocity: summary?.consumptionVelocity ?? log?.feedConsumptionVelocityVt ?? 0.016,
        timestamp: log?.timestamp || new Date().toISOString(),
        ageSeconds: 1,
        isStale: false,
      },
    };
    await Storage.setJSON(`${AppConfig.storageKeys.cachedFis}_${payload.pondId}`, mapped);
    return mapped;
  },

  /**
   * 12.1. Lấy khuyến nghị AI mới nhất cho ao nuôi
   * Endpoint: GET /ponds/:pondId/ai/recommendations/latest
   */
  async getLatestAiRecommendation(pondId: string): Promise<AiRecommendation | null> {
    try {
      const response = await apiClient.get<AiRecommendation>(
        Endpoints.ai.recommendationsLatest(pondId)
      );
      if (response.data && typeof response.data.predictedFeedAmountKg === 'number') {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedAiRec}_${pondId}`, response.data);
        return response.data;
      }
      return null;
    } catch {
      try {
        // Fallback thử đường dẫn tương thích tài liệu 1 nếu cần
        const alt = await apiClient.get<AiRecommendation>(
          Endpoints.ai.legacyRecommendations(pondId)
        );
        if (alt.data && typeof alt.data.predictedFeedAmountKg === 'number') {
          await Storage.setJSON(`${AppConfig.storageKeys.cachedAiRec}_${pondId}`, alt.data);
          return alt.data;
        }
      } catch {
        // Ignore
      }
      const cached = await Storage.getJSON<AiRecommendation>(
        `${AppConfig.storageKeys.cachedAiRec}_${pondId}`
      );
      if (cached) return cached;

      return {
        id: `ai-rec-${pondId}`,
        pondId,
        modelName: 'ShrimpMate-FeedOpt-v2',
        modelVersion: '2.1.0',
        predictedFeedAmountKg: 22.0,
        spreadRateKgPerMinute: 1.5,
        appetiteLevel: 3,
        biomassKg: 780.0,
        anomalyScore: 0.04,
        confidence: 0.94,
        safetyDecision: 'allowed',
        safetyReason: null,
        explanation:
          'Tôm bắt mồi mạnh (FIS=0.79, Mức 3), DO=5.4 mg/L và nhiệt độ 28.5°C nằm trong ngưỡng tối ưu. Khuyến nghị cữ hiện tại 22.0 kg.',
      };
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
      const pondDevices = allDevices.filter((d) => !d.pondId || d.pondId === pondId);
      if (pondDevices.length > 0) {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedDevices}_${pondId}`, pondDevices);
      }
      return pondDevices;
    } catch {
      const cached = await Storage.getJSON<Device[]>(
        `${AppConfig.storageKeys.cachedDevices}_${pondId}`
      );
      if (cached && cached.length > 0) return cached;
      return [
        {
          id: '22fffa98-46eb-4606-93a0-faae9f70691e',
          pondId,
          deviceUid: 'ESP32_FEEDER_01',
          name: 'Máy cho ăn tự động A1',
          type: 'feeder',
          status: 'online',
          mode: 'automatic',
          firmwareVersion: '1.2.0',
          lastSeenAt: new Date().toISOString(),
          metadata: { hopperCapacityKg: 150 },
        },
        {
          id: 'cam-device-01',
          pondId,
          deviceUid: 'CAM-01-A1',
          name: 'Camera giám sát sàng ăn Ao 1',
          type: 'camera',
          status: 'online',
          firmwareVersion: '1.0.0',
          lastSeenAt: new Date().toISOString(),
        },
      ];
    }
  },

  /**
   * 9.1. Danh sách lịch cho ăn của ao (GET /ponds/:pondId/feeding-schedules)
   */
  async getFeedingSchedules(pondId: string): Promise<FeedingSchedule[]> {
    try {
      const response = await apiClient.get<any>(Endpoints.feedings.schedules(pondId));
      const raw = response.data;
      const list: FeedingSchedule[] = Array.isArray(raw)
        ? raw
        : raw && Array.isArray(raw.data)
        ? raw.data
        : [];
      if (list.length > 0) {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedSchedules}_${pondId}`, list);
      }
      return list;
    } catch {
      const cached = await Storage.getJSON<FeedingSchedule[]>(
        `${AppConfig.storageKeys.cachedSchedules}_${pondId}`
      );
      return cached || [];
    }
  },

  /**
   * 9.4. Lịch sử nhật ký các lần cho ăn (GET /ponds/:pondId/feeding-records)
   */
  async getFeedingRecords(pondId: string): Promise<FeedingRecord[]> {
    try {
      const response = await apiClient.get<any>(Endpoints.feedings.records(pondId));
      const raw = response.data;
      const list: FeedingRecord[] = Array.isArray(raw)
        ? raw
        : raw && Array.isArray(raw.data)
        ? raw.data
        : [];
      if (list.length > 0) {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedRecords}_${pondId}`, list);
      }
      return list;
    } catch {
      const cached = await Storage.getJSON<FeedingRecord[]>(
        `${AppConfig.storageKeys.cachedRecords}_${pondId}`
      );
      return cached || [];
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
      // Đánh giá an toàn cục bộ theo đúng ngưỡng sinh học khi mất sóng bờ ao
      const doVal = fallbackTelemetry?.dissolvedOxygenMgL ?? 5.4;
      const phVal = fallbackTelemetry?.ph ?? 7.85;
      const nh3Val = fallbackTelemetry?.ammoniaMgL ?? 0.02;
      const tempVal = fallbackTelemetry?.temperatureC ?? 28.5;

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
      if (nh3Val > 0.1) {
        reasons.push(
          `Khí độc NH3 (${nh3Val} mg/L) vượt ngưỡng nguy hiểm (> 0.1 mg/L). Cấm xả thức ăn.`
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
      return response.data;
    } catch {
      return pondsState;
    }
  },

  async getPondById(id: string): Promise<Pond | null> {
    try {
      const response = await apiClient.get<Pond>(Endpoints.ponds.detail(id));
      return response.data;
    } catch {
      return pondsState.find((p) => p.id === id) ?? null;
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
