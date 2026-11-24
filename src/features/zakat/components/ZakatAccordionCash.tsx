import React from 'react';
import { ZakatAccordionCard } from './ZakatAccordionCard';
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
    <ZakatAccordionCard
      title={locale === 'bn' ? '২. নগদ অর্থ ও ব্যাংক' : '2. Cash & Bank Savings'}
      icon="call"
      iconColor="#2563eb"
      iconBgClass="bg-blue-100 dark:bg-blue-950"
      badgeText={totalCash > 0 ? formatBangladeshiCurrency(totalCash, locale) : undefined}
      badgeClass="text-emerald-600 dark:text-emerald-400"
      isOpen={isOpen}
      onToggle={onToggle}
      onOpenTip={() => onOpenTip(ZAKAT_TIPS.dps)}
      isDark={isDark}>
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
        labelBn="ডিপিএস (DPS) - জমাকৃত আসল"
        labelEn="DPS (Deposited Principal)"
        value={state.dpsAmount}
        onChangeValue={(v) => onChangeField('dpsAmount', v)}
        tipKey="dps"
        onOpenTip={onOpenTip}
        isDark={isDark}
        locale={locale}
      />
      <ZakatNumericInput
        labelBn="এফডিআর (FDR) - জমাকৃত আসল"
        labelEn="FDR (Principal Deposited)"
        value={state.fdrAmount}
        onChangeValue={(v) => onChangeField('fdrAmount', v)}
        tipKey="dps"
        onOpenTip={onOpenTip}
        isDark={isDark}
        locale={locale}
      />
      <ZakatNumericInput
        labelBn="মোবাইল ব্যাংকিং (বিকাশ / নগদ)"
        labelEn="Mobile Banking (bKash/Nagad)"
        value={state.mobileBanking}
        onChangeValue={(v) => onChangeField('mobileBanking', v)}
        isDark={isDark}
        locale={locale}
      />
      <ZakatNumericInput
        labelBn="প্রবাসী রেমিট্যান্স সঞ্চয়"
        labelEn="Foreign Remittance Savings"
        value={state.foreignRemittance}
        onChangeValue={(v) => onChangeField('foreignRemittance', v)}
        isDark={isDark}
        locale={locale}
        isLast
      />
    </ZakatAccordionCard>
  );
}
