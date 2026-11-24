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
  const nisabProgress =
    results.nisabThreshold > 0
      ? Math.min(100, Math.max(0, (results.netZakatableWealth / results.nisabThreshold) * 100))
      : 0;

  return (
    <View
      style={{
        backgroundColor: isDark ? '#242526' : '#ffffff',
        borderColor: isDark ? '#393a3b' : '#e4e6eb',
      }}
      className="p-4 rounded-2xl border mb-3.5">
      {/* Top Action Row */}
      <View className="flex-row items-center justify-between gap-2 mb-3.5 flex-wrap">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Pressable
            onPress={() => onToggleAll(!isAllOpen)}
            className="px-3 py-1.5 rounded-xl bg-[#f0f2f5] dark:bg-white/10 active:opacity-70">
            <Text className="text-[13.5px] font-bold text-emerald-700 dark:text-emerald-400">
              {isAllOpen
                ? locale === 'bn'
                  ? 'সব গুটান'
                  : 'Collapse All'
                : locale === 'bn'
                  ? 'সব খুলুন'
                  : 'Expand All'}
            </Text>
          </Pressable>
          {onSave && (
            <Pressable
              onPress={onSave}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 active:bg-emerald-700">
              <Text className="text-[13.5px] font-bold text-white">
                {locale === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </Text>
            </Pressable>
          )}
          {onReset && (
            <Pressable
              onPress={onReset}
              className="px-3 py-1.5 rounded-xl bg-[#f0f2f5] dark:bg-white/10 active:opacity-70">
              <Text className="text-[13.5px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'রিসেট' : 'Reset'}
              </Text>
            </Pressable>
          )}
        </View>

        {onToggleLanguage && (
          <Pressable
            onPress={onToggleLanguage}
            style={{
              borderColor: isDark ? '#1d4ed8' : '#93c5fd',
            }}
            className="px-3 py-1.5 rounded-xl border bg-primary-50 dark:bg-primary-950/40 active:opacity-70">
            <Text className="text-[13.5px] font-bold text-primary-700 dark:text-primary-300">
              {locale === 'bn' ? 'English' : 'বাংলা'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Live Payable Zakat Hero Strip */}
      <View
        style={{
          backgroundColor: isDark ? 'rgba(5, 150, 105, 0.14)' : '#ecfdf5',
          borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
        }}
        className="p-3.5 rounded-2xl border mb-3">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-emerald-900 dark:text-emerald-200">
              {locale === 'bn' ? 'প্রদেয় যাকাত' : 'Payable Zakat'}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              className="text-[26px] font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
              {formatBangladeshiCurrency(results.payableZakat, locale)}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: results.isEligibleForZakat
                ? '#059669'
                : isDark
                  ? '#242526'
                  : '#ffffff',
              borderColor: results.isEligibleForZakat
                ? '#059669'
                : isDark
                  ? 'rgba(16, 185, 129, 0.35)'
                  : '#a7f3d0',
            }}
            className="px-3 py-1.5 rounded-full border">
            <Text
              className={`text-[13px] font-bold ${
                results.isEligibleForZakat
                  ? 'text-white'
                  : 'text-emerald-800 dark:text-emerald-300'
              }`}>
              {results.isEligibleForZakat
                ? locale === 'bn'
                  ? 'যাকাত ফরজ'
                  : 'Obligatory'
                : locale === 'bn'
                  ? 'নিসাব পৌঁছেনি'
                  : 'Below Nisab'}
            </Text>
          </View>
        </View>

        {results.nisabThreshold > 0 && (
          <View className="mt-2.5">
            <View className="h-1.5 w-full rounded-full bg-emerald-200/70 dark:bg-emerald-950 overflow-hidden">
              <View
                style={{ width: `${nisabProgress}%` }}
                className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
              />
            </View>
            <Text className="text-[13px] font-medium text-emerald-900/80 dark:text-emerald-200/80 mt-1.5">
              {locale === 'bn'
                ? `নিসাব সীমা: ${formatBangladeshiCurrency(results.nisabThreshold, locale)}`
                : `Nisab: ${formatBangladeshiCurrency(results.nisabThreshold, locale)}`}
            </Text>
          </View>
        )}
      </View>

      {/* 3 Compact Borderless Summary Tiles */}
      <View className="flex-row gap-2">
        <View
          style={{
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
          }}
          className="flex-1 p-2.5 rounded-xl">
          <Text className="text-[13px] text-emerald-800 dark:text-emerald-300 font-semibold">
            {locale === 'bn' ? 'মোট সম্পদ' : 'Assets'}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-[15px] font-bold text-emerald-700 dark:text-emerald-200 mt-0.5">
            {formatBangladeshiCurrency(results.totalAssets, locale)}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: isDark ? 'rgba(244, 63, 94, 0.12)' : '#fff1f2',
          }}
          className="flex-1 p-2.5 rounded-xl">
          <Text className="text-[13px] text-rose-800 dark:text-rose-300 font-semibold">
            {locale === 'bn' ? 'মোট দেনা' : 'Debts'}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-[15px] font-bold text-rose-700 dark:text-rose-200 mt-0.5">
            {formatBangladeshiCurrency(results.totalLiabilities, locale)}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff',
          }}
          className="flex-1 p-2.5 rounded-xl">
          <Text className="text-[13px] text-blue-800 dark:text-blue-300 font-semibold">
            {locale === 'bn' ? 'নিট সম্পদ' : 'Net'}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-[15px] font-bold text-blue-700 dark:text-blue-200 mt-0.5">
            {formatBangladeshiCurrency(results.netZakatableWealth, locale)}
          </Text>
        </View>
      </View>
    </View>
  );
}
