import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { ZakatCalculationResult, YearStandard } from '../types/zakat.types';
import { formatBangladeshiCurrency } from '../utils/zakatCalculator';

interface ZakatFinalSummaryCardProps {
  results: ZakatCalculationResult;
  yearStandard: YearStandard;
  onShare: () => void;
  onSave?: () => void;
  onReset?: () => void;
  isDark?: boolean;
  locale?: 'bn' | 'en';
}

export function ZakatFinalSummaryCard({
  results,
  yearStandard,
  onShare,
  onSave,
  onReset,
  isDark = false,
  locale = 'bn',
}: ZakatFinalSummaryCardProps) {
  return (
    <View
      style={{
        backgroundColor: isDark ? '#242526' : '#ffffff',
        borderColor: isDark ? '#393a3b' : '#e4e6eb',
      }}
      className="rounded-2xl border mb-0 overflow-hidden">
      {/* Header */}
      <View
        style={{ borderBottomColor: isDark ? '#333436' : '#f0f2f5' }}
        className="px-4 py-3.5 flex-row items-center justify-between border-b">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 items-center justify-center">
            <AppIcon android="calculate" size={19} color="#059669" />
          </View>
          <Text
            numberOfLines={1}
            className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] flex-1">
            {locale === 'bn' ? '৬. যাকাত হিসাবের ফলাফল' : '6. Final Zakat Summary'}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: isDark ? 'rgba(5, 150, 105, 0.16)' : '#ecfdf5',
            borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
          }}
          className="px-3 py-1 rounded-full border">
          <Text className="text-[13px] font-bold text-emerald-700 dark:text-emerald-300">
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

      <View className="p-4">
        {/* Breakdown Rows */}
        <View className="gap-2 mb-3.5">
          <View className="flex-row justify-between items-center py-0.5">
            <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn' ? 'মোট যাকাতযোগ্য সম্পদ (+)' : 'Total Assets (+)'}
            </Text>
            <Text className="text-[15px] font-semibold text-emerald-600 dark:text-emerald-400">
              {formatBangladeshiCurrency(results.totalAssets, locale)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-0.5">
            <Text className="text-[15px] text-rose-500">
              {locale === 'bn' ? 'বাদযোগ্য দেনা ও ঋণ (-)' : 'Deductible Debts (-)'}
            </Text>
            <Text className="text-[15px] font-semibold text-rose-600 dark:text-rose-400">
              - {formatBangladeshiCurrency(results.totalLiabilities, locale)}
            </Text>
          </View>

          <View
            style={{ borderTopColor: isDark ? '#393a3b' : '#e4e6eb' }}
            className="flex-row justify-between items-center pt-2 border-t border-dashed mt-0.5">
            <Text className="text-[15px] font-bold text-[#050505] dark:text-[#e4e6eb]">
              {locale === 'bn' ? 'নিট যাকাতযোগ্য সম্পদ' : 'Net Zakatable Wealth'}
            </Text>
            <Text className="text-[15px] font-bold text-[#050505] dark:text-[#e4e6eb]">
              {formatBangladeshiCurrency(results.netZakatableWealth, locale)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-0.5">
            <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn' ? 'নিসাব সীমা' : 'Nisab Threshold'}
            </Text>
            <Text className="text-[15px] font-medium text-[#1c1e21] dark:text-[#e4e6eb]">
              {formatBangladeshiCurrency(results.nisabThreshold, locale)}
            </Text>
          </View>
        </View>

        {/* Highlight Result Box */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(5, 150, 105, 0.14)' : '#ecfdf5',
            borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
          }}
          className="p-4 rounded-2xl border mb-4">
          <Text className="text-[15px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
            {locale === 'bn'
              ? `প্রদেয় যাকাতের পরিমাণ (${results.zakatRatePercent}%):`
              : `Payable Zakat (${results.zakatRatePercent}%):`}
          </Text>
          <Text className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
            {formatBangladeshiCurrency(results.payableZakat, locale)}
          </Text>
          <View className="flex-row items-center gap-2">
            <AppIcon
              android={results.isEligibleForZakat ? 'check_circle' : 'error_outline'}
              size={18}
              color={results.isEligibleForZakat ? '#059669' : '#65676b'}
            />
            <Text className="text-[14.5px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb] flex-1">
              {results.isEligibleForZakat
                ? locale === 'bn'
                  ? 'আলহামদুলিল্লাহ, আপনার ওপর যাকাত ফরজ হয়েছে।'
                  : 'Alhamdulillah, Zakat is obligatory on your wealth.'
                : locale === 'bn'
                  ? 'আপনার সম্পদ এখনও নিসাব পরিমাণ পৌঁছেনি।'
                  : 'Your wealth has not reached the Nisab threshold.'}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onShare}
            className="flex-1 py-3 rounded-xl bg-emerald-600 active:bg-emerald-700 flex-row items-center justify-center gap-2">
            <AppIcon android="share" size={18} color="#ffffff" />
            <Text className="text-[15px] font-bold text-white">
              {locale === 'bn' ? 'শেয়ার করুন' : 'Share'}
            </Text>
          </Pressable>

          {onSave && (
            <Pressable
              onPress={onSave}
              className="px-4 py-3 rounded-xl bg-[#f0f2f5] dark:bg-white/10 active:opacity-70">
              <Text className="text-[15px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </Text>
            </Pressable>
          )}

          {onReset && (
            <Pressable
              onPress={onReset}
              className="px-4 py-3 rounded-xl bg-[#f0f2f5] dark:bg-white/10 active:opacity-70">
              <Text className="text-[15px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'রিসেট' : 'Reset'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
