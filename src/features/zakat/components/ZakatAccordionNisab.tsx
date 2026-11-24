import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { ZakatAccordionCard } from './ZakatAccordionCard';
import { ZakatNumericInput } from './ZakatNumericInput';
import { ZakatState } from '../types/zakat.types';
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
    <ZakatAccordionCard
      title={locale === 'bn' ? '১. নিসাব ও বাজারদর' : '1. Nisab & Market Rates'}
      icon="settings"
      iconColor="#059669"
      iconBgClass="bg-emerald-100 dark:bg-emerald-950"
      badgeText={formatBangladeshiCurrency(nisabThreshold, locale)}
      badgeClass="text-emerald-600 dark:text-emerald-400"
      isOpen={isOpen}
      onToggle={onToggle}
      onOpenTip={() => onOpenTip(ZAKAT_TIPS.nisab)}
      isDark={isDark}>
      {/* Nisab Selector Pills */}
      <View className="flex-row gap-2.5 mb-3.5">
        <Pressable
          onPress={() => onChangeField('nisabStandard', 'SILVER')}
          className={`flex-1 p-3 rounded-xl border ${
            state.nisabStandard === 'SILVER'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500'
              : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] border-transparent'
          }`}>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[15px] font-bold text-emerald-700 dark:text-emerald-300">
              {locale === 'bn' ? 'রূপার নিসাব' : 'Silver Nisab'}
            </Text>
            {state.nisabStandard === 'SILVER' && (
              <AppIcon android="check_circle" size={17} color="#059669" />
            )}
          </View>
          <Text className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8]">
            {SILVER_NISAB_VORI} {locale === 'bn' ? 'ভরি রূপা' : 'Vori Silver'}
          </Text>
          <Text className="text-[14.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ≈ {formatBangladeshiCurrency(SILVER_NISAB_VORI * state.silverPricePerVori, locale)}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onChangeField('nisabStandard', 'GOLD')}
          className={`flex-1 p-3 rounded-xl border ${
            state.nisabStandard === 'GOLD'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500'
              : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] border-transparent'
          }`}>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[15px] font-bold text-amber-700 dark:text-amber-300">
              {locale === 'bn' ? 'স্বর্ণের নিসাব' : 'Gold Nisab'}
            </Text>
            {state.nisabStandard === 'GOLD' && (
              <AppIcon android="check_circle" size={17} color="#d97706" />
            )}
          </View>
          <Text className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8]">
            {GOLD_NISAB_VORI} {locale === 'bn' ? 'ভরি স্বর্ণ' : 'Vori Gold'}
          </Text>
          <Text className="text-[14.5px] font-bold text-amber-600 dark:text-amber-400 mt-1">
            ≈ {formatBangladeshiCurrency(GOLD_NISAB_VORI * state.goldPricePerVori, locale)}
          </Text>
        </Pressable>
      </View>

      {/* Market Price Input */}
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
      <View
        style={{ borderTopColor: isDark ? '#333436' : '#f0f2f5' }}
        className="border-t pt-3.5 mt-0.5">
        <Text className="text-[14.5px] font-semibold text-[#1c1e21] dark:text-[#e4e6eb] mb-2">
          {locale === 'bn' ? 'বছর গণনার ধরন' : 'Year Calculation'}
        </Text>
        <View className="flex-row gap-2.5">
          <Pressable
            onPress={() => onChangeField('yearStandard', 'HIJRI')}
            className={`flex-1 py-2.5 px-3 rounded-xl border flex-row items-center justify-between ${
              state.yearStandard === 'HIJRI'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] border-transparent'
            }`}>
            <View>
              <Text className="text-[15px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'হিজরি' : 'Hijri'}
              </Text>
              <Text className="text-[13px] text-[#65676b] dark:text-[#b0b3b8]">২.৫%</Text>
            </View>
            {state.yearStandard === 'HIJRI' && (
              <AppIcon android="check_circle" size={17} color="#059669" />
            )}
          </Pressable>

          <Pressable
            onPress={() => onChangeField('yearStandard', 'SOLAR')}
            className={`flex-1 py-2.5 px-3 rounded-xl border flex-row items-center justify-between ${
              state.yearStandard === 'SOLAR'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] border-transparent'
            }`}>
            <View>
              <Text className="text-[15px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'সৌরবছর' : 'Solar'}
              </Text>
              <Text className="text-[13px] text-[#65676b] dark:text-[#b0b3b8]">২.৫৭৭%</Text>
            </View>
            {state.yearStandard === 'SOLAR' && (
              <AppIcon android="check_circle" size={17} color="#059669" />
            )}
          </Pressable>
        </View>
      </View>
    </ZakatAccordionCard>
  );
}
