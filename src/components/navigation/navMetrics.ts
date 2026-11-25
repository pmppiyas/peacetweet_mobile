import { Platform } from 'react-native';

/**
 * Exact distance from viewport bottom to the top border of MobileNav.
 * NativeWind uses `1rem = 14dp` on native (`16px` on web), so `MobileNav` (`h-14` + `border-t`)
 * measures `50dp` natively (`57px` on web) and is shifted `bottom: -2.5` on Android (~`47.5dp`).
 * Using `47` (Android) / `50` (iOS) / `57` (Web) eliminates any gap above the bottom navbar.
 */
export const BOTTOM_NAV_CLEARANCE =
  Platform.OS === 'android' ? 47 : Platform.OS === 'ios' ? 50 : 57;
