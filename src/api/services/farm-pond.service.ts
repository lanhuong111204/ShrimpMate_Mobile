import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { farmerService } from './farmer.service';
import { CreateFarmRequest, Farm, UpdateFarmRequest } from '@/types/farm';
import { CreatePondRequest, Pond, UpdatePondRequest } from '@/types/pond';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Hàm bóc tách mảng dữ liệu an toàn từ nhiều định dạng response khác nhau của Backend
 */
function extractList<T>(raw: any, candidateKeys: string[]): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') {
    for (const key of candidateKeys) {
      if (Array.isArray(raw[key])) {
        return raw[key];
      }
      if (raw[key] && typeof raw[key] === 'object' && Array.isArray(raw[key].data)) {
        return raw[key].data;
      }
    }
  }
  return [];
}

export const farmPondService = {
  /**
   * Lấy danh sách trang trại được phân công cho Farmer hiện tại
   * - Gọi GET /farms và GET /farmers/:id/assignments
   * - Nếu cả 2 đều trả về mảng rỗng hợp lệ (200 OK): trả về [] (Tài khoản mới chưa được phân công ao)
   * - Chỉ khi mất mạng (Network Error): mới fallback về cache đã lưu của chính user đó
   */
  async getFarms(params?: PaginationParams, userId?: string): Promise<Farm[]> {
    const cacheKey = userId
      ? `${AppConfig.storageKeys.cachedFarms}_${userId}`
      : AppConfig.storageKeys.cachedFarms;

    try {
      const response = await apiClient.get<any>(Endpoints.farms.list, { params });
      let farms = extractList<Farm>(response.data, ['data', 'farms', 'items', 'results']);

      // Nếu GET /farms trả về rỗng, kiểm tra danh sách phân công từ GET /farmers/:id/assignments
      if (farms.length === 0) {
        const assignments = await farmerService.getMyAssignments(userId);
        if (assignments.length > 0) {
          const farmMap = new Map<string, Farm>();
          for (const assign of assignments as any[]) {
            const fId = assign.farmId || assign.farm?.id;
            if (fId && !farmMap.has(fId)) {
              if (assign.farm && typeof assign.farm === 'object') {
                farmMap.set(fId, {
                  id: fId,
                  ownerId: assign.farm.ownerId || assign.assignedBy || '',
                  name: assign.farm.name || assign.farmName || 'Trang trại được phân công',
                  address: assign.farm.address || '',
                  status: assign.farm.status || 'active',
                  createdAt: assign.farm.createdAt || assign.createdAt || new Date().toISOString(),
                  updatedAt: assign.farm.updatedAt || new Date().toISOString(),
                });
              } else {
                try {
                  const detailRes = await apiClient.get<any>(Endpoints.farms.detail(fId));
                  const fData = detailRes.data?.data || detailRes.data;
                  if (fData && fData.id) {
                    farmMap.set(fId, fData as Farm);
                    continue;
                  }
                } catch {
                  // Ignore và tạo từ metadata của assignment
                }
                farmMap.set(fId, {
                  id: fId,
                  ownerId: assign.assignedBy || '',
                  name: assign.farmName || 'Trang trại được phân công',
                  address: assign.farmAddress || '',
                  status: 'active',
                  createdAt: assign.createdAt || assign.assignedAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }
            }
          }
          farms = Array.from(farmMap.values());
        }
      }

      // Lưu cache (kể cả khi rỗng để phản ánh đúng trạng thái phân công hiện tại của user)
      await Storage.setJSON(cacheKey, farms);
      return farms;
    } catch (error) {
      // Khi mất sóng bờ ao (Network Error), đọc từ cache của đúng user đó
      const cached = await Storage.getJSON<Farm[]>(cacheKey);
      if (cached && Array.isArray(cached)) {
        return cached;
      }
      throw error;
    }
  },

  /**
   * Lấy chi tiết một trang trại theo ID
   */
  async getFarmById(id: string): Promise<Farm> {
    const response = await apiClient.get<Farm>(Endpoints.farms.detail(id));
    return response.data;
  },

  /**
   * Tạo mới trang trại
   */
  async createFarm(data: CreateFarmRequest): Promise<Farm> {
    const response = await apiClient.post<Farm>(Endpoints.farms.create, data);
    return response.data;
  },

  /**
   * Cập nhật thông tin trang trại
   */
  async updateFarm(id: string, data: UpdateFarmRequest): Promise<Farm> {
    const response = await apiClient.patch<Farm>(Endpoints.farms.update(id), data);
    return response.data;
  },

  /**
   * Xóa trang trại
   */
  async deleteFarm(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(Endpoints.farms.delete(id));
    return response.data;
  },

  /**
   * Lấy danh sách ao nuôi được phân công trong một trang trại cụ thể
   * - Kết hợp GET /farms/:farmId/ponds, GET /farms/:farmId và GET /farmers/:id/assignments
   * - Nếu tài khoản chưa được gán ao nào (200 OK rỗng): trả về []
   */
  async getPondsByFarm(
    farmId: string,
    params?: PaginationParams,
    userId?: string
  ): Promise<Pond[]> {
    const cacheKey = userId
      ? `${AppConfig.storageKeys.cachedPonds}_${userId}_${farmId}`
      : `${AppConfig.storageKeys.cachedPonds}_${farmId}`;

    try {
      const response = await apiClient.get<any>(Endpoints.ponds.listByFarm(farmId), { params });
      let ponds = extractList<Pond>(response.data, ['data', 'ponds', 'items', 'results']);

      // Bước dự phòng 1: Kiểm tra trong GET /farms/:id (nếu danh sách ao đính kèm trong chi tiết farm)
      if (ponds.length === 0) {
        try {
          const farmDetailRes = await apiClient.get<any>(Endpoints.farms.detail(farmId));
          const farmObj = farmDetailRes.data?.data || farmDetailRes.data;
          if (farmObj && Array.isArray(farmObj.ponds) && farmObj.ponds.length > 0) {
            ponds = farmObj.ponds;
          }
        } catch {
          // Ignore
        }
      }

      // Bước dự phòng 2: Kiểm tra từ GET /farmers/:id/assignments
      if (ponds.length === 0) {
        const assignments = await farmerService.getMyAssignments(userId);
        const farmAssignments = assignments.filter(
          (a: any) => !a.farmId || a.farmId === farmId || a.farm?.id === farmId
        );

        const pondMap = new Map<string, Pond>();
        for (const assign of farmAssignments as any[]) {
          const pId = assign.pondId || assign.pond?.id;
          if (pId && !pondMap.has(pId)) {
            if (assign.pond && typeof assign.pond === 'object') {
              pondMap.set(pId, {
                id: pId,
                farmId: assign.farmId || farmId,
                code: assign.pond.code || 'AO-01',
                name: assign.pond.name || assign.pondName || 'Ao nuôi được phân công',
                areaM2: Number(assign.pond.areaM2) || 3000,
                status: assign.pond.status || 'active',
                createdAt: assign.pond.createdAt || assign.createdAt || new Date().toISOString(),
                updatedAt: assign.pond.updatedAt || new Date().toISOString(),
              });
            } else {
              try {
                const pRes = await apiClient.get<any>(Endpoints.ponds.detailInFarm(farmId, pId));
                const pData = pRes.data?.data || pRes.data;
                if (pData && pData.id) {
                  pondMap.set(pId, pData as Pond);
                  continue;
                }
              } catch {
                // Ignore
              }
              pondMap.set(pId, {
                id: pId,
                farmId: assign.farmId || farmId,
                code: assign.pondCode || `AO-0${pondMap.size + 1}`,
                name: assign.pondName || `Ao nuôi số ${pondMap.size + 1}`,
                areaM2: Number(assign.areaM2) || 3000,
                status: 'active',
                createdAt: assign.createdAt || assign.assignedAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
        if (pondMap.size > 0) {
          ponds = Array.from(pondMap.values());
        }
      }

      await Storage.setJSON(cacheKey, ponds);
      return ponds;
    } catch (error) {
      const cached = await Storage.getJSON<Pond[]>(cacheKey);
      if (cached && Array.isArray(cached)) {
        return cached;
      }
      throw error;
    }
  },

  /**
   * Lấy chi tiết một ao nuôi trong trang trại
   */
  async getPondById(farmId: string, id: string): Promise<Pond> {
    const response = await apiClient.get<Pond>(Endpoints.ponds.detailInFarm(farmId, id));
    return response.data;
  },

  /**
   * Tạo mới ao nuôi trong trang trại
   */
  async createPond(farmId: string, data: CreatePondRequest): Promise<Pond> {
    const response = await apiClient.post<Pond>(Endpoints.ponds.create(farmId), data);
    return response.data;
  },

  /**
   * Cập nhật thông tin ao nuôi
   */
  async updatePond(farmId: string, id: string, data: UpdatePondRequest): Promise<Pond> {
    const response = await apiClient.patch<Pond>(Endpoints.ponds.updateInFarm(farmId, id), data);
    return response.data;
  },

  /**
   * Xóa ao nuôi
   */
  async deletePond(farmId: string, id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      Endpoints.ponds.deleteInFarm(farmId, id)
    );
    return response.data;
  },

  // ==========================================
  // Quản lý Bộ Nhớ Đệm Lựa Chọn (Preferences)
  // ==========================================

  async getSelectedFarmId(): Promise<string | null> {
    return await Storage.getItem(AppConfig.storageKeys.selectedFarmId);
  },

  async setSelectedFarmId(farmId: string): Promise<void> {
    await Storage.setItem(AppConfig.storageKeys.selectedFarmId, farmId);
  },

  async getSelectedPondId(): Promise<string | null> {
    return await Storage.getItem(AppConfig.storageKeys.selectedPondId);
  },

  async setSelectedPondId(pondId: string): Promise<void> {
    await Storage.setItem(AppConfig.storageKeys.selectedPondId, pondId);
  },

  async clearSelections(): Promise<void> {
    await Storage.removeItem(AppConfig.storageKeys.selectedFarmId);
    await Storage.removeItem(AppConfig.storageKeys.selectedPondId);
  },
};
