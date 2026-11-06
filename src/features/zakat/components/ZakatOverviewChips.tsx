import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { formatBangladeshiCurrency } from '../utils/zakatCalculator';
import { ZakatCalculationResult } from '../types/zakat.types';

interface ZakatOverviewChipsProps {
  results: ZakatCalculationResult;
  isAllOpen: boolean;
  onToggleAll: (expand: boolean) => void;
  onReset?: () => void;
  onSave?: () => void;
  onToggleLanguage?: () => void;
  isDark?: boolean;
  locale?: 'bn' | 'en';
}

export function ZakatOverviewChips({
  results,
  isAllOpen,
  onToggleAll,
  onReset,
  onSave,
  onToggleLanguage,
  isDark = false,
  locale = 'bn',
}: ZakatOverviewChipsProps) {
  return (
    <View
      style={{ backgroundColor: isDark ? '#242526' : '#ffffff' }}
      className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs mb-3">
      <View className="flex-row items-center justify-between mb-2.5 flex-wrap gap-y-1.5">
        <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">
          {locale === 'bn' ? 'যাকাত হিসাব একনজরে' : 'Real-time Overview'}
        </Text>
        <View className="flex-row items-center gap-1.5 flex-wrap">
          {onReset && (
            <Pressable
              onPress={onReset}
              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 active:opacity-70">
              <Text className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                {locale === 'bn' ? 'রিসেট' : 'Reset'}
              </Text>
            </Pressable>
          )}
          {onSave && (
            <Pressable
              onPress={onSave}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 active:bg-emerald-700">
              <Text className="text-[11px] font-bold text-white">
                {locale === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => onToggleAll(!isAllOpen)}
            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 active:opacity-70">
            <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {isAllOpen
                ? locale === 'bn'
                  ? 'সব গুটিয়ে নিন'
                  : 'Collapse'
                : locale === 'bn'
                ? 'সব খুলুন'
                : 'Expand'}
            </Text>
          </Pressable>
          {onToggleLanguage && (
            <Pressable
              onPress={onToggleLanguage}
              className="px-2.5 py-1 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/40 active:opacity-70">
              <Text className="text-[11px] font-bold text-primary-700 dark:text-primary-300">
                {locale === 'bn' ? 'English' : 'বাংলা'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
          <Text className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">
            {locale === 'bn' ? 'মোট সম্পদ (+)' : 'Total Assets (+)'}
          </Text>
          <Text
            numberOfLines={1}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-200 mt-0.5">
            {formatBangladeshiCurrency(results.totalAssets, locale)}
          </Text>
        </View>

        <View className="flex-1 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
          <Text className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold">
            {locale === 'bn' ? 'মোট দেনা (-)' : 'Total Debts (-)'}
          </Text>
          <Text
            numberOfLines={1}
            className="text-xs font-bold text-rose-700 dark:text-rose-200 mt-0.5">
            - {formatBangladeshiCurrency(results.totalLiabilities, locale)}
          </Text>
        </View>

        <View className="flex-1 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40">
          <Text className="text-[10px] text-blue-800 dark:text-blue-300 font-semibold">
            {locale === 'bn' ? 'নিট সম্পদ' : 'Net Wealth'}
          </Text>
          <Text
            numberOfLines={1}
            className="text-xs font-bold text-blue-700 dark:text-blue-200 mt-0.5">
            {formatBangladeshiCurrency(results.netZakatableWealth, locale)}
          </Text>
        </View>
      </View>
    </View>
  );
}
