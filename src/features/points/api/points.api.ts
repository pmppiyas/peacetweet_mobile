import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import {
  CheckInResult,
  LeaderboardEntry,
  PointsDashboard,
  PointTransactionItem,
  RedeemResult,
  RedeemStoreData,
} from '../types/points.types';

export const pointsApi = {
  getDashboard: async (): Promise<PointsDashboard> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.POINTS.ME);
    return res?.data?.data ?? res?.data;
  },

  getHistory: async (
    page = 1,
    limit = 25
  ): Promise<{ items: PointTransactionItem[]; meta?: any }> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.POINTS.HISTORY, {
      params: { page, limit },
    });
    const payload = res?.data;
    return {
      items: payload?.data ?? [],
      meta: payload?.meta,
    };
  },

  checkIn: async (): Promise<CheckInResult> => {
    const res = await apiClient.post<any>(API_ENDPOINTS.POINTS.CHECK_IN);
    return res?.data?.data ?? res?.data;
  },

  getRedeemStore: async (): Promise<RedeemStoreData> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.POINTS.REDEEM);
    return res?.data?.data ?? res?.data;
  },

  redeemReward: async (
    code: string,
    deliveryInfo?: {
      recipientName: string;
      phone: string;
      address: string;
      note?: string;
    },
  ): Promise<RedeemResult> => {
    const res = await apiClient.post<any>(API_ENDPOINTS.POINTS.REDEEM, {
      code,
      ...(deliveryInfo ? { deliveryInfo } : {}),
    });
    return res?.data?.data ?? res?.data;
  },

  toggleEquipCosmetic: async (
    code: string,
    equip: boolean,
  ): Promise<{ rewardCode: string; equipped: boolean; user?: any }> => {
    const res = await apiClient.post<any>(API_ENDPOINTS.POINTS.REDEEM_EQUIP, {
      code,
      equip,
    });
    return res?.data?.data ?? res?.data;
  },

  getLeaderboard: async (limit = 20): Promise<LeaderboardEntry[]> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.POINTS.LEADERBOARD, {
      params: { limit },
    });
    return res?.data?.data ?? [];
  },
};
