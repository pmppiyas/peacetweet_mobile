import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { AppIcon, type AndroidSymbol } from '@/components/ui/Icon';

interface SubNavItem {
  id: string;
  labelBn: string;
  labelEn: string;
  href: string;
  icon: AndroidSymbol;
  iconColor?: string;
  activeColor?: string;
}

const SUB_NAV_ITEMS: SubNavItem[] = [
  {
    id: 'subnav-feed',
    labelBn: 'সকল ফিড',
    labelEn: 'All Feed',
    href: '/',
    icon: 'home',
    iconColor: '#1877f2',
  },
  {
    id: 'subnav-duas',
    labelBn: 'দোয়া ও বিষয়',
    labelEn: 'Duas',
    href: '/categories',
    icon: 'menu_book',
    iconColor: '#3b82f6',
  },
  {
    id: 'subnav-blood',
    labelBn: 'রক্তদান',
    labelEn: 'Blood',
    href: '/blood',
    icon: 'water_drop',
    iconColor: '#e11d48',
  },
  {
    id: 'subnav-saved',
    labelBn: 'সংরক্ষিত',
    labelEn: 'Saved',
    href: '/saved',
    icon: 'bookmark',
    iconColor: '#d97706',
  },
  {
    id: 'subnav-zakat',
    labelBn: 'যাকাত',
    labelEn: 'Zakat',
    href: '/zakat',
    icon: 'calculate',
    iconColor: '#059669',
  },
  {
    id: 'subnav-friends',
    labelBn: 'ফ্রেন্ডস',
    labelEn: 'Friends',
    href: '/friends',
    icon: 'group',
    iconColor: '#6366f1',
  },
  {
    id: 'subnav-groups',
    labelBn: 'গ্রুপসমূহ',
    labelEn: 'Groups',
    href: '/groups',
    icon: 'groups',
    iconColor: '#0284c7',
  },
];

export function HomeSubNav() {
  const pathname = usePathname();
  const { locale, theme } = useUi();
  const isDark = theme === 'dark';

  return (
    <View
      style={{ height: 44 }}
      className="w-full bg-white dark:bg-[#242526] border-b border-[#d9dde4] dark:border-[#393a3b] select-none justify-center">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 10,
          alignItems: 'center',
          gap: 6,
        }}>
        {SUB_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href ||
                (pathname.startsWith(item.href + '/') && item.href !== '/');

          const label = locale === 'bn' ? item.labelBn : item.labelEn;
          const activeBg = isDark ? '#3a3b3c' : '#e6e9ef';
          const activeBorder = isDark ? '#4e4f50' : '#d9dde4';

          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (pathname === item.href) return;
                router.navigate(item.href as any);
              }}
              style={{
                backgroundColor: isActive
                  ? activeBg
                  : isDark
                    ? '#2c2d2e'
                    : '#f0f2f5',
                borderColor: isActive ? activeBorder : 'transparent',
                borderWidth: 1,
              }}
              className="flex-row items-center gap-1.5 px-3 py-1 rounded-full select-none active:opacity-75">
              <AppIcon
                android={item.icon}
                size={14}
                weight="bold"
                color={isActive ? item.iconColor || '#1877f2' : isDark ? '#b0b3b8' : '#65676b'}
              />
              <Text
                selectable={false}
                style={{
                  color: isActive
                    ? item.iconColor || (isDark ? '#e4e6eb' : '#1877f2')
                    : isDark
                      ? '#b0b3b8'
                      : '#65676b',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: 12.5,
                }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
