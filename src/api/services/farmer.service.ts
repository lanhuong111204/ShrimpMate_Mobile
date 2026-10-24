import { apiClient } from '../client';
import { Endpoints } from '../endpoints';
import { FarmerAssignment } from '@/types/auth';

export const farmerService = {
  /**
   * Lấy danh sách ao / trang trại được phân công cho Farmer hiện tại
   */
  async getMyAssignments(): Promise<FarmerAssignment[]> {
    try {
      const response = await apiClient.get<FarmerAssignment[]>(Endpoints.farmers.myAssignments);
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Lấy danh sách phân công theo Farmer ID (dành cho quản lý hoặc tra cứu chi tiết)
   */
  async getAssignmentsByFarmerId(farmerId: string): Promise<FarmerAssignment[]> {
    try {
      const response = await apiClient.get<FarmerAssignment[]>(Endpoints.farmers.assignments(farmerId));
      return response.data || [];
    } catch {
      return [];
    }
  },
};
