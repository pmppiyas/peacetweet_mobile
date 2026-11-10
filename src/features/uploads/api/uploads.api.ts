import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { resolvePrimaryApiUrl } from '@/config/api';

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

function appendUploadFile(
  formData: FormData,
  fieldName: string,
  file: UploadableImage,
  fallbackFilename: string
) {
  const isNativeAsset =
    typeof file === 'object' &&
    file !== null &&
    'uri' in file &&
    typeof (file as NativeUploadFile).uri === 'string' &&
    !(typeof Blob !== 'undefined' && file instanceof Blob);

  if (isNativeAsset) {
    const nativeFile = file as NativeUploadFile;
    let mime = (nativeFile.type || '').trim().toLowerCase();
    if (!mime || mime === 'image/jpg') mime = 'image/jpeg';

    let filename = (nativeFile.name || fallbackFilename || 'photo.jpg').trim();
    if (!filename.includes('.')) {
      const ext = mime.split('/')[1] || 'jpg';
      filename = `${filename}.${ext === 'jpeg' ? 'jpg' : ext}`;
    }

    formData.append(fieldName, {
      uri: nativeFile.uri,
      name: filename,
      type: mime,
    } as any);
  } else {
    formData.append(fieldName, file as Blob, fallbackFilename);
  }
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
  uploadImage: async (file: UploadableImage, filename = 'photo.jpg'): Promise<UploadImageResult> => {
    const formData = new FormData();
    appendUploadFile(formData, 'file', file, filename);

    const res = await apiClient.post<any>(API_ENDPOINTS.UPLOADS.IMAGE, formData);
    const data = res?.data?.data || res?.data;
    const rawUrl = data?.url || '';
    return {
      url: normalizeMediaUrl(rawUrl),
      publicId: data?.publicId,
    };
  },

  uploadMultipleImages: async (files: UploadableImage[]): Promise<string[]> => {
    if (files.length === 0) return [];
    try {
      const formData = new FormData();
      files.forEach((file, idx) =>
        appendUploadFile(formData, 'files', file, `photo_${Date.now()}_${idx}.jpg`)
      );

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
