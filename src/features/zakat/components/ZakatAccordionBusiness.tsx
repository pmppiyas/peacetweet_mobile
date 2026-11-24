import React from 'react';
import { ZakatAccordionCard } from './ZakatAccordionCard';
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
    <ZakatAccordionCard
      title={locale === 'bn' ? '৪. ব্যবসা ও বিনিয়োগ' : '4. Business & Investments'}
      icon="domain"
      iconColor="#9333ea"
      iconBgClass="bg-purple-100 dark:bg-purple-950"
      badgeText={
        totalBusiness > 0 ? formatBangladeshiCurrency(totalBusiness, locale) : undefined
      }
      badgeClass="text-purple-600 dark:text-purple-400"
      isOpen={isOpen}
      onToggle={onToggle}
      onOpenTip={() => onOpenTip(ZAKAT_TIPS.business)}
      isDark={isDark}>
      <ZakatNumericInput
        labelBn="ব্যবসার বিক্রয়যোগ্য পণ্যের পাইকারি দর"
        labelEn="Inventory / Stock (Wholesale)"
        value={state.businessStock}
        onChangeValue={(v) => onChangeField('businessStock', v)}
        tipKey="business"
        onOpenTip={onOpenTip}
        isDark={isDark}
        locale={locale}
      />
      <ZakatNumericInput
        labelBn="ব্যবসার চলতি ক্যাশ ও ব্যাংক"
        labelEn="Business Cash & Bank"
        value={state.businessCash}
        onChangeValue={(v) => onChangeField('businessCash', v)}
        isDark={isDark}
        locale={locale}
      />
      <ZakatNumericInput
        labelBn="দেনাদারদের কাছে নিশ্চিত পাওনা"
        labelEn="Receivables (Confirmed Debt)"
        value={state.receivablesGood}
        onChangeValue={(v) => onChangeField('receivablesGood', v)}
        isDark={isDark}
        locale={locale}
      />
      <ZakatNumericInput
        labelBn="শেয়ারের বর্তমান বাজারমূল্য"
        labelEn="Stock Market Shares"
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
        labelBn="পুনর্বিক্রয়ের জমি বা ফ্ল্যাটের দর"
        labelEn="Land / Flat for Resale"
        value={state.landForResale}
        onChangeValue={(v) => onChangeField('landForResale', v)}
        isDark={isDark}
        locale={locale}
        isLast
      />
    </ZakatAccordionCard>
  );
}
