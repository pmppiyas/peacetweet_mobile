import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { ApiResponse } from '@/types/api.types';
import {
  CreatePostInput,
  FeedFilters,
  FeedItem,
  FeedResponse,
  PostComment,
} from '../types/feed.types';

export const feedApi = {
  getFeed: async (params?: FeedFilters): Promise<ApiResponse<FeedResponse>> => {
    const { data } = await apiClient.get<ApiResponse<FeedResponse>>(
      API_ENDPOINTS.FEED.GET,
      { params: params as any }
    );
    return data;
  },

  getPost: async (id: string): Promise<ApiResponse<FeedItem>> => {
    const { data } = await apiClient.get<ApiResponse<FeedItem>>(
      API_ENDPOINTS.POSTS.DETAIL(id)
    );
    return data;
  },

  createPost: async (input: CreatePostInput): Promise<ApiResponse<FeedItem>> => {
    const { data } = await apiClient.post<ApiResponse<FeedItem>>(
      API_ENDPOINTS.POSTS.CREATE,
      input
    );
    return data;
  },

  deletePost: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const { data } = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      API_ENDPOINTS.POSTS.DELETE(id)
    );
    return data;
  },

  reactToPost: async (
    postId: string
  ): Promise<ApiResponse<{ hasReacted: boolean; reactionCount: number }>> => {
    const { data } = await apiClient.post<
      ApiResponse<{ hasReacted: boolean; reactionCount: number }>
    >(API_ENDPOINTS.POSTS.REACTION(postId));
    return data;
  },

  unreactToPost: async (
    postId: string
  ): Promise<ApiResponse<{ hasReacted: boolean; reactionCount: number }>> => {
    const { data } = await apiClient.delete<
      ApiResponse<{ hasReacted: boolean; reactionCount: number }>
    >(API_ENDPOINTS.POSTS.UNREACTION(postId));
    return data;
  },

  savePost: async (
    postId: string,
    timeSlot?: string
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

  getComments: async (
    postId: string,
    limit?: number
  ): Promise<ApiResponse<PostComment[]>> => {
    const { data } = await apiClient.get<ApiResponse<PostComment[]>>(
      API_ENDPOINTS.POSTS.COMMENTS(postId),
      { params: { limit } }
    );
    return data;
  },

  createComment: async (
    postId: string,
    content: string
  ): Promise<ApiResponse<{ comment: PostComment; commentCount: number }>> => {
    const { data } = await apiClient.post<
      ApiResponse<{ comment: PostComment; commentCount: number }>
    >(API_ENDPOINTS.POSTS.CREATE_COMMENT(postId), { content });
    return data;
  },
};
