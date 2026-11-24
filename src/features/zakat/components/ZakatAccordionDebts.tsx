import React from 'react';
import { ZakatAccordionCard } from './ZakatAccordionCard';
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
    <ZakatAccordionCard
      title={locale === 'bn' ? '৫. বাদযোগ্য ঋণ ও দেনা' : '5. Deductible Debts'}
      icon="cancel"
      iconColor="#e11d48"
      iconBgClass="bg-rose-100 dark:bg-rose-950"
      badgeText={
        totalDebts > 0 ? `- ${formatBangladeshiCurrency(totalDebts, locale)}` : undefined
      }
      badgeClass="text-rose-600 dark:text-rose-400"
      isOpen={isOpen}
      onToggle={onToggle}
      onOpenTip={() => onOpenTip(ZAKAT_TIPS.debts)}
      isDark={isDark}>
      <ZakatNumericInput
        labelBn="তাৎক্ষণিক প্রদেয় ব্যক্তিগত বা ব্যাংক ঋণ"
        labelEn="Immediate Due Loans"
        value={state.immediateDebts}
        onChangeValue={(v) => onChangeField('immediateDebts', v)}
        tipKey="debts"
        onOpenTip={onOpenTip}
        isDark={isDark}
        locale={locale}
      />
      <ZakatNumericInput
        labelBn="বকেয়া বাড়িভাড়া ও ইউটিলিটি বিল"
        labelEn="Due Rent and Utility Bills"
        value={state.dueBillsAndRent}
        onChangeValue={(v) => onChangeField('dueBillsAndRent', v)}
        isDark={isDark}
        locale={locale}
      />
      <ZakatNumericInput
        labelBn="কর্মচারীদের বকেয়া বেতন"
        labelEn="Staff Due Salaries"
        value={state.staffSalaryDue}
        onChangeValue={(v) => onChangeField('staffSalaryDue', v)}
        isDark={isDark}
        locale={locale}
      />
      <ZakatNumericInput
        labelBn="দোকানের সাপ্লায়ার / মহাজনের পাওনা"
        labelEn="Trade Payables / Suppliers Due"
        value={state.suppliersDue}
        onChangeValue={(v) => onChangeField('suppliersDue', v)}
        isDark={isDark}
        locale={locale}
      />
      <ZakatNumericInput
        labelBn="দীর্ঘমেয়াদী লোনের চলতি কিস্তি"
        labelEn="Long-term Loan Current Installment"
        value={state.currentInstallmentDue}
        onChangeValue={(v) => onChangeField('currentInstallmentDue', v)}
        tipKey="debts"
        onOpenTip={onOpenTip}
        isDark={isDark}
        locale={locale}
        isLast
      />
    </ZakatAccordionCard>
  );
}
