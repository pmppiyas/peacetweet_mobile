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

const PRIVATE_OR_LOCAL_UPLOAD_URL_RE =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?(\/uploads\/.*)$/i;

export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const origin = resolvePrimaryApiUrl().replace(/\/api\/v1\/?$/, '');

  // Rewrite stale localhost / emulator / DHCP-changed LAN IP upload URLs to the current reachable backend origin
  const localMatch = trimmed.match(PRIVATE_OR_LOCAL_UPLOAD_URL_RE);
  if (localMatch && origin) {
    return `${origin}${localMatch[1]}`;
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return origin ? `${origin}${cleanPath}` : trimmed;
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
