import { Image, Platform } from 'react-native';

const ratioCache = new Map<string, number>();

export const imageRatioCache = {
  get(url?: string | null): number | null {
    if (!url) return null;
    return ratioCache.get(url) || null;
  },
  set(url: string, ratio: number): void {
    if (!url || !ratio || isNaN(ratio) || ratio <= 0) return;
    ratioCache.set(url, ratio);
  },
  has(url?: string | null): boolean {
    if (!url) return false;
    return ratioCache.has(url);
  },
};

export function resolveImageAspectRatio(
  uri?: string | null,
  callback?: (ratio: number) => void
): number | null {
  if (!uri) return null;
  const cached = imageRatioCache.get(uri);
  if (cached) {
    callback?.(cached);
    return cached;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const img = new (window as any).Image();
      img.src = uri;
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const r = img.naturalWidth / img.naturalHeight;
        imageRatioCache.set(uri, r);
        callback?.(r);
        return r;
      }
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const r = img.naturalWidth / img.naturalHeight;
          imageRatioCache.set(uri, r);
          callback?.(r);
        }
      };
    } catch {}
  }

  Image.getSize(
    uri,
    (w, h) => {
      if (w > 0 && h > 0) {
        const r = w / h;
        imageRatioCache.set(uri, r);
        callback?.(r);
      }
    },
    () => {}
  );

  return null;
}
