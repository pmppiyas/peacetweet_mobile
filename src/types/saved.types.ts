import { FeedItem } from '@/features/feed/types/feed.types';

export type TimeSlot = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export interface TimeSlotConfig {
  id: TimeSlot;
  labelEn: string;
  labelBn: string;
  icon: string;
  routineEn: string;
  routineBn: string;
  badgeBg: string;
  badgeText: string;
}

export const TIME_SLOTS: TimeSlotConfig[] = [
  {
    id: 'morning',
    labelEn: 'Morning',
    labelBn: 'সকাল',
    icon: '🌅',
    routineEn: 'Fajr & Morning Azkar',
    routineBn: 'ফজর ও সকালের দোয়া',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
  },
  {
    id: 'noon',
    labelEn: 'Noon',
    labelBn: 'দুপুর',
    icon: '☀️',
    routineEn: 'Dhuhr & Noon Prayers',
    routineBn: 'যোহর ও দুপুরের দোয়া',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-950/60',
    badgeText: 'text-yellow-800 dark:text-yellow-300',
  },
  {
    id: 'afternoon',
    labelEn: 'Afternoon',
    labelBn: 'বিকেল',
    icon: '🌤️',
    routineEn: 'Asr & Late Afternoon',
    routineBn: 'আসর ও বিকালের দোয়া',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/60',
    badgeText: 'text-sky-800 dark:text-sky-300',
  },
  {
    id: 'evening',
    labelEn: 'Evening',
    labelBn: 'সন্ধ্যা',
    icon: '🌇',
    routineEn: 'Maghrib & Evening Azkar',
    routineBn: 'মাগরিব ও সন্ধ্যার দোয়া',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/60',
    badgeText: 'text-orange-800 dark:text-orange-300',
  },
  {
    id: 'night',
    labelEn: 'Night',
    labelBn: 'রাত',
    icon: '🌙',
    routineEn: 'Isha & Before Sleep',
    routineBn: 'এশা ও ঘুমানোর আগের দোয়া',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
  },
];

export function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 15) return 'noon';
  if (hour >= 15 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
}

export interface SavedItemParams {
  page?: number;
  limit?: number;
  search?: string;
  timeSlot?: TimeSlot | 'all';
  type?: 'ALL' | 'DUA' | 'POST';
}

export type SavedFeedItem = FeedItem & {
  savedId?: string;
  savedType?: 'DUA' | 'POST';
  timeSlot?: TimeSlot | null;
  savedAt?: string;
};
