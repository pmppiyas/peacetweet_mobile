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
  {
    id: 'vintage-bw',
    nameBn: 'বইয়ের পাতা (B&W)',
    nameEn: 'Vintage Paper',
    type: 'image',
    imageSource: require('@/assets/images/photocard-bg-vintage.jpg'),
    textColor: '#111111',
    placeholderColor: '#666666',
    thumbBg: '#eaeaea',
    thumbBorder: '#cccccc',
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
    thumbBorder: '#d8be9a',
    thumbImage: require('@/assets/images/post-bg-warm-vintage.jpg'),
  },
  {
    id: 'islamic-emerald',
    nameBn: 'ইসলামিক আরাবেস্ক',
    nameEn: 'Islamic Arabesque',
    type: 'image',
    imageSource: require('@/assets/images/post-bg-islamic-emerald.jpg'),
    textColor: '#fef9c3',
    placeholderColor: '#a7f3d0',
    textShadow: true,
    thumbBg: '#1e4620',
    thumbBorder: '#4ade80',
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
    textShadow: true,
    thumbBg: '#181926',
    thumbBorder: '#6366f1',
    thumbImage: require('@/assets/images/post-bg-midnight-slate.jpg'),
  },
  {
    id: 'gradient-sunset',
    nameBn: 'সানসেট ড্রিম',
    nameEn: 'Sunset Dream',
    type: 'gradient',
    gradientColors: ['#f97316', '#db2777'],
    textColor: '#ffffff',
    placeholderColor: '#fed7aa',
    textShadow: true,
    thumbBg: '#f97316',
    thumbBorder: '#db2777',
  },
  {
    id: 'gradient-ocean',
    nameBn: 'ওশেন ব্রিজ',
    nameEn: 'Ocean Breeze',
    type: 'gradient',
    gradientColors: ['#0284c7', '#0d9488'],
    textColor: '#ffffff',
    placeholderColor: '#bae6fd',
    textShadow: true,
    thumbBg: '#0284c7',
    thumbBorder: '#0d9488',
  },
  {
    id: 'gradient-berry',
    nameBn: 'রয়েল বেরি',
    nameEn: 'Royal Berry',
    type: 'gradient',
    gradientColors: ['#7c3aed', '#c026d3'],
    textColor: '#ffffff',
    placeholderColor: '#e9d5ff',
    textShadow: true,
    thumbBg: '#7c3aed',
    thumbBorder: '#c026d3',
  },
  {
    id: 'gradient-emerald',
    nameBn: 'লাশ এমারেল্ড',
    nameEn: 'Lush Emerald',
    type: 'gradient',
    gradientColors: ['#047857', '#059669'],
    textColor: '#ffffff',
    placeholderColor: '#a7f3d0',
    textShadow: true,
    thumbBg: '#047857',
    thumbBorder: '#10b981',
  },
  {
    id: 'gradient-gold',
    nameBn: 'গোল্ডেন অ্যাম্বার',
    nameEn: 'Golden Amber',
    type: 'gradient',
    gradientColors: ['#b45309', '#d97706'],
    textColor: '#ffffff',
    placeholderColor: '#fde68a',
    textShadow: true,
    thumbBg: '#b45309',
    thumbBorder: '#f59e0b',
  },
  {
    id: 'solid-dark',
    nameBn: 'ডার্ক অনিক্স',
    nameEn: 'Dark Onyx',
    type: 'gradient',
    gradientColors: ['#1f242d', '#111317'],
    textColor: '#ffffff',
    placeholderColor: '#9ca3af',
    textShadow: true,
    thumbBg: '#1f242d',
    thumbBorder: '#4b5563',
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
