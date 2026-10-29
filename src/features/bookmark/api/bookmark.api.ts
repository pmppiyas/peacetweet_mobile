import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { ApiResponse } from '@/types/api.types';
import { SavedItemParams, SavedFeedItem, TimeSlot } from '@/types/saved.types';

export const bookmarkApi = {
  saveDua: async (
    duaId: string,
    timeSlot?: TimeSlot | null
  ): Promise<ApiResponse<{ message: string; data?: unknown }>> => {
    const { data } = await apiClient.post<
      ApiResponse<{ message: string; data?: unknown }>
    >(API_ENDPOINTS.DUAS.SAVE(duaId), { timeSlot });
    return data;
  },

  unsaveDua: async (duaId: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.DUAS.UNSAVE(duaId)
    );
    return data;
  },

  savePost: async (
    postId: string,
    timeSlot?: TimeSlot | null
  ): Promise<ApiResponse<{ hasSaved: boolean; timeSlot?: string }>> => {
    const { data } = await apiClient.post<
      ApiResponse<{ hasSaved: boolean; timeSlot?: string }>
    >(API_ENDPOINTS.POSTS.SAVE(postId), { timeSlot });
    return data;
  },

  unsavePost: async (
    postId: string
  ): Promise<ApiResponse<{ hasSaved: boolean }>> => {
    const { data } = await apiClient.delete<ApiResponse<{ hasSaved: boolean }>>(
      API_ENDPOINTS.POSTS.UNSAVE(postId)
    );
    return data;
  },

  updateTimeSlot: async ({
    id,
    type,
    timeSlot,
  }: {
    id: string;
    type: 'DUA' | 'POST';
    timeSlot: TimeSlot | null;
  }): Promise<ApiResponse<{ success: boolean; timeSlot: string | null }>> => {
    const { data } = await apiClient.patch<
      ApiResponse<{ success: boolean; timeSlot: string | null }>
    >(API_ENDPOINTS.USERS.UPDATE_TIME_SLOT, {
      id,
      type,
      timeSlot,
    });
    return data;
  },

  getSavedItems: async (
    params?: SavedItemParams
  ): Promise<ApiResponse<SavedFeedItem[]>> => {
    const { data } = await apiClient.get<ApiResponse<SavedFeedItem[]>>(
      API_ENDPOINTS.USERS.SAVED,
      { params: params as any }
    );
    return data;
  },
};
