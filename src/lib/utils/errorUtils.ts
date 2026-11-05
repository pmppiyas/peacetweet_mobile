/**
 * Sanitizes and formats any error (from API, fetch, or runtime) into a polite,
 * user-friendly message suitable for presentation. Never exposes code lines,
 * database details, or file paths.
 */
export function formatUserFacingError(
  err: any,
  fallbackMessage?: string,
  locale: 'bn' | 'en' = 'bn'
): string {
  const defaultFallback =
    fallbackMessage ||
    (locale === 'bn'
      ? 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।'
      : 'Something went wrong. Please try again later.');

  if (!err) return defaultFallback;

  const raw =
    err?.response?.data?.message ||
    err?.response?.message ||
    err?.message ||
    (typeof err === 'string' ? err : '');

  if (typeof raw !== 'string' || !raw.trim()) {
    return defaultFallback;
  }

  const trimmed = raw.trim();

  // Detect technical/backend crash signatures (Prisma, stack traces, file paths)
  const isTechnical =
    trimmed.includes('prisma') ||
    trimmed.includes('invocation in') ||
    trimmed.includes('\\') ||
    trimmed.includes('.ts:') ||
    trimmed.includes('.js:') ||
    trimmed.includes('at ') ||
    trimmed.includes('TypeError') ||
    trimmed.includes('SyntaxError') ||
    trimmed.includes('INTERNAL_SERVER_ERROR') ||
    trimmed.length > 180;

  if (isTechnical) {
    return defaultFallback;
  }

  // Detect connection / network errors
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('aborted') ||
    lower.includes('econnrefused')
  ) {
    return locale === 'bn'
      ? 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।'
      : 'Unable to connect to server. Please check your internet connection.';
  }

  return trimmed;
}
