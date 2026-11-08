import React from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { FeedItem } from '@/features/feed/types/feed.types';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { PostMediaGallery } from './PostMediaGallery';
import { ExpandablePostCaption } from './ExpandablePostCaption';

const BLOOD_LABEL_MAP: Record<string, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
};

export interface BloodPostCardProps {
  post: FeedItem;
  onOpenPhoto?: (url: string) => void;
}

export function BloodPostCard({ post, onOpenPhoto }: BloodPostCardProps) {
  const { locale, theme } = useUi();
  const { user } = useAuth();
  const blood = post.bloodRequest;

  if (!blood || (blood as any).isUnavailable) {
    return (
      <View className="mx-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
        <Text className="text-xs font-semibold text-rose-700 dark:text-rose-400">
          {locale === 'bn'
            ? 'রক্তের আবেদনের বিবরণ পাওয়া যায়নি।'
            : 'Blood request details are unavailable.'}
        </Text>
      </View>
    );
  }

  const neededDate = blood.neededDate
    ? new Date(blood.neededDate).toLocaleString(
        locale === 'bn' ? 'bn-BD' : 'en-US',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }
      )
    : null;

  const activeDonationsCount =
    blood.donations?.filter(
      (d: any) => d.status === 'ACCEPTED' || d.status === 'COMPLETED'
    ).length || 0;

  const progressPercent = blood.units
    ? Math.min(
        100,
        Math.round(((blood.unitsFulfilled || 0) / blood.units) * 100)
      )
    : 0;

  const bloodGroupLabel =
    BLOOD_LABEL_MAP[blood.bloodGroup] || blood.bloodGroup || '?';

  const isOwner = user?.id === blood.requesterId;
  const myDonation = blood.donations?.find(
    (d: any) => d.donorId === user?.id && d.status !== 'CANCELLED'
  );
  const isMyDonationActive = Boolean(myDonation);

  // Avoid duplicating caption if content is identical to blood problem
  const isRedundantContent =
    !post.content ||
    (blood.problem &&
      post.content.trim().replace(/^🩸\s*/, '').toLowerCase() ===
        blood.problem.trim().toLowerCase());

  const hasMedia = Boolean(post.mediaUrls && post.mediaUrls.length > 0);

  return (
    <View style={{ width: '100%' }} className="w-full gap-2.5">
      {/* Optional Editorial / Caption Note (Expandable if > 10 lines for text-only, or > 3 lines for photo posts) */}
      {post.content && !isRedundantContent ? (
        <ExpandablePostCaption content={post.content} hasMedia={hasMedia} />
      ) : null}

      {/* Compact Blood Request Card (Soft border, no black outline, space-efficient) */}
      <View
        style={{
          backgroundColor: theme === 'dark' ? '#1f2022' : '#eceff4',
          borderWidth: 1,
          borderColor: theme === 'dark' ? '#2e2f31' : '#d9dde4',
          borderRadius: 14,
        }}
        className="mx-3 p-3 gap-2">
        {/* Top Header: Compact Blood Badge + Patient Info + Status */}
        <View className="flex-row items-center justify-between gap-2.5">
          <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
            {/* Compact Blood Badge (Clean, sharp, no overflowing text) */}
            <View
              style={{
                width: 42,
                height: 36,
                backgroundColor: '#e11d48',
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="shrink-0 shadow-2xs">
              <Text
                selectable={false}
                style={{
                  color: '#ffffff',
                  fontWeight: '900',
                  fontSize: 13,
                  letterSpacing: -0.3,
                }}>
                {bloodGroupLabel}
              </Text>
            </View>

            {/* Patient Name & Problem */}
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center gap-1.5 flex-wrap">
                <Text
                  selectable={true}
                  numberOfLines={1}
                  className="text-[15.5px] font-bold text-[#050505] dark:text-[#e4e6eb] select-text">
                  {blood.patientName}
                </Text>
                {blood.forMyself ? (
                  <View className="rounded-full bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2">
                    <Text
                      selectable={false}
                      className="text-[9px] font-bold text-blue-700 dark:text-blue-300 select-none">
                      {locale === 'bn' ? 'নিজের জন্য' : 'Self'}
                    </Text>
                  </View>
                ) : null}
                {blood.patientAge ? (
                  <Text
                    selectable={false}
                    className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] select-none">
                    ({blood.patientAge} {locale === 'bn' ? 'বছর' : 'yrs'})
                  </Text>
                ) : null}
              </View>

              {blood.problem ? (
                <Text
                  selectable={true}
                  numberOfLines={1}
                  className="text-[13px] font-medium text-rose-600 dark:text-rose-400 mt-0.5 select-text">
                  {blood.problem}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Right: Emergency & Status Badges */}
          <View className="items-end gap-1 shrink-0">
            {blood.urgency === 'EMERGENCY' ? (
              <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80">
                <View className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                <Text
                  selectable={false}
                  className="text-[9px] font-black text-rose-700 dark:text-rose-300 uppercase">
                  {locale === 'bn' ? 'জরুরি' : 'Emergency'}
                </Text>
              </View>
            ) : null}

            {blood.status ? (
              <View className="px-2 py-0.5 rounded-md bg-[#e9ecef] dark:bg-[#2c2d2e]">
                <Text
                  selectable={false}
                  className="text-[9.5px] font-bold text-[#65676b] dark:text-[#b0b3b8]">
                  {blood.status === 'COMPLETED'
                    ? (locale === 'bn' ? 'সম্পন্ন' : 'Completed')
                    : blood.status === 'FULLY_ACCEPTED'
                    ? (locale === 'bn' ? 'ডোনার পূর্ণ' : 'Fully Pledged')
                    : blood.status === 'PARTIALLY_ACCEPTED'
                    ? (locale === 'bn' ? 'আংশিক গৃহীত' : 'Partially Accepted')
                    : (locale === 'bn' ? 'সক্রিয়' : 'Active')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: theme === 'dark' ? '#2e2f31' : '#eef0f2',
            marginVertical: 2,
          }}
        />

        {/* Clean, Compact Details Rows (No bulky boxes) */}
        <View className="gap-1.5">
          {/* Hospital Name */}
          <View className="flex-row items-center gap-2">
            <AppIcon
              android="domain"
              ios="building.2"
              size={13}
              color={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            />
            <Text
              selectable={true}
              numberOfLines={1}
              className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] flex-1 select-text">
              {blood.hospitalName}
            </Text>
          </View>

          {/* Location */}
          {blood.location ? (
            <View className="flex-row items-center gap-2">
              <AppIcon
                android="pin_drop"
                ios="mappin.and.ellipse"
                size={13}
                color="#e11d48"
              />
              <Text
                selectable={true}
                numberOfLines={1}
                className="text-xs text-[#65676b] dark:text-[#b0b3b8] flex-1 select-text">
                {blood.location}
              </Text>
            </View>
          ) : null}

          {/* Needed Date & Time */}
          {neededDate ? (
            <View className="flex-row items-center gap-2">
              <AppIcon
                android="calendar_today"
                ios="calendar"
                size={13}
                color="#2563eb"
              />
              <Text
                selectable={false}
                numberOfLines={1}
                className="text-xs text-[#65676b] dark:text-[#b0b3b8] flex-1 select-none">
                {locale === 'bn' ? 'প্রয়োজন:' : 'Needed:'}{' '}
                <Text className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
                  {neededDate}
                </Text>
              </Text>
            </View>
          ) : null}

          {/* Contact Phone & One-Tap Call Button */}
          {blood.contactNumber ? (
            <View className="flex-row items-center justify-between gap-2 pt-0.5">
              <View className="flex-row items-center gap-2 flex-1 min-w-0">
                <AppIcon android="call" ios="phone.fill" size={13} color="#059669" />
                <Text
                  selectable={true}
                  numberOfLines={1}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 select-text">
                  {blood.contactNumber}
                  {blood.alternateContact ? ` / ${blood.alternateContact}` : ''}
                </Text>
              </View>

              <Pressable
                onPress={() => Linking.openURL(`tel:${blood.contactNumber}`)}
                className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 active:scale-95 shadow-2xs">
                <AppIcon android="call" ios="phone.fill" size={10} color="#ffffff" />
                <Text className="text-[10px] font-bold text-white">
                  {locale === 'bn' ? 'কল দিন' : 'Call'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Units Needed & Progress Bar */}
        <View className="gap-1 pt-0.5">
          <View className="flex-row items-center justify-between">
            <Text
              selectable={false}
              className="text-[11px] font-semibold text-[#050505] dark:text-[#e4e6eb] select-none">
              {locale === 'bn' ? 'রক্তের পরিমাণ:' : 'Required Units:'}{' '}
              <Text className="text-rose-600 dark:text-rose-400 font-black">
                {blood.units} {locale === 'bn' ? 'ব্যাগ' : 'bag(s)'}
              </Text>
            </Text>
            <Text
              selectable={false}
              className="text-[10px] text-[#65676b] dark:text-[#b0b3b8] select-none">
              {locale === 'bn'
                ? `${blood.unitsFulfilled || 0} সম্পন্ন / ${activeDonationsCount} প্রতিশ্রুতিবদ্ধ`
                : `${blood.unitsFulfilled || 0} completed / ${activeDonationsCount} pledged`}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="h-1.5 w-full rounded-full bg-[#e5e7eb] dark:bg-[#3a3b3c] overflow-hidden">
            <View
              style={{
                width: `${Math.max(
                  progressPercent,
                  activeDonationsCount > 0
                    ? (activeDonationsCount / blood.units) * 100
                    : 0
                )}%`,
              }}
              className={`h-full rounded-full ${
                progressPercent >= 100
                  ? 'bg-emerald-500'
                  : progressPercent > 0
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
          </View>
        </View>

        {/* Donors Preview */}
        {blood.donations && blood.donations.length > 0 ? (
          <View className="flex-row items-center gap-2 pt-0.5">
            <Text
              selectable={false}
              className="text-[10px] font-medium text-[#65676b] dark:text-[#b0b3b8] select-none">
              {locale === 'bn' ? 'ডোনারসমূহ:' : 'Donors:'}
            </Text>
            <View className="flex-row -space-x-1.5">
              {blood.donations
                .filter((d: any) => d.status !== 'CANCELLED')
                .slice(0, 4)
                .map((d: any, idx: number) => (
                  <View
                    key={d.id || idx}
                    className="h-5 w-5 rounded-full border-2 border-white dark:border-[#242526] bg-primary-100 items-center justify-center overflow-hidden">
                    {d.donor?.avatarUrl ? (
                      <Image
                        source={{ uri: d.donor.avatarUrl }}
                        className="h-full w-full"
                      />
                    ) : (
                      <Text className="text-[9px] font-bold text-primary-700">
                        {(d.donor?.name || 'D').charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          </View>
        ) : null}

        {/* Footer Actions */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme === 'dark' ? '#2e2f31' : '#eef0f2',
            paddingTop: 6,
            marginTop: 2,
          }}
          className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.push('/blood')}
            className="flex-row items-center gap-1 active:opacity-70 py-0.5">
            <Text className="text-[11px] font-bold text-primary-600 dark:text-primary-400">
              {locale === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
            </Text>
            <AppIcon android="arrow_forward" ios="arrow.right" size={11} color="#1877f2" />
          </Pressable>

          {isOwner ? (
            <View className="px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950/40">
              <Text className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
                {locale === 'bn' ? 'আপনার আবেদন' : 'Your Request'}
              </Text>
            </View>
          ) : isMyDonationActive ? (
            <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40">
              <AppIcon
                android="check_circle"
                ios="checkmark.circle.fill"
                size={12}
                color="#059669"
              />
              <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {locale === 'bn' ? 'যুক্ত আছেন' : 'Accepted'}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                if (blood.contactNumber) {
                  Linking.openURL(`tel:${blood.contactNumber}`);
                } else {
                  router.push('/blood');
                }
              }}
              className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 active:scale-95 shadow-2xs">
              <AppIcon android="water_drop" ios="drop.fill" size={11} color="#ffffff" />
              <Text className="text-[10px] font-bold text-white">
                {locale === 'bn' ? 'রক্ত দিতে চাই' : 'Donate Blood'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Media Gallery (if any) */}
      <PostMediaGallery
        post={post}
        urls={post.mediaUrls}
        layout={post.mediaLayout}
        onOpenPhoto={onOpenPhoto}
      />
    </View>
  );
}
