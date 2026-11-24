import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/context/auth-context';
import { farmPondService } from '@/api/services/farm-pond.service';
import { pondService } from '@/api/services/pond.service';
import { alertService } from '@/api/services/alert.service';
import {
  DeviceStatusSocketPayload,
  FeederStatusSocketPayload,
  FeedingCompletedSocketPayload,
  socketService,
  TelemetrySocketPayload,
} from '@/api/socket.service';
import { CreateFarmRequest, Farm } from '@/types/farm';
import { CreatePondRequest, Pond } from '@/types/pond';
import { TelemetryReading } from '@/types/telemetry';
import {
  AiRecommendation,
  PredictFeedOverrideDto,
  PredictFeedResponse,
  PredictedTrendsResponse,
} from '@/types/ai';
import { FeedingRecord, FeedingSchedule, FeedingSource, FeedingStatus } from '@/types/feeding';
import { EvaluateSafetyResponse } from '@/types/safety-rule';
import { Device, DeviceMode, DeviceStatus } from '@/types/device';
import { AlertItem, AlertSummary } from '@/types/alert';

export interface FarmInfo {
  farmerName: string;
  farmName: string;
  location: string;
  salinity?: number; // ‰
  tideInfo?: string;
  pondScale?: '1-3' | '4-8' | '8+';
  selectedPond: string;
  waterTemp?: number; // °C
  dissolvedOxygen?: number; // mg/L
  ph?: number;
  nh3?: number; // mg/L
  turbidity?: number; // NTU
  measuredAt?: string;
}

export interface FeedingMeal {
  id: string;
  time: string;
  name: string;
  period: 'Sáng' | 'Trưa' | 'Chiều' | 'Tối';
  status: 'completed' | 'active' | 'ai_suggested' | 'pending';
  feedType: string;
  targetKg: number;
  dispensedKg: number;
  speedKgPerMin?: number;
  estRemainingMinutes?: number;
  progressPercent?: number;
  notes?: string;
  aiSuggestedKg?: number;
  isAiAccepted?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'feed' | 'water' | 'probiotics' | 'nutrition' | 'minerals';
  spec: string;
  subtitle: string;
  stockCount: number;
  unit: string;
  totalKgOrL?: number;
  stockStatus?: 'low' | 'normal' | 'good';
}

export interface QuickFeedResult {
  success: boolean;
  evaluation: EvaluateSafetyResponse;
  record?: FeedingRecord;
  errorMessage?: string;
  isSafetyBlocked?: boolean;
}

interface FarmContextType {
  // 1. Trạng thái Farm & Pond được phân công (UC020, UC021)
  farms: Farm[];
  selectedFarm: Farm | null;
  ponds: Pond[];
  selectedPond: Pond | null;
  isLoadingFarms: boolean;
  isLoadingPonds: boolean;
  farmError: string | null;
  selectFarm: (farmId: string) => Promise<void>;
  selectPond: (pondId: string) => void;
  refreshFarmsAndPonds: () => Promise<void>;
  createFarm: (data: CreateFarmRequest) => Promise<Farm>;
  createPond: (data: CreatePondRequest) => Promise<Pond>;

  // 2. Dữ liệu thời gian thực của Ao đang chọn (Telemetry 6 Gauges, AI, Devices, Alerts)
  latestTelemetry: TelemetryReading | null;
  latestAiRecommendation: AiRecommendation | null;
  predictedTrends: PredictedTrendsResponse | null;
  pondDevices: Device[];
  feederDevice: Device | null;
  feedingSchedules: FeedingSchedule[];
  feedingRecords: FeedingRecord[];
  lastSafetyEvaluation: EvaluateSafetyResponse | null;
  alerts: AlertItem[];
  alertSummary: AlertSummary | null;
  isRefreshingPondData: boolean;
  refreshPondOperationalData: () => Promise<void>;

  // 3. Các hành động nghiệp vụ bờ ao chuẩn Backend API
  evaluateSafetyBeforeFeed: (requestedAmountKg: number) => Promise<EvaluateSafetyResponse>;
  triggerQuickFeed: (
    requestedAmountKg: number,
    source?: FeedingSource,
    scheduleId?: string,
    note?: string
  ) => Promise<QuickFeedResult>;
  requestAiFeedPrediction: (
    overrideDto?: PredictFeedOverrideDto
  ) => Promise<PredictFeedResponse | null>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;

  // 4. Dữ liệu & hàm tương thích UI
  farmInfo: FarmInfo;
  updateFarmInfo: (info: Partial<FarmInfo>) => void;
  feedMeals: FeedingMeal[];
  updateFeedMeal: (id: string, updates: Partial<FeedingMeal>) => void;
  addExtraMeal: (kg: number, note: string) => Promise<void>;
  dispensedKg: number;
  targetKg: number;
  feederPaused: boolean;
  feederRadius: '3m' | '6m' | '9m';
  hopperKg: number;
  isEmergencyStopped: boolean;
  toggleFeederPause: () => Promise<void>;
  addFeederKg: (kg: number) => Promise<void>;
  setFeederRadius: (r: '3m' | '6m' | '9m') => void;
  triggerEmergencyStop: () => Promise<void>;
  resetEmergencyStop: () => Promise<void>;
  inventory: InventoryItem[];
  dispenseFeedBag: (itemId: string, kg?: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
}

const initialFarmInfo: FarmInfo = {
  farmerName: '',
  farmName: '',
  location: '',
  selectedPond: '',
};

function getPeriodFromTime(timeOfDay: string): 'Sáng' | 'Trưa' | 'Chiều' | 'Tối' {
  const hour = parseInt(timeOfDay.split(':')[0] || '8', 10);
  if (hour < 10) return 'Sáng';
  if (hour < 14) return 'Trưa';
  if (hour < 18) return 'Chiều';
  return 'Tối';
}

function computeAlertSummaryFromList(items: AlertItem[]): AlertSummary {
  const open = items.filter((a) => !a.status || a.status === 'open').length;
  const acknowledged = items.filter((a) => a.status === 'acknowledged').length;
  const resolved = items.filter((a) => a.status === 'resolved').length;
  const critical = items.filter(
    (a) => (a.severity === 3 || a.severity === 'critical') && a.status !== 'resolved'
  ).length;
  const warning = items.filter(
    (a) => (a.severity === 2 || a.severity === 'warning') && a.status !== 'resolved'
  ).length;
  const monitoring = items.filter(
    (a) =>
      (a.severity === 1 || a.severity === 'monitoring' || a.severity === 'info') &&
      a.status !== 'resolved'
  ).length;

  return {
    total: items.length,
    open,
    acknowledged,
    resolved,
    bySeverity: {
      critical,
      warning,
      monitoring,
    },
  };
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isOfflineMode, user } = useAuth();

  // Trạng thái Farm & Pond động từ Backend
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);
  const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(true);
  const [isLoadingPonds, setIsLoadingPonds] = useState<boolean>(false);
  const [farmError, setFarmError] = useState<string | null>(null);

  // Trạng thái vận hành thực tế theo ao đang chọn
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryReading | null>(null);
  const [latestAiRecommendation, setLatestAiRecommendation] = useState<AiRecommendation | null>(
    null
  );
  const [predictedTrends, setPredictedTrends] = useState<PredictedTrendsResponse | null>(null);
  const [pondDevices, setPondDevices] = useState<Device[]>([]);
  const [feedingSchedules, setFeedingSchedules] = useState<FeedingSchedule[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [lastSafetyEvaluation, setLastSafetyEvaluation] = useState<EvaluateSafetyResponse | null>(
    null
  );
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [isRefreshingPondData, setIsRefreshingPondData] = useState<boolean>(false);

  // Trạng thái bảo lưu tương thích UI
  const [farmInfo, setFarmInfo] = useState<FarmInfo>(initialFarmInfo);
  const [feedMeals, setFeedMeals] = useState<FeedingMeal[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [dispensedKg, setDispensedKg] = useState<number>(0);
  const [targetKg, setTargetKg] = useState<number>(0);
  const [feederPaused, setFeederPaused] = useState<boolean>(false);
  const [feederRadius, setFeederRadius] = useState<'3m' | '6m' | '9m'>('6m');
  const [hopperKg, setHopperKg] = useState<number>(0);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState<boolean>(false);

  // Refs chống race condition và stale closure cho WebSocket
  const fetchSeqRef = useRef(0);
  const selectedPondIdRef = useRef<string | null>(null);
  const pondDevicesRef = useRef<Device[]>([]);
  const seenAlertIdsRef = useRef<Set<string>>(new Set());
  const seenAlertEventKeysRef = useRef<Set<string>>(new Set());
  const seenCompletedIdsRef = useRef<Set<string>>(new Set());

  const feederDevice: Device | null = useMemo(
    () => pondDevices.find((d) => d.type === 'feeder') || null,
    [pondDevices]
  );

  useEffect(() => {
    selectedPondIdRef.current = selectedPond?.id ?? null;
  }, [selectedPond?.id]);

  useEffect(() => {
    pondDevicesRef.current = pondDevices;
  }, [pondDevices]);

  const clearPondOperationalState = useCallback(() => {
    fetchSeqRef.current += 1;
    setLatestTelemetry(null);
    setLatestAiRecommendation(null);
    setPredictedTrends(null);
    setPondDevices([]);
    setFeedingSchedules([]);
    setFeedingRecords([]);
    setFeedMeals([]);
    setLastSafetyEvaluation(null);
    setAlerts([]);
    setAlertSummary(null);
    setDispensedKg(0);
    setTargetKg(0);
    setHopperKg(0);
    setFeederPaused(false);
    setIsEmergencyStopped(false);
  }, []);

  /**
   * Nạp toàn bộ dữ liệu vận hành thời gian thực cho một Ao nuôi cụ thể
   */
  const loadPondOperationalData = useCallback(
    async (pondId: string, options?: { silent?: boolean }) => {
      if (!pondId) return;
      const seq = ++fetchSeqRef.current;
      if (!options?.silent) {
        setIsRefreshingPondData(true);
      }

      try {
        const [
          telemetry,
          aiRec,
          trends,
          devices,
          schedules,
          records,
          pondAlerts,
          summary,
        ] = await Promise.all([
          pondService.getLatestTelemetry(pondId),
          pondService.getLatestAiRecommendation(pondId),
          pondService.getPredictedTrends(pondId).catch(() => null),
          pondService.getDevicesByPond(pondId),
          pondService.getFeedingSchedules(pondId),
          pondService.getFeedingRecords(pondId),
          alertService.getPondAlerts(pondId),
          alertService.getAlertSummary(pondId),
        ]);

        // Race condition guard: bỏ qua kết quả cũ nếu người dùng đã chuyển ao khác
        if (seq !== fetchSeqRef.current) return;

        // 1. Cập nhật Telemetry 6 chỉ số
        setLatestTelemetry(telemetry);
        if (telemetry) {
          setFarmInfo((prev) => ({
            ...prev,
            waterTemp: telemetry.temperatureC,
            dissolvedOxygen: telemetry.dissolvedOxygenMgL,
            ph: telemetry.ph,
            salinity: telemetry.salinityPpt,
            nh3: telemetry.ammoniaMgL,
            turbidity: telemetry.turbidityNtu,
            measuredAt: telemetry.measuredAt,
          }));
        } else {
          setFarmInfo((prev) => ({
            ...prev,
            waterTemp: undefined,
            dissolvedOxygen: undefined,
            ph: undefined,
            salinity: undefined,
            nh3: undefined,
            turbidity: undefined,
            measuredAt: undefined,
          }));
        }

        // 2. Cập nhật Khuyến nghị AI & Xu hướng DO
        setLatestAiRecommendation(aiRec);
        setPredictedTrends(trends);

        // 3. Cập nhật Thiết bị IoT, Hopper & trạng thái Emergency Stop
        setPondDevices(devices);
        const feeder = devices.find((d) => d.type === 'feeder');
        if (feeder) {
          setIsEmergencyStopped(feeder.mode === 'emergency_stop');
          setFeederPaused(feeder.mode === 'manual' || feeder.mode === 'emergency_stop');
          const rawHopper = feeder.metadata?.hopperKg ?? feeder.metadata?.hopperCapacityKg;
          if (rawHopper !== undefined && rawHopper !== null && !isNaN(Number(rawHopper))) {
            setHopperKg(Math.min(150, Number(rawHopper)));
          } else {
            setHopperKg(0);
          }
        } else {
          setIsEmergencyStopped(false);
          setFeederPaused(false);
          setHopperKg(0);
        }

        // 4. Cập nhật Lịch ăn & Nhật ký cho ăn
        setFeedingSchedules(schedules);
        setFeedingRecords(records);

        if (schedules.length > 0) {
          const mappedMeals: FeedingMeal[] = schedules.map((sch, idx) => {
            const matchingRecord = records.find((r) => r.scheduleId === sch.id);
            const isRunning = matchingRecord?.status === 'running';
            const isDone = matchingRecord?.status === 'completed';
            const period = getPeriodFromTime(sch.timeOfDay);
            const isAiSlot = idx === schedules.length - 2 || period === 'Chiều';
            return {
              id: sch.id,
              time: sch.timeOfDay,
              name: sch.name || `Cữ ${idx + 1} (${period})`,
              period,
              status: isRunning
                ? 'active'
                : isDone
                ? 'completed'
                : isAiSlot && aiRec
                ? 'ai_suggested'
                : 'pending',
              feedType: 'Cám số 2 hạt nổi (Grobest)',
              targetKg: Number(sch.feedAmountKg) || 0,
              dispensedKg: matchingRecord
                ? Number(matchingRecord.actualAmountKg) || 0
                : isDone
                ? Number(sch.feedAmountKg) || 0
                : 0,
              speedKgPerMin:
                sch.spreadRateKgPerMinute !== undefined
                  ? Number(sch.spreadRateKgPerMinute) || 0
                  : undefined,
              aiSuggestedKg: isAiSlot && aiRec ? Number(aiRec.predictedFeedAmountKg) || 0 : undefined,
              notes:
                matchingRecord?.safetyReason ||
                (sch.isEnabled ? 'Lịch tự động đang bật' : 'Tạm ngưng'),
            };
          });
          setFeedMeals(mappedMeals);
        } else {
          setFeedMeals([]);
        }

        const activeRec = records.find((r) => r.status === 'running') || records[0];
        if (activeRec) {
          setDispensedKg(Number(activeRec.actualAmountKg) || 0);
          setTargetKg(Number(activeRec.requestedAmountKg) || 0);
        } else {
          setDispensedKg(0);
          setTargetKg(0);
        }

        // 5. Cảnh báo (ghi nhận ID đã tải để deduplicate sự kiện WebSocket)
        pondAlerts.forEach((a) => {
          if (a.id) {
            seenAlertIdsRef.current.add(a.id);
            seenAlertEventKeysRef.current.add(`${a.id}:${a.status ?? 'open'}`);
          }
        });
        setAlerts(pondAlerts);
        setAlertSummary(summary);

        // 6. Đánh giá trước Safety Rule nếu có chỉ số nước
        if (telemetry) {
          try {
            const safetyEval = await pondService.evaluateSafetyBeforeFeed(
              pondId,
              {
                ...(feeder?.id ? { deviceId: feeder.id } : {}),
                requestedAmountKg: 15.0,
              },
              telemetry
            );
            if (seq !== fetchSeqRef.current) return;
            setLastSafetyEvaluation(safetyEval);
          } catch {
            if (seq !== fetchSeqRef.current) return;
            setLastSafetyEvaluation(null);
          }
        } else {
          setLastSafetyEvaluation(null);
        }
      } finally {
        if (seq === fetchSeqRef.current && !options?.silent) {
          setIsRefreshingPondData(false);
        }
      }
    },
    []
  );

  /**
   * Tải toàn bộ danh sách Farms và Ponds khi người dùng đăng nhập
   */
  const loadFarmsAndPonds = useCallback(async () => {
    if (!isAuthenticated) {
      setFarms([]);
      setSelectedFarm(null);
      setPonds([]);
      setSelectedPond(null);
      clearPondOperationalState();
      setIsLoadingFarms(false);
      setIsLoadingPonds(false);
      return;
    }

    setIsLoadingFarms(true);
    setFarmError(null);
    try {
      const farmsList = await farmPondService.getFarms(undefined, user?.id);
      setFarms(farmsList);

      if (farmsList.length > 0) {
        const savedFarmId = await farmPondService.getSelectedFarmId();
        const currentFarm = farmsList.find((f) => f.id === savedFarmId) || farmsList[0];
        setSelectedFarm(currentFarm);
        await farmPondService.setSelectedFarmId(currentFarm.id);

        setIsLoadingPonds(true);
        try {
          const pondsList = await farmPondService.getPondsByFarm(
            currentFarm.id,
            undefined,
            user?.id
          );
          setPonds(pondsList);

          if (pondsList.length > 0) {
            const savedPondId = await farmPondService.getSelectedPondId();
            const currentPond = pondsList.find((p) => p.id === savedPondId) || pondsList[0];
            setSelectedPond(currentPond);
            await farmPondService.setSelectedPondId(currentPond.id);

            setFarmInfo((prev) => ({
              ...prev,
              farmerName: user?.fullName || prev.farmerName,
              farmName: currentFarm.name,
              location: currentFarm.address || prev.location,
              selectedPond: currentPond.name || currentPond.code,
            }));

            await loadPondOperationalData(currentPond.id);
          } else {
            setSelectedPond(null);
            clearPondOperationalState();
            setFarmInfo((prev) => ({
              ...prev,
              farmerName: user?.fullName || prev.farmerName,
              farmName: currentFarm.name,
              location: currentFarm.address || prev.location,
              selectedPond: 'Chưa có ao giám sát',
            }));
          }
        } finally {
          setIsLoadingPonds(false);
        }
      } else {
        setSelectedFarm(null);
        setPonds([]);
        setSelectedPond(null);
        clearPondOperationalState();
        setFarmInfo((prev) => ({
          ...prev,
          farmerName: user?.fullName || prev.farmerName,
          farmName: 'Chưa được phân công trang trại',
          selectedPond: 'Chưa có ao giám sát',
        }));
      }
    } catch (err: any) {
      setFarmError(err?.message || 'Không thể tải danh sách trang trại được phân công');
    } finally {
      setIsLoadingFarms(false);
    }
  }, [isAuthenticated, user?.id, user?.fullName, loadPondOperationalData, clearPondOperationalState]);

  useEffect(() => {
    loadFarmsAndPonds();
  }, [loadFarmsAndPonds]);

  // Kết nối WebSocket thời gian thực khi đã đăng nhập trực tuyến
  useEffect(() => {
    if (!isAuthenticated || isOfflineMode) {
      socketService.disconnect();
      return;
    }

    socketService.connect();
    if (selectedPondIdRef.current) {
      socketService.joinPond(selectedPondIdRef.current);
    }

    const unsubTelemetry = socketService.onTelemetry((payload: TelemetrySocketPayload) => {
      if (!payload || payload.pondId !== selectedPondIdRef.current) return;

      setLatestTelemetry((prev) => {
        const nextReading: TelemetryReading = {
          id: String(payload.readingId ?? payload.id ?? prev?.id ?? `ws-${Date.now()}`),
          pondId: String(payload.pondId),
          deviceId: String(payload.deviceId ?? prev?.deviceId ?? ''),
          measuredAt: String(payload.measuredAt ?? payload.emittedAt ?? new Date().toISOString()),
          ph:
            payload.ph !== undefined && payload.ph !== null
              ? Number(payload.ph)
              : (prev?.ph ?? 0),
          dissolvedOxygenMgL:
            payload.dissolvedOxygenMgL !== undefined && payload.dissolvedOxygenMgL !== null
              ? Number(payload.dissolvedOxygenMgL)
              : payload.do !== undefined && payload.do !== null
              ? Number(payload.do)
              : (prev?.dissolvedOxygenMgL ?? 0),
          temperatureC:
            payload.temperatureC !== undefined && payload.temperatureC !== null
              ? Number(payload.temperatureC)
              : payload.temperature !== undefined && payload.temperature !== null
              ? Number(payload.temperature)
              : (prev?.temperatureC ?? 0),
          salinityPpt:
            payload.salinityPpt !== undefined && payload.salinityPpt !== null
              ? Number(payload.salinityPpt)
              : payload.salinity !== undefined && payload.salinity !== null
              ? Number(payload.salinity)
              : (prev?.salinityPpt ?? 0),
          ammoniaMgL:
            payload.ammoniaMgL !== undefined && payload.ammoniaMgL !== null
              ? Number(payload.ammoniaMgL)
              : payload.nh3 !== undefined && payload.nh3 !== null
              ? Number(payload.nh3)
              : (prev?.ammoniaMgL ?? 0),
          turbidityNtu:
            payload.turbidityNtu !== undefined && payload.turbidityNtu !== null
              ? Number(payload.turbidityNtu)
              : payload.turbidity !== undefined && payload.turbidity !== null
              ? Number(payload.turbidity)
              : (prev?.turbidityNtu ?? 0),
        };

        setFarmInfo((info) => ({
          ...info,
          waterTemp: nextReading.temperatureC,
          dissolvedOxygen: nextReading.dissolvedOxygenMgL,
          ph: nextReading.ph,
          salinity: nextReading.salinityPpt,
          nh3: nextReading.ammoniaMgL,
          turbidity: nextReading.turbidityNtu,
          measuredAt: nextReading.measuredAt,
        }));

        return nextReading;
      });
    });

    const unsubFeederStatus = socketService.onFeederStatus(
      (payload: FeederStatusSocketPayload) => {
        const currentPondId = selectedPondIdRef.current;
        if (!payload || !currentPondId) return;

        if (payload.pondId && payload.pondId !== 'all' && payload.pondId !== currentPondId) {
          return;
        }
        if (payload.pondId === 'all' && payload.deviceUid) {
          const belongsToPond = pondDevicesRef.current.some(
            (d) => d.deviceUid === payload.deviceUid
          );
          if (!belongsToPond) return;
        }

        if (payload.mode || payload.command === 'STOP') {
          const nextMode = (
            payload.command === 'STOP' ? 'emergency_stop' : payload.mode
          ) as DeviceMode;
          setPondDevices((prev) =>
            prev.map((d) => {
              const matches =
                (payload.deviceId && d.id === payload.deviceId) ||
                (payload.deviceUid && d.deviceUid === payload.deviceUid) ||
                d.type === 'feeder';
              if (!matches) return d;
              return {
                ...d,
                mode: nextMode,
                ...(payload.status && ['online', 'offline', 'error', 'maintenance'].includes(payload.status)
                  ? { status: payload.status as DeviceStatus }
                  : {}),
              };
            })
          );
          setIsEmergencyStopped(nextMode === 'emergency_stop');
          setFeederPaused(nextMode === 'manual' || nextMode === 'emergency_stop');
        }

        if (payload.recordId) {
          const nextStatus = payload.status as FeedingStatus | undefined;
          setFeedingRecords((prev) => {
            const idx = prev.findIndex((r) => r.id === payload.recordId);
            if (idx === -1) return prev;
            const updated: FeedingRecord = {
              ...prev[idx],
              ...(nextStatus ? { status: nextStatus } : {}),
              ...(payload.actualAmountKg !== undefined && payload.actualAmountKg !== null
                ? { actualAmountKg: Number(payload.actualAmountKg) }
                : {}),
              ...(payload.stoppedReason !== undefined
                ? { stoppedReason: payload.stoppedReason }
                : {}),
              ...(payload.safetyDecision
                ? { safetyDecision: payload.safetyDecision as FeedingRecord['safetyDecision'] }
                : {}),
            };
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          });

          if (payload.actualAmountKg !== undefined && payload.actualAmountKg !== null) {
            setDispensedKg(Number(payload.actualAmountKg) || 0);
          }
        }
      }
    );

    const unsubDeviceStatus = socketService.onDeviceStatus(
      (payload: DeviceStatusSocketPayload) => {
        if (!payload) return;
        if (payload.pondId && payload.pondId !== selectedPondIdRef.current) return;

        setPondDevices((prev) =>
          prev.map((d) => {
            const matches =
              d.id === payload.deviceId ||
              (payload.deviceUid && d.deviceUid === payload.deviceUid);
            if (!matches) return d;

            const updatedDevice: Device = {
              ...d,
              ...(payload.status ? { status: payload.status as DeviceStatus } : {}),
              ...(payload.mode ? { mode: payload.mode as DeviceMode } : {}),
              ...(payload.lastSeenAt !== undefined ? { lastSeenAt: payload.lastSeenAt } : {}),
            };

            if (updatedDevice.type === 'feeder' && payload.mode) {
              setIsEmergencyStopped(payload.mode === 'emergency_stop');
              setFeederPaused(
                payload.mode === 'manual' || payload.mode === 'emergency_stop'
              );
            }

            return updatedDevice;
          })
        );
      }
    );

    const unsubFeedingCompleted = socketService.onFeedingCompleted(
      (payload: FeedingCompletedSocketPayload) => {
        if (!payload || payload.pondId !== selectedPondIdRef.current) return;
        const dedupeKey = String(payload.recordId || payload.emittedAt || '');
        if (dedupeKey) {
          if (seenCompletedIdsRef.current.has(dedupeKey)) return;
          if (seenCompletedIdsRef.current.size > 200) {
            seenCompletedIdsRef.current.clear();
          }
          seenCompletedIdsRef.current.add(dedupeKey);
        }
        void loadPondOperationalData(payload.pondId, { silent: true });
      }
    );

    const unsubAlertNew = socketService.onAlertNew((alert: AlertItem) => {
      if (!alert || !alert.id || alert.pondId !== selectedPondIdRef.current) return;

      const eventKey = `${alert.id}:${alert.status ?? 'open'}`;
      if (seenAlertEventKeysRef.current.has(eventKey)) {
        return;
      }
      if (seenAlertEventKeysRef.current.size > 500) {
        seenAlertEventKeysRef.current.clear();
      }
      seenAlertEventKeysRef.current.add(eventKey);

      const isBrandNewAlert = !seenAlertIdsRef.current.has(alert.id);
      if (seenAlertIdsRef.current.size > 500) {
        seenAlertIdsRef.current.clear();
      }
      seenAlertIdsRef.current.add(alert.id);

      setAlerts((prev) => {
        const existingIndex = prev.findIndex((a) => a.id === alert.id);
        let nextAlerts: AlertItem[];
        if (existingIndex !== -1) {
          nextAlerts = [...prev];
          nextAlerts[existingIndex] = { ...prev[existingIndex], ...alert };
        } else {
          nextAlerts = [alert, ...prev];
        }
        setAlertSummary(computeAlertSummaryFromList(nextAlerts));
        return nextAlerts;
      });

      // Không phát âm thanh / popup cảnh báo nếu là bản tin đệm khi mất kết nối (isBuffered)
      if (isBrandNewAlert && alert.isBuffered !== true) {
        Alert.alert(
          alert.title || '⚠️ Cảnh Báo Ao Nuôi',
          alert.message || 'Phát hiện cảnh báo mới tại ao nuôi.'
        );
      }
    });

    return () => {
      unsubTelemetry();
      unsubFeederStatus();
      unsubDeviceStatus();
      unsubFeedingCompleted();
      unsubAlertNew();
      socketService.disconnect();
    };
  }, [isAuthenticated, isOfflineMode, loadPondOperationalData]);

  // Tham gia room WebSocket theo ao đang chọn
  useEffect(() => {
    const pondId = selectedPond?.id ?? null;
    if (!isAuthenticated || isOfflineMode) return;
    if (pondId) {
      socketService.joinPond(pondId);
    } else {
      socketService.leavePond();
    }
  }, [isAuthenticated, isOfflineMode, selectedPond?.id]);

  const selectFarm = useCallback(
    async (farmId: string) => {
      const targetFarm = farms.find((f) => f.id === farmId);
      if (!targetFarm) return;

      setSelectedFarm(targetFarm);
      await farmPondService.setSelectedFarmId(targetFarm.id);

      setIsLoadingPonds(true);
      try {
        const pondsList = await farmPondService.getPondsByFarm(
          targetFarm.id,
          undefined,
          user?.id
        );
        setPonds(pondsList);

        if (pondsList.length > 0) {
          const firstPond = pondsList[0];
          setSelectedPond(firstPond);
          await farmPondService.setSelectedPondId(firstPond.id);

          setFarmInfo((prev) => ({
            ...prev,
            farmName: targetFarm.name,
            location: targetFarm.address || prev.location,
            selectedPond: firstPond.name || firstPond.code,
          }));

          await loadPondOperationalData(firstPond.id);
        } else {
          setSelectedPond(null);
          clearPondOperationalState();
        }
      } catch (err: any) {
        setFarmError(err?.message || 'Không thể tải danh sách ao nuôi');
      } finally {
        setIsLoadingPonds(false);
      }
    },
    [farms, user?.id, loadPondOperationalData, clearPondOperationalState]
  );

  const selectPond = useCallback(
    (pondId: string) => {
      const targetPond = ponds.find((p) => p.id === pondId);
      if (!targetPond) return;

      setSelectedPond(targetPond);
      void farmPondService.setSelectedPondId(targetPond.id);

      setFarmInfo((prev) => ({
        ...prev,
        selectedPond: targetPond.name || targetPond.code,
      }));

      void loadPondOperationalData(targetPond.id);
    },
    [ponds, loadPondOperationalData]
  );

  const refreshFarmsAndPonds = useCallback(async () => {
    await loadFarmsAndPonds();
  }, [loadFarmsAndPonds]);

  const refreshPondOperationalData = useCallback(async () => {
    if (selectedPond?.id) {
      await loadPondOperationalData(selectedPond.id);
    }
  }, [selectedPond?.id, loadPondOperationalData]);

  const createFarm = useCallback(
    async (data: CreateFarmRequest): Promise<Farm> => {
      const newFarm = await farmPondService.createFarm(data);
      setFarms((prev) => [newFarm, ...prev]);
      await selectFarm(newFarm.id);
      return newFarm;
    },
    [selectFarm]
  );

  const createPond = useCallback(
    async (data: CreatePondRequest): Promise<Pond> => {
      if (!selectedFarm) {
        throw new Error('Vui lòng chọn trang trại trước khi thêm ao');
      }
      const newPond = await farmPondService.createPond(selectedFarm.id, data);
      setPonds((prev) => [newPond, ...prev]);
      selectPond(newPond.id);
      return newPond;
    },
    [selectedFarm, selectPond]
  );

  /**
   * Đánh giá an toàn trước khi cho ăn (POST /ponds/:pondId/safety-rules/evaluate)
   */
  const evaluateSafetyBeforeFeed = useCallback(
    async (requestedAmountKg: number): Promise<EvaluateSafetyResponse> => {
      if (!selectedPond?.id) {
        const blockedResult: EvaluateSafetyResponse = {
          decision: 'blocked',
          allowedAmountKg: 0,
          requestedAmountKg,
          reasons: ['Chưa chọn ao nuôi hợp lệ.'],
          appliedRules: [],
        };
        setLastSafetyEvaluation(blockedResult);
        return blockedResult;
      }

      const evalResult = await pondService.evaluateSafetyBeforeFeed(
        selectedPond.id,
        {
          ...(feederDevice?.id ? { deviceId: feederDevice.id } : {}),
          requestedAmountKg,
        },
        latestTelemetry
      );
      setLastSafetyEvaluation(evalResult);
      return evalResult;
    },
    [selectedPond?.id, feederDevice?.id, latestTelemetry]
  );

  /**
   * Luồng Cho ăn nhanh (Quick Feed) có khóa bảo vệ qua Safety Rule Engine:
   * 1. Gọi POST /ponds/:pondId/safety-rules/evaluate
   * 2. Nếu blocked -> chặn xả cám & báo lỗi vi phạm an toàn sinh học
   * 3. Nếu adjusted / allowed -> gọi POST /ponds/:pondId/feeding-records
   */
  const triggerQuickFeed = useCallback(
    async (
      requestedAmountKg: number,
      source: FeedingSource = 'manual',
      scheduleId?: string,
      note?: string
    ): Promise<QuickFeedResult> => {
      if (!selectedPond?.id) {
        return {
          success: false,
          evaluation: {
            decision: 'blocked',
            allowedAmountKg: 0,
            requestedAmountKg,
            reasons: ['Chưa chọn ao nuôi hợp lệ.'],
            appliedRules: [],
          },
          errorMessage: 'Chưa chọn ao nuôi hợp lệ.',
        };
      }

      const evaluation = await evaluateSafetyBeforeFeed(requestedAmountKg);

      if (evaluation.decision === 'blocked') {
        return {
          success: false,
          evaluation,
          isSafetyBlocked: true,
          errorMessage:
            evaluation.reasons.join('; ') ||
            'Chỉ số môi trường nước vượt ngưỡng nguy hiểm. Cấm xả cám!',
        };
      }

      const finalKg =
        evaluation.decision === 'adjusted' ? evaluation.allowedAmountKg : requestedAmountKg;

      try {
        const record = await pondService.triggerFeedingRecord(selectedPond.id, {
          ...(feederDevice?.id ? { deviceId: feederDevice.id } : {}),
          scheduleId,
          requestedAmountKg: finalKg,
          source,
        });

        setFeedingRecords((prev) => [record, ...prev]);

        if (record.safetyDecision === 'blocked' || record.status === 'stopped') {
          return {
            success: false,
            evaluation,
            record,
            isSafetyBlocked: true,
            errorMessage:
              record.safetyReason ||
              record.stoppedReason ||
              evaluation.reasons.join('; ') ||
              'Cữ cho ăn đã bị chặn bởi Safety Rule Engine.',
          };
        }

        setDispensedKg((prev) => {
          const updated = Number((prev + finalKg).toFixed(1));
          setTargetKg((prevTarget) => Math.max(prevTarget, updated));
          return updated;
        });

        const newMeal: FeedingMeal = {
          id: record.id || `meal-quick-${Date.now()}`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          name: `Cữ Cho Ăn Nhanh (${finalKg}kg)`,
          period: getPeriodFromTime(
            new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          ),
          status: 'active',
          feedType: 'Cám số 2 hạt nổi (Quick Feed)',
          targetKg: finalKg,
          dispensedKg: Number(record.actualAmountKg) || finalKg,
          notes:
            note ||
            (evaluation.decision === 'adjusted'
              ? `Đã điều chỉnh an toàn từ ${requestedAmountKg}kg xuống ${finalKg}kg`
              : 'Đã kiểm duyệt qua Safety Rule Engine (Allowed)'),
        };
        setFeedMeals((prev) => [newMeal, ...prev]);

        return { success: true, evaluation, record };
      } catch (err: any) {
        const statusCode = err?.statusCode || err?.response?.status;
        const errorMessage = err?.message || 'Không thể gửi lệnh cho ăn tới máy chủ.';
        return {
          success: false,
          evaluation,
          errorMessage,
          isSafetyBlocked: statusCode === 422,
        };
      }
    },
    [selectedPond?.id, feederDevice?.id, evaluateSafetyBeforeFeed]
  );

  /**
   * Yêu cầu AI dự báo khẩu phần ăn mới (POST /ponds/:pondId/ai/predict-feed)
   */
  const requestAiFeedPrediction = useCallback(
    async (overrideDto?: PredictFeedOverrideDto): Promise<PredictFeedResponse | null> => {
      if (!selectedPond?.id) return null;
      try {
        const res = await pondService.predictFeedDemand(selectedPond.id, overrideDto);
        const mappedRec: AiRecommendation = {
          id: res.recommendationId,
          pondId: res.pondId,
          modelName: res.modelName || 'XGBoost-Regressor',
          modelVersion: res.modelVersion || 'v2.0.0',
          predictedFeedAmountKg: res.predictedFeedAmountKg,
          safeAllowedAmountKg: res.safeAllowedAmountKg,
          baseValueKg: res.baseValueKg ?? null,
          biomassKg: res.biomassKg ?? null,
          feedRatePercent: res.feedRatePercent ?? null,
          safetyDecision: res.safetyDecision,
          safetyReason: res.safetyReasons?.length > 0 ? res.safetyReasons.join('; ') : null,
          safetyReasons: res.safetyReasons,
          explanation: res.explanation,
          featureContributions: res.featureContributions,
          inputSnapshot: res.inputSnapshot,
          createdAt: res.createdAt,
        };
        setLatestAiRecommendation(mappedRec);
        return res;
      } catch {
        return null;
      }
    },
    [selectedPond?.id]
  );

  const updateFarmInfo = useCallback((info: Partial<FarmInfo>) => {
    setFarmInfo((prev) => ({ ...prev, ...info }));
  }, []);

  const updateFeedMeal = useCallback((id: string, updates: Partial<FeedingMeal>) => {
    setFeedMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const addExtraMeal = useCallback(
    async (kg: number, note: string) => {
      const result = await triggerQuickFeed(kg, 'manual', undefined, note);
      if (!result.success) {
        const isBlocked = result.isSafetyBlocked || result.evaluation.decision === 'blocked';
        Alert.alert(
          isBlocked ? '⛔ KHÓA AN TOÀN SINH HỌC (BLOCKED)' : '❌ KHÔNG THỂ GỬI LỆNH CHO ĂN',
          result.errorMessage ||
            result.evaluation.reasons.join('\n') ||
            'Không thể gửi lệnh cho ăn tới máy chủ.'
        );
        return;
      }
      if (result.evaluation.decision === 'adjusted') {
        Alert.alert(
          '⚠️ ĐÃ ĐIỀU CHỈNH LƯỢNG CÁM AN TOÀN',
          `${result.evaluation.reasons.join('\n')}\n\nKhẩu phần thực tế được phép xả: ${result.evaluation.allowedAmountKg} kg.`
        );
        return;
      }
      Alert.alert(
        'Cho Ăn Nhanh Thành Công',
        `Đã kiểm duyệt Safety Rule Engine và phát lệnh xả ${kg} kg cám cho ao ${selectedPond?.name || ''}!`
      );
    },
    [triggerQuickFeed, selectedPond?.name]
  );

  const toggleFeederPause = useCallback(async () => {
    if (!selectedPond?.id || !feederDevice?.id) {
      Alert.alert(
        'Chưa Có Thiết Bị',
        'Ao chưa được gán máy cho ăn nên không thể thay đổi chế độ vận hành.'
      );
      return;
    }

    const nextPaused = !feederPaused;
    const nextMode: DeviceMode = nextPaused ? 'manual' : 'automatic';
    try {
      await pondService.updateDeviceMode(feederDevice.id, nextMode);
      setPondDevices((prev) =>
        prev.map((d) => (d.id === feederDevice.id ? { ...d, mode: nextMode } : d))
      );
      setFeederPaused(nextPaused);
      Alert.alert(
        nextPaused ? 'Tạm Dừng Máy Ăn' : 'Tiếp Tục Chu Kỳ Tự Động',
        nextPaused
          ? 'Đã chuyển máy cho ăn sang chế độ Thủ công (Tạm dừng chu kỳ rải tự động).'
          : 'Đã chuyển máy cho ăn về chế độ Tự động (Automatic).'
      );
    } catch (err: any) {
      Alert.alert(
        'Lỗi Điều Khiển Máy Ăn',
        err?.message || 'Không thể cập nhật chế độ máy cho ăn tới máy chủ.'
      );
    }
  }, [selectedPond?.id, feederDevice?.id, feederPaused]);

  const addFeederKg = useCallback(
    async (kg: number) => {
      await addExtraMeal(kg, `Bổ sung nhanh +${kg}kg tại bờ ao`);
    },
    [addExtraMeal]
  );

  /**
   * Emergency Stop 1 chạm (POST /devices/:id/emergency-stop)
   */
  const triggerEmergencyStop = useCallback(async () => {
    if (!selectedPond?.id || !feederDevice?.id) {
      Alert.alert(
        'Chưa Có Thiết Bị',
        'Ao chưa được gán máy cho ăn nên không thể kích hoạt dừng khẩn cấp.'
      );
      return;
    }

    try {
      await pondService.triggerEmergencyStop(feederDevice.id);
      setIsEmergencyStopped(true);
      setFeederPaused(true);
      setPondDevices((prev) =>
        prev.map((d) => (d.id === feederDevice.id ? { ...d, mode: 'emergency_stop' } : d))
      );
      Alert.alert(
        '🚨 DỪNG KHẨN CẤP THÀNH CÔNG',
        `Đã gửi lệnh POST /devices/${feederDevice.id}/emergency-stop ngắt động cơ máy cho ăn tức thì qua MQTT!`
      );
    } catch (err: any) {
      const statusCode = err?.statusCode || err?.response?.status;
      const errMsg = err?.message || 'Không thể kết nối tới máy chủ để kích hoạt dừng khẩn cấp.';
      // Chỉ đánh dấu emergency_stop nếu Backend đã xác nhận lưu DB nhưng MQTT gặp sự cố (502/503 từ BE)
      const isMqttDownAfterDbSave =
        statusCode === 502 ||
        (statusCode === 503 && (Boolean(err?.details) || /mqtt|csdl/i.test(errMsg)));

      if (isMqttDownAfterDbSave) {
        setIsEmergencyStopped(true);
        setFeederPaused(true);
        setPondDevices((prev) =>
          prev.map((d) => (d.id === feederDevice.id ? { ...d, mode: 'emergency_stop' } : d))
        );
        Alert.alert('⚠️ ĐÃ KHÓA TRÊN HỆ THỐNG (LỖI MQTT)', errMsg);
      } else {
        Alert.alert('❌ DỪNG KHẨN CẤP THẤT BẠI', errMsg);
      }
    }
  }, [selectedPond?.id, feederDevice?.id]);

  const resetEmergencyStop = useCallback(async () => {
    if (!selectedPond?.id || !feederDevice?.id) {
      Alert.alert('Chưa Có Thiết Bị', 'Ao chưa được gán máy cho ăn.');
      return;
    }

    try {
      await pondService.updateDeviceMode(feederDevice.id, 'automatic');
      setIsEmergencyStopped(false);
      setFeederPaused(false);
      setPondDevices((prev) =>
        prev.map((d) => (d.id === feederDevice.id ? { ...d, mode: 'automatic' } : d))
      );
      Alert.alert(
        'Khôi Phục Trạng Thái Máy Ăn',
        'Đã chuyển chế độ máy ăn từ emergency_stop về automatic. Sẵn sàng vận hành.'
      );
    } catch (err: any) {
      Alert.alert(
        'Lỗi Khôi Phục Máy Ăn',
        err?.message || 'Không thể kết nối tới máy chủ để khôi phục chế độ tự động.'
      );
    }
  }, [selectedPond?.id, feederDevice?.id]);

  const dispenseFeedBag = useCallback((itemId: string, kg = 25) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId && item.stockCount > 0) {
          return {
            ...item,
            stockCount: item.stockCount - 1,
            totalKgOrL: (item.totalKgOrL || 0) - kg,
          };
        }
        return item;
      })
    );
    setHopperKg((prev) => Math.min(150, prev + kg));
    Alert.alert(
      'Xuất Kho Thành Công',
      `Đã xuất 1 bao (${kg}kg) và nạp trực tiếp vào Thùng Cám Hopper máy ăn!`
    );
  }, []);

  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
    };
    setInventory((prev) => [newItem, ...prev]);
    Alert.alert('Thành Công', `Đã nhập thêm "${item.name}" vào kho hàng!`);
  }, []);

  /**
   * Xác nhận đã tiếp nhận cảnh báo (PATCH /alerts/:id/acknowledge)
   */
  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      await alertService.acknowledgeAlert(alertId);
      const now = new Date().toISOString();
      seenAlertEventKeysRef.current.add(`${alertId}:acknowledged`);
      setAlerts((prev) => {
        const next = prev.map((a) =>
          a.id === alertId ? { ...a, status: 'acknowledged', acknowledgedAt: now } : a
        );
        return next;
      });
      const summary = await alertService.getAlertSummary(selectedPond?.id);
      setAlertSummary(summary);
    },
    [selectedPond?.id]
  );

  /**
   * Xác nhận đã khắc phục sự cố ngoài bờ ao (PATCH /alerts/:id/resolve)
   */
  const resolveAlert = useCallback(
    async (alertId: string) => {
      await alertService.resolveAlert(alertId);
      const now = new Date().toISOString();
      seenAlertEventKeysRef.current.add(`${alertId}:resolved`);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, status: 'resolved', resolvedAt: now } : a
        )
      );
      const summary = await alertService.getAlertSummary(selectedPond?.id);
      setAlertSummary(summary);
    },
    [selectedPond?.id]
  );

  const contextValue = useMemo<FarmContextType>(
    () => ({
      farms,
      selectedFarm,
      ponds,
      selectedPond,
      isLoadingFarms,
      isLoadingPonds,
      farmError,
      selectFarm,
      selectPond,
      refreshFarmsAndPonds,
      createFarm,
      createPond,
      latestTelemetry,
      latestAiRecommendation,
      predictedTrends,
      pondDevices,
      feederDevice,
      feedingSchedules,
      feedingRecords,
      lastSafetyEvaluation,
      alerts,
      alertSummary,
      isRefreshingPondData,
      refreshPondOperationalData,
      evaluateSafetyBeforeFeed,
      triggerQuickFeed,
      requestAiFeedPrediction,
      acknowledgeAlert,
      resolveAlert,
      farmInfo,
      updateFarmInfo,
      feedMeals,
      updateFeedMeal,
      addExtraMeal,
      dispensedKg,
      targetKg,
      feederPaused,
      feederRadius,
      hopperKg,
      isEmergencyStopped,
      toggleFeederPause,
      addFeederKg,
      setFeederRadius,
      triggerEmergencyStop,
      resetEmergencyStop,
      inventory,
      dispenseFeedBag,
      addInventoryItem,
    }),
    [
      farms,
      selectedFarm,
      ponds,
      selectedPond,
      isLoadingFarms,
      isLoadingPonds,
      farmError,
      selectFarm,
      selectPond,
      refreshFarmsAndPonds,
      createFarm,
      createPond,
      latestTelemetry,
      latestAiRecommendation,
      predictedTrends,
      pondDevices,
      feederDevice,
      feedingSchedules,
      feedingRecords,
      lastSafetyEvaluation,
      alerts,
      alertSummary,
      isRefreshingPondData,
      refreshPondOperationalData,
      evaluateSafetyBeforeFeed,
      triggerQuickFeed,
      requestAiFeedPrediction,
      acknowledgeAlert,
      resolveAlert,
      farmInfo,
      updateFarmInfo,
      feedMeals,
      updateFeedMeal,
      addExtraMeal,
      dispensedKg,
      targetKg,
      feederPaused,
      feederRadius,
      hopperKg,
      isEmergencyStopped,
      toggleFeederPause,
      addFeederKg,
      triggerEmergencyStop,
      resetEmergencyStop,
      inventory,
      dispenseFeedBag,
      addInventoryItem,
    ]
  );

  return <FarmContext.Provider value={contextValue}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}
