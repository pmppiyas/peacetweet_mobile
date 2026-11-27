import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { AppIcon, type AndroidSymbol } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { NoorThemeAura } from '@/components/ui/NoorThemeAura';
import { Skeleton } from '@/components/ui/Skeleton';
import { pointsApi } from '@/features/points/api/points.api';
import {
  RedeemCategory,
  RedeemItem,
  RedeemStoreData,
} from '@/features/points/types/points.types';

export interface ProfileCustomizeModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORY_ICON: Record<RedeemCategory, AndroidSymbol> = {
  BADGE: 'verified_user',
  COSMETIC: 'auto_awesome',
  PERK: 'bookmark',
  EXTERNAL_GIFT: 'favorite',
};

/**
 * Modal launched from Profile Management -> "Profile Customize" allowing owners
 * to preview and equip/unequip all cosmetic assets redeemed in the Redeem Store.
 */
export function ProfileCustomizeModal({
  visible,
  onClose,
}: ProfileCustomizeModalProps) {
  const { locale, theme, showToast } = useUi();
  const { user, setUser } = useAuth();
  const { refreshFeed } = useFeed();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const topPad = Math.max(
    insets.top || 0,
    Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0
  );
  const bottomPad = Math.max(insets.bottom || 0, 16);

  const [store, setStore] = useState<RedeemStoreData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await pointsApi.getRedeemStore();
      setStore(data);
    } catch (err: any) {
      setErrorMsg(
        String(
          err?.response?.data?.message ||
            (locale === 'bn'
              ? 'রিডিম করা অ্যাসেট লোড করা যায়নি।'
              : 'Failed to load redeemed assets.')
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (visible) {
      loadAssets();
    }
  }, [visible, loadAssets]);

  const redeemedItems = useMemo(
    () => (store?.items || []).filter((item) => item.isRedeemed),
    [store?.items]
  );

  const cosmeticAssets = useMemo(
    () => redeemedItems.filter((item) => item.category === 'COSMETIC'),
    [redeemedItems]
  );

  const otherRedeemedAssets = useMemo(
    () => redeemedItems.filter((item) => item.category !== 'COSMETIC'),
    [redeemedItems]
  );

  const activeAvatarFrame =
    store?.activeAvatarFrame ?? (user as any)?.activeAvatarFrame ?? null;
  const activeProfileTheme =
    store?.activeProfileTheme ?? (user as any)?.activeProfileTheme ?? null;
  const currentUserStatus = store?.userStatus ?? user?.userStatus;

  const hasNoorTheme = activeProfileTheme === 'NOOR_PROFILE_THEME';
  const hasEmeraldFrame = activeAvatarFrame === 'EMERALD_AVATAR_FRAME';

  const cardSurfaceStyle = {
    backgroundColor: isDark ? '#242526' : '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: isDark ? '#393a3b' : '#e4e6eb',
  };

  const handleToggleEquip = async (item: RedeemItem) => {
    if (busyCode) return;
    const nextEquip = !item.isEquipped;
    setBusyCode(item.code);
    try {
      const res = await pointsApi.toggleEquipCosmetic(item.code, nextEquip);
      if (res?.user) {
        setUser({ ...(user || {}), ...res.user } as any);
      }
      await loadAssets();
      refreshFeed().catch(() => {});
      showToast({
        type: 'success',
        message: nextEquip
          ? locale === 'bn'
            ? `"${item.titleBn}" আপনার প্রোফাইলে সক্রিয় হয়েছে!`
            : `"${item.titleEn}" equipped on your profile!`
          : locale === 'bn'
            ? `"${item.titleBn}" বন্ধ করা হয়েছে।`
            : `"${item.titleEn}" unequipped.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: String(
          err?.response?.data?.message ||
            (locale === 'bn'
              ? 'স্ট্যাটাস পরিবর্তন করা যায়নি।'
              : 'Failed to update cosmetic.')
        ),
      });
    } finally {
      setBusyCode(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#18191a' : '#f0f2f5',
          paddingTop: topPad,
        }}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: isDark ? '#242526' : '#ffffff',
            borderBottomColor: isDark ? '#393a3b' : '#e4e6eb',
          }}
          className="flex-row items-center justify-between px-3.5 py-3 border-b"
        >
          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 rounded-full bg-violet-600 items-center justify-center">
              <AppIcon
                android="auto_awesome"
                size={19}
                weight="bold"
                color="#ffffff"
              />
            </View>
            <View>
              <Text className="text-[17px] font-bold text-[#050505] dark:text-white">
                {locale === 'bn' ? 'প্রোফাইল কাস্টমাইজ' : 'Profile Customize'}
              </Text>
              <Text className="text-[11.5px] text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn'
                  ? 'রিডিম করা স্টাইল সক্রিয় বা বন্ধ করুন'
                  : 'Equip or unequip your redeemed assets'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="h-9 w-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center active:opacity-80"
            accessibilityLabel={locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            <AppIcon
              android="close"
              size={20}
              color={isDark ? '#e4e6eb' : '#050505'}
            />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: bottomPad + 16,
            gap: 8,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Live Preview Section */}
          <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
            <View className="flex-row items-center justify-between mb-2.5">
              <Text className="text-[12px] font-bold uppercase tracking-wider text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Profile Preview'}
              </Text>
              <Text className="text-[11.5px] font-semibold text-primary-600 dark:text-primary-400">
                {cosmeticAssets.filter((i) => i.isEquipped).length}{' '}
                {locale === 'bn' ? 'টি সক্রিয়' : 'equipped'}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: hasNoorTheme
                  ? isDark
                    ? '#211c2d'
                    : '#f8f5ff'
                  : isDark
                    ? '#18191a'
                    : '#f8fafc',
                borderColor: hasNoorTheme
                  ? '#7c3aed'
                  : isDark
                    ? '#3a3b3c'
                    : '#e4e6eb',
              }}
              className="rounded-2xl border p-3.5 flex-row items-center gap-3 relative overflow-hidden"
            >
              {hasNoorTheme ? <NoorThemeAura isDark={isDark} /> : null}

              <UserAvatar
                avatarUrl={user?.avatarUrl || (user as any)?.avatar}
                name={user?.name || 'Member'}
                frameCode={activeAvatarFrame}
                isOnline={hasEmeraldFrame}
                size="md"
                sizePx={48}
              />

              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1.5 flex-wrap">
                  <Text
                    numberOfLines={1}
                    className="text-[15px] font-bold text-[#050505] dark:text-white"
                  >
                    {user?.name || 'PeaceTweet Member'}
                  </Text>
                  {currentUserStatus === 'VERIFIED' ? (
                    <AppIcon
                      android="verified_user"
                      size={16}
                      color="#10b981"
                    />
                  ) : null}
                </View>
                <Text className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                  @{user?.username || 'member'}
                  {hasNoorTheme
                    ? locale === 'bn'
                      ? ' • নূর থিম'
                      : ' • Noor Theme'
                    : ''}
                  {hasEmeraldFrame
                    ? locale === 'bn'
                      ? ' • অনলাইন ফ্রেম'
                      : ' • Online Frame'
                    : ''}
                </Text>
              </View>
            </View>
          </View>

          {isLoading && !store ? (
            <View style={{ gap: 8 }}>
              <View className="px-3.5 pt-1">
                <Skeleton className="h-3.5 w-36 rounded-md" />
              </View>

              {[1, 2].map((i) => (
                <View
                  key={i}
                  style={cardSurfaceStyle}
                  className="w-full px-3.5 py-4 gap-3"
                >
                  <View className="flex-row items-start gap-3">
                    <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                    <View className="flex-1 gap-2">
                      <View className="flex-row items-center gap-2">
                        <Skeleton className="h-4 w-36 rounded-md" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </View>
                      <Skeleton className="h-3 w-full rounded-md" />
                      <Skeleton className="h-3 w-4/5 rounded-md" />
                    </View>
                  </View>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </View>
              ))}

              <View className="px-3.5 pt-1">
                <Skeleton className="h-3.5 w-40 rounded-md" />
              </View>
              <View
                style={cardSurfaceStyle}
                className="w-full px-3.5 py-3.5 flex-row items-center justify-between gap-3"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <View className="flex-1 gap-1.5">
                    <Skeleton className="h-3.5 w-32 rounded-md" />
                    <Skeleton className="h-3 w-48 rounded-md" />
                  </View>
                </View>
                <Skeleton className="h-6 w-14 rounded-full" />
              </View>
            </View>
          ) : errorMsg ? (
            <View
              style={cardSurfaceStyle}
              className="w-full px-3.5 py-6 items-center justify-center gap-3"
            >
              <Text className="text-[13.5px] font-medium text-rose-600 dark:text-rose-400 text-center">
                {errorMsg}
              </Text>
              <Pressable
                onPress={loadAssets}
                className="px-4 py-2 rounded-xl bg-primary-600 active:opacity-85"
              >
                <Text className="text-[13px] font-bold text-white">
                  {locale === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
                </Text>
              </Pressable>
            </View>
          ) : redeemedItems.length === 0 ? (
            <View
              style={cardSurfaceStyle}
              className="w-full px-3.5 py-6 items-center justify-center"
            >
              <View className="h-14 w-14 rounded-full bg-violet-100 dark:bg-violet-950/50 items-center justify-center mb-3">
                <AppIcon android="auto_awesome" size={28} color="#7c3aed" />
              </View>
              <Text className="text-[15.5px] font-bold text-[#050505] dark:text-white text-center">
                {locale === 'bn'
                  ? 'এখনো কোনো প্রোফাইল অ্যাসেট রিডিম করেননি'
                  : 'No Redeemed Assets Yet'}
              </Text>
              <Text className="text-[12.5px] text-[#65676b] dark:text-[#b0b3b8] text-center mt-1.5 leading-4">
                {locale === 'bn'
                  ? 'রিডিম স্টোর থেকে এমেরাল্ড ফ্রেম বা নূর থিম সংগ্রহ করলে এখান থেকে সহজেই Equip ও Unequip করতে পারবেন।'
                  : 'Redeem styles like Emerald Frame or Noor Theme from the Redeem Store to equip or unequip them here.'}
              </Text>
              <Pressable
                onPress={() => {
                  onClose();
                  router.push('/redeem' as any);
                }}
                className="mt-4 px-5 py-2.5 rounded-xl bg-primary-600 active:opacity-85 flex-row items-center gap-2"
              >
                <AppIcon android="auto_awesome" size={16} color="#ffffff" />
                <Text className="text-[13.5px] font-bold text-white">
                  {locale === 'bn' ? 'রিডিম স্টোরে যান' : 'Go to Redeem Store'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Equippable Cosmetic Assets */}
              {cosmeticAssets.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text className="px-3.5 pt-1 text-[12.5px] font-bold uppercase tracking-wider text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'প্রোফাইল স্টাইল ও ফ্রেম'
                      : 'Profile Styles & Frames'}
                  </Text>

                  {cosmeticAssets.map((item) => {
                    const isBusy = busyCode === item.code;
                    return (
                      <View
                        key={item.code}
                        style={cardSurfaceStyle}
                        className="w-full px-3.5 py-4 gap-3"
                      >
                        <View className="flex-row items-start gap-3">
                          <View
                            style={{
                              backgroundColor: `${item.accentColor}1a`,
                            }}
                            className="h-11 w-11 rounded-xl items-center justify-center shrink-0"
                          >
                            <AppIcon
                              android={CATEGORY_ICON[item.category]}
                              size={22}
                              color={item.accentColor}
                            />
                          </View>
                          <View className="flex-1 min-w-0">
                            <View className="flex-row items-center gap-2 flex-wrap">
                              <Text className="text-[15px] font-bold text-[#050505] dark:text-white">
                                {locale === 'bn' ? item.titleBn : item.titleEn}
                              </Text>
                              <View
                                style={{
                                  backgroundColor: item.isEquipped
                                    ? isDark
                                      ? 'rgba(16, 185, 129, 0.18)'
                                      : '#dcfce7'
                                    : isDark
                                      ? '#3a3b3c'
                                      : '#f0f2f5',
                                }}
                                className="px-2 py-0.5 rounded-full"
                              >
                                <Text
                                  className={`text-[10.5px] font-bold ${
                                    item.isEquipped
                                      ? 'text-emerald-700 dark:text-emerald-300'
                                      : 'text-[#65676b] dark:text-[#b0b3b8]'
                                  }`}
                                >
                                  {item.isEquipped
                                    ? locale === 'bn'
                                      ? 'সক্রিয়'
                                      : 'Equipped'
                                    : locale === 'bn'
                                      ? 'সংরক্ষিত'
                                      : 'Owned'}
                                </Text>
                              </View>
                            </View>
                            <Text className="text-[12.5px] text-[#65676b] dark:text-[#b0b3b8] mt-1 leading-4">
                              {locale === 'bn'
                                ? item.descriptionBn
                                : item.descriptionEn}
                            </Text>
                          </View>
                        </View>

                        <Pressable
                          disabled={isBusy}
                          onPress={() => handleToggleEquip(item)}
                          style={{
                            backgroundColor: item.isEquipped
                              ? isDark
                                ? 'rgba(16, 185, 129, 0.16)'
                                : '#ecfdf5'
                              : item.accentColor,
                            borderColor: item.accentColor,
                          }}
                          className="w-full py-2.5 rounded-xl border flex-row items-center justify-center gap-2 active:opacity-85"
                        >
                          {isBusy ? (
                            <ActivityIndicator
                              size="small"
                              color={item.isEquipped ? item.accentColor : '#ffffff'}
                            />
                          ) : (
                            <AppIcon
                              android={
                                item.isEquipped ? 'close' : 'check_circle'
                              }
                              size={17}
                              color={item.isEquipped ? item.accentColor : '#ffffff'}
                            />
                          )}
                          <Text
                            style={{
                              color: item.isEquipped
                                ? item.accentColor
                                : '#ffffff',
                            }}
                            className="text-[13.5px] font-bold"
                          >
                            {item.isEquipped
                              ? locale === 'bn'
                                ? 'বন্ধ করুন (Unequip)'
                                : 'Unequip'
                              : locale === 'bn'
                                ? 'প্রোফাইলে ব্যবহার করুন (Equip)'
                                : 'Equip Now'}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {/* Other Redeemed Badges / Perks */}
              {otherRedeemedAssets.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text className="px-3.5 pt-1 text-[12.5px] font-bold uppercase tracking-wider text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'অন্যান্য অর্জিত ব্যাজ ও সুবিধা'
                      : 'Unlocked Badges & Perks'}
                  </Text>

                  <View style={cardSurfaceStyle} className="w-full overflow-hidden">
                    {otherRedeemedAssets.map((item, idx) => (
                      <View
                        key={item.code}
                        style={
                          idx > 0
                            ? {
                                borderTopWidth: 1,
                                borderTopColor: isDark ? '#393a3b' : '#e4e6eb',
                              }
                            : undefined
                        }
                        className="px-3.5 py-3.5 flex-row items-center justify-between gap-3"
                      >
                        <View className="flex-row items-center gap-3 flex-1 min-w-0">
                          <View
                            style={{
                              backgroundColor: `${item.accentColor}1a`,
                            }}
                            className="h-10 w-10 rounded-xl items-center justify-center shrink-0"
                          >
                            <AppIcon
                              android={CATEGORY_ICON[item.category]}
                              size={20}
                              color={item.accentColor}
                            />
                          </View>
                          <View className="flex-1 min-w-0">
                            <Text
                              numberOfLines={1}
                              className="text-[14px] font-bold text-[#050505] dark:text-white"
                            >
                              {locale === 'bn' ? item.titleBn : item.titleEn}
                            </Text>
                            <Text
                              numberOfLines={2}
                              className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5"
                            >
                              {locale === 'bn'
                                ? item.descriptionBn
                                : item.descriptionEn}
                            </Text>
                          </View>
                        </View>

                        <View className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 shrink-0">
                          <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            {locale === 'bn' ? 'সক্রিয়' : 'Active'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Link to Redeem Store */}
              <Pressable
                onPress={() => {
                  onClose();
                  router.push('/redeem' as any);
                }}
                style={cardSurfaceStyle}
                className="w-full px-3.5 py-3.5 flex-row items-center justify-between active:opacity-85"
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-9 w-9 rounded-full bg-amber-500/15 items-center justify-center">
                    <AppIcon android="auto_awesome" size={18} color="#d97706" />
                  </View>
                  <Text className="text-[14px] font-bold text-[#050505] dark:text-white">
                    {locale === 'bn'
                      ? 'আরও স্টাইল রিডিম করতে স্টোরে যান'
                      : 'Get more styles in Redeem Store'}
                  </Text>
                </View>
                <AppIcon android="chevron_right" size={18} color="#65676b" />
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
