import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';

interface ZakatAccordionCardProps {
  title: string;
  icon: React.ComponentProps<typeof AppIcon>['android'];
  iconColor: string;
  iconBgClass: string;
  badgeText?: string;
  badgeClass?: string;
  isOpen: boolean;
  onToggle: () => void;
  onOpenTip?: () => void;
  isDark?: boolean;
  children: React.ReactNode;
}

/** Shared accordion card shell for Zakat calculator sections. */
export function ZakatAccordionCard({
  title,
  icon,
  iconColor,
  iconBgClass,
  badgeText,
  badgeClass = 'text-[#65676b] dark:text-[#b0b3b8]',
  isOpen,
  onToggle,
  onOpenTip,
  isDark = false,
  children,
}: ZakatAccordionCardProps) {
  return (
    <View
      style={{
        backgroundColor: isDark ? '#242526' : '#ffffff',
        borderColor: isDark ? '#393a3b' : '#e4e6eb',
      }}
      className="rounded-2xl border mb-3.5 overflow-hidden">
      <Pressable
        onPress={onToggle}
        className="px-4 py-3.5 flex-row items-center justify-between active:opacity-80">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View className={`w-9 h-9 rounded-xl ${iconBgClass} items-center justify-center`}>
            <AppIcon android={icon} size={19} color={iconColor} />
          </View>
          <Text
            numberOfLines={1}
            className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] flex-1">
            {title}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {badgeText ? (
            <Text className={`text-[14px] font-bold ${badgeClass}`}>{badgeText}</Text>
          ) : null}
          {onOpenTip ? (
            <Pressable
              onPress={(e) => {
                e?.stopPropagation?.();
                onOpenTip();
              }}
              hitSlop={8}
              className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 items-center justify-center">
              <Text className="text-[12px] font-bold text-emerald-700 dark:text-emerald-300">
                ?
              </Text>
            </Pressable>
          ) : null}
          <AppIcon
            android={isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            size={22}
            color={isDark ? '#b0b3b8' : '#65676b'}
          />
        </View>
      </Pressable>

      {isOpen && (
        <View
          style={{ borderTopColor: isDark ? '#333436' : '#f0f2f5' }}
          className="px-4 pb-4 pt-3.5 border-t">
          {children}
        </View>
      )}
    </View>
  );
}
