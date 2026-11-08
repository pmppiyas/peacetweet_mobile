export interface PresetAvatarItem {
  id: string;
  labelEn: string;
  labelBn: string;
  url: string;
}

/**
 * 8 pre-hosted, 100% human-free / creature-free profile avatars
 * Themes: Islamic Vibe (Masjid, Holy Quran, Noor Lantern), Flowers (Rose, Lotus), & Peaceful Nature
 */
export const PRESET_AVATARS: PresetAvatarItem[] = [
  {
    id: 'golden-masjid',
    labelEn: 'Golden Masjid',
    labelBn: 'সোনালী মসজিদ',
    url: 'https://images.unsplash.com/photo-1519834089823-08a494ba5a12?auto=format&fit=crop&w=400&h=400&q=85',
  },
  {
    id: 'holy-quran',
    labelEn: 'Holy Quran',
    labelBn: 'পবিত্র কুরআন',
    url: 'https://images.unsplash.com/photo-1587617425953-9075d28b8c46?auto=format&fit=crop&w=400&h=400&q=85',
  },
  {
    id: 'noor-lantern',
    labelEn: 'Noor Lantern',
    labelBn: 'নূরের লণ্ঠন',
    url: 'https://images.unsplash.com/photo-1760647832762-d9b645f425b8?auto=format&fit=crop&w=400&h=400&q=85',
  },
  {
    id: 'white-rose',
    labelEn: 'White Rose',
    labelBn: 'শুভ্র গোলাপ',
    url: 'https://images.unsplash.com/photo-1753088645634-6117ad60dd4d?auto=format&fit=crop&w=400&h=400&q=85',
  },
  {
    id: 'pink-lotus',
    labelEn: 'Pink Lotus',
    labelBn: 'পদ্ম ফুল',
    url: 'https://images.unsplash.com/photo-1530027644375-9c83053d392e?auto=format&fit=crop&w=400&h=400&q=85',
  },
  {
    id: 'white-blossom',
    labelEn: 'White Blossom',
    labelBn: 'শুভ্র পুষ্প',
    url: 'https://images.unsplash.com/photo-1749117631912-df9d281e9744?auto=format&fit=crop&w=400&h=400&q=85',
  },
  {
    id: 'serene-horizon',
    labelEn: 'Serene Horizon',
    labelBn: 'প্রশান্ত দিগন্ত',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&h=400&q=85',
  },
  {
    id: 'peaceful-stream',
    labelEn: 'Peaceful Falls',
    labelBn: 'শান্ত ঝর্ণা',
    url: 'https://images.unsplash.com/photo-1518903676892-945c712d6a93?auto=format&fit=crop&w=400&h=400&q=85',
  },
];
