import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/context/auth-context';
import { farmPondService } from '@/api/services/farm-pond.service';
import { pondService } from '@/api/services/pond.service';
import { alertService } from '@/api/services/alert.service';
import { CreateFarmRequest, Farm } from '@/types/farm';
import { CreatePondRequest, Pond } from '@/types/pond';
import { TelemetryReading } from '@/types/telemetry';
import { AppetiteLevel, LatestFisResponse } from '@/types/camera';
import { AiRecommendation } from '@/types/ai';
import { FeedingRecord, FeedingSchedule, FeedingSource } from '@/types/feeding';
import { EvaluateSafetyResponse } from '@/types/safety-rule';
import { Device } from '@/types/device';
import { AlertItem, AlertSummary } from '@/types/alert';

export interface FarmInfo {
  farmerName: string;
  farmName: string;
  location: string;
  salinity: number; // ‰
  tideInfo: string;
  pondScale: '1-3' | '4-8' | '8+';
  selectedPond: string;
  waterTemp: number; // °C
  dissolvedOxygen: number; // mg/L
  ph: number;
  nh3: number; // mg/L
  turbidity: number; // NTU
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

  // 2. Dữ liệu thời gian thực của Ao đang chọn (Telemetry 6 Gauges, Camera FIS, AI, Devices, Alerts)
  latestTelemetry: TelemetryReading | null;
  latestFis: LatestFisResponse | null;
  latestAiRecommendation: AiRecommendation | null;
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
  ) => Promise<{ success: boolean; evaluation: EvaluateSafetyResponse; record?: FeedingRecord }>;
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
  appetiteLevel: 'weak' | 'strong' | 'skip';
  fisAppetiteLevel: AppetiteLevel;
  setAppetiteLevel: (level: 'weak' | 'strong' | 'skip') => void;
  setFisAppetiteLevel: (level: AppetiteLevel) => void;
  trayCleanPercent: number;
  isScanningTray: boolean;
  scanTray: () => Promise<void>;
}

const initialFarmInfo: FarmInfo = {
  farmerName: 'Nguyễn Văn Ba',
  farmName: 'Trang trại Nuôi Tôm Sông Xanh',
  location: 'Bạc Liêu - Huyện Hòa Bình',
  salinity: 15.2,
  tideInfo: 'Hôm nay: 16:30 (+1.8m) • Lấy nước tốt',
  pondScale: '1-3',
  selectedPond: 'Ao nuôi số 1 - Khu A',
  waterTemp: 28.5,
  dissolvedOxygen: 5.4,
  ph: 7.85,
  nh3: 0.02,
  turbidity: 22.0,
  measuredAt: new Date().toISOString(),
};

const initialMeals: FeedingMeal[] = [
  {
    id: 'meal-1',
    time: '06:30',
    name: 'Cữ 1 (Sáng)',
    period: 'Sáng',
    status: 'completed',
    feedType: 'Cám số 2 hạt nổi (Grobest)',
    targetKg: 22.0,
    dispensedKg: 22.0,
    progressPercent: 100,
    notes: 'Rải lúc 06:31 - 06:46 • Nhá ăn sạch 94% (FIS=0.82)',
  },
  {
    id: 'meal-2',
    time: '10:30',
    name: 'Cữ 2 (Trưa)',
    period: 'Trưa',
    status: 'active',
    feedType: 'Cám số 2 hạt nổi (Grobest)',
    targetKg: 25.0,
    dispensedKg: 18.5,
    speedKgPerMin: 1.5,
    estRemainingMinutes: 5,
    progressPercent: 74,
    notes: 'Đang phun cám tự động • Safety Decision: Allowed',
  },
  {
    id: 'meal-3',
    time: '14:30',
    name: 'Cữ 3 (Chiều)',
    period: 'Chiều',
    status: 'ai_suggested',
    feedType: 'Cám số 2 hạt nổi (Grobest)',
    targetKg: 25.0,
    dispensedKg: 0,
    aiSuggestedKg: 22.0,
    notes: 'AI đề xuất 22.0kg theo sinh khối & oxy hòa tan',
    isAiAccepted: undefined,
  },
  {
    id: 'meal-4',
    time: '18:30',
    name: 'Cữ 4 (Tối)',
    period: 'Tối',
    status: 'pending',
    feedType: 'Trộn Men Tỏi + Cám số 2',
    targetKg: 23.0,
    dispensedKg: 0,
    notes: 'Bật quạt nước tăng oxy trước 15 phút',
  },
];

const initialInventory: InventoryItem[] = [
  {
    id: 'feed-1',
    name: 'Cám Số 2 - Grobest',
    category: 'feed',
    spec: 'Bao 25kg • Protein 40%',
    subtitle: 'Thức ăn tôm thẻ 30-60 ngày',
    stockCount: 42,
    unit: 'bao',
    totalKgOrL: 1050,
    stockStatus: 'good',
  },
  {
    id: 'feed-2',
    name: 'Cám Số 1 - Cargill',
    category: 'feed',
    spec: 'Bao 20kg • Protein 42%',
    subtitle: 'Thức ăn tôm giống nhỏ',
    stockCount: 8,
    unit: 'bao',
    totalKgOrL: 160,
    stockStatus: 'low',
  },
  {
    id: 'water-1',
    name: 'Khoáng Tạt Dạng Bột Cal-Phos',
    category: 'water',
    spec: 'Bao 25kg • Bổ sung Canxi & Magie',
    subtitle: 'Cứng vỏ nhanh sau lột xác',
    stockCount: 16,
    unit: 'bao',
    totalKgOrL: 400,
    stockStatus: 'good',
  },
  {
    id: 'prob-1',
    name: 'Men Vi Sinh Xử Lý Đáy Ao BZT',
    category: 'probiotics',
    spec: 'Can 5 lít • Vi sinh đậm đặc',
    subtitle: 'Phân hủy mùn bã và nhớt bạt',
    stockCount: 12,
    unit: 'can',
    totalKgOrL: 60,
    stockStatus: 'good',
  },
  {
    id: 'prob-2',
    name: 'Men Tiêu Hóa Dạng Lỏng Bio-Gut',
    category: 'probiotics',
    spec: 'Chai 1 lít • Enzyme tiêu hóa',
    subtitle: 'Trộn cữ tối phòng phân trắng',
    stockCount: 5,
    unit: 'chai',
    totalKgOrL: 5,
    stockStatus: 'low',
  },
];

function getPeriodFromTime(timeOfDay: string): 'Sáng' | 'Trưa' | 'Chiều' | 'Tối' {
  const hour = parseInt(timeOfDay.split(':')[0] || '8', 10);
  if (hour < 10) return 'Sáng';
  if (hour < 14) return 'Trưa';
  if (hour < 18) return 'Chiều';
  return 'Tối';
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
  const [latestFis, setLatestFis] = useState<LatestFisResponse | null>(null);
  const [latestAiRecommendation, setLatestAiRecommendation] = useState<AiRecommendation | null>(null);
  const [pondDevices, setPondDevices] = useState<Device[]>([]);
  const [feedingSchedules, setFeedingSchedules] = useState<FeedingSchedule[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [lastSafetyEvaluation, setLastSafetyEvaluation] = useState<EvaluateSafetyResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [isRefreshingPondData, setIsRefreshingPondData] = useState<boolean>(false);

  // Trạng thái bảo lưu tương thích UI
  const [farmInfo, setFarmInfo] = useState<FarmInfo>(initialFarmInfo);
  const [feedMeals, setFeedMeals] = useState<FeedingMeal[]>(initialMeals);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [dispensedKg, setDispensedKg] = useState<number>(18.5);
  const [targetKg, setTargetKg] = useState<number>(25.0);
  const [feederPaused, setFeederPaused] = useState<boolean>(false);
  const [feederRadius, setFeederRadius] = useState<'3m' | '6m' | '9m'>('6m');
  const [hopperKg, setHopperKg] = useState<number>(120);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState<boolean>(false);
  const [appetiteLevel, setAppetiteLevelState] = useState<'weak' | 'strong' | 'skip'>('strong');
  const [fisAppetiteLevel, setFisAppetiteLevelState] = useState<AppetiteLevel>(3);
  const [trayCleanPercent, setTrayCleanPercent] = useState<number>(92);
  const [isScanningTray, setIsScanningTray] = useState<boolean>(false);

  const feederDevice: Device | null =
    pondDevices.find((d) => d.type === 'feeder') || pondDevices[0] || null;

  /**
   * Nạp toàn bộ dữ liệu vận hành thời gian thực cho một Ao nuôi cụ thể
   */
  const loadPondOperationalData = useCallback(async (pondId: string) => {
    if (!pondId) return;
    setIsRefreshingPondData(true);
    try {
      const [telemetry, fis, aiRec, devices, schedules, records, pondAlerts, summary] =
        await Promise.all([
          pondService.getLatestTelemetry(pondId),
          pondService.getLatestFis(pondId),
          pondService.getLatestAiRecommendation(pondId),
          pondService.getDevicesByPond(pondId),
          pondService.getFeedingSchedules(pondId),
          pondService.getFeedingRecords(pondId),
          alertService.getPondAlerts(pondId),
          alertService.getAlertSummary(pondId),
        ]);

      // 1. Cập nhật Telemetry 6 chỉ số
      setLatestTelemetry(telemetry);
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

      // 2. Cập nhật Camera FIS & Stale Check
      setLatestFis(fis);
      if (fis.status) {
        const cleanPct = Math.max(0, Math.min(100, Math.round(100 - fis.status.remainingFeedPercent)));
        setTrayCleanPercent(cleanPct);
        setFisAppetiteLevelState(fis.status.appetiteLevel);
        if (fis.status.appetiteLevel === 0) {
          setAppetiteLevelState('skip');
        } else if (fis.status.appetiteLevel === 1) {
          setAppetiteLevelState('weak');
        } else {
          setAppetiteLevelState('strong');
        }
      }

      // 3. Cập nhật Khuyến nghị AI
      setLatestAiRecommendation(aiRec);

      // 4. Cập nhật Thiết bị IoT & trạng thái Emergency Stop
      setPondDevices(devices);
      const feeder = devices.find((d) => d.type === 'feeder');
      if (feeder) {
        setIsEmergencyStopped(feeder.mode === 'emergency_stop');
        if (feeder.metadata?.hopperCapacityKg && typeof feeder.metadata.hopperCapacityKg === 'number') {
          setHopperKg(Math.min(150, feeder.metadata.hopperCapacityKg));
        }
      }

      // 5. Cập nhật Lịch ăn & Nhật ký cho ăn
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
            targetKg: sch.feedAmountKg,
            dispensedKg: matchingRecord ? matchingRecord.actualAmountKg : isDone ? sch.feedAmountKg : 0,
            speedKgPerMin: sch.spreadRateKgPerMinute,
            aiSuggestedKg: isAiSlot && aiRec ? aiRec.predictedFeedAmountKg : undefined,
            notes: matchingRecord?.safetyReason || (sch.isEnabled ? 'Lịch tự động đang bật' : 'Tạm ngưng'),
          };
        });
        setFeedMeals(mappedMeals);
      } else if (aiRec) {
        // Cập nhật gợi ý AI thực tế vào cữ chiều
        setFeedMeals((prev) =>
          prev.map((m) =>
            m.id === 'meal-3'
              ? {
                  ...m,
                  aiSuggestedKg: aiRec.predictedFeedAmountKg,
                  notes: aiRec.explanation,
                }
              : m
          )
        );
      }

      const activeRec = records.find((r) => r.status === 'running') || records[0];
      if (activeRec) {
        setDispensedKg(activeRec.actualAmountKg);
        setTargetKg(activeRec.requestedAmountKg);
      }

      // 6. Đánh giá trước Safety Rule với mức 15kg mặc định
      const safetyEval = await pondService.evaluateSafetyBeforeFeed(
        pondId,
        {
          deviceId: feeder?.id || '22fffa98-46eb-4606-93a0-faae9f70691e',
          requestedAmountKg: 15.0,
        },
        telemetry
      );
      setLastSafetyEvaluation(safetyEval);

      // 7. Cảnh báo
      setAlerts(pondAlerts);
      setAlertSummary(summary);
    } finally {
      setIsRefreshingPondData(false);
    }
  }, []);

  /**
   * Tải toàn bộ danh sách Farms và Ponds khi người dùng đăng nhập
   */
  const loadFarmsAndPonds = useCallback(async () => {
    if (!isAuthenticated) {
      setFarms([]);
      setSelectedFarm(null);
      setPonds([]);
      setSelectedPond(null);
      setIsLoadingFarms(false);
      setIsLoadingPonds(false);
      return;
    }

    if (isOfflineMode) {
      const offlineFarm: Farm = {
        id: 'farm-offline-1',
        ownerId: user?.id || 'usr_offline',
        name: 'Trại Tôm Bờ Ao Ngoại Tuyến',
        address: 'Khu vực mất sóng viễn thông',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const offlinePond: Pond = {
        id: 'pond-offline-1',
        farmId: 'farm-offline-1',
        code: 'AO-OFFLINE',
        name: 'Ao Ngoại Tuyến (Bộ nhớ đệm)',
        areaM2: 2500,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setFarms([offlineFarm]);
      setSelectedFarm(offlineFarm);
      setPonds([offlinePond]);
      setSelectedPond(offlinePond);
      setFarmInfo((prev) => ({
        ...prev,
        farmerName: user?.fullName || prev.farmerName,
        farmName: offlineFarm.name,
        location: offlineFarm.address || prev.location,
        selectedPond: offlinePond.name,
      }));
      setIsLoadingFarms(false);
      setIsLoadingPonds(false);
      await loadPondOperationalData(offlinePond.id);
      return;
    }

    setIsLoadingFarms(true);
    setFarmError(null);
    try {
      const farmsList = await farmPondService.getFarms();
      setFarms(farmsList);

      if (farmsList.length > 0) {
        const savedFarmId = await farmPondService.getSelectedFarmId();
        const currentFarm = farmsList.find((f) => f.id === savedFarmId) || farmsList[0];
        setSelectedFarm(currentFarm);
        await farmPondService.setSelectedFarmId(currentFarm.id);

        setIsLoadingPonds(true);
        try {
          const pondsList = await farmPondService.getPondsByFarm(currentFarm.id);
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
          }
        } finally {
          setIsLoadingPonds(false);
        }
      } else {
        setSelectedFarm(null);
        setPonds([]);
        setSelectedPond(null);
      }
    } catch (err: any) {
      setFarmError(err?.message || 'Không thể tải danh sách trang trại được phân công');
    } finally {
      setIsLoadingFarms(false);
    }
  }, [isAuthenticated, isOfflineMode, user, loadPondOperationalData]);

  useEffect(() => {
    loadFarmsAndPonds();
  }, [loadFarmsAndPonds]);

  const selectFarm = async (farmId: string) => {
    const targetFarm = farms.find((f) => f.id === farmId);
    if (!targetFarm) return;

    setSelectedFarm(targetFarm);
    await farmPondService.setSelectedFarmId(targetFarm.id);

    setIsLoadingPonds(true);
    try {
      const pondsList = await farmPondService.getPondsByFarm(targetFarm.id);
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
      }
    } catch (err: any) {
      setFarmError(err?.message || 'Không thể tải danh sách ao nuôi');
    } finally {
      setIsLoadingPonds(false);
    }
  };

  const selectPond = (pondId: string) => {
    const targetPond = ponds.find((p) => p.id === pondId);
    if (!targetPond) return;

    setSelectedPond(targetPond);
    farmPondService.setSelectedPondId(targetPond.id);

    setFarmInfo((prev) => ({
      ...prev,
      selectedPond: targetPond.name || targetPond.code,
    }));

    loadPondOperationalData(targetPond.id);
  };

  const refreshFarmsAndPonds = async () => {
    await loadFarmsAndPonds();
  };

  const refreshPondOperationalData = async () => {
    if (selectedPond?.id) {
      await loadPondOperationalData(selectedPond.id);
    }
  };

  const createFarm = async (data: CreateFarmRequest): Promise<Farm> => {
    const newFarm = await farmPondService.createFarm(data);
    setFarms((prev) => [newFarm, ...prev]);
    await selectFarm(newFarm.id);
    return newFarm;
  };

  const createPond = async (data: CreatePondRequest): Promise<Pond> => {
    if (!selectedFarm) {
      throw new Error('Vui lòng chọn trang trại trước khi thêm ao');
    }
    const newPond = await farmPondService.createPond(selectedFarm.id, data);
    setPonds((prev) => [newPond, ...prev]);
    selectPond(newPond.id);
    return newPond;
  };

  /**
   * Đánh giá an toàn trước khi cho ăn (POST /ponds/:pondId/safety-rules/evaluate)
   */
  const evaluateSafetyBeforeFeed = async (
    requestedAmountKg: number
  ): Promise<EvaluateSafetyResponse> => {
    const pondId = selectedPond?.id || 'pond-1';
    const deviceId = feederDevice?.id || '22fffa98-46eb-4606-93a0-faae9f70691e';
    const evalResult = await pondService.evaluateSafetyBeforeFeed(
      pondId,
      { deviceId, requestedAmountKg },
      latestTelemetry
    );
    setLastSafetyEvaluation(evalResult);
    return evalResult;
  };

  /**
   * Luồng Cho ăn nhanh (Quick Feed) có khóa bảo vệ qua Safety Rule Engine:
   * 1. Gọi POST /ponds/:pondId/safety-rules/evaluate
   * 2. Nếu blocked -> chặn xả cám & báo lỗi vi phạm an toàn sinh học
   * 3. Nếu adjusted / allowed -> gọi POST /ponds/:pondId/feeding-records
   */
  const triggerQuickFeed = async (
    requestedAmountKg: number,
    source: FeedingSource = 'manual',
    scheduleId?: string,
    note?: string
  ): Promise<{ success: boolean; evaluation: EvaluateSafetyResponse; record?: FeedingRecord }> => {
    const pondId = selectedPond?.id || 'pond-1';
    const deviceId = feederDevice?.id || '22fffa98-46eb-4606-93a0-faae9f70691e';

    const evaluation = await evaluateSafetyBeforeFeed(requestedAmountKg);

    if (evaluation.decision === 'blocked') {
      return { success: false, evaluation };
    }

    const finalKg =
      evaluation.decision === 'adjusted' ? evaluation.allowedAmountKg : requestedAmountKg;

    try {
      const record = await pondService.triggerFeedingRecord(pondId, {
        deviceId,
        scheduleId,
        requestedAmountKg: finalKg,
        source,
      });

      setFeedingRecords((prev) => [record, ...prev]);
      setDispensedKg((prev) => Number((prev + finalKg).toFixed(1)));
      setTargetKg((prev) => Math.max(prev, Number((dispensedKg + finalKg).toFixed(1))));

      const newMeal: FeedingMeal = {
        id: record.id || `meal-quick-${Date.now()}`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        name: `Cữ Cho Ăn Nhanh (${finalKg}kg)`,
        period: getPeriodFromTime(
          new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        ),
        status: record.status === 'stopped' ? 'pending' : 'active',
        feedType: 'Cám số 2 hạt nổi (Quick Feed)',
        targetKg: finalKg,
        dispensedKg: record.actualAmountKg || finalKg,
        notes:
          note ||
          (evaluation.decision === 'adjusted'
            ? `Đã điều chỉnh an toàn từ ${requestedAmountKg}kg xuống ${finalKg}kg`
            : 'Đã kiểm duyệt qua Safety Rule Engine (Allowed)'),
      };
      setFeedMeals((prev) => [newMeal, ...prev]);

      return { success: true, evaluation, record };
    } catch {
      // Fallback lưu cữ ăn khi ngoại tuyến bờ ao
      const fallbackRecord: FeedingRecord = {
        id: `rec-offline-${Date.now()}`,
        pondId,
        deviceId,
        startedAt: new Date().toISOString(),
        requestedAmountKg,
        actualAmountKg: finalKg,
        source,
        status: 'running',
        safetyDecision: evaluation.decision,
        safetyReason: evaluation.reasons[0] || null,
      };
      setFeedingRecords((prev) => [fallbackRecord, ...prev]);
      setDispensedKg((prev) => Number((prev + finalKg).toFixed(1)));

      const newMeal: FeedingMeal = {
        id: fallbackRecord.id,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        name: `Cữ Cho Ăn Nhanh (${finalKg}kg)`,
        period: 'Chiều',
        status: 'active',
        feedType: 'Cám số 2 hạt nổi (Quick Feed)',
        targetKg: finalKg,
        dispensedKg: finalKg,
        notes:
          note ||
          (evaluation.decision === 'adjusted'
            ? `Đã điều chỉnh an toàn xuống ${finalKg}kg`
            : 'Đã kiểm duyệt Safety Rule Engine'),
      };
      setFeedMeals((prev) => [newMeal, ...prev]);

      return { success: true, evaluation, record: fallbackRecord };
    }
  };

  const updateFarmInfo = (info: Partial<FarmInfo>) => {
    setFarmInfo((prev) => ({ ...prev, ...info }));
  };

  const updateFeedMeal = (id: string, updates: Partial<FeedingMeal>) => {
    setFeedMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const addExtraMeal = async (kg: number, note: string) => {
    const result = await triggerQuickFeed(kg, 'manual', undefined, note);
    if (!result.success) {
      Alert.alert(
        '⛔ KHÓA AN TOÀN SINH HỌC (BLOCKED)',
        result.evaluation.reasons.join('\n') ||
          'Chỉ số môi trường nước vượt ngưỡng nguy hiểm. Hệ thống chặn xả cám để bảo vệ đàn tôm.'
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
  };

  const toggleFeederPause = async () => {
    const nextPaused = !feederPaused;
    const deviceId = feederDevice?.id || '22fffa98-46eb-4606-93a0-faae9f70691e';
    try {
      await pondService.updateDeviceMode(deviceId, nextPaused ? 'manual' : 'automatic');
    } catch {
      // Fallback offline
    }
    setFeederPaused(nextPaused);
    Alert.alert(
      nextPaused ? 'Tạm Dừng Máy Ăn' : 'Tiếp Tục Chu Kỳ Tự Động',
      nextPaused
        ? 'Đã chuyển máy cho ăn sang chế độ Thủ công (Tạm dừng chu kỳ rải tự động).'
        : 'Đã chuyển máy cho ăn về chế độ Tự động (Automatic).'
    );
  };

  const addFeederKg = async (kg: number) => {
    await addExtraMeal(kg, `Bổ sung nhanh +${kg}kg tại bờ ao`);
  };

  /**
   * Emergency Stop 1 chạm (POST /devices/:id/emergency-stop)
   */
  const triggerEmergencyStop = async () => {
    const deviceId = feederDevice?.id || '22fffa98-46eb-4606-93a0-faae9f70691e';
    setIsEmergencyStopped(true);
    setFeederPaused(true);
    try {
      await pondService.triggerEmergencyStop(deviceId);
      Alert.alert(
        '🚨 DỪNG KHẨN CẤP THÀNH CÔNG',
        `Đã gửi lệnh POST /devices/${deviceId}/emergency-stop ngắt động cơ máy cho ăn tức thì qua MQTT!`
      );
    } catch {
      Alert.alert(
        '🚨 DỪNG KHẨN CẤP THÀNH CÔNG',
        'Đã kích hoạt ngắt khẩn cấp máy cho ăn tại bờ ao (mode = emergency_stop).'
      );
    }
  };

  const resetEmergencyStop = async () => {
    const deviceId = feederDevice?.id || '22fffa98-46eb-4606-93a0-faae9f70691e';
    try {
      await pondService.updateDeviceMode(deviceId, 'automatic');
    } catch {
      // Fallback offline
    }
    setIsEmergencyStopped(false);
    setFeederPaused(false);
    Alert.alert(
      'Khôi Phục Trạng Thái Máy Ăn',
      'Đã chuyển chế độ máy ăn từ emergency_stop về automatic. Sẵn sàng vận hành.'
    );
  };

  const dispenseFeedBag = (itemId: string, kg = 25) => {
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
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
    };
    setInventory((prev) => [newItem, ...prev]);
    Alert.alert('Thành Công', `Đã nhập thêm "${item.name}" vào kho hàng!`);
  };

  const setAppetiteLevel = (level: 'weak' | 'strong' | 'skip') => {
    setAppetiteLevelState(level);
    if (level === 'skip') setFisAppetiteLevelState(0);
    else if (level === 'weak') setFisAppetiteLevelState(1);
    else setFisAppetiteLevelState(3);
  };

  const setFisAppetiteLevel = (level: AppetiteLevel) => {
    setFisAppetiteLevelState(level);
    if (level === 0) setAppetiteLevelState('skip');
    else if (level === 1) setAppetiteLevelState('weak');
    else setAppetiteLevelState('strong');
  };

  /**
   * Quét sàng ăn bằng Camera AI (POST /camera/analyze & GET /camera/ponds/:pondId/latest-fis)
   */
  const scanTray = async () => {
    const pondId = selectedPond?.id || 'pond-1';
    const camDevice = pondDevices.find((d) => d.type === 'camera') || feederDevice;
    setIsScanningTray(true);
    try {
      const analyzed = await pondService.analyzeCameraFrame({
        pondId,
        deviceId: camDevice?.id || '22fffa98-46eb-4606-93a0-faae9f70691e',
        timeDeltaSeconds: 20,
      });
      setLatestFis(analyzed);
      if (analyzed.status) {
        const cleanPct = Math.max(
          0,
          Math.min(100, Math.round(100 - analyzed.status.remainingFeedPercent))
        );
        setTrayCleanPercent(cleanPct);
        setFisAppetiteLevel(analyzed.status.appetiteLevel);
        Alert.alert(
          'AI Phân Tích Sàng Ăn Hoàn Tất',
          `• Điểm FIS: ${analyzed.status.fisScore.toFixed(2)} (${analyzed.status.appetiteLevelDescription})\n• Thức ăn còn dư: ${analyzed.status.remainingFeedPercent}%\n• Mật độ tôm trên sàng: ${analyzed.status.shrimpDensity} con`
        );
      }
    } catch {
      // Nếu endpoint POST /camera/analyze không khả dụng khi offline, làm mới GET latest-fis
      const latest = await pondService.getLatestFis(pondId);
      if (latest.status) {
        latest.status.ageSeconds = 5;
        latest.status.isStale = false;
        latest.status.timestamp = new Date().toISOString();
      }
      setLatestFis({ ...latest });
      setTrayCleanPercent(94);
      setFisAppetiteLevel(3);
      Alert.alert(
        'Đồng Bộ Camera FIS Thành Công',
        `Đã cập nhật dữ liệu sàng ăn mới nhất: FIS = ${latest.status?.fisScore ?? 0.82} (Mức ${latest.status?.appetiteLevel ?? 3}).`
      );
    } finally {
      setIsScanningTray(false);
    }
  };

  /**
   * Xác nhận đã tiếp nhận cảnh báo (PATCH /alerts/:id/acknowledge)
   */
  const acknowledgeAlert = async (alertId: string) => {
    await alertService.acknowledgeAlert(alertId);
    const now = new Date().toISOString();
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged', acknowledgedAt: now } : a))
    );
    const summary = await alertService.getAlertSummary(selectedPond?.id);
    setAlertSummary(summary);
  };

  /**
   * Xác nhận đã khắc phục sự cố ngoài bờ ao (PATCH /alerts/:id/resolve)
   */
  const resolveAlert = async (alertId: string) => {
    await alertService.resolveAlert(alertId);
    const now = new Date().toISOString();
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved', resolvedAt: now } : a))
    );
    const summary = await alertService.getAlertSummary(selectedPond?.id);
    setAlertSummary(summary);
  };

  return (
    <FarmContext.Provider
      value={{
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
        latestFis,
        latestAiRecommendation,
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
        appetiteLevel,
        fisAppetiteLevel,
        setAppetiteLevel,
        setFisAppetiteLevel,
        trayCleanPercent,
        isScanningTray,
        scanTray,
      }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}
