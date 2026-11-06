import {
  GRAMS_PER_VORI,
  GOLD_NISAB_VORI,
  SILVER_NISAB_VORI,
} from '../constants/zakatConstants';
import { ZakatCalculationResult, ZakatState } from '../types/zakat.types';

export function calculateZakat(state: ZakatState): ZakatCalculationResult {
  // 1. Cash Assets
  const totalCashAssets =
    (state.cashInHand || 0) +
    (state.bankBalance || 0) +
    (state.dpsAmount || 0) +
    (state.fdrAmount || 0) +
    (state.mobileBanking || 0) +
    (state.foreignRemittance || 0);

  // 2. Gold & Silver Assets
  const goldVori =
    state.goldUnit === 'GRAM'
      ? (state.goldQuantity || 0) / GRAMS_PER_VORI
      : state.goldQuantity || 0;
  const goldValue = goldVori * (state.goldPricePerVori || 0);

  const silverVori =
    state.silverUnit === 'GRAM'
      ? (state.silverQuantity || 0) / GRAMS_PER_VORI
      : state.silverQuantity || 0;
  const silverValue = silverVori * (state.silverPricePerVori || 0);

  const totalGoldSilverAssets = Math.round(goldValue + silverValue);

  // 3. Business & Investment Assets
  const totalBusinessAssets =
    (state.businessStock || 0) +
    (state.businessCash || 0) +
    (state.receivablesGood || 0) +
    (state.sharesTrading || 0) +
    (state.sanchayapatraPrincipal || 0) +
    (state.landForResale || 0);

  // Total Assets
  const totalAssets = totalCashAssets + totalGoldSilverAssets + totalBusinessAssets;

  // 4. Liabilities & Debts
  const totalLiabilities =
    (state.immediateDebts || 0) +
    (state.dueBillsAndRent || 0) +
    (state.staffSalaryDue || 0) +
    (state.suppliersDue || 0) +
    (state.currentInstallmentDue || 0);

  // Net Wealth
  const netZakatableWealth = Math.max(0, totalAssets - totalLiabilities);

  // Nisab Threshold
  const nisabThreshold = Math.round(
    state.nisabStandard === 'GOLD'
      ? GOLD_NISAB_VORI * (state.goldPricePerVori || 0)
      : SILVER_NISAB_VORI * (state.silverPricePerVori || 0)
  );

  const isEligibleForZakat = netZakatableWealth >= nisabThreshold && nisabThreshold > 0;

  // Zakat rate: 2.5% for Lunar (Hijri), 2.577% for Solar (Gregorian)
  const zakatRatePercent = state.yearStandard === 'SOLAR' ? 2.577 : 2.5;

  const payableZakat = isEligibleForZakat
    ? Math.round(netZakatableWealth * (zakatRatePercent / 100))
    : 0;

  return {
    totalCashAssets,
    totalGoldSilverAssets,
    totalBusinessAssets,
    totalAssets,
    totalLiabilities,
    netZakatableWealth,
    nisabThreshold,
    isEligibleForZakat,
    zakatRatePercent,
    payableZakat,
  };
}

// Format numbers in Bengali / English with Bangladeshi comma style (lakhs, crores)
export function formatBangladeshiCurrency(num: number, locale: 'bn' | 'en' = 'bn'): string {
  const rounded = Math.round(num || 0);
  const formattedEn = rounded.toLocaleString('en-IN');

  if (locale === 'en') {
    return `৳ ${formattedEn}`;
  }

  // Convert English digits to Bengali digits
  const bnDigits: Record<string, string> = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };

  const formattedBn = formattedEn.replace(/[0-9]/g, (d) => bnDigits[d] || d);
  return `৳ ${formattedBn}`;
}
