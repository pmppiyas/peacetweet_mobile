import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { normalizeMediaUrl } from '@/features/uploads/api/uploads.api';

export type PhotoEditorMode = 'cover' | 'avatar';

export interface PhotoEditorModalProps {
  isOpen: boolean;
  mode: PhotoEditorMode;
  imageSrc: string | null;
  isSaving?: boolean;
  onClose: () => void;
  onPickAnother?: () => void;
  onSave: (croppedFile: File | Blob, filename: string) => Promise<void> | void;
}

export function PhotoEditorModal({
  isOpen,
  mode,
  imageSrc,
  isSaving: externalIsSaving = false,
  onClose,
  onPickAnother,
  onSave,
}: PhotoEditorModalProps) {
  const { locale, theme } = useUi();

  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [viewportSize, setViewportSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [internalIsSaving, setInternalIsSaving] = useState(false);

  const isSaving = externalIsSaving || internalIsSaving;

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Prepare image as local Blob URL to prevent canvas CORS issues
  useEffect(() => {
    let active = true;
    let createdUrl = '';

    const prepareImage = async () => {
      if (!imageSrc) {
        setLoadedSrc(null);
        return;
      }
      const normalized = normalizeMediaUrl(imageSrc);
      if (normalized.startsWith('blob:') || normalized.startsWith('data:')) {
        setLoadedSrc(normalized);
        return;
      }

      try {
        const res = await fetch(normalized, { mode: 'cors' });
        const blob = await res.blob();
        if (active) {
          createdUrl = URL.createObjectURL(blob);
          setLoadedSrc(createdUrl);
        }
      } catch {
        if (active) {
          setLoadedSrc(normalized);
        }
      }
    };

    if (isOpen && imageSrc) {
      setNaturalSize(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      prepareImage();
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, imageSrc]);

  // Measure viewport container
  useEffect(() => {
    if (!isOpen || Platform.OS !== 'web') return;
    const el = viewportRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const timer = setTimeout(updateSize, 60);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateSize);
      ro.observe(el);
    }

    return () => {
      clearTimeout(timer);
      ro?.disconnect();
    };
  }, [isOpen, loadedSrc, mode]);

  const vw = viewportSize.width || (mode === 'avatar' ? 280 : 600);
  const vh = viewportSize.height || (mode === 'avatar' ? 280 : 200);
  const nw = naturalSize?.width || 1;
  const nh = naturalSize?.height || 1;

  // Scale so image always covers the crop viewport
  const baseScale = vw > 0 && vh > 0 ? Math.max(vw / nw, vh / nh) : 1;
  const renderedWidth = nw * baseScale * zoom;
  const renderedHeight = nh * baseScale * zoom;

  const clampOffset = useCallback(
    (x: number, y: number, z: number) => {
      if (vw <= 0 || vh <= 0) return { x: 0, y: 0 };
      const curW = nw * baseScale * z;
      const curH = nh * baseScale * z;
      const maxX = Math.max(0, (curW - vw) / 2);
      const maxY = Math.max(0, (curH - vh) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [vw, vh, nw, nh, baseScale]
  );

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setNaturalSize({ width: naturalWidth, height: naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.min(3, Math.max(1, Number(newZoom.toFixed(2))));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const targetX = offsetStartRef.current.x + deltaX;
    const targetY = offsetStartRef.current.y + deltaY;
    setOffset(clampOffset(targetX, targetY, zoom));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomStep = 0.08;
    const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
    handleZoomChange(zoom + delta);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    if (!imgRef.current || vw <= 0 || vh <= 0 || isSaving) return;
    setInternalIsSaving(true);

    try {
      const exportWidth = mode === 'avatar' ? 600 : 1200;
      const exportHeight =
        mode === 'avatar' ? 600 : Math.round(1200 * (vh / vw));

      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context not available');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const scale = exportWidth / vw;
      const imgLeft = ((vw - renderedWidth) / 2 + offset.x) * scale;
      const imgTop = ((vh - renderedHeight) / 2 + offset.y) * scale;
      const imgW = renderedWidth * scale;
      const imgH = renderedHeight * scale;

      ctx.drawImage(imgRef.current, imgLeft, imgTop, imgW, imgH);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setInternalIsSaving(false);
            return;
          }
          const filename = mode === 'avatar' ? 'avatar.jpg' : 'cover.jpg';
          const croppedFile =
            typeof File !== 'undefined'
              ? new File([blob], filename, { type: 'image/jpeg' })
              : blob;
          try {
            await onSave(croppedFile, filename);
          } finally {
            setInternalIsSaving(false);
          }
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Failed to crop image:', err);
      setInternalIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isAvatar = mode === 'avatar';

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={isSaving ? undefined : onClose}>
      <Pressable
        onPress={isSaving ? undefined : onClose}
        className="flex-1 bg-black/75 items-center justify-center p-3 sm:p-5">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-[680px] rounded-3xl border border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] p-4 sm:p-5 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-[#e4e6eb] dark:border-[#393a3b]">
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              <View className="h-9 w-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 items-center justify-center">
                <AppIcon android="crop_rotate" size={18} color="#1877f2" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-[#050505] dark:text-white">
                  {isAvatar
                    ? locale === 'bn'
                      ? 'প্রোফাইল ছবি রিসাইজ ও পজিশন করুন'
                      : 'Adjust Profile Picture'
                    : locale === 'bn'
                      ? 'কভার ছবি রিসাইজ ও পজিশন করুন'
                      : 'Adjust Cover Photo'}
                </Text>
                <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                  {locale === 'bn'
                    ? 'ছবিটি ড্র্যাগ করে পজিশন ঠিক করুন এবং স্লাইডার দিয়ে জুম/রিসাইজ করুন'
                    : 'Drag to reposition and use the slider to resize/zoom'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={isSaving ? undefined : onClose}
              disabled={isSaving}
              className="h-8 w-8 rounded-full bg-[#e6e9ef] dark:bg-[#3a3b3c] items-center justify-center active:scale-95">
              <AppIcon
                android="close"
                size={18}
                color={theme === 'dark' ? '#e4e6eb' : '#050505'}
              />
            </Pressable>
          </View>

          {/* Interactive Viewport */}
          <View className="items-center justify-center my-1">
            {Platform.OS === 'web' ? (
              <div
                ref={viewportRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                style={{
                  position: 'relative',
                  width: isAvatar ? 260 : '100%',
                  height: isAvatar ? 260 : undefined,
                  aspectRatio: isAvatar ? '1 / 1' : '3 / 1',
                  minHeight: isAvatar ? 260 : 185,
                  borderRadius: isAvatar ? 9999 : 16,
                  overflow: 'hidden',
                  backgroundColor: '#111827',
                  border: '2px solid rgba(24, 119, 242, 0.45)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  touchAction: 'none',
                }}>
                {loadedSrc ? (
                  <img
                    ref={imgRef}
                    src={loadedSrc}
                    alt="Crop preview"
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    draggable={false}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: `${renderedWidth}px`,
                      height: `${renderedHeight}px`,
                      maxWidth: 'none',
                      maxHeight: 'none',
                      transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      height: '100%',
                      width: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: 12,
                    }}>
                    {locale === 'bn' ? 'ছবি লোড হচ্ছে...' : 'Loading photo...'}
                  </div>
                )}

                {/* Drag Instruction Pill */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.62)',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    pointerEvents: 'none',
                    opacity: isDragging ? 0.3 : 0.9,
                    transition: 'opacity 150ms',
                    whiteSpace: 'nowrap',
                  }}>
                  ✥ {locale === 'bn' ? 'ড্র্যাগ করে পজিশন ঠিক করুন' : 'Drag to reposition'}
                </div>

                {/* Cover Avatar Placement Silhouette */}
                {!isAvatar && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -36,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 84,
                      height: 84,
                      borderRadius: 999,
                      border: '2px dashed rgba(255,255,255,0.65)',
                      backgroundColor: 'rgba(0,0,0,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 10,
                      fontWeight: 700,
                      pointerEvents: 'none',
                    }}>
                    {locale === 'bn' ? 'প্রোফাইল' : 'Avatar'}
                  </div>
                )}
              </div>
            ) : null}
          </View>

          {/* Zoom & Resize Toolbar */}
          <View className="mt-3 p-3 rounded-2xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/60 border border-[#e4e6eb] dark:border-[#393a3b] space-y-2.5">
            <View className="flex-row items-center gap-2.5">
              <Pressable
                onPress={() => handleZoomChange(zoom - 0.1)}
                disabled={zoom <= 1 || isSaving}
                className="h-8 w-8 rounded-lg bg-white dark:bg-[#242526] items-center justify-center border border-[#ced0d4] dark:border-[#4a4b4d] disabled:opacity-40 active:scale-95">
                <AppIcon
                  android="remove"
                  size={16}
                  color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                />
              </Pressable>

              <View className="flex-1 justify-center">
                {Platform.OS === 'web' ? (
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    disabled={isSaving}
                    onChange={(e) =>
                      handleZoomChange(parseFloat(e.target.value))
                    }
                    style={{
                      width: '100%',
                      cursor: 'pointer',
                      accentColor: '#1877f2',
                    }}
                  />
                ) : null}
              </View>

              <Pressable
                onPress={() => handleZoomChange(zoom + 0.1)}
                disabled={zoom >= 3 || isSaving}
                className="h-8 w-8 rounded-lg bg-white dark:bg-[#242526] items-center justify-center border border-[#ced0d4] dark:border-[#4a4b4d] disabled:opacity-40 active:scale-95">
                <AppIcon
                  android="add"
                  size={16}
                  color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                />
              </Pressable>

              <Text className="text-xs font-bold text-[#050505] dark:text-white min-w-[44px] text-right">
                {Math.round(zoom * 100)}%
              </Text>
            </View>

            {/* Quick Action Buttons: Pick Another Photo & Reset */}
            <View className="flex-row items-center justify-between pt-1">
              {onPickAnother ? (
                <Pressable
                  onPress={onPickAnother}
                  disabled={isSaving}
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#4a4b4d] active:scale-95">
                  <AppIcon android="photo_library" size={14} color="#1877f2" />
                  <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {locale === 'bn' ? 'অন্য ছবি নিন' : 'Change Photo'}
                  </Text>
                </Pressable>
              ) : (
                <View />
              )}

              <Pressable
                onPress={handleReset}
                disabled={
                  isSaving || (zoom === 1 && offset.x === 0 && offset.y === 0)
                }
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#4a4b4d] disabled:opacity-40 active:scale-95">
                <AppIcon
                  android="restart_alt"
                  size={14}
                  color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                />
                <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {locale === 'bn' ? 'রিসেট' : 'Reset'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer Buttons */}
          <View className="mt-4 pt-3 border-t border-[#e4e6eb] dark:border-[#393a3b] flex-row items-center justify-end gap-2.5">
            <Pressable
              onPress={isSaving ? undefined : onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-[#ced0d4] dark:border-[#4a4b4d] bg-[#e6e9ef] dark:bg-[#3a3b3c] active:scale-95">
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'বাতিল' : 'Cancel'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={isSaving || !naturalSize}
              className="flex-row items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-600 shadow-sm active:scale-95 disabled:opacity-60">
              {isSaving ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-xs font-bold text-white">
                    {locale === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                  </Text>
                </>
              ) : (
                <>
                  <AppIcon android="check" size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">
                    {locale === 'bn' ? 'সংরক্ষণ করুন' : 'Save Photo'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
