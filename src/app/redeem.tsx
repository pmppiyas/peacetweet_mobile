import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon, type AndroidSymbol } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { AuthPromptCard } from '@/components/ui/AuthPromptCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/navMetrics';
import { pointsApi } from '@/features/points/api/points.api';
import {
  RedeemCategory,
  RedeemDeliveryInfo,
  RedeemItem,
  RedeemStoreData,
} from '@/features/points/types/points.types';
import { queryCache } from '@/lib/cache/queryCache';

type StoreFilter = 'ALL' | RedeemCategory | 'CLAIMED';

const CATEGORY_ICON: Record<RedeemCategory, AndroidSymbol> = {
  BADGE: 'verified_user',
  COSMETIC: 'auto_awesome',
  PERK: 'bookmark',
  EXTERNAL_GIFT: 'favorite',
};

const FILTER_OPTIONS: { key: StoreFilter; bn: string; en: string }[] = [
  { key: 'ALL', bn: 'সব রিওয়ার্ড', en: 'All' },
  { key: 'BADGE', bn: 'ব্যাজ', en: 'Badges' },
  { key: 'COSMETIC', bn: 'স্টাইল ও ফ্রেম', en: 'Cosmetics' },
  { key: 'PERK', bn: 'সুবিধা', en: 'Perks' },
  { key: 'EXTERNAL_GIFT', bn: 'আউটসাইড গিফট', en: 'Outside Gifts' },
  { key: 'CLAIMED', bn: 'আমার রিডিম', en: 'My Claims' },
];

export default function RedeemScreen() {
  const { locale, theme, showToast } = useUi();
  const { user, setUser, refreshUser, isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  const [store, setStore] = useState<RedeemStoreData | null>(null);
  const [filter, setFilter] = useState<StoreFilter>('ALL');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [redeemingCode, setRedeemingCode] = useState<string | null>(null);

  const [deliveryModalItem, setDeliveryModalItem] = useState<RedeemItem | null>(null);
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  const cardSurfaceStyle = {
    backgroundColor: isDark ? '#242526' : '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: isDark ? '#393a3b' : '#e4e6eb',
  };

  const loadStore = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await pointsApi.getRedeemStore();
      setStore(data);
    } catch {
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadStore();
  }, [loadStore]);

  const filteredItems = useMemo(() => {
    const list = store?.items || [];
    if (filter === 'ALL') return list;
    if (filter === 'CLAIMED') return [];
    return list.filter((i) => i.category === filter);
  }, [store?.items, filter]);

  const previewItem = useMemo(() => {
    if (filter !== 'ALL' && filter !== 'BADGE' && filter !== 'COSMETIC') {
      return null;
    }
    const previewPool = (store?.items || []).filter((i) =>
      filter === 'ALL'
        ? i.category === 'BADGE' || i.category === 'COSMETIC'
        : i.category === filter
    );
    if (selectedCode) {
      const match = previewPool.find((i) => i.code === selectedCode);
      if (match) return match;
    }
    return previewPool.find((i) => !i.comingSoon) || previewPool[0] || null;
  }, [store?.items, selectedCode, filter]);

  const executeRedeem = async (
    item: RedeemItem,
    deliveryInfo?: RedeemDeliveryInfo,
  ) => {
    if (redeemingCode) return;
    setRedeemingCode(item.code);
    try {
      const res = await pointsApi.redeemReward(item.code, deliveryInfo);
      if (res?.user) {
        setUser({ ...(user || {}), ...res.user });
      } else {
        await refreshUser?.();
      }
      queryCache.invalidate('points:dashboard');
      await loadStore();
      setDeliveryModalItem(null);
      setPhone('');
      setAddress('');
      setNote('');
      showToast({
        type: 'success',
        message:
          locale === 'bn'
            ? `অভিনন্দন! ${item.costPoints} পয়েন্টে "${item.titleBn}" রিডিম সম্পন্ন হয়েছে!`
            : `Success! Redeemed "${item.titleEn}" (-${item.costPoints} pts)!`,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (locale === 'bn'
          ? 'রিডিম করতে সমস্যা হয়েছে।'
          : 'Failed to redeem reward.');
      showToast({ type: 'error', message: String(msg) });
    } finally {
      setRedeemingCode(null);
    }
  };

  const handleToggleEquip = async (item: RedeemItem) => {
    if (redeemingCode) return;
    setRedeemingCode(item.code);
    const nextEquip = !item.isEquipped;
    try {
      const res = await pointsApi.toggleEquipCosmetic(item.code, nextEquip);
      if (res?.user) {
        setUser({ ...(user || {}), ...res.user });
      }
      await loadStore();
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
            (locale === 'bn' ? 'আপডেট করা যায়নি।' : 'Failed to update cosmetic.'),
        ),
      });
    } finally {
      setRedeemingCode(null);
    }
  };

  const handleRedeemPress = (item: RedeemItem) => {
    if (redeemingCode || item.comingSoon) return;

    if (item.missingEmailVerification) {
      showToast({
        type: 'warning',
        message:
          locale === 'bn'
            ? 'এই রিওয়ার্ড নিতে আগে জিমেইল ভেরিফাই করুন।'
            : 'Please verify your Gmail first to redeem this reward.',
      });
      router.push('/settings/profile' as any);
      return;
    }

    if (!item.canRedeem) return;

    if (item.requiresDeliveryInfo) {
      setRecipientName(user?.name || '');
      setDeliveryModalItem(item);
      return;
    }

    executeRedeem(item);
  };

  if (!isAuthenticated) {
    return (
      <ScrollView
        className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
        contentContainerStyle={{
          paddingTop: 60,
          paddingBottom: BOTTOM_NAV_CLEARANCE,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[768px] mx-auto px-3.5 py-4">
          <AuthPromptCard
            icon="verified_user"
            iconBgColor="bg-green-50 dark:bg-green-950/60"
            iconColor="#16a34a"
            titleBn="রিডিম স্টোর দেখতে লগইন করুন"
            titleEn="Sign in to Redeem Rewards"
            descriptionBn="অর্জিত পয়েন্ট দিয়ে ব্যাজ, প্রোফাইল স্টাইল এবং অ্যাপের বাইরের গিফট সংগ্রহ করুন।"
            descriptionEn="Redeem points for verified badges, profile cosmetics, perks, and real outside gifts."
          />
        </View>
      </ScrollView>
    );
  }

  const currentPoints = store?.points ?? user?.points ?? 0;
  const emailVerified = store?.emailVerified ?? Boolean(user?.emailVerified);
  const currentUserStatus = store?.userStatus ?? user?.userStatus;

  return (
    <>
      <ScrollView
        className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
        contentContainerStyle={{
          paddingTop: 60,
          paddingBottom: BOTTOM_NAV_CLEARANCE,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#16a34a"
            colors={['#16a34a']}
          />
        }
      >
        <View className="w-full max-w-[768px] mx-auto flex-1" style={{ gap: 8 }}>
          {/* Header & Balance */}
          <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-3 flex-1 min-w-0">
                <Pressable
                  onPress={() => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/points' as any);
                    }
                  }}
                  className="h-9 w-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] items-center justify-center active:opacity-80"
                >
                  <AppIcon
                    android="arrow_back"
                    size={20}
                    color={isDark ? '#e4e6eb' : '#050505'}
                  />
                </Pressable>
                <View className="flex-1 min-w-0">
                  <Text className="text-[18px] font-black text-[#050505] dark:text-white">
                    {locale === 'bn' ? 'রিডিম শপ ও গিফটস' : 'Rewards & Gift Shop'}
                  </Text>
                  <Text className="text-[13px] text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'ব্যাজ, প্রোফাইল স্টাইল ও অ্যাপের বাইরের উপহার'
                      : 'Badges, profile cosmetics, perks & external gifts'}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.16)'
                    : '#fffbeb',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a',
                }}
                className="px-3 py-1.5 rounded-full border flex-row items-center gap-1.5"
              >
                <AppIcon android="auto_awesome" size={14} color="#d97706" />
                <Text className="text-[13.5px] font-extrabold text-amber-700 dark:text-amber-300">
                  {currentPoints} pts
                </Text>
              </View>
            </View>
          </View>

          {isLoading && !store ? (
            <View style={cardSurfaceStyle} className="w-full px-3.5 py-5">
              <View style={{ gap: 12 }}>
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </View>
            </View>
          ) : (
            <>
              {/* Interactive Live Preview Card */}
              {previewItem ? (
                <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
                  <View className="flex-row items-center justify-between mb-2.5">
                    <Text className="text-[12px] font-bold uppercase tracking-wider text-[#65676b] dark:text-[#b0b3b8]">
                      {locale === 'bn'
                        ? `লাইভ প্রিভিউ: ${previewItem.titleBn}`
                        : `Live Preview: ${previewItem.titleEn}`}
                    </Text>
                    <Text
                      style={{ color: previewItem.accentColor }}
                      className="text-[11.5px] font-bold"
                    >
                      {previewItem.costPoints} pts
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor:
                        previewItem.previewType === 'PROFILE_THEME'
                          ? isDark
                            ? 'rgba(124, 58, 237, 0.14)'
                            : '#f5f3ff'
                          : isDark
                            ? '#18191a'
                            : '#f8fafc',
                      borderColor:
                        previewItem.previewType === 'PROFILE_THEME'
                          ? previewItem.accentColor
                          : isDark
                            ? '#3a3b3c'
                            : '#e4e6eb',
                    }}
                    className="rounded-2xl border p-3.5 flex-row items-center gap-3"
                  >
                    <View
                      style={
                        previewItem.previewType === 'AVATAR_FRAME'
                          ? {
                              borderWidth: 3,
                              borderColor: previewItem.accentColor,
                              borderRadius: 999,
                              padding: 2,
                            }
                          : undefined
                      }
                    >
                      <UserAvatar
                        avatarUrl={user?.avatarUrl}
                        name={user?.name || 'Member'}
                        size="md"
                      />
                    </View>

                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        <Text
                          numberOfLines={1}
                          className="text-[16.5px] font-black text-[#050505] dark:text-white"
                        >
                          {user?.name || 'PeaceTweet Member'}
                        </Text>
                        {previewItem.previewType === 'BADGE_NEXT_TO_NAME' ||
                        currentUserStatus === 'VERIFIED' ? (
                          <AppIcon
                            android="verified_user"
                            size={18}
                            weight="semibold"
                            fill="none"
                            color={isDark ? '#4ade80' : '#22c55e'}
                          />
                        ) : (
                          <AppIcon
                            android={CATEGORY_ICON[previewItem.category]}
                            size={16}
                            weight="semibold"
                            fill="none"
                            color={previewItem.accentColor}
                          />
                        )}
                      </View>
                      <Text className="text-[13px] font-semibold text-primary-600 dark:text-primary-400">
                        @{user?.username || 'member'}
                        {previewItem.previewType === 'GIFT_BOX'
                          ? locale === 'bn'
                            ? ' • গিফট ডেলিভারি প্রিভিউ'
                            : ' • Gift Claim Preview'
                          : ''}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: previewItem.isRedeemed
                          ? isDark
                            ? 'rgba(22, 163, 74, 0.2)'
                            : '#dcfce7'
                          : isDark
                            ? '#2e2f30'
                            : '#e4e6eb',
                      }}
                      className="px-2.5 py-1 rounded-full"
                    >
                      <Text
                        className={`text-[11.5px] font-bold ${
                          previewItem.isRedeemed
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-[#65676b] dark:text-[#b0b3b8]'
                        }`}
                      >
                        {previewItem.isRedeemed
                          ? locale === 'bn'
                            ? 'সক্রিয়'
                            : 'Active'
                          : previewItem.comingSoon
                            ? locale === 'bn'
                              ? 'শীঘ্রই'
                              : 'Soon'
                            : locale === 'bn'
                              ? 'প্রিভিউ'
                              : 'Preview'}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Category Filter Bar */}
              <View style={cardSurfaceStyle} className="w-full py-2.5">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}
                >
                  {FILTER_OPTIONS.map((opt) => {
                    const active = filter === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setFilter(opt.key)}
                        style={{
                          backgroundColor: active
                            ? '#16a34a'
                            : isDark
                              ? '#3a3b3c'
                              : '#f0f2f5',
                        }}
                        className="px-3.5 py-1.5 rounded-full"
                      >
                        <Text
                          className={`text-[13px] font-bold ${
                            active
                              ? 'text-white'
                              : 'text-[#050505] dark:text-[#e4e6eb]'
                          }`}
                        >
                          {locale === 'bn' ? opt.bn : opt.en}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {filter === 'CLAIMED' ? (
                <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
                  <Text className="text-[15.5px] font-bold text-[#050505] dark:text-white mb-3">
                    {locale === 'bn' ? 'আমার রিডিম হিস্ট্রি' : 'My Redeemed Rewards'}
                  </Text>
                  {(store?.redemptions || []).length === 0 ? (
                    <Text className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8] py-4 text-center">
                      {locale === 'bn'
                        ? 'আপনি এখনো কোনো রিওয়ার্ড বা গিফট রিডিম করেননি।'
                        : 'You have not redeemed any rewards or gifts yet.'}
                    </Text>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {(store?.redemptions || []).map((rec) => (
                        <View
                          key={rec.id}
                          style={{
                            borderColor: isDark ? '#3a3b3c' : '#e4e6eb',
                            backgroundColor: isDark ? '#18191a' : '#f8fafc',
                          }}
                          className="rounded-xl border p-3 flex-row items-center justify-between gap-3"
                        >
                          <View className="flex-1 min-w-0">
                            <Text className="text-[14.5px] font-bold text-[#050505] dark:text-white">
                              {locale === 'bn' ? rec.titleBn : rec.titleEn}
                            </Text>
                            <Text className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                              -{rec.pointsSpent} pts •{' '}
                              {new Date(rec.redeemedAt).toLocaleDateString()}
                            </Text>
                            {rec.fulfillmentCode ? (
                              <Text className="text-[12px] font-bold text-primary-600 dark:text-primary-400 mt-1">
                                Code: {rec.fulfillmentCode}
                              </Text>
                            ) : null}
                          </View>
                          <View className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/60">
                            <Text className="text-[11.5px] font-bold text-green-700 dark:text-green-400">
                              {rec.status}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                filteredItems.map((item) => {
                  const isBusy = redeemingCode === item.code;
                  const isSelected = previewItem?.code === item.code;
                  return (
                    <Pressable
                      key={item.code}
                      onPress={() => {
                        if (item.category === 'BADGE' || item.category === 'COSMETIC') {
                          setSelectedCode(item.code);
                        }
                      }}
                      style={[
                        cardSurfaceStyle,
                        isSelected
                          ? { borderColor: item.accentColor }
                          : undefined,
                      ]}
                      className="w-full px-3.5 py-4"
                    >
                      <View className="flex-row items-start justify-between gap-3 mb-2.5">
                        <View className="flex-row items-center gap-3 flex-1 min-w-0">
                          <View
                            style={{
                              backgroundColor: `${item.accentColor}1A`,
                            }}
                            className="h-11 w-11 rounded-2xl items-center justify-center shrink-0"
                          >
                            <AppIcon
                              android={CATEGORY_ICON[item.category]}
                              size={22}
                              color={item.accentColor}
                            />
                          </View>
                          <View className="flex-1 min-w-0">
                            <View className="flex-row items-center gap-2 flex-wrap">
                              <Text className="text-[16px] font-bold text-[#050505] dark:text-white">
                                {locale === 'bn' ? item.titleBn : item.titleEn}
                              </Text>
                              {(item.badgeTagBn || item.badgeTagEn) ? (
                                <View
                                  style={{
                                    backgroundColor: `${item.accentColor}18`,
                                  }}
                                  className="px-2 py-0.5 rounded-full"
                                >
                                  <Text
                                    style={{ color: item.accentColor }}
                                    className="text-[10.5px] font-bold"
                                  >
                                    {locale === 'bn'
                                      ? item.badgeTagBn
                                      : item.badgeTagEn}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            <Text className="text-[13px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                              {locale === 'bn'
                                ? `মূল্য: ${item.costPoints} পয়েন্ট`
                                : `Price: ${item.costPoints} pts`}
                              {item.redeemCount > 0 && item.isRepeatable
                                ? locale === 'bn'
                                  ? ` • ${item.redeemCount} বার নেওয়া হয়েছে`
                                  : ` • Claimed ${item.redeemCount}x`
                                : ''}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text className="text-[14px] leading-5 text-[#65676b] dark:text-[#b0b3b8] mb-3.5">
                        {locale === 'bn' ? item.descriptionBn : item.descriptionEn}
                      </Text>

                      {/* Requirements Checklist */}
                      <View
                        style={{
                          backgroundColor: isDark ? '#18191a' : '#f8fafc',
                          borderColor: isDark ? '#3a3b3c' : '#e4e6eb',
                        }}
                        className="rounded-xl border p-3 gap-2 mb-3.5"
                      >
                        {item.requiresEmailVerified ? (
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                              <AppIcon
                                android={
                                  emailVerified ? 'check_circle' : 'error_outline'
                                }
                                size={16}
                                color={emailVerified ? '#16a34a' : '#d97706'}
                              />
                              <Text className="text-[13.5px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                                {locale === 'bn'
                                  ? 'জিমেইল ভেরিফিকেশন (বাধ্যতামূলক)'
                                  : 'Gmail Verification (Mandatory)'}
                              </Text>
                            </View>
                            {emailVerified ? (
                              <Text className="text-[12.5px] font-bold text-green-600 dark:text-green-400">
                                {locale === 'bn' ? 'সম্পন্ন' : 'Verified'}
                              </Text>
                            ) : (
                              <Pressable
                                onPress={() =>
                                  router.push('/settings/profile' as any)
                                }
                              >
                                <Text className="text-[12.5px] font-bold text-primary-600 dark:text-primary-400">
                                  {locale === 'bn' ? 'ভেরিফাই করুন →' : 'Verify →'}
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        ) : null}

                        {item.requiresDeliveryInfo ? (
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                              <AppIcon
                                android="pin_drop"
                                size={16}
                                color={item.accentColor}
                              />
                              <Text className="text-[13.5px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                                {locale === 'bn'
                                  ? 'ডেলিভারি / রিসিভার তথ্য প্রয়োজন'
                                  : 'Outside Delivery Info Required'}
                              </Text>
                            </View>
                          </View>
                        ) : null}

                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <AppIcon
                              android={
                                item.pointsNeeded === 0
                                  ? 'check_circle'
                                  : 'auto_awesome'
                              }
                              size={16}
                              color={
                                item.pointsNeeded === 0 ? '#16a34a' : '#d97706'
                              }
                            />
                            <Text className="text-[13.5px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
                              {locale === 'bn'
                                ? `প্রয়োজনীয় পয়েন্ট (${item.costPoints} pts)`
                                : `Required Points (${item.costPoints} pts)`}
                            </Text>
                          </View>
                          <Text
                            className={`text-[12.5px] font-bold ${
                              item.pointsNeeded === 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {currentPoints}/{item.costPoints} pts
                          </Text>
                        </View>
                      </View>

                      {/* Action CTA */}
                      {item.comingSoon ? (
                        <View
                          style={{
                            backgroundColor: isDark ? '#3a3b3c' : '#f0f2f5',
                          }}
                          className="w-full py-3 rounded-xl items-center justify-center"
                        >
                          <Text className="text-[14px] font-bold text-[#65676b] dark:text-[#b0b3b8]">
                            {locale === 'bn'
                              ? 'শীঘ্রই রিডিমের জন্য উন্মুক্ত হবে'
                              : 'Coming Soon to Redeem Shop'}
                          </Text>
                        </View>
                      ) : item.isRedeemed && item.category === 'COSMETIC' ? (
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
                          className="w-full py-3 rounded-xl border flex-row items-center justify-center gap-2 active:opacity-85"
                        >
                          {isBusy ? (
                            <ActivityIndicator
                              size="small"
                              color={item.isEquipped ? item.accentColor : '#ffffff'}
                            />
                          ) : (
                            <AppIcon
                              android={
                                item.isEquipped ? 'check_circle' : 'auto_awesome'
                              }
                              size={18}
                              color={item.isEquipped ? item.accentColor : '#ffffff'}
                            />
                          )}
                          <Text
                            style={{
                              color: item.isEquipped ? item.accentColor : '#ffffff',
                            }}
                            className="text-[14.5px] font-bold"
                          >
                            {item.isEquipped
                              ? locale === 'bn'
                                ? 'সক্রিয় আছে ✓ (বন্ধ করতে ট্যাপ করুন)'
                                : 'Equipped ✓ (Tap to Unequip)'
                              : locale === 'bn'
                                ? 'প্রোফাইলে সেট করুন'
                                : 'Equip on Profile'}
                          </Text>
                        </Pressable>
                      ) : item.isRedeemed ? (
                        <View
                          style={{
                            backgroundColor: isDark
                              ? 'rgba(22, 163, 74, 0.16)'
                              : '#dcfce7',
                            borderColor: isDark
                              ? 'rgba(22, 163, 74, 0.4)'
                              : '#bbf7d0',
                          }}
                          className="w-full py-3 rounded-xl border flex-row items-center justify-center gap-2"
                        >
                          <AppIcon
                            android="check_circle"
                            size={18}
                            color="#16a34a"
                          />
                          <Text className="text-[14.5px] font-bold text-green-700 dark:text-green-300">
                            {locale === 'bn'
                              ? 'ইতিমধ্যেই রিডিম করা হয়েছে ✓'
                              : 'Already Redeemed ✓'}
                          </Text>
                        </View>
                      ) : item.missingEmailVerification ? (
                        <Pressable
                          onPress={() => router.push('/settings/profile' as any)}
                          className="w-full py-3 rounded-xl bg-amber-600 flex-row items-center justify-center gap-2 active:opacity-85"
                        >
                          <AppIcon android="verified_user" size={18} color="#ffffff" />
                          <Text className="text-[14.5px] font-bold text-white">
                            {locale === 'bn'
                              ? 'আগে জিমেইল ভেরিফাই করুন'
                              : 'Verify Gmail First'}
                          </Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          disabled={!item.canRedeem || isBusy}
                          onPress={() => handleRedeemPress(item)}
                          style={{
                            backgroundColor: item.canRedeem
                              ? item.accentColor
                              : isDark
                                ? '#3a3b3c'
                                : '#e4e6eb',
                          }}
                          className="w-full py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-85"
                        >
                          {isBusy ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <AppIcon
                              android={CATEGORY_ICON[item.category]}
                              size={18}
                              color={
                                item.canRedeem
                                  ? '#ffffff'
                                  : isDark
                                    ? '#8a8d91'
                                    : '#65676b'
                              }
                            />
                          )}
                          <Text
                            className={`text-[14.5px] font-bold ${
                              item.canRedeem
                                ? 'text-white'
                                : 'text-[#65676b] dark:text-[#b0b3b8]'
                            }`}
                          >
                            {isBusy
                              ? locale === 'bn'
                                ? 'প্রসেস হচ্ছে...'
                                : 'Redeeming...'
                              : item.canRedeem
                                ? locale === 'bn'
                                  ? `${item.costPoints} পয়েন্টে রিডিম করুন`
                                  : `Redeem for ${item.costPoints} pts`
                                : locale === 'bn'
                                  ? `আরও ${item.pointsNeeded} পয়েন্ট প্রয়োজন`
                                  : `Need ${item.pointsNeeded} more pts`}
                          </Text>
                        </Pressable>
                      )}
                    </Pressable>
                  );
                })
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* External Gift Delivery Info Modal */}
      <Modal
        visible={Boolean(deliveryModalItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setDeliveryModalItem(null)}
      >
        <View className="flex-1 bg-black/55 items-center justify-center px-4">
          <View
            style={{
              backgroundColor: isDark ? '#242526' : '#ffffff',
              borderColor: isDark ? '#3a3b3c' : '#e4e6eb',
            }}
            className="w-full max-w-md rounded-2xl border p-4"
          >
            <Text className="text-[17px] font-black text-[#050505] dark:text-white mb-1">
              {locale === 'bn'
                ? 'গিফট ডেলিভারির তথ্য দিন'
                : 'Gift Delivery Details'}
            </Text>
            <Text className="text-[13px] text-[#65676b] dark:text-[#b0b3b8] mb-3">
              {deliveryModalItem
                ? locale === 'bn'
                  ? `${deliveryModalItem.titleBn} (${deliveryModalItem.costPoints} pts)`
                  : `${deliveryModalItem.titleEn} (${deliveryModalItem.costPoints} pts)`
                : ''}
            </Text>

            <View style={{ gap: 10 }}>
              <TextInput
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder={locale === 'bn' ? 'প্রাপকের নাম' : 'Recipient full name'}
                placeholderTextColor="#8a8d91"
                className="rounded-xl border border-[#e4e6eb] dark:border-[#3a3b3c] bg-[#f8fafc] dark:bg-[#18191a] px-3 py-2.5 text-[14px] text-[#050505] dark:text-white"
              />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder={locale === 'bn' ? 'মোবাইল নম্বর' : 'Phone number'}
                placeholderTextColor="#8a8d91"
                className="rounded-xl border border-[#e4e6eb] dark:border-[#3a3b3c] bg-[#f8fafc] dark:bg-[#18191a] px-3 py-2.5 text-[14px] text-[#050505] dark:text-white"
              />
              <TextInput
                value={address}
                onChangeText={setAddress}
                multiline
                placeholder={
                  locale === 'bn' ? 'সম্পূর্ণ ঠিকানা' : 'Full delivery address'
                }
                placeholderTextColor="#8a8d91"
                className="rounded-xl border border-[#e4e6eb] dark:border-[#3a3b3c] bg-[#f8fafc] dark:bg-[#18191a] px-3 py-2.5 text-[14px] text-[#050505] dark:text-white min-h-[72px]"
              />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={
                  locale === 'bn' ? 'নোট (ঐচ্ছিক)' : 'Optional delivery note'
                }
                placeholderTextColor="#8a8d91"
                className="rounded-xl border border-[#e4e6eb] dark:border-[#3a3b3c] bg-[#f8fafc] dark:bg-[#18191a] px-3 py-2.5 text-[14px] text-[#050505] dark:text-white"
              />
            </View>

            <View className="flex-row justify-end gap-2 mt-4">
              <Pressable
                onPress={() => setDeliveryModalItem(null)}
                className="px-4 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c]"
              >
                <Text className="text-[13.5px] font-bold text-[#050505] dark:text-white">
                  {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                disabled={Boolean(redeemingCode)}
                onPress={() => {
                  if (!deliveryModalItem) return;
                  if (!recipientName.trim() || !phone.trim() || !address.trim()) {
                    showToast({
                      type: 'warning',
                      message:
                        locale === 'bn'
                          ? 'নাম, মোবাইল নম্বর এবং ঠিকানা লিখুন।'
                          : 'Please fill name, phone, and address.',
                    });
                    return;
                  }
                  executeRedeem(deliveryModalItem, {
                    recipientName: recipientName.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                    note: note.trim() || undefined,
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-green-600"
              >
                <Text className="text-[13.5px] font-bold text-white">
                  {redeemingCode
                    ? locale === 'bn'
                      ? 'প্রসেস হচ্ছে...'
                      : 'Submitting...'
                    : locale === 'bn'
                      ? 'কনফার্ম রিডিম'
                      : 'Confirm Redeem'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
