import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { FarmerAssignment, User } from '@/types/auth';

export const farmerService = {
  /**
   * Lấy danh sách ao / trang trại được phân công cho Farmer hiện tại
   * Chuẩn đặc tả Mục 4.7: GET /farmers/:id/assignments
   */
  async getMyAssignments(farmerId?: string): Promise<FarmerAssignment[]> {
    try {
      let targetId = farmerId;
      if (!targetId) {
        const storedUser = await Storage.getJSON<User>(AppConfig.storageKeys.userData);
        targetId = storedUser?.id;
      }
      if (!targetId || targetId === 'usr_offline') {
        return [];
      }
      const response = await apiClient.get<FarmerAssignment[]>(Endpoints.farmers.assignments(targetId));
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /**
   * Lấy danh sách phân công theo Farmer ID (GET /farmers/:id/assignments)
   */
  async getAssignmentsByFarmerId(farmerId: string): Promise<FarmerAssignment[]> {
    try {
      const response = await apiClient.get<FarmerAssignment[]>(Endpoints.farmers.assignments(farmerId));
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },
};

