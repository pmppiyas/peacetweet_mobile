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

async function appendUploadFile(
  formData: FormData,
  fieldName: string,
  file: UploadableImage,
  fallbackFilename: string
): Promise<void> {
  // 1. If it's already a standard Blob or File
  if (typeof Blob !== 'undefined' && file instanceof Blob) {
    const filename = (file as any).name || fallbackFilename || 'photo.jpg';
    formData.append(fieldName, file, filename);
    return;
  }

  // 2. If it's a native asset with a uri
  if (
    typeof file === 'object' &&
    file !== null &&
    'uri' in file &&
    typeof (file as NativeUploadFile).uri === 'string'
  ) {
    const nativeFile = file as NativeUploadFile;
    const uri = nativeFile.uri;
    let mime = (nativeFile.type || '').trim().toLowerCase();
    if (!mime || mime === 'image/jpg') mime = 'image/jpeg';

    let filename = (nativeFile.name || fallbackFilename || 'photo.jpg').trim();
    if (!filename.includes('.')) {
      const ext = mime.split('/')[1] || 'jpg';
      filename = `${filename}.${ext === 'jpeg' ? 'jpg' : ext}`;
    }

    // Modern Expo WinterCG fetch / FormData strictly expects standard Blob/File objects.
    // Passing React Native's legacy { uri, name, type } triggers "Unsupported FormDataPart implementation".
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append(fieldName, blob, filename);
      return;
    } catch (err) {
      console.warn(
        '[uploadsApi] fetch(uri) -> blob conversion failed, trying XHR fallback:',
        err
      );
    }

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response as Blob);
        xhr.onerror = () =>
          reject(new Error('XMLHttpRequest failed to read file URI'));
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });
      formData.append(fieldName, blob, filename);
      return;
    } catch (xhrErr) {
      console.warn(
        '[uploadsApi] XHR fallback failed, trying legacy RN object format:',
        xhrErr
      );
    }

    // Fallback for older React Native runtimes that don't support Blob inside FormData
    formData.append(fieldName, {
      uri: nativeFile.uri,
      name: filename,
      type: mime,
    } as any);
    return;
  }

  formData.append(fieldName, file as Blob, fallbackFilename);
}

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
    const formData = new FormData();
    await appendUploadFile(formData, 'file', file, filename);

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
    try {
      const formData = new FormData();
      for (let idx = 0; idx < files.length; idx++) {
        await appendUploadFile(
          formData,
          'files',
          files[idx],
          `photo_${Date.now()}_${idx}.jpg`
        );
      }

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
