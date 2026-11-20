export interface PostBackgroundOption {
  id: string;
  nameBn: string;
  nameEn: string;
  type: 'none' | 'image' | 'gradient';
  imageSource?: any;
  gradientColors?: [string, string, ...string[]];
  textColor: string;
  placeholderColor: string;
  textShadow?: boolean;
  thumbBg: string;
  thumbBorder?: string;
  thumbImage?: any;
}

export const POST_BACKGROUNDS: PostBackgroundOption[] = [
  {
    id: 'none',
    nameBn: 'ডিফল্ট',
    nameEn: 'Default',
    type: 'none',
    textColor: '#050505',
    placeholderColor: '#8e8e93',
    thumbBg: '#f0f2f5',
    thumbBorder: '#d0d5dd',
  },
  // ─── আগের ফটো ও টেক্সচার ব্যাকগ্রাউন্ডসমূহ (বর্ডার, শ্যাডো ও ব্লার ছাড়া) ───
  {
    id: 'vintage-bw',
    nameBn: 'বইয়ের পাতা (B&W)',
    nameEn: 'Vintage Paper',
    type: 'image',
    imageSource: require('@/assets/images/photocard-bg-vintage.jpg'),
    textColor: '#111111',
    placeholderColor: '#666666',
    thumbBg: '#eaeaea',
    thumbImage: require('@/assets/images/photocard-bg-vintage.jpg'),
  },
  {
    id: 'vintage-warm',
    nameBn: 'ওল্ড নোটবুক',
    nameEn: 'Old Notebook',
    type: 'image',
    imageSource: require('@/assets/images/post-bg-warm-vintage.jpg'),
    textColor: '#261b14',
    placeholderColor: '#786558',
    thumbBg: '#f5e8d3',
    thumbImage: require('@/assets/images/post-bg-warm-vintage.jpg'),
  },
  {
    id: 'islamic-emerald',
    nameBn: 'ইসলামিক আরাবেস্ক',
    nameEn: 'Islamic Arabesque',
    type: 'image',
    imageSource: require('@/assets/images/post-bg-islamic-emerald.jpg'),
    textColor: '#ffffff',
    placeholderColor: '#e2e8f0',
    thumbBg: '#1e4620',
    thumbImage: require('@/assets/images/post-bg-islamic-emerald.jpg'),
  },
  {
    id: 'midnight-slate',
    nameBn: 'মিডনাইট স্টারস',
    nameEn: 'Midnight Slate',
    type: 'image',
    imageSource: require('@/assets/images/post-bg-midnight-slate.jpg'),
    textColor: '#ffffff',
    placeholderColor: '#94a3b8',
    thumbBg: '#181926',
    thumbImage: require('@/assets/images/post-bg-midnight-slate.jpg'),
  },
  // ─── আগের আকর্ষণীয় গ্রেডিয়েন্ট ব্যাকগ্রাউন্ডসমূহ ───
  {
    id: 'gradient-sunset',
    nameBn: 'সানসেট ড্রিম',
    nameEn: 'Sunset Dream',
    type: 'gradient',
    gradientColors: ['#f97316', '#db2777'],
    textColor: '#ffffff',
    placeholderColor: '#fed7aa',
    thumbBg: '#f97316',
  },
  {
    id: 'gradient-ocean',
    nameBn: 'ওশেন ব্রিজ',
    nameEn: 'Ocean Breeze',
    type: 'gradient',
    gradientColors: ['#0284c7', '#0d9488'],
    textColor: '#ffffff',
    placeholderColor: '#bae6fd',
    thumbBg: '#0284c7',
  },
  {
    id: 'gradient-berry',
    nameBn: 'রয়েল বেরি',
    nameEn: 'Royal Berry',
    type: 'gradient',
    gradientColors: ['#7c3aed', '#c026d3'],
    textColor: '#ffffff',
    placeholderColor: '#f3e8ff',
    thumbBg: '#7c3aed',
  },
  {
    id: 'gradient-emerald',
    nameBn: 'লাশ এমারেল্ড',
    nameEn: 'Lush Emerald',
    type: 'gradient',
    gradientColors: ['#047857', '#059669'],
    textColor: '#ffffff',
    placeholderColor: '#a7f3d0',
    thumbBg: '#047857',
  },
  {
    id: 'gradient-gold',
    nameBn: 'গোল্ডেন অ্যাম্বার',
    nameEn: 'Golden Amber',
    type: 'gradient',
    gradientColors: ['#b45309', '#d97706'],
    textColor: '#ffffff',
    placeholderColor: '#fde68a',
    thumbBg: '#b45309',
  },
  {
    id: 'solid-dark',
    nameBn: 'ডার্ক অনিক্স',
    nameEn: 'Dark Onyx',
    type: 'gradient',
    gradientColors: ['#1f242d', '#111317'],
    textColor: '#ffffff',
    placeholderColor: '#9ca3af',
    thumbBg: '#1f242d',
  },
  // ─── নতুন আধুনিক গ্রেডিয়েন্ট ও সলিড কালারসমূহ ───
  {
    id: 'gradient-islamic',
    nameBn: 'ইসলামিক নূর',
    nameEn: 'Islamic Noor',
    type: 'gradient',
    gradientColors: ['#064e3b', '#047857'],
    textColor: '#ffffff',
    placeholderColor: '#e2e8f0',
    thumbBg: '#064e3b',
  },
  {
    id: 'gradient-crimson',
    nameBn: 'ক্রিমসন ফায়ার',
    nameEn: 'Crimson Fire',
    type: 'gradient',
    gradientColors: ['#dc2626', '#881337'],
    textColor: '#ffffff',
    placeholderColor: '#fecaca',
    thumbBg: '#dc2626',
  },
  {
    id: 'gradient-neon',
    nameBn: 'নিওন সাইবার',
    nameEn: 'Neon Cyber',
    type: 'gradient',
    gradientColors: ['#6366f1', '#ec4899'],
    textColor: '#ffffff',
    placeholderColor: '#e0e7ff',
    thumbBg: '#6366f1',
  },
  {
    id: 'gradient-midnight',
    nameBn: 'মিডনাইট স্কাই',
    nameEn: 'Midnight Sky',
    type: 'gradient',
    gradientColors: ['#1e293b', '#0f172a'],
    textColor: '#ffffff',
    placeholderColor: '#94a3b8',
    thumbBg: '#1e293b',
  },
  {
    id: 'gradient-aurora',
    nameBn: 'অরোরা গ্রিন',
    nameEn: 'Aurora Green',
    type: 'gradient',
    gradientColors: ['#0f766e', '#65a30d'],
    textColor: '#ffffff',
    placeholderColor: '#ccfbf1',
    thumbBg: '#0f766e',
  },
  {
    id: 'gradient-sky',
    nameBn: 'স্কাই ব্লু',
    nameEn: 'Sky Blue',
    type: 'gradient',
    gradientColors: ['#38bdf8', '#1d4ed8'],
    textColor: '#ffffff',
    placeholderColor: '#e0f2fe',
    thumbBg: '#38bdf8',
  },
  {
    id: 'gradient-coral',
    nameBn: 'কোরাল পিচ',
    nameEn: 'Coral Peach',
    type: 'gradient',
    gradientColors: ['#f43f5e', '#fb923c'],
    textColor: '#ffffff',
    placeholderColor: '#ffe4e6',
    thumbBg: '#f43f5e',
  },
  {
    id: 'gradient-lavender',
    nameBn: 'ল্যাভেন্ডার ড্রিম',
    nameEn: 'Lavender Dream',
    type: 'gradient',
    gradientColors: ['#581c87', '#9333ea'],
    textColor: '#ffffff',
    placeholderColor: '#f3e8ff',
    thumbBg: '#581c87',
  },
  {
    id: 'gradient-citrus',
    nameBn: 'ফ্রেশ লেমন',
    nameEn: 'Fresh Citrus',
    type: 'gradient',
    gradientColors: ['#84cc16', '#15803d'],
    textColor: '#ffffff',
    placeholderColor: '#f7fee7',
    thumbBg: '#84cc16',
  },
  {
    id: 'gradient-magma',
    nameBn: 'ম্যাগমা ব্লাস্ট',
    nameEn: 'Magma Blast',
    type: 'gradient',
    gradientColors: ['#ea580c', '#7f1d1d'],
    textColor: '#ffffff',
    placeholderColor: '#ffedd5',
    thumbBg: '#ea580c',
  },
  {
    id: 'gradient-mystic',
    nameBn: 'মিস্টিক নাইট',
    nameEn: 'Mystic Night',
    type: 'gradient',
    gradientColors: ['#3b0764', '#1e1b4b'],
    textColor: '#ffffff',
    placeholderColor: '#e9d5ff',
    thumbBg: '#3b0764',
  },
  {
    id: 'solid-royal-blue',
    nameBn: 'রয়েল ব্লু',
    nameEn: 'Royal Blue',
    type: 'gradient',
    gradientColors: ['#1d4ed8', '#172554'],
    textColor: '#ffffff',
    placeholderColor: '#bfdbfe',
    thumbBg: '#1d4ed8',
  },
  {
    id: 'gradient-parchment',
    nameBn: 'ডার্ক পার্চমেন্ট',
    nameEn: 'Dark Parchment',
    type: 'gradient',
    gradientColors: ['#451a03', '#1c0b02'],
    textColor: '#ffffff',
    placeholderColor: '#fed7aa',
    thumbBg: '#451a03',
  },
];

export const POST_BACKGROUND_PREFIX = 'BG:';

export function getPostBackgroundById(id?: string | null): PostBackgroundOption | null {
  if (!id) return null;
  const cleanId = id.startsWith(POST_BACKGROUND_PREFIX)
    ? id.slice(POST_BACKGROUND_PREFIX.length)
    : id;

  return POST_BACKGROUNDS.find((bg) => bg.id === cleanId && bg.type !== 'none') || null;
}

export interface BackgroundPostTypography {
  fontSize: number;
  lineHeight: number;
  fontWeight: '800' | '700' | '600';
}

/**
 * Calculates responsive typography (fontSize, lineHeight, fontWeight)
 * dynamically based on text length and line breaks, matching Facebook-style post backgrounds.
 */
export function getBackgroundPostTypography(content: string): BackgroundPostTypography {
  const text = (content || '').trim();
  const charLength = text.length;
  const lineCount = text ? text.split('\n').length : 1;

  if (charLength <= 35 && lineCount <= 2) {
    return { fontSize: 32, lineHeight: 44, fontWeight: '800' };
  }
  if (charLength <= 75 && lineCount <= 3) {
    return { fontSize: 26, lineHeight: 36, fontWeight: '700' };
  }
  if (charLength <= 135 && lineCount <= 5) {
    return { fontSize: 21, lineHeight: 30, fontWeight: '700' };
  }
  if (charLength <= 220 && lineCount <= 8) {
    return { fontSize: 17.5, lineHeight: 25, fontWeight: '600' };
  }
  return { fontSize: 15, lineHeight: 22, fontWeight: '600' };
}

