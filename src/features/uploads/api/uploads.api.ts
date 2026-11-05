import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { resolvePrimaryApiUrl } from '@/config/api';

export interface UploadImageResult {
  url: string;
  publicId?: string;
}

export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const origin = resolvePrimaryApiUrl().replace(/\/api\/v1\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${cleanPath}`;
}

export const uploadsApi = {
  uploadImage: async (file: File | Blob, filename = 'photo.jpg'): Promise<UploadImageResult> => {
    const formData = new FormData();
    formData.append('file', file, filename);

    const res = await apiClient.post<any>(API_ENDPOINTS.UPLOADS.IMAGE, formData);
    const data = res?.data?.data || res?.data;
    const rawUrl = data?.url || '';
    return {
      url: normalizeMediaUrl(rawUrl),
      publicId: data?.publicId,
    };
  },

  uploadMultipleImages: async (files: (File | Blob)[]): Promise<string[]> => {
    if (files.length === 0) return [];
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const res = await apiClient.post<any>('/uploads/images', formData);
      const data = res?.data?.data || res?.data;
      if (Array.isArray(data)) {
        return data
          .map((item) => normalizeMediaUrl(item?.url || item))
          .filter(Boolean);
      }
    } catch {
      // Fallback: parallel uploads
    }

    const results = await Promise.allSettled(
      files.map((file, idx) =>
        uploadsApi.uploadImage(file, `photo_${Date.now()}_${idx}.jpg`)
      )
    );
    return results
      .filter(
        (r): r is PromiseFulfilledResult<UploadImageResult> =>
          r.status === 'fulfilled'
      )
      .map((r) => r.value.url)
      .filter(Boolean);
  },
};
