import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { resolvePrimaryApiUrl } from '@/config/api';
import { tokenStorage } from '@/lib/storage/secureStorage';

export interface UploadImageResult {
  url: string;
  publicId?: string;
}

export interface NativeUploadFile {
  uri: string;
  name: string;
  type: string;
}

export type UploadableImage = File | Blob | NativeUploadFile;

export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const origin = resolvePrimaryApiUrl().replace(/\/api\/v1\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${cleanPath}`;
}

export const uploadsApi = {
  uploadImage: async (
    file: UploadableImage,
    filename = 'photo.jpg'
  ): Promise<UploadImageResult> => {
    // 1. Native Mobile (Android & iOS): Use native FileSystem.uploadAsync
    // This avoids JS networking/FormDataPart/whatwg-fetch crashes on mobile completely.
    if (
      Platform.OS !== 'web' &&
      typeof file === 'object' &&
      file !== null &&
      'uri' in file &&
      typeof (file as NativeUploadFile).uri === 'string'
    ) {
      const nativeFile = file as NativeUploadFile;
      const primaryUrl = resolvePrimaryApiUrl();
      const endpoint = API_ENDPOINTS.UPLOADS.IMAGE;
      const cleanBase = primaryUrl.replace(/\/+$/, '');
      const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const uploadUrl = `${cleanBase}${cleanPath}`;
      const token = tokenStorage.getAccessToken();

      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await FileSystem.uploadAsync(uploadUrl, nativeFile.uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: nativeFile.type || 'image/jpeg',
        headers,
      });

      if (res.status >= 200 && res.status < 300) {
        let parsed: any = {};
        try {
          parsed = JSON.parse(res.body);
        } catch {
          parsed = { url: res.body };
        }
        const data = parsed?.data || parsed;
        const rawUrl = data?.url || '';
        return {
          url: normalizeMediaUrl(rawUrl),
          publicId: data?.publicId,
        };
      } else {
        let errMsg = `Upload failed with status ${res.status}`;
        try {
          const errBody = JSON.parse(res.body);
          errMsg = errBody?.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
    }

    // 2. Web browser or standard Blob upload via FormData
    const formData = new FormData();
    if (typeof Blob !== 'undefined' && file instanceof Blob) {
      const name = (file as any).name || filename || 'photo.jpg';
      formData.append('file', file, name);
    } else {
      formData.append('file', file as any, filename);
    }

    const res = await apiClient.post<any>(
      API_ENDPOINTS.UPLOADS.IMAGE,
      formData
    );
    const data = res?.data?.data || res?.data;
    const rawUrl = data?.url || '';
    return {
      url: normalizeMediaUrl(rawUrl),
      publicId: data?.publicId,
    };
  },

  uploadMultipleImages: async (
    files: UploadableImage[]
  ): Promise<string[]> => {
    if (files.length === 0) return [];
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
