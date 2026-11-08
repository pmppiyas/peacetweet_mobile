import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { ZakatNumericInput } from './ZakatNumericInput';
import { ZakatState } from '../types/zakat.types';
import { ZAKAT_TIPS, FiqhTip } from '../constants/zakatConstants';
import { formatBangladeshiCurrency } from '../utils/zakatCalculator';

interface ZakatAccordionDebtsProps {
  state: ZakatState;
  onChangeField: (field: keyof ZakatState, val: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  totalDebts: number;
  onOpenTip: (tip: FiqhTip) => void;
  isDark?: boolean;
  locale?: 'bn' | 'en';
}

export function ZakatAccordionDebts({
  state,
  onChangeField,
  isOpen,
  onToggle,
  totalDebts,
  onOpenTip,
  isDark = false,
  locale = 'bn',
}: ZakatAccordionDebtsProps) {
  return (
    <View
      style={{ backgroundColor: isDark ? '#242526' : '#f5f6f8' }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs mb-3 overflow-hidden">
      <Pressable
        onPress={onToggle}
        className="p-4 flex-row items-center justify-between active:opacity-80">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 items-center justify-center">
            <AppIcon android="cancel" size={17} color="#e11d48" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
              {locale === 'bn' ? '৫. বাদযোগ্য ঋণ ও বকেয়া দেনা' : '5. Deductible Debts & Due Bills'}
            </Text>
            <Text className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              - {formatBangladeshiCurrency(totalDebts, locale)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => onOpenTip(ZAKAT_TIPS.debts)}
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
          <Text className="text-xs text-rose-600 dark:text-rose-400 mb-3">
            {locale === 'bn'
              ? 'এই দেনাগুলো আপনার মোট যাকাতযোগ্য সম্পদ থেকে স্বয়ংক্রিয়ভাবে বিয়োগ হবে।'
              : 'These liabilities will be subtracted from your total zakatable wealth.'}
          </Text>

          <ZakatNumericInput
            labelBn="তাৎক্ষণিক প্রদেয় ব্যক্তিগত বা ব্যাংক ঋণ"
            labelEn="Immediate Due Loans (Bank or Personal)"
            value={state.immediateDebts}
            onChangeValue={(v) => onChangeField('immediateDebts', v)}
            tipKey="debts"
            onOpenTip={onOpenTip}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="চলতি মাসের বকেয়া বাড়িভাড়া ও ইউটিলিটি বিল"
            labelEn="Due Rent and Utility Bills"
            value={state.dueBillsAndRent}
            onChangeValue={(v) => onChangeField('dueBillsAndRent', v)}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="কর্মচারীদের বকেয়া বেতন"
            labelEn="Staff / Employee Due Salaries"
            value={state.staffSalaryDue}
            onChangeValue={(v) => onChangeField('staffSalaryDue', v)}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="দোকানের সাপ্লায়ার বা মহাজনের বকেয়া দেনা"
            labelEn="Trade Payables / Suppliers Due"
            value={state.suppliersDue}
            onChangeValue={(v) => onChangeField('suppliersDue', v)}
            isDark={isDark}
            locale={locale}
          />
          <ZakatNumericInput
            labelBn="দীর্ঘমেয়াদী লোনের চলতি বছরের প্রদেয় কিস্তি"
            labelEn="Long-term Loan Current Year Installment"
            value={state.currentInstallmentDue}
            onChangeValue={(v) => onChangeField('currentInstallmentDue', v)}
            tipKey="debts"
            onOpenTip={onOpenTip}
            isDark={isDark}
            locale={locale}
          />
        </View>
      )}
    </View>
  );
}
