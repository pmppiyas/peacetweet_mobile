import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { ZakatNumericInput } from './ZakatNumericInput';
import { ZakatState } from '../types/zakat.types';
import { ZAKAT_TIPS, FiqhTip } from '../constants/zakatConstants';
import { formatBangladeshiCurrency } from '../utils/zakatCalculator';

interface ZakatAccordionBusinessProps {
  state: ZakatState;
  onChangeField: (field: keyof ZakatState, val: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  totalBusiness: number;
  onOpenTip: (tip: FiqhTip) => void;
  isDark?: boolean;
  locale?: 'bn' | 'en';
}

export function ZakatAccordionBusiness({
  state,
  onChangeField,
  isOpen,
  onToggle,
  totalBusiness,
  onOpenTip,
  isDark = false,
  locale = 'bn',
}: ZakatAccordionBusinessProps) {
  return (
    <View
      style={{ backgroundColor: isDark ? '#242526' : '#ffffff' }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs mb-3 overflow-hidden">
      <Pressable
        onPress={onToggle}
        className="p-4 flex-row items-center justify-between active:opacity-80">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 items-center justify-center">
            <AppIcon android="domain" size={17} color="#9333ea" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
              {locale === 'bn' ? '৪. ব্যবসা, শেয়ার ও বিনিয়োগ' : '4. Business & Investments'}
            </Text>
            <Text className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              {formatBangladeshiCurrency(totalBusiness, locale)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => onOpenTip(ZAKAT_TIPS.business)}
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
          <ZakatNumericInput
            labelBn="দোকান বা ব্যবসার বিক্রয়যোগ্য পণ্যের পাইকারি দর"
            labelEn="Inventory / Stock for Sale (Wholesale)"
            value={state.businessStock}
            onChangeValue={(v) => onChangeField('businessStock', v)}
            tipKey="business"
            onOpenTip={onOpenTip}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="ব্যবসার চলতি ক্যাশ ও ব্যাংক ব্যালেন্স"
            labelEn="Business Cash & Bank"
            value={state.businessCash}
            onChangeValue={(v) => onChangeField('businessCash', v)}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="দেনাদারদের কাছে নিশ্চিত পাওনা (Good Receivables)"
            labelEn="Receivables (Confirmed Debt owed to you)"
            value={state.receivablesGood}
            onChangeValue={(v) => onChangeField('receivablesGood', v)}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="পুঁজিবাজার / শেয়ারের বর্তমান বাজারমূল্য"
            labelEn="Stock Market Shares (Current value)"
            value={state.sharesTrading}
            onChangeValue={(v) => onChangeField('sharesTrading', v)}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="সঞ্চয়পত্রে আসল বিনিয়োগ"
            labelEn="Sanchayapatra Principal"
            value={state.sanchayapatraPrincipal}
            onChangeValue={(v) => onChangeField('sanchayapatraPrincipal', v)}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="পুনর্বিক্রয়ের উদ্দেশ্যে কেনা জমি বা ফ্ল্যাটের বর্তমান দর"
            labelEn="Land / Flat purchased for Resale"
            value={state.landForResale}
            onChangeValue={(v) => onChangeField('landForResale', v)}
            isDark={isDark}
            locale={locale}
          />
        </View>
      )}
    </View>
  );
}
