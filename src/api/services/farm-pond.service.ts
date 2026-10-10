import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { CreateFarmRequest, Farm, UpdateFarmRequest } from '@/types/farm';
import { CreatePondRequest, Pond, UpdatePondRequest } from '@/types/pond';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export const farmPondService = {
  /**
   * Lấy danh sách trang trại của Farmer hiện tại
   * Hỗ trợ tự động cache vào Storage phục vụ chế độ offline bờ ao
   */
  async getFarms(params?: PaginationParams): Promise<Farm[]> {
    try {
      const response = await apiClient.get<any>(Endpoints.farms.list, { params });
      const result = response.data;

      // Xử lý linh hoạt cả cấu trúc mảng trực tiếp và cấu trúc phân trang { data: Farm[], meta }
      let farms: Farm[] = [];
      if (Array.isArray(result)) {
        farms = result;
      } else if (result && Array.isArray(result.data)) {
        farms = result.data;
      }

      // Lưu cache offline
      if (farms.length > 0) {
        await Storage.setJSON(AppConfig.storageKeys.cachedFarms, farms);
      }
      return farms;
    } catch (error) {
      // Khi mất sóng bờ ao, fallback đọc dữ liệu đã lưu trong bộ nhớ đệm
      const cached = await Storage.getJSON<Farm[]>(AppConfig.storageKeys.cachedFarms);
      if (cached && Array.isArray(cached) && cached.length > 0) {
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
   * Lấy danh sách ao nuôi thuộc một trang trại cụ thể
   * Hỗ trợ tự động lưu cache phục vụ chế độ offline bờ ao
   */
  async getPondsByFarm(farmId: string, params?: PaginationParams): Promise<Pond[]> {
    try {
      const response = await apiClient.get<any>(Endpoints.ponds.listByFarm(farmId), { params });
      const result = response.data;

      let ponds: Pond[] = [];
      if (Array.isArray(result)) {
        ponds = result;
      } else if (result && Array.isArray(result.data)) {
        ponds = result.data;
      }

      // Lưu cache ao nuôi theo farm
      if (ponds.length > 0) {
        await Storage.setJSON(`${AppConfig.storageKeys.cachedPonds}_${farmId}`, ponds);
      }
      return ponds;
    } catch (error) {
      // Fallback cache offline
      const cached = await Storage.getJSON<Pond[]>(`${AppConfig.storageKeys.cachedPonds}_${farmId}`);
      if (cached && Array.isArray(cached) && cached.length > 0) {
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
    const response = await apiClient.delete<{ message: string }>(Endpoints.ponds.deleteInFarm(farmId, id));
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
