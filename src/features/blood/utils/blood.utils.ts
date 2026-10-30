export const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const SELECTABLE_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const formatBloodGroup = (bg?: string | null): string => {
  if (!bg) return '?';
  return bg
    .replace('_POSITIVE', '+')
    .replace('_NEGATIVE', '-')
    .replace('POSITIVE', '+')
    .replace('NEGATIVE', '-');
};

export const toBackendBloodGroup = (bg: string): string | undefined => {
  if (!bg || bg === 'ALL') return undefined;
  return bg.replace('+', '_POSITIVE').replace('-', '_NEGATIVE');
};

export const getStatusBadge = (status: string, locale: string = 'bn') => {
  switch (status) {
    case 'POSTING':
      return {
        label: locale === 'bn' ? 'পোস্ট হচ্ছে...' : 'Posting...',
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-300 dark:border-rose-800',
        isPosting: true,
      };
    case 'COMPLETED':
      return {
        label: locale === 'bn' ? 'সম্পন্ন' : 'Completed',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
      };
    case 'PARTIALLY_ACCEPTED':
      return {
        label: locale === 'bn' ? 'ডোনার গৃহীত' : 'Donor Pledged',
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
      };
    case 'FULLY_ACCEPTED':
      return {
        label: locale === 'bn' ? 'ডোনার পূর্ণ' : 'Fully Pledged',
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
      };
    case 'CANCELLED':
      return {
        label: locale === 'bn' ? 'বাতিল' : 'Cancelled',
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
      };
    case 'PENDING':
    default:
      return {
        label: locale === 'bn' ? 'অপেক্ষমান' : 'Pending',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
      };
  }
};
