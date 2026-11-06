import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { ZakatNumericInput } from './ZakatNumericInput';
import { ZakatState } from '../types/zakat.types';
import { ZAKAT_TIPS, FiqhTip } from '../constants/zakatConstants';
import { formatBangladeshiCurrency } from '../utils/zakatCalculator';

interface ZakatAccordionCashProps {
  state: ZakatState;
  onChangeField: (field: keyof ZakatState, val: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  totalCash: number;
  onOpenTip: (tip: FiqhTip) => void;
  isDark?: boolean;
  locale?: 'bn' | 'en';
}

export function ZakatAccordionCash({
  state,
  onChangeField,
  isOpen,
  onToggle,
  totalCash,
  onOpenTip,
  isDark = false,
  locale = 'bn',
}: ZakatAccordionCashProps) {
  return (
    <View
      style={{ backgroundColor: isDark ? '#242526' : '#ffffff' }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs mb-3 overflow-hidden">
      <Pressable
        onPress={onToggle}
        className="p-4 flex-row items-center justify-between active:opacity-80">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 items-center justify-center">
            <AppIcon android="call" size={17} color="#2563eb" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
              {locale === 'bn' ? '২. নগদ অর্থ ও ব্যাংক সঞ্চয়' : '2. Cash & Bank Savings'}
            </Text>
            <Text className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {formatBangladeshiCurrency(totalCash, locale)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => onOpenTip(ZAKAT_TIPS.dps)}
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
            labelBn="হাতে থাকা নগদ টাকা"
            labelEn="Cash in Hand"
            value={state.cashInHand}
            onChangeValue={(v) => onChangeField('cashInHand', v)}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="ব্যাংক অ্যাকাউন্টে জমার ব্যালেন্স"
            labelEn="Bank Account Balance"
            value={state.bankBalance}
            onChangeValue={(v) => onChangeField('bankBalance', v)}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="ডিপিএস (DPS) - আজ পর্যন্ত জমাকৃত আসল"
            labelEn="DPS (Deposited Principal)"
            value={state.dpsAmount}
            onChangeValue={(v) => onChangeField('dpsAmount', v)}
            tipKey="dps"
            onOpenTip={onOpenTip}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="এফডিআর (FDR) - জমাকৃত মূল আসল"
            labelEn="FDR (Principal Deposited)"
            value={state.fdrAmount}
            onChangeValue={(v) => onChangeField('fdrAmount', v)}
            tipKey="dps"
            onOpenTip={onOpenTip}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="মোবাইল ব্যাংকিং (বিকাশ / নগদ / রকেট)"
            labelEn="Mobile Banking (bKash/Nagad)"
            value={state.mobileBanking}
            onChangeValue={(v) => onChangeField('mobileBanking', v)}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="প্রবাসীদের প্রেরিত বা সঞ্চিত রেমিট্যান্স"
            labelEn="Foreign Remittance Savings"
            value={state.foreignRemittance}
            onChangeValue={(v) => onChangeField('foreignRemittance', v)}
            isDark={isDark}
            locale={locale}
          />
        </View>
      )}
    </View>
  );
}
