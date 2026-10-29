import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { appStorage } from '@/lib/storage/secureStorage';
import { AppIcon } from '@/components/ui/Icon';

export const TASBIH_TARGETS = [3, 7, 11, 15, 33, 100] as const;
export type TasbihTarget = (typeof TASBIH_TARGETS)[number];

export interface TasbihItem {
  id?: string;
  title: string;
  arabicText?: string;
  transliteration?: string;
}

export const DEFAULT_TASBIH_ITEMS: TasbihItem[] = [
  {
    id: 'subhanallah',
    title: 'সুবহানাল্লাহ',
    arabicText: 'سُبْحَانَ اللَّهِ',
    transliteration: 'সুবহানাল্লাহ',
  },
  {
    id: 'alhamdulillah',
    title: 'আলহামদুলিল্লাহ',
    arabicText: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'আলহামদুলিল্লাহ',
  },
  {
    id: 'allahuakbar',
    title: 'আল্লাহু আকবার',
    arabicText: 'اللَّهُ أَكْبَرُ',
    transliteration: 'আল্লাহু আকবার',
  },
  {
    id: 'lailahaillallah',
    title: 'লা ইলাহা ইল্লাল্লাহ',
    arabicText: 'لَا إِلَهَ إِلَّا اللَّهُ',
    transliteration: 'লা ইলাহা ইল্লাল্লাহ',
  },
  {
    id: 'astaghfirullah',
    title: 'আস্তাগফিরুল্লাহ',
    arabicText: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'আস্তাগফিরুল্লাহ',
  },
  {
    id: 'hawqala',
    title: 'লা হাওলা ওয়া লা কুওয়াতা ইল্লা বিল্লাহ',
    arabicText: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'লা হাওলা ওয়া লা কুওয়াতা ইল্লা বিল্লাহ',
  },
  {
    id: 'salawat',
    title: 'দুরূদ শরীফ',
    arabicText: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    transliteration: 'আল্লাহুম্মা সাল্লি আলা মুহাম্মাদ ওয়া আলা আলি মুহাম্মাদ',
  },
  {
    id: 'subhanallah_bihamdihi',
    title: 'সুবহানাল্লাহি ওয়া বিহামদিহি',
    arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: 'সুবহানাল্লাহি ওয়া বিহামদিহি, সুবহানাল্লাহিল আজিম',
  },
  {
    id: 'dua_yunus',
    title: 'দোয়া ইউনুস',
    arabicText: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: 'লা ইলাহা ইল্লা আনতা সুবহানাকা ইন্নি কুনতু মিনাজ জোয়ালিমিন',
  },
  {
    id: 'hasbunallah',
    title: 'হাসবুনাল্লাহু ওয়া নি’মাল ওয়াকিল',
    arabicText: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: 'হাসবুনাল্লাহু ওয়া নি’মাল ওয়াকিল',
  },
];

export interface TasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
  duaTitle?: string;
  arabicText?: string;
  transliteration?: string;
}

export function TasbihModal({
  isOpen,
  onClose,
  duaTitle,
  arabicText,
  transliteration,
}: TasbihModalProps) {
  const { locale, theme } = useUi();

  const [target, setTarget] = useState<TasbihTarget>(() => {
    const saved = Number(appStorage.getItem('pt_tasbih_target'));
    return TASBIH_TARGETS.includes(saved as any) ? (saved as TasbihTarget) : 33;
  });
  const [count, setCount] = useState<number>(
    () => Number(appStorage.getItem('pt_tasbih_count')) || 0
  );
  const [lap, setLap] = useState<number>(
    () => Number(appStorage.getItem('pt_tasbih_lap')) || 1
  );
  const [totalToday, setTotalToday] = useState<number>(
    () => Number(appStorage.getItem('pt_tasbih_today')) || 0
  );
  const [isTargetReached, setIsTargetReached] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items: TasbihItem[] = useMemo(() => {
    if (duaTitle || arabicText || transliteration) {
      const currentItem: TasbihItem = {
        id: 'current-dua',
        title: duaTitle || (locale === 'bn' ? 'সংরক্ষিত দোয়া' : 'Saved Dua'),
        arabicText,
        transliteration,
      };
      const rest = DEFAULT_TASBIH_ITEMS.filter(
        (i) =>
          i.arabicText !== arabicText && i.transliteration !== transliteration
      );
      return [currentItem, ...rest];
    }
    return DEFAULT_TASBIH_ITEMS;
  }, [duaTitle, arabicText, transliteration, locale]);

  const currentItem =
    items[currentIndex] || items[0] || DEFAULT_TASBIH_ITEMS[0];

  useEffect(() => {
    appStorage.setItem('pt_tasbih_count', String(count));
    appStorage.setItem('pt_tasbih_target', String(target));
    appStorage.setItem('pt_tasbih_lap', String(lap));
    appStorage.setItem('pt_tasbih_today', String(totalToday));
  }, [count, target, lap, totalToday]);

  useEffect(() => {
    return () => {
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }
    };
  }, []);

  const handleNextZikr = useCallback(() => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setCount(0);
    setIsTargetReached(false);
  }, [items.length]);

  const handlePrevZikr = useCallback(() => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setCount(0);
    setIsTargetReached(false);
  }, [items.length]);

  const handleIncrement = () => {
    if (count >= target || isTargetReached) {
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
        autoNextTimeoutRef.current = null;
      }
      handleNextZikr();
      return;
    }

    const nextCount = count + 1;
    setTotalToday((prev) => prev + 1);

    if (nextCount >= target) {
      setCount(target);
      setLap((prev) => prev + 1);
      setIsTargetReached(true);
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }
      autoNextTimeoutRef.current = setTimeout(() => {
        handleNextZikr();
      }, 700);
    } else {
      setCount(nextCount);
    }
  };

  const handleReset = () => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
    setCount(0);
    setLap(1);
    setIsTargetReached(false);
  };

  const handleTargetChange = (newTarget: TasbihTarget) => {
    setTarget(newTarget);
    setCount(0);
    setIsTargetReached(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 justify-end sm:justify-center sm:items-center p-0 sm:p-4">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] p-4 pb-6 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-[#e4e6eb] dark:border-[#393a3b] gap-2">
            <View className="flex-row items-center gap-2 flex-1">
              <Text className="text-xl">📿</Text>
              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {currentItem.title}
                </Text>
                <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                  {locale === 'bn'
                    ? `চক্র: ${lap} • মোট: ${totalToday} • (${currentIndex + 1}/${items.length})`
                    : `Lap: ${lap} • Total: ${totalToday} • (${currentIndex + 1}/${items.length})`}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={handleReset}
                className="p-1.5 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                <AppIcon
                  android="refresh"
                  ios="arrow.counterclockwise"
                  size={18}
                  color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                />
              </Pressable>
              <Pressable
                onPress={onClose}
                className="p-1.5 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                <AppIcon
                  android="close"
                  ios="xmark"
                  size={20}
                  color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                />
              </Pressable>
            </View>
          </View>

          {/* Pronunciation & Arabic Text recitation box */}
          {(currentItem.transliteration || currentItem.arabicText) && (
            <View className="mt-3 rounded-2xl bg-[#f0f2f5]/80 dark:bg-[#3a3b3c]/50 p-3 items-center gap-1.5 border border-[#e4e6eb]/60 dark:border-[#393a3b]/60">
              {currentItem.arabicText && (
                <Text className="text-xl text-[#050505] dark:text-primary-200 font-bold text-center leading-8">
                  {currentItem.arabicText}
                </Text>
              )}
              {currentItem.transliteration && (
                <Text className="text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] text-center leading-5">
                  {currentItem.transliteration}
                </Text>
              )}
            </View>
          )}

          {/* Target Count Selector (3, 7, 11, 15, 33, 100) */}
          <View className="mt-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[11px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn' ? 'টার্গেট সংখ্যা:' : 'Target Count:'}
              </Text>
              <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                {target} {locale === 'bn' ? 'বার' : 'times'}
              </Text>
            </View>
            <View className="flex-row gap-1">
              {TASBIH_TARGETS.map((t) => {
                const isSelected = target === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => handleTargetChange(t)}
                    className={`flex-1 py-1.5 rounded-xl items-center ${
                      isSelected
                        ? 'bg-primary-500'
                        : 'bg-[#f0f2f5] dark:bg-[#3a3b3c]'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-white'
                          : 'text-[#050505] dark:text-[#e4e6eb]'
                      }`}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Main Interactive Tap Dial with Left (<) and Right (>) Navigation Buttons */}
          <View className="mt-4 mb-1 flex-row items-center justify-center gap-6">
            <Pressable
              onPress={handlePrevZikr}
              className="h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-[#2d2f31] border border-[#e4e6eb] dark:border-[#3e4042]">
              <AppIcon
                android="chevron_left"
                ios="chevron.left"
                size={22}
                color={theme === 'dark' ? '#b0b3b8' : '#4b4f56'}
              />
            </Pressable>

            <Pressable
              onPress={handleIncrement}
              className={`h-36 w-36 rounded-full items-center justify-center border-4 ${
                isTargetReached
                  ? 'bg-emerald-600 border-emerald-400'
                  : 'bg-primary-600 border-primary-400/50'
              }`}>
              <Text className="text-[10px] font-bold tracking-widest uppercase text-white/85 mb-0.5">
                {isTargetReached
                  ? locale === 'bn'
                    ? 'সম্পন্ন!'
                    : 'Completed!'
                  : locale === 'bn'
                    ? 'ট্যাপ করুন'
                    : 'Tap to Count'}
              </Text>
              <Text className="text-4xl font-black text-white">{count}</Text>
              <Text className="text-[11px] font-semibold text-white/85 mt-0.5">
                / {target}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleNextZikr}
              className="h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-[#2d2f31] border border-[#e4e6eb] dark:border-[#3e4042]">
              <AppIcon
                android="chevron_right"
                ios="chevron.right"
                size={22}
                color={theme === 'dark' ? '#b0b3b8' : '#4b4f56'}
              />
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
