import { ZakatState } from '../types/zakat.types';

export const GRAMS_PER_VORI = 11.664;
export const SILVER_NISAB_VORI = 52.5; // 612.36 grams
export const GOLD_NISAB_VORI = 7.5; // 87.48 grams

// Approximate typical market prices in Bangladesh (editable by user)
export const DEFAULT_GOLD_PRICE_PER_VORI = 145000;
export const DEFAULT_SILVER_PRICE_PER_VORI = 2200;

export const DEFAULT_ZAKAT_STATE: ZakatState = {
  nisabStandard: 'SILVER',
  goldPricePerVori: DEFAULT_GOLD_PRICE_PER_VORI,
  silverPricePerVori: DEFAULT_SILVER_PRICE_PER_VORI,
  yearStandard: 'HIJRI',

  cashInHand: 0,
  bankBalance: 0,
  dpsAmount: 0,
  fdrAmount: 0,
  mobileBanking: 0,
  foreignRemittance: 0,

  goldUnit: 'VORI',
  goldQuantity: 0,
  silverUnit: 'VORI',
  silverQuantity: 0,

  businessStock: 0,
  businessCash: 0,
  receivablesGood: 0,
  sharesTrading: 0,
  sanchayapatraPrincipal: 0,
  landForResale: 0,

  immediateDebts: 0,
  dueBillsAndRent: 0,
  staffSalaryDue: 0,
  suppliersDue: 0,
  currentInstallmentDue: 0,
};

export interface FiqhTip {
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
}

export const ZAKAT_TIPS: Record<string, FiqhTip> = {
  nisab: {
    titleBn: 'রূপার নিসাব কেন গ্রহণ করা উত্তম?',
    titleEn: 'Why Silver Nisab is Recommended?',
    descBn:
      'মিশ্র সম্পদ (টাকা, সোনা, ব্যবসার পণ্য ইত্যাদি) থাকলে বাংলাদেশের বেশিরভাগ আলেমদের মতে রূপার নিসাব (৫২.৫ ভরি) ধরা অধিকতর সতর্কতামূলক। এতে দরিদ্রদের সর্বোচ্চ কল্যাণ সাধিত হয়।',
    descEn:
      'For mixed assets (cash, gold, business inventory), following silver nisab (52.5 vori) is recommended by major scholars to best benefit the needy.',
  },
  dps: {
    titleBn: 'ডিপিএস ও এফডিআর এর যাকাত কীভাবে হবে?',
    titleEn: 'How to calculate Zakat on DPS & FDR?',
    descBn:
      'ডিপিএস বা এফডিআর-এ আজ পর্যন্ত আপনার নিজের জমানো মূল আসল টাকার ওপর যাকাত আসবে। ব্যাংক থেকে আসা সুদের ওপর কোনো যাকাত নেই, বরং অর্জিত সুদ পুরোটাই সওয়াবের নিয়ত ছাড়া গরীবদের দান করে দিতে হয়।',
    descEn:
      'Only the deposited principal amount is subject to Zakat. Bank interest is not zakatable and must be given away to charity without expecting spiritual reward.',
  },
  gold: {
    titleBn: 'অলংকার ও স্বর্ণের যাকাত কে দেবেন?',
    titleEn: 'Who pays Zakat on Gold Jewelry?',
    descBn:
      'স্বর্ণ বা রূপা ব্যবহারের হোক বা জমানো হোক, বর্তমান বিক্রয়মূল্য অনুযায়ী যাকাত দিতে হয়। যে ব্যক্তি অলংকারের প্রকৃত মালিক (যেমন স্ত্রী), যাকাত মূলত তাকেই দিতে হবে। তবে স্বামী স্বেচ্ছায় স্ত্রীর পক্ষ থেকে আদায় করে দিলে তা আদায় হয়ে যাবে।',
    descEn:
      'Gold is zakatable at current market value whether used or stored. The actual owner pays Zakat, but a spouse can pay on their behalf with consent.',
  },
  business: {
    titleBn: 'দোকান ও ব্যবসার কোন সম্পদে যাকাত আসবে?',
    titleEn: 'What Business Assets are Zakatable?',
    descBn:
      'দোকানের বিক্রয়যোগ্য মালের পাইকারি ক্রয়মূল্যের ওপর যাকাত আসবে। কিন্তু দোকানের ভিটা, ডেকোরেশন, এসি, ডেলিভারি ভ্যান বা কারখানার মেশিনারির ওপর কোনো যাকাত নেই।',
    descEn:
      'Only inventory for sale (at wholesale value) and business cash are zakatable. Fixed assets (shop premises, furniture, machinery) are exempt.',
  },
  debts: {
    titleBn: 'কোন ঋণগুলো সম্পদ থেকে বাদ যাবে?',
    titleEn: 'Which Debts can be Deducted?',
    descBn:
      'তাৎক্ষণিক প্রদেয় জরুরি ঋণ, চলতি মাসের বকেয়া ঘরভাড়া, কর্মচারীদের বেতন এবং বিল বাদ যাবে। তবে ২০-২৫ বছরের গৃহনির্মাণ লোনের পুরোটা একসঙ্গে বাদ যাবে না, শুধুমাত্র চলতি বছরের প্রদেয় কিস্তি বাদ দেওয়া যাবে।',
    descEn:
      'Immediate due loans, pending rent, utility bills, and staff salaries can be deducted. For multi-year long-term loans, only the current installment due is deductible.',
  },
};
