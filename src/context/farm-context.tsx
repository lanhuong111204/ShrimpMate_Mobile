import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/context/auth-context';
import { farmPondService } from '@/api/services/farm-pond.service';
import { CreateFarmRequest, Farm } from '@/types/farm';
import { CreatePondRequest, Pond } from '@/types/pond';

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
  // Trạng thái Động từ Backend (Giai đoạn 2)
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

  // Dữ liệu cũ bảo lưu tương thích ngược (Giai đoạn 3 & 4)
  farmInfo: FarmInfo;
  updateFarmInfo: (info: Partial<FarmInfo>) => void;
  feedMeals: FeedingMeal[];
  updateFeedMeal: (id: string, updates: Partial<FeedingMeal>) => void;
  addExtraMeal: (kg: number, note: string) => void;
  dispensedKg: number;
  targetKg: number;
  feederPaused: boolean;
  feederRadius: '3m' | '6m' | '9m';
  hopperKg: number;
  isEmergencyStopped: boolean;
  toggleFeederPause: () => void;
  addFeederKg: (kg: number) => void;
  setFeederRadius: (r: '3m' | '6m' | '9m') => void;
  triggerEmergencyStop: () => void;
  resetEmergencyStop: () => void;
  inventory: InventoryItem[];
  dispenseFeedBag: (itemId: string, kg?: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  appetiteLevel: 'weak' | 'strong' | 'skip';
  setAppetiteLevel: (level: 'weak' | 'strong' | 'skip') => void;
  trayCleanPercent: number;
  isScanningTray: boolean;
  scanTray: () => Promise<void>;
}

const initialFarmInfo: FarmInfo = {
  farmerName: 'Nguyễn Văn Ba',
  farmName: 'Trại Tôm Ba Đầm (Ao 02)',
  location: 'Bến Tre - Huyện Ba Tri',
  salinity: 18,
  tideInfo: 'Hôm nay: 16:30 (+1.8m) • Lấy nước tốt',
  pondScale: '1-3',
  selectedPond: 'AO 02 - Tôm Mẫu',
  waterTemp: 31.5,
  dissolvedOxygen: 5.5,
  ph: 7.8,
  nh3: 0.02,
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
    notes: 'Rải lúc 06:31 - 06:46 • Nhá ăn sạch 100%',
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
    speedKgPerMin: 1.2,
    estRemainingMinutes: 6,
    progressPercent: 74,
    notes: 'Đang phun cám chu kỳ 5s nghỉ 15s',
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
    notes: 'Gemini AI đề xuất giảm 3kg do nắng đỉnh 32°C & oxy giảm',
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

  // Trạng thái bảo lưu tương thích ngược cho các màn hình khác
  const [farmInfo, setFarmInfo] = useState<FarmInfo>(initialFarmInfo);
  const [feedMeals, setFeedMeals] = useState<FeedingMeal[]>(initialMeals);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [dispensedKg, setDispensedKg] = useState<number>(18.5);
  const targetKg = 25.0;
  const [feederPaused, setFeederPaused] = useState<boolean>(false);
  const [feederRadius, setFeederRadius] = useState<'3m' | '6m' | '9m'>('6m');
  const [hopperKg, setHopperKg] = useState<number>(120);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState<boolean>(false);
  const [appetiteLevel, setAppetiteLevel] = useState<'weak' | 'strong' | 'skip'>('strong');
  const [trayCleanPercent, setTrayCleanPercent] = useState<number>(90);
  const [isScanningTray, setIsScanningTray] = useState<boolean>(false);

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
        farmName: offlineFarm.name,
        location: offlineFarm.address || prev.location,
        selectedPond: offlinePond.name,
      }));
      setIsLoadingFarms(false);
      setIsLoadingPonds(false);
      return;
    }

    setIsLoadingFarms(true);
    setFarmError(null);
    try {
      const farmsList = await farmPondService.getFarms();
      setFarms(farmsList);

      if (farmsList.length > 0) {
        // Tìm farm đã lưu trong Storage hoặc chọn Farm đầu tiên
        const savedFarmId = await farmPondService.getSelectedFarmId();
        const currentFarm = farmsList.find((f) => f.id === savedFarmId) || farmsList[0];
        setSelectedFarm(currentFarm);
        await farmPondService.setSelectedFarmId(currentFarm.id);

        // Tải danh sách Ao của Farm đang chọn
        setIsLoadingPonds(true);
        try {
          const pondsList = await farmPondService.getPondsByFarm(currentFarm.id);
          setPonds(pondsList);

          if (pondsList.length > 0) {
            const savedPondId = await farmPondService.getSelectedPondId();
            const currentPond = pondsList.find((p) => p.id === savedPondId) || pondsList[0];
            setSelectedPond(currentPond);
            await farmPondService.setSelectedPondId(currentPond.id);

            // Đồng bộ sang farmInfo tương thích ngược
            setFarmInfo((prev) => ({
              ...prev,
              farmName: currentFarm.name,
              location: currentFarm.address || prev.location,
              selectedPond: currentPond.name || currentPond.code,
            }));
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
      setFarmError(err?.message || 'Không thể tải danh sách trang trại');
    } finally {
      setIsLoadingFarms(false);
    }
  }, [isAuthenticated, isOfflineMode, user]);

  useEffect(() => {
    loadFarmsAndPonds();
  }, [loadFarmsAndPonds]);

  /**
   * Chọn Trang trại khác -> Tự động nạp danh sách ao tương ứng
   */
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
      } else {
        setSelectedPond(null);
      }
    } catch (err: any) {
      setFarmError(err?.message || 'Không thể tải danh sách ao nuôi');
    } finally {
      setIsLoadingPonds(false);
    }
  };

  /**
   * Chọn Ao nuôi khác -> Cập nhật và lưu Storage
   */
  const selectPond = (pondId: string) => {
    const targetPond = ponds.find((p) => p.id === pondId);
    if (!targetPond) return;

    setSelectedPond(targetPond);
    farmPondService.setSelectedPondId(targetPond.id);

    setFarmInfo((prev) => ({
      ...prev,
      selectedPond: targetPond.name || targetPond.code,
    }));
  };

  /**
   * Làm mới dữ liệu trang trại và ao nuôi từ server
   */
  const refreshFarmsAndPonds = async () => {
    await loadFarmsAndPonds();
  };

  /**
   * Tạo trang trại mới
   */
  const createFarm = async (data: CreateFarmRequest): Promise<Farm> => {
    const newFarm = await farmPondService.createFarm(data);
    setFarms((prev) => [newFarm, ...prev]);
    await selectFarm(newFarm.id);
    return newFarm;
  };

  /**
   * Tạo ao nuôi mới trong trang trại hiện tại
   */
  const createPond = async (data: CreatePondRequest): Promise<Pond> => {
    if (!selectedFarm) {
      throw new Error('Vui lòng chọn trang trại trước khi thêm ao');
    }
    const newPond = await farmPondService.createPond(selectedFarm.id, data);
    setPonds((prev) => [newPond, ...prev]);
    selectPond(newPond.id);
    return newPond;
  };

  // ==========================================
  // Các hàm cũ bảo lưu tương thích ngược
  // ==========================================

  const updateFarmInfo = (info: Partial<FarmInfo>) => {
    setFarmInfo((prev) => ({ ...prev, ...info }));
  };

  const updateFeedMeal = (id: string, updates: Partial<FeedingMeal>) => {
    setFeedMeals((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const addExtraMeal = (kg: number, note: string) => {
    const newMeal: FeedingMeal = {
      id: `meal-extra-${Date.now()}`,
      time: '16:15',
      name: `Cữ Phụ (${kg}kg)`,
      period: 'Chiều',
      status: 'pending',
      feedType: 'Cám số 2 + Men Tỏi',
      targetKg: kg,
      dispensedKg: 0,
      notes: note || 'Cữ bổ sung dinh dưỡng bờ ao',
    };
    setFeedMeals((prev) => [...prev, newMeal]);
    Alert.alert('Thành Công', `Đã thêm cữ ăn phụ ${kg} kg vào lịch cữ hôm nay!`);
  };

  const toggleFeederPause = () => {
    const nextPaused = !feederPaused;
    setFeederPaused(nextPaused);
    Alert.alert(
      nextPaused ? 'Tạm Dừng Máy Ăn' : 'Tiếp Tục Chu Kỳ Phun',
      nextPaused
        ? 'Rơ-le máy cấp cám đã đóng tạm thời.'
        : 'Chu kỳ phun 5s nghỉ 15s đang tiếp tục.'
    );
  };

  const addFeederKg = (kg: number) => {
    const next = Math.min(targetKg, dispensedKg + kg);
    setDispensedKg(next);
    Alert.alert('Đã Thêm Cám', `Đã thêm +${kg} kg vào mẻ phun hiện tại!`);
  };

  const triggerEmergencyStop = () => {
    setIsEmergencyStopped(true);
    setFeederPaused(true);
    Alert.alert(
      'DỪNG KHẨN CẤP THÀNH CÔNG',
      'Toàn bộ rơ-le máy cho ăn đã ngắt trong 0.18s qua sóng LoRa bờ ao an toàn.'
    );
  };

  const resetEmergencyStop = () => {
    setIsEmergencyStopped(false);
    setFeederPaused(false);
    Alert.alert('Khôi Phục Trạng Thái', 'Hệ thống an toàn đã sẵn sàng tiếp tục vận hành.');
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

  const scanTray = async () => {
    setIsScanningTray(true);
    setTimeout(() => {
      setIsScanningTray(false);
      setTrayCleanPercent(94);
      setAppetiteLevel('strong');
      Alert.alert(
        'AI Quét Nhá Thành Công',
        'Ảnh sàng nhá đạt độ sạch 94% • Tôm đường ruột đầy thức ăn, không phát hiện thức ăn đọng.'
      );
    }, 1200);
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
        setAppetiteLevel,
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
