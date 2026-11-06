export type NisabStandard = 'SILVER' | 'GOLD';
export type GoldUnit = 'VORI' | 'GRAM';
export type YearStandard = 'HIJRI' | 'SOLAR';

export interface ZakatState {
  // Rates & Nisab
  nisabStandard: NisabStandard;
  goldPricePerVori: number;
  silverPricePerVori: number;
  yearStandard: YearStandard;

  // 1. Cash & Bank
  cashInHand: number;
  bankBalance: number;
  dpsAmount: number;
  fdrAmount: number;
  mobileBanking: number;
  foreignRemittance: number;

  // 2. Gold & Silver
  goldUnit: GoldUnit;
  goldQuantity: number;
  silverUnit: GoldUnit;
  silverQuantity: number;

  // 3. Business & Investment
  businessStock: number;
  businessCash: number;
  receivablesGood: number;
  sharesTrading: number;
  sanchayapatraPrincipal: number;
  landForResale: number;

  // 4. Liabilities & Debts
  immediateDebts: number;
  dueBillsAndRent: number;
  staffSalaryDue: number;
  suppliersDue: number;
  currentInstallmentDue: number;
}

export interface ZakatCalculationResult {
  totalCashAssets: number;
  totalGoldSilverAssets: number;
  totalBusinessAssets: number;
  totalAssets: number;
  totalLiabilities: number;
  netZakatableWealth: number;
  nisabThreshold: number;
  isEligibleForZakat: boolean;
  zakatRatePercent: number;
  payableZakat: number;
}
