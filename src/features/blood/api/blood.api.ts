import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { BloodRequestItem, BloodDonorItem } from '../types/blood.types';

export const bloodApi = {
  // Get all blood requests
  getBloodRequests: async (params?: {
    bloodGroup?: string;
    status?: string;
    city?: string;
    search?: string;
    requesterId?: string;
    donorId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: BloodRequestItem[]; total?: number; meta?: any }> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.BLOOD.REQUESTS, { params });
    const payload = res?.data?.data || res?.data || {};
    const items = payload.items || (Array.isArray(payload) ? payload : []);
    return {
      items,
      total: payload.meta?.total ?? items.length,
      meta: payload.meta,
    };
  },

  // Get available blood donors
  getAvailableDonors: async (params?: {
    bloodGroup?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: BloodDonorItem[]; total?: number; meta?: any }> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.BLOOD.DONORS, { params });
    const payload = res?.data?.data || res?.data || {};
    const items = payload.items || (Array.isArray(payload) ? payload : []);
    return {
      items,
      total: payload.meta?.total ?? items.length,
      meta: payload.meta,
    };
  },

  // Accept a blood request
  acceptBloodRequest: async (requestId: string): Promise<any> => {
    const res = await apiClient.post<any>(API_ENDPOINTS.BLOOD.ACCEPT_REQUEST(requestId));
    return res?.data?.data || res?.data;
  },

  // Cancel accepted donation
  cancelDonation: async (requestId: string): Promise<any> => {
    const res = await apiClient.delete<any>(API_ENDPOINTS.BLOOD.CANCEL_DONATION(requestId));
    return res?.data?.data || res?.data;
  },

  // Delete blood request
  deleteBloodRequest: async (requestId: string): Promise<any> => {
    const res = await apiClient.delete<any>(API_ENDPOINTS.BLOOD.DELETE_REQUEST(requestId));
    return res?.data?.data || res?.data;
  },

  // Update blood request status (e.g. COMPLETED or CANCELLED)
  updateRequestStatus: async (requestId: string, status: string): Promise<any> => {
    const res = await apiClient.patch<any>(API_ENDPOINTS.BLOOD.UPDATE_STATUS(requestId), { status });
    return res?.data?.data || res?.data;
  },

  // Create a blood request
  createBloodRequest: async (data: any): Promise<BloodRequestItem> => {
    const res = await apiClient.post<any>(API_ENDPOINTS.BLOOD.CREATE_REQUEST, data);
    return res?.data?.data || res?.data;
  },

  // Toggle donor mode
  toggleDonorMode: async (isDonor?: boolean): Promise<any> => {
    const res = await apiClient.post<any>(API_ENDPOINTS.BLOOD.DONOR_MODE, { isDonor });
    return res?.data?.data || res?.data;
  },
};
