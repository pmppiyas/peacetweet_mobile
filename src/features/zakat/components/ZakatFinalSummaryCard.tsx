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
      style={{ backgroundColor: isDark ? '#242526' : '#f5f6f8' }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs mb-0 overflow-hidden">
      {/* Header */}
      <View className="p-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center gap-2.5">
          <View className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 items-center justify-center">
            <AppIcon android="calculate" size={18} color="#059669" />
          </View>
          <View>
            <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
              {locale === 'bn' ? '৬. যাকাত হিসাবের ফলাফল' : '6. Final Zakat Summary'}
            </Text>
            <Text className="text-[11px] text-gray-500">
              {results.zakatRatePercent}%{' '}
              {yearStandard === 'HIJRI'
                ? locale === 'bn'
                  ? 'হিজরি চন্দ্রবছর'
                  : 'Hijri Lunar'
                : locale === 'bn'
                ? 'ইংরেজি সৌরবছর'
                : 'Solar Year'}
            </Text>
          </View>
        </View>

        <View className="bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
          <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
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

      <View className="p-4 pb-3">
        {/* Breakdown Rows */}
        <View className="space-y-2 mb-3">
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {locale === 'bn' ? 'মোট যাকাতযোগ্য সম্পদ (+):' : 'Total Assets (+):'}
            </Text>
            <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {formatBangladeshiCurrency(results.totalAssets, locale)}
            </Text>
          </View>

          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-rose-500">
              {locale === 'bn' ? 'বাদযোগ্য দেনা ও ঋণ (-):' : 'Deductible Debts (-):'}
            </Text>
            <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              - {formatBangladeshiCurrency(results.totalLiabilities, locale)}
            </Text>
          </View>

          <View className="flex-row justify-between py-1 border-t border-dashed border-gray-200 dark:border-gray-700 mt-1">
            <Text className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {locale === 'bn' ? 'নিট যাকাতযোগ্য সম্পদ:' : 'Net Zakatable Wealth:'}
            </Text>
            <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
              {formatBangladeshiCurrency(results.netZakatableWealth, locale)}
            </Text>
          </View>

          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {locale === 'bn' ? 'নিসাব সীমা (ন্যূনতম শর্ত):' : 'Nisab Threshold:'}
            </Text>
            <Text className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {formatBangladeshiCurrency(results.nisabThreshold, locale)}
            </Text>
          </View>
        </View>

        {/* Highlight Result Box */}
        <View className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 mb-3.5">
          <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
            {locale === 'bn' ? 'প্রদেয় যাকাতের পরিমাণ:' : 'Payable Zakat Amount:'}
          </Text>
          <Text className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
            {formatBangladeshiCurrency(results.payableZakat, locale)}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <AppIcon
              android={results.isEligibleForZakat ? 'check_circle' : 'error_outline'}
              size={15}
              color={results.isEligibleForZakat ? '#059669' : '#65676b'}
            />
            <Text className="text-xs font-semibold text-gray-600 dark:text-gray-300">
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
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 active:bg-emerald-700 flex-row items-center justify-center gap-1.5 shadow-sm">
            <AppIcon android="share" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">
              {locale === 'bn' ? 'যাকাত আদায় আহ্বান শেয়ার' : 'Share Inspiration'}
            </Text>
          </Pressable>

          {onSave && (
            <Pressable
              onPress={onSave}
              className="px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 active:opacity-70">
              <Text className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                {locale === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </Text>
            </Pressable>
          )}

          {onReset && (
            <Pressable
              onPress={onReset}
              className="px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 active:opacity-70">
              <Text className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                {locale === 'bn' ? 'রিসেট' : 'Reset'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
