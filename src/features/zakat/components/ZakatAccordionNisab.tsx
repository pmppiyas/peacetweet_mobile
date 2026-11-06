import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { ZakatNumericInput } from './ZakatNumericInput';
import { ZakatState, NisabStandard, YearStandard } from '../types/zakat.types';
import {
  SILVER_NISAB_VORI,
  GOLD_NISAB_VORI,
  DEFAULT_SILVER_PRICE_PER_VORI,
  DEFAULT_GOLD_PRICE_PER_VORI,
  ZAKAT_TIPS,
  FiqhTip,
} from '../constants/zakatConstants';
import { formatBangladeshiCurrency } from '../utils/zakatCalculator';

interface ZakatAccordionNisabProps {
  state: ZakatState;
  onChangeField: (field: keyof ZakatState, val: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  nisabThreshold: number;
  onOpenTip: (tip: FiqhTip) => void;
  isDark?: boolean;
  locale?: 'bn' | 'en';
}

export function ZakatAccordionNisab({
  state,
  onChangeField,
  isOpen,
  onToggle,
  nisabThreshold,
  onOpenTip,
  isDark = false,
  locale = 'bn',
}: ZakatAccordionNisabProps) {
  return (
    <View
      style={{ backgroundColor: isDark ? '#242526' : '#ffffff' }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs mb-3 overflow-hidden">
      <Pressable
        onPress={onToggle}
        className="p-4 flex-row items-center justify-between active:opacity-80">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 items-center justify-center">
            <AppIcon android="settings" size={17} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
              {locale === 'bn' ? '১. নিসাব নির্বাচন ও বাজারদর' : '1. Nisab & Market Rates'}
            </Text>
            <Text className="text-[11px] text-gray-500">
              {state.nisabStandard === 'SILVER'
                ? locale === 'bn'
                  ? `রূপার নিসাব: ${formatBangladeshiCurrency(nisabThreshold, locale)}`
                  : `Silver Nisab: ${formatBangladeshiCurrency(nisabThreshold, locale)}`
                : locale === 'bn'
                ? `স্বর্ণের নিসাব: ${formatBangladeshiCurrency(nisabThreshold, locale)}`
                : `Gold Nisab: ${formatBangladeshiCurrency(nisabThreshold, locale)}`}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => onOpenTip(ZAKAT_TIPS.nisab)}
            hitSlop={8}
            className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 items-center justify-center">
            <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              ?
            </Text>
          </Pressable>
          <AppIcon
            android={isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            size={20}
            color="#65676b"
          />
        </View>
      </Pressable>

      {isOpen && (
        <View className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {locale === 'bn'
              ? 'নগদ টাকা বা মিশ্র সম্পদের জন্য রূপার নিসাব (৫২.৫ ভরি) ধরা বাংলাদেশের আলেমদের সর্বসম্মত ফতোয়া।'
              : 'Silver Nisab (52.5 Vori) is universally recommended for mixed cash and wealth in Bangladesh.'}
          </Text>

          {/* Nisab Selector Pills */}
          <View className="flex-row gap-2 mb-3.5">
            <Pressable
              onPress={() => onChangeField('nisabStandard', 'SILVER')}
              className={`flex-1 p-3 rounded-xl border ${
                state.nisabStandard === 'SILVER'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500'
                  : 'bg-gray-50 dark:bg-[#3a3b3c] border-gray-200 dark:border-gray-700'
              }`}>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {locale === 'bn' ? 'রূপার নিসাব (প্রস্তাবিত)' : 'Silver (Recommended)'}
                </Text>
                {state.nisabStandard === 'SILVER' && (
                  <AppIcon android="check_circle" size={14} color="#059669" />
                )}
              </View>
              <Text className="text-[11px] text-gray-500 dark:text-gray-400">
                {SILVER_NISAB_VORI} {locale === 'bn' ? 'ভরি রূপা' : 'Vori Silver'}
              </Text>
              <Text className="text-xs font-bold text-emerald-600 mt-1">
                ≈ {formatBangladeshiCurrency(SILVER_NISAB_VORI * state.silverPricePerVori, locale)}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onChangeField('nisabStandard', 'GOLD')}
              className={`flex-1 p-3 rounded-xl border ${
                state.nisabStandard === 'GOLD'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500'
                  : 'bg-gray-50 dark:bg-[#3a3b3c] border-gray-200 dark:border-gray-700'
              }`}>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  {locale === 'bn' ? 'স্বর্ণের নিসাব' : 'Gold Nisab'}
                </Text>
                {state.nisabStandard === 'GOLD' && (
                  <AppIcon android="check_circle" size={14} color="#d97706" />
                )}
              </View>
              <Text className="text-[11px] text-gray-500 dark:text-gray-400">
                {GOLD_NISAB_VORI} {locale === 'bn' ? 'ভরি স্বর্ণ' : 'Vori Gold'}
              </Text>
              <Text className="text-xs font-bold text-amber-600 mt-1">
                ≈ {formatBangladeshiCurrency(GOLD_NISAB_VORI * state.goldPricePerVori, locale)}
              </Text>
            </Pressable>
          </View>

          {/* Market Price Input - Only show the input for whichever Nisab standard is currently selected */}
          {state.nisabStandard === 'SILVER' ? (
            <ZakatNumericInput
              labelBn="প্রতি ভরি রূপার দর"
              labelEn="Silver Price per Vori"
              value={state.silverPricePerVori}
              onChangeValue={(v) => onChangeField('silverPricePerVori', v)}
              isDark={isDark}
              locale={locale}
              placeholder={String(DEFAULT_SILVER_PRICE_PER_VORI)}
            />
          ) : (
            <ZakatNumericInput
              labelBn="প্রতি ভরি ২২ ক্যারেট স্বর্ণের দর"
              labelEn="Gold Price per Vori (22K)"
              value={state.goldPricePerVori}
              onChangeValue={(v) => onChangeField('goldPricePerVori', v)}
              isDark={isDark}
              locale={locale}
              placeholder={String(DEFAULT_GOLD_PRICE_PER_VORI)}
            />
          )}

          {/* Year Standard */}
          <View className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-1">
            <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              {locale === 'bn' ? 'বছর গণনার ধরন' : 'Year Calculation Method'}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => onChangeField('yearStandard', 'HIJRI')}
                className={`flex-1 py-2 px-3 rounded-xl border flex-row items-center justify-between ${
                  state.yearStandard === 'HIJRI'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                <View>
                  <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'হিজরি চন্দ্রবছর' : 'Hijri (Lunar)'}
                  </Text>
                  <Text className="text-[10px] text-gray-500">২.৫% (১/৪০ অংশ)</Text>
                </View>
                {state.yearStandard === 'HIJRI' && (
                  <AppIcon android="check_circle" size={14} color="#059669" />
                )}
              </Pressable>

              <Pressable
                onPress={() => onChangeField('yearStandard', 'SOLAR')}
                className={`flex-1 py-2 px-3 rounded-xl border flex-row items-center justify-between ${
                  state.yearStandard === 'SOLAR'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                <View>
                  <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'ইংরেজি সৌরবছর' : 'Solar (365 days)'}
                  </Text>
                  <Text className="text-[10px] text-gray-500">২.৫৭৭%</Text>
                </View>
                {state.yearStandard === 'SOLAR' && (
                  <AppIcon android="check_circle" size={14} color="#059669" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
