import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
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
  LeaderboardEntry,
  PointsDashboard,
  PointTaskCategory,
  PointTaskItem,
} from '@/features/points/types/points.types';
import { queryCache } from '@/lib/cache/queryCache';

type ScreenTab = 'tasks' | 'history' | 'leaderboard';
type TaskFilter = 'INCOMPLETE' | PointTaskCategory | 'COMPLETED';

const CACHE_KEY_DASHBOARD = 'points:dashboard';
const CACHE_KEY_LEADERBOARD = 'points:leaderboard';

const resolveTaskIcon = (code: string): AndroidSymbol => {
  switch (code) {
    case 'UPLOAD_AVATAR':
      return 'account_circle';
    case 'UPLOAD_COVER':
      return 'photo_camera';
    case 'ADD_BIO':
      return 'edit';
    case 'SET_LOCATION':
      return 'location_on';
    case 'VERIFY_EMAIL':
      return 'mail';
    case 'COMPLETE_PROFILE_100':
      return 'verified_user';
    case 'DAILY_CHECKIN':
    case 'WEEKLY_STREAK_7':
      return 'calendar_today';
    case 'INVITE_FRIEND_JOIN':
    case 'INVITE_FRIEND_QUALIFIED':
      return 'person_add';
    case 'WELCOME_REFERRAL_BONUS':
      return 'auto_awesome';
    case 'CREATE_POST':
      return 'article';
    case 'COMMENT_POST':
      return 'chat_bubble';
    case 'REACT_POST':
      return 'favorite';
    case 'SHARE_CONTENT':
      return 'share';
    case 'SAVE_BOOKMARK':
      return 'bookmark';
    case 'MAKE_FRIEND':
      return 'group';
    case 'MILESTONE_5_FRIENDS':
    case 'MILESTONE_25_FRIENDS':
    case 'JOIN_GROUP':
      return 'groups';
    case 'CREATE_GROUP':
      return 'add_box';
    default:
      return 'auto_awesome';
  }
};

const getCategoryColor = (category: PointTaskCategory): string => {
  switch (category) {
    case 'PROFILE':
      return '#0866FF';
    case 'DAILY':
      return '#d97706';
    case 'REFERRAL':
      return '#8b5cf6';
    case 'SOCIAL':
      return '#0d9488';
    case 'COMMUNITY':
      return '#e11d48';
    default:
      return '#0866FF';
  }
};

export default function PointsScreen() {
  const { locale, theme, showToast } = useUi();
  const { isAuthenticated, user, setUser } = useAuth();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<ScreenTab>('tasks');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('INCOMPLETE');
  const [dashboard, setDashboard] = useState<PointsDashboard | null>(
    () => queryCache.get<PointsDashboard>(CACHE_KEY_DASHBOARD) || null
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(
    () => queryCache.get<LeaderboardEntry[]>(CACHE_KEY_LEADERBOARD) || []
  );
  const [isLoading, setIsLoading] = useState(!dashboard && isAuthenticated);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const cardSurfaceStyle = {
    backgroundColor: isDark ? '#242526' : '#ffffff',
  };

  const loadData = useCallback(
    async (silent = false) => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      if (!silent) setIsLoading(true);
      try {
        const [dash, lb] = await Promise.all([
          pointsApi.getDashboard(),
          pointsApi.getLeaderboard(20).catch(() => []),
        ]);
        if (dash) {
          setDashboard(dash);
          queryCache.set(CACHE_KEY_DASHBOARD, dash);
          if (user) {
            setUser({
              ...user,
              points: dash.points,
              lifetimePoints: dash.lifetimePoints,
              referralCode: dash.referral.code,
              currentStreak: dash.currentStreak,
            });
          }
        }
        if (Array.isArray(lb) && lb.length > 0) {
          setLeaderboard(lb);
          queryCache.set(CACHE_KEY_LEADERBOARD, lb);
        }
      } catch {
        // silent fallback to cached data
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    loadData(Boolean(dashboard));
  }, [isAuthenticated]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleCheckIn = async () => {
    if (isCheckingIn || dashboard?.checkedInToday) return;
    setIsCheckingIn(true);
    try {
      const res = await pointsApi.checkIn();
      if (!res.alreadyCheckedIn && res.pointsAwarded > 0) {
        const bonusTxt =
          res.streakBonusAwarded > 0
            ? locale === 'bn'
              ? ` (+${res.streakBonusAwarded} ৭-দিনের স্ট্রিক বোনাস!)`
              : ` (+${res.streakBonusAwarded} 7-day streak bonus!)`
            : '';
        showToast({
          type: 'success',
          title: `+${res.pointsAwarded + res.streakBonusAwarded} Points`,
          message:
            locale === 'bn'
              ? `আজকের চেক-ইন সম্পন্ন হয়েছে${bonusTxt}`
              : `Daily check-in complete${bonusTxt}`,
        });
      }
      await loadData(true);
    } catch {
      showToast({
        type: 'error',
        message:
          locale === 'bn'
            ? 'চেক-ইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।'
            : 'Failed to check in. Please try again.',
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const referralCode = user?.username || dashboard?.referral.code || '';
  const referralUrl = referralCode
    ? `https://peacetweet.com/register?invitedBy=${referralCode}`
    : 'https://peacetweet.com/register';

  const handleCopyInvite = async () => {
    if (!referralCode) return;
    let copied = false;

    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(referralUrl);
        copied = true;
      } catch {}
    } else {
      try {
        const rn = require('react-native');
        if (rn?.Clipboard?.setString) {
          rn.Clipboard.setString(referralUrl);
          copied = true;
        }
      } catch {}
    }

    if (copied) {
      setCopiedCode(true);
      showToast({
        type: 'success',
        message:
          locale === 'bn'
            ? 'ইনভাইট লিংক কপি হয়েছে!'
            : 'Invite link copied to clipboard!',
      });
      setTimeout(() => setCopiedCode(false), 2000);
      return;
    }

    await handleShareInvite();
  };

  const handleShareInvite = async () => {
    const message =
      locale === 'bn'
        ? `PeaceTweet-এ যুক্ত হোন — চোখের যিনামুক্ত, প্রশান্তিময় ইসলামিক সোশ্যাল স্পেস! আমার ইনভাইট লিংক দিয়ে জয়েন করে বোনাস পয়েন্ট নিন: ${referralUrl}`
        : `Join me on PeaceTweet — a gaze-protected, ad-free Islamic social platform! Sign up with my invite link for bonus points: ${referralUrl}`;
    try {
      await Share.share({ message, url: referralUrl });
    } catch {}
  };

  const handleTaskPress = (task: PointTaskItem) => {
    if (task.isCompleted) return;
    if (!task.actionRoute || task.actionRoute === '/points') {
      if (task.code === 'DAILY_CHECKIN') {
        handleCheckIn();
      } else if (
        task.code === 'INVITE_FRIEND_JOIN' ||
        task.code === 'INVITE_FRIEND_QUALIFIED'
      ) {
        handleShareInvite();
      }
      return;
    }
    router.push(task.actionRoute as any);
  };

  const filterChips: { key: TaskFilter; bn: string; en: string }[] = [
    { key: 'INCOMPLETE', bn: 'বাকি টাস্ক', en: 'Uncompleted' },
    { key: 'PROFILE', bn: 'প্রোফাইল', en: 'Profile' },
    { key: 'DAILY', bn: 'দৈনিক', en: 'Daily' },
    { key: 'REFERRAL', bn: 'ইনভাইট', en: 'Invite' },
    { key: 'SOCIAL', bn: 'পোস্ট/সোশ্যাল', en: 'Social' },
    { key: 'COMMUNITY', bn: 'বন্ধু ও গ্রুপ', en: 'Community' },
    { key: 'COMPLETED', bn: 'সম্পন্ন', en: 'Completed' },
  ];

  const filteredTasks = (dashboard?.tasks || [])
    .filter((t) => {
      if (taskFilter === 'INCOMPLETE') return !t.isCompleted;
      if (taskFilter === 'COMPLETED') return t.isCompleted;
      return t.category === taskFilter;
    })
    .sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));

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
            icon="auto_awesome"
            iconBgColor="bg-amber-50 dark:bg-amber-950/60"
            iconColor="#d97706"
            titleBn="পয়েন্ট ও টাস্ক দেখতে লগইন করুন"
            titleEn="Sign in to earn Points & Rewards"
            descriptionBn="প্রোফাইল সম্পূর্ণ করে, পোস্ট করে, বন্ধু বানিয়ে ও ইনভাইট করে পয়েন্ট অর্জন করতে লগইন করুন।"
            descriptionEn="Log in to complete tasks, invite friends, track your level, and earn community points."
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 60,
        paddingBottom: BOTTOM_NAV_CLEARANCE,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#0866FF"
          colors={['#0866FF']}
        />
      }
    >
      <View className="w-full max-w-[768px] mx-auto" style={{ gap: 8 }}>
        {isLoading && !dashboard ? (
          <View style={cardSurfaceStyle} className="w-full px-3.5 py-5" >
            <View style={{ gap: 12 }}>
              <Skeleton className="h-8 w-44 rounded-xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </View>
          </View>
        ) : (
          <>
            {/* 1. Hero Points Balance & Level Card */}
            <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    style={{
                      backgroundColor: isDark
                        ? 'rgba(245, 158, 11, 0.16)'
                        : '#fffbeb',
                    }}
                    className="h-12 w-12 rounded-2xl items-center justify-center shrink-0"
                  >
                    <AppIcon android="auto_awesome" size={24} color="#d97706" />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-[13px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                      {locale === 'bn' ? 'আপনার মোট পয়েন্ট' : 'Your Total Points'}
                    </Text>
                    <View className="flex-row items-baseline gap-2">
                      <Text className="text-[26px] font-black text-[#050505] dark:text-white">
                        {dashboard?.points ?? user?.points ?? 0}
                      </Text>
                      <Text className="text-[13.5px] font-bold text-amber-600 dark:text-amber-400">
                        pts
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Daily Check-In CTA */}
                <Pressable
                  onPress={handleCheckIn}
                  disabled={isCheckingIn || Boolean(dashboard?.checkedInToday)}
                  style={{
                    backgroundColor: dashboard?.checkedInToday
                      ? isDark
                        ? '#2e2f30'
                        : '#f0f2f5'
                      : '#0866FF',
                    borderColor: dashboard?.checkedInToday
                      ? isDark
                        ? '#3e4042'
                        : '#e4e6eb'
                      : '#0866FF',
                  }}
                  className="px-3.5 py-2.5 rounded-xl border flex-row items-center gap-1.5 active:opacity-85"
                >
                  {isCheckingIn ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <AppIcon
                      android={
                        dashboard?.checkedInToday
                          ? 'check_circle'
                          : 'calendar_today'
                      }
                      size={16}
                      color={
                        dashboard?.checkedInToday
                          ? '#059669'
                          : '#ffffff'
                      }
                    />
                  )}
                  <Text
                    className={`text-[13.5px] font-bold ${
                      dashboard?.checkedInToday
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-white'
                    }`}
                  >
                    {dashboard?.checkedInToday
                      ? locale === 'bn'
                        ? 'চেকড ইন'
                        : 'Checked In'
                      : locale === 'bn'
                        ? 'চেক-ইন +5'
                        : 'Check-In +5'}
                  </Text>
                </Pressable>
              </View>

              {/* Level & Streak Row */}
              {dashboard?.level ? (
                <View className="mt-4">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className="flex-row items-center gap-2">
                      <View
                        style={{
                          backgroundColor: `${dashboard.level.current.color}18`,
                        }}
                        className="px-2.5 py-1 rounded-full"
                      >
                        <Text
                          style={{ color: dashboard.level.current.color }}
                          className="text-[12.5px] font-bold"
                        >
                          Lv.{dashboard.level.current.level} •{' '}
                          {locale === 'bn'
                            ? dashboard.level.current.nameBn
                            : dashboard.level.current.nameEn}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: isDark
                            ? 'rgba(249, 115, 22, 0.16)'
                            : '#fff7ed',
                        }}
                        className="px-2.5 py-1 rounded-full"
                      >
                        <Text className="text-[12.5px] font-bold text-orange-600 dark:text-orange-400">
                          🔥 {dashboard.currentStreak}{' '}
                          {locale === 'bn' ? 'দিন' : 'day streak'}
                        </Text>
                      </View>
                    </View>
                    {dashboard.level.next ? (
                      <Text className="text-[12.5px] font-medium text-[#65676b] dark:text-[#b0b3b8]">
                        {locale === 'bn'
                          ? `${dashboard.level.pointsToNext} pts বাকি`
                          : `${dashboard.level.pointsToNext} pts to Lv.${dashboard.level.next.level}`}
                      </Text>
                    ) : null}
                  </View>

                  <View className="w-full h-2 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] overflow-hidden">
                    <View
                      style={{
                        width: `${dashboard.level.progressPercent}%`,
                        backgroundColor: dashboard.level.current.color,
                      }}
                      className="h-full rounded-full"
                    />
                  </View>
                </View>
              ) : null}

              {/* Sub-navigation Tabs: Tasks | History | Top Rank */}
              <View className="mt-4 w-full flex-row rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] p-1">
                {(
                  [
                    { key: 'tasks', bn: 'টাস্কসমূহ', en: 'Tasks' },
                    { key: 'history', bn: 'হিস্ট্রি', en: 'History' },
                    { key: 'leaderboard', bn: 'র‍্যাংকিং', en: 'Top Users' },
                  ] as const
                ).map((t) => {
                  const isSel = activeTab === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => setActiveTab(t.key)}
                      className={`flex-1 py-2 items-center rounded-lg ${
                        isSel ? 'bg-[#0866FF]' : ''
                      }`}
                    >
                      <Text
                        className={`text-[13.5px] font-bold ${
                          isSel
                            ? 'text-white'
                            : 'text-[#65676b] dark:text-[#b0b3b8]'
                        }`}
                      >
                        {locale === 'bn' ? t.bn : t.en}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* TAB 1: TASKS */}
            {activeTab === 'tasks' && (
              <>
                {/* 2. Profile Completion Card */}
                {dashboard?.profileCompletion ? (
                  <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                        {locale === 'bn'
                          ? 'প্রোফাইল কমপ্লিশন'
                          : 'Profile Completion'}
                      </Text>
                      <Text className="text-[14px] font-bold text-[#0866FF] dark:text-[#60a5fa]">
                        {dashboard.profileCompletion.percentage}% (
                        {dashboard.profileCompletion.completedSteps}/
                        {dashboard.profileCompletion.totalSteps})
                      </Text>
                    </View>

                    <View className="w-full h-2 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] overflow-hidden mb-3">
                      <View
                        style={{
                          width: `${dashboard.profileCompletion.percentage}%`,
                          backgroundColor: '#059669',
                        }}
                        className="h-full rounded-full"
                      />
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                      {dashboard.profileCompletion.steps.map((s) => (
                        <Pressable
                          key={s.key}
                          onPress={() => {
                            if (s.done) return;
                            if (s.key === 'avatar' || s.key === 'cover') {
                              router.push('/profile');
                            } else {
                              router.push('/settings/profile');
                            }
                          }}
                          style={{
                            backgroundColor: s.done
                              ? isDark
                                ? 'rgba(5, 150, 105, 0.16)'
                                : '#ecfdf5'
                              : isDark
                                ? '#3a3b3c'
                                : '#f0f2f5',
                            borderColor: s.done
                              ? isDark
                                ? 'rgba(16, 185, 129, 0.35)'
                                : '#a7f3d0'
                              : isDark
                                ? '#4e4f50'
                                : '#e4e6eb',
                          }}
                          className="px-3 py-1.5 rounded-full border flex-row items-center gap-1.5"
                        >
                          <AppIcon
                            android={
                              s.done ? 'check_circle' : 'add_box'
                            }
                            size={14}
                            color={
                              s.done
                                ? '#059669'
                                : isDark
                                  ? '#b0b3b8'
                                  : '#65676b'
                            }
                          />
                          <Text
                            className={`text-[13px] font-semibold ${
                              s.done
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-[#050505] dark:text-[#e4e6eb]'
                            }`}
                          >
                            {locale === 'bn' ? s.labelBn : s.labelEn}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* 3. Invite Friends / Referral Card */}
                <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
                  <View className="flex-row items-center gap-3 mb-2.5">
                    <View
                      style={{
                        backgroundColor: isDark
                          ? 'rgba(139, 92, 246, 0.16)'
                          : '#f5f3ff',
                      }}
                      className="h-11 w-11 rounded-2xl items-center justify-center shrink-0"
                    >
                      <AppIcon android="person_add" size={22} color="#8b5cf6" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                        {locale === 'bn'
                          ? 'বন্ধুকে ইনভাইট করে পয়েন্ট পান'
                          : 'Invite Friends & Earn Points'}
                      </Text>
                      <Text className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8]">
                        {locale === 'bn'
                          ? `প্রতি জয়েনে +30 pts এবং অ্যাক্টিভ হলে +50 pts (${dashboard?.referral.totalInvited ?? 0} জন যুক্ত)`
                          : `+30 pts on sign-up & +50 pts when active (${dashboard?.referral.totalInvited ?? 0} invited)`}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: isDark ? '#18191a' : '#f0f2f5',
                      borderColor: isDark ? '#3a3b3c' : '#e4e6eb',
                    }}
                    className="rounded-xl border px-3.5 py-2.5 flex-row items-center justify-between gap-2 mb-2.5"
                  >
                    <View className="flex-1">
                      <Text className="text-[11.5px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                        {locale === 'bn' ? 'আপনার ইনভাইট ইউজারনেম' : 'Your Invite Username'}
                      </Text>
                      <Text className="text-[16px] font-black text-[#050505] dark:text-white">
                        {referralCode ? `@${referralCode}` : '---'}
                      </Text>
                    </View>

                    <Pressable
                      onPress={handleCopyInvite}
                      style={{
                        backgroundColor: isDark ? '#242526' : '#ffffff',
                        borderColor: isDark ? '#3e4042' : '#d0d5dd',
                      }}
                      className="px-3 py-2 rounded-lg border flex-row items-center gap-1.5 active:opacity-80"
                    >
                      <AppIcon
                        android={copiedCode ? 'check' : 'content_copy'}
                        size={15}
                        color={copiedCode ? '#059669' : '#0866FF'}
                      />
                      <Text className="text-[13px] font-bold text-[#0866FF] dark:text-[#60a5fa]">
                        {copiedCode
                          ? locale === 'bn'
                            ? 'কপি হয়েছে'
                            : 'Copied'
                          : locale === 'bn'
                            ? 'কপি লিংক'
                            : 'Copy Link'}
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={handleShareInvite}
                    style={{ backgroundColor: '#7c3aed' }}
                    className="w-full py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-85"
                  >
                    <AppIcon android="share" size={18} color="#ffffff" />
                    <Text className="text-[14.5px] font-bold text-white">
                      {locale === 'bn'
                        ? 'বন্ধুদের ইনভাইট লিংক পাঠান'
                        : 'Share Invite Link'}
                    </Text>
                  </Pressable>
                </View>

                {/* 4. Task Category Chips */}
                <View style={cardSurfaceStyle} className="w-full py-3">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 14, gap: 6 }}
                  >
                    {filterChips.map((chip) => {
                      const isSel = taskFilter === chip.key;
                      return (
                        <Pressable
                          key={chip.key}
                          onPress={() => setTaskFilter(chip.key)}
                          style={{
                            backgroundColor: isSel
                              ? '#0866FF'
                              : isDark
                                ? '#3a3b3c'
                                : '#f0f2f5',
                            borderColor: isSel
                              ? '#0866FF'
                              : isDark
                                ? '#4e4f50'
                                : '#e4e6eb',
                          }}
                          className="px-3.5 py-1.5 rounded-full border"
                        >
                          <Text
                            className={`text-[13.5px] font-bold ${
                              isSel
                                ? 'text-white'
                                : 'text-[#050505] dark:text-[#e4e6eb]'
                            }`}
                          >
                            {locale === 'bn' ? chip.bn : chip.en}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 5. Task Cards */}
                <View style={{ gap: 8 }}>
                  {filteredTasks.length === 0 ? (
                    <View style={cardSurfaceStyle} className="w-full px-3.5 py-6 items-center">
                      <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8] text-center">
                        {taskFilter === 'COMPLETED'
                          ? locale === 'bn'
                            ? 'এখনো কোনো টাস্ক সম্পন্ন হয়নি।'
                            : 'No completed tasks yet.'
                          : locale === 'bn'
                            ? 'সব টাস্ক সম্পন্ন হয়েছে! 🎉'
                            : 'All tasks in this section are completed! 🎉'}
                      </Text>
                    </View>
                  ) : null}
                  {filteredTasks.map((task) => {
                    const color = getCategoryColor(task.category);
                    const target = Math.max(
                      1,
                      task.frequency === 'DAILY'
                        ? task.dailyLimit || 1
                        : task.targetCount || task.maxLimit || 1
                    );
                    const current = Math.min(target, task.currentCount || 0);
                    const pct = Math.round((current / target) * 100);

                    return (
                      <Pressable
                        key={task.code}
                        onPress={() => handleTaskPress(task)}
                        style={cardSurfaceStyle}
                        className="w-full px-3.5 py-4 flex-row items-start gap-3.5 active:opacity-90"
                      >
                        <View
                          style={{ backgroundColor: `${color}18` }}
                          className="h-11 w-11 rounded-2xl items-center justify-center shrink-0 mt-0.5"
                        >
                          <AppIcon
                            android={resolveTaskIcon(task.code)}
                            size={22}
                            color={color}
                          />
                        </View>

                        <View className="flex-1 min-w-0">
                          <View className="flex-row items-center justify-between gap-2 mb-1">
                            <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] flex-1">
                              {locale === 'bn' ? task.titleBn : task.titleEn}
                            </Text>
                            <View
                              style={{
                                backgroundColor: task.isCompleted
                                  ? isDark
                                    ? 'rgba(5, 150, 105, 0.18)'
                                    : '#ecfdf5'
                                  : isDark
                                    ? 'rgba(245, 158, 11, 0.18)'
                                    : '#fffbeb',
                              }}
                              className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
                            >
                              {task.isCompleted ? (
                                <AppIcon
                                  android="check_circle"
                                  size={13}
                                  color="#059669"
                                />
                              ) : null}
                              <Text
                                className={`text-[12.5px] font-bold ${
                                  task.isCompleted
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : 'text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                +{task.points} pts
                              </Text>
                            </View>
                          </View>

                          {task.descriptionBn || task.descriptionEn ? (
                            <Text className="text-[14.5px] leading-[21px] text-[#65676b] dark:text-[#b0b3b8] mb-2">
                              {locale === 'bn'
                                ? task.descriptionBn
                                : task.descriptionEn}
                            </Text>
                          ) : null}

                          <View className="flex-row items-center justify-between gap-3">
                            <View className="flex-1">
                              <View className="w-full h-1.5 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] overflow-hidden">
                                <View
                                  style={{
                                    width: `${task.isCompleted ? 100 : pct}%`,
                                    backgroundColor: task.isCompleted
                                      ? '#059669'
                                      : color,
                                  }}
                                  className="h-full rounded-full"
                                />
                              </View>
                            </View>
                            <Text className="text-[12.5px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                              {task.isCompleted
                                ? locale === 'bn'
                                  ? 'সম্পন্ন'
                                  : 'Completed'
                                : `${current}/${target}${
                                    task.frequency === 'DAILY'
                                      ? locale === 'bn'
                                        ? ' আজ'
                                        : ' today'
                                      : ''
                                  }`}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* TAB 2: HISTORY */}
            {activeTab === 'history' && (
              <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
                <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] mb-3">
                  {locale === 'bn'
                    ? 'সাম্প্রতিক পয়েন্ট হিস্ট্রি'
                    : 'Recent Points History'}
                </Text>

                {!dashboard?.recentTransactions?.length ? (
                  <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8] py-6 text-center">
                    {locale === 'bn'
                      ? 'এখনো কোনো পয়েন্ট লেনদেন হয়নি। টাস্ক সম্পন্ন করে পয়েন্ট অর্জন শুরু করুন!'
                      : 'No points earned yet. Complete tasks above to start earning!'}
                  </Text>
                ) : (
                  <View style={{ gap: 10 }}>
                    {dashboard.recentTransactions.map((tx) => (
                      <View
                        key={tx.id}
                        style={{
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? '#333436' : '#f0f2f5',
                        }}
                        className="pb-2.5 flex-row items-center justify-between gap-3"
                      >
                        <View className="flex-row items-center gap-3 flex-1 min-w-0">
                          <View
                            style={{
                              backgroundColor: isDark
                                ? 'rgba(5, 150, 105, 0.16)'
                                : '#ecfdf5',
                            }}
                            className="h-9 w-9 rounded-xl items-center justify-center shrink-0"
                          >
                            <AppIcon
                              android={resolveTaskIcon(tx.taskCode)}
                              size={18}
                              color="#059669"
                            />
                          </View>
                          <View className="flex-1 min-w-0">
                            <Text
                              numberOfLines={1}
                              className="text-[14.5px] font-semibold text-[#050505] dark:text-[#e4e6eb]"
                            >
                              {locale === 'bn'
                                ? tx.titleBn || tx.taskCode
                                : tx.titleEn || tx.taskCode}
                            </Text>
                            <Text className="text-[12.5px] text-[#65676b] dark:text-[#b0b3b8]">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400">
                          +{tx.pointsDelta}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 3: LEADERBOARD */}
            {activeTab === 'leaderboard' && (
              <View style={cardSurfaceStyle} className="w-full px-3.5 py-4">
                <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] mb-3">
                  {locale === 'bn'
                    ? 'শীর্ষ অবদানকারী সদস্যগণ'
                    : 'Top Contributors'}
                </Text>

                {leaderboard.length === 0 ? (
                  <Text className="text-[15px] text-[#65676b] dark:text-[#b0b3b8] py-6 text-center">
                    {locale === 'bn'
                      ? 'এখনো কোনো র‍্যাংকিং ডেটা তৈরি হয়নি।'
                      : 'No leaderboard entries yet.'}
                  </Text>
                ) : (
                  <View style={{ gap: 10 }}>
                    {leaderboard.map((entry) => (
                      <Pressable
                        key={entry.id}
                        onPress={() => router.push(`/${entry.username}` as any)}
                        style={{
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? '#333436' : '#f0f2f5',
                        }}
                        className="pb-2.5 flex-row items-center justify-between gap-3 active:opacity-80"
                      >
                        <View className="flex-row items-center gap-3 flex-1 min-w-0">
                          <View
                            style={{
                              backgroundColor:
                                entry.rank <= 3
                                  ? '#fffbeb'
                                  : isDark
                                    ? '#3a3b3c'
                                    : '#f0f2f5',
                            }}
                            className="h-8 w-8 rounded-full items-center justify-center shrink-0"
                          >
                            <Text
                              className={`text-[13px] font-black ${
                                entry.rank <= 3
                                  ? 'text-amber-600'
                                  : 'text-[#65676b] dark:text-[#b0b3b8]'
                              }`}
                            >
                              #{entry.rank}
                            </Text>
                          </View>
                          <UserAvatar
                            avatarUrl={entry.avatarUrl}
                            name={entry.name}
                            size="sm"
                          />
                          <View className="flex-1 min-w-0">
                            <Text
                              numberOfLines={1}
                              className="text-[14.5px] font-bold text-[#050505] dark:text-[#e4e6eb]"
                            >
                              {entry.name}
                            </Text>
                            <Text
                              numberOfLines={1}
                              className="text-[12.5px] text-[#65676b] dark:text-[#b0b3b8]"
                            >
                              @{entry.username} •{' '}
                              {locale === 'bn'
                                ? entry.level.nameBn
                                : entry.level.nameEn}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-[15px] font-bold text-[#0866FF] dark:text-[#60a5fa]">
                          {entry.lifetimePoints} pts
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
