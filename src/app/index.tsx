import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

interface SamplePost {
  id: string;
  authorName: string;
  authorUsername: string;
  createdAt: string;
  type: 'DUA' | 'TEXT' | 'BLOOD_REQUEST';
  feeling?: { label: string; emoji: string };
  content?: string;
  dua?: {
    title: string;
    fadilah?: string;
    transliteration: string;
    meaning: string;
    arabicText: string;
    reference?: string;
  };
  bloodRequest?: {
    bloodGroup: string;
    urgency: string;
    patientName: string;
    hospitalName: string;
    location: string;
    contactNumber: string;
    units: number;
  };
  stats: {
    reactionCount: number;
    commentCount: number;
    saveCount: number;
    shareCount: number;
  };
}

const SAMPLE_FEED: SamplePost[] = [
  {
    id: '1',
    authorName: 'PeaceTweet Scholar',
    authorUsername: 'peacetweet',
    createdAt: 'আজ',
    type: 'DUA',
    dua: {
      title: 'দুনিয়া ও আখিরাতের কল্যাণ প্রার্থনার দু’আ',
      fadilah:
        'রাসূলুল্লাহ (সা.) সবচেয়ে বেশি এই দু’আটি পাঠ করতেন এবং সাহাবীদেরও পাঠ করতে উৎসাহিত করতেন।',
      transliteration:
        'রব্বানা আতিনা ফিদ্দুনইয়া হাসানাতাও ওয়া ফিল আখিরাতি হাসানাতাও ওয়া ক্বিনা আযাবান্নার।',
      meaning:
        'হে আমাদের রব! আমাদের দুনিয়াতে কল্যাণ দান করুন এবং আখিরাতেও কল্যাণ দান করুন এবং জাহান্নামের আযাব থেকে আমাদের রক্ষা করুন।',
      arabicText:
        'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
      reference: 'সূরা আল-বাকারা: ২০১',
    },
    stats: {
      reactionCount: 42,
      commentCount: 8,
      saveCount: 19,
      shareCount: 6,
    },
  },
  {
    id: '2',
    authorName: 'আব্দুল্লাহ আল মামুন',
    authorUsername: 'abdullah_m',
    createdAt: '২ ঘণ্টা আগে',
    type: 'TEXT',
    feeling: { label: 'grateful', emoji: '🤲' },
    content:
      'আলহামদুলিল্লাহ, প্রতিদিনের ছোট ছোট নেক আমলগুলোই আমাদের ঈমানকে সজীব রাখে। ফজরের পর সকাল-সন্ধ্যার যিকিরগুলো কখনোই মিস করবেন না।',
    stats: {
      reactionCount: 28,
      commentCount: 5,
      saveCount: 9,
      shareCount: 3,
    },
  },
  {
    id: '3',
    authorName: 'মাহমুদ হাসান',
    authorUsername: 'mahmud_h',
    createdAt: '৪ ঘণ্টা আগে',
    type: 'DUA',
    dua: {
      title: 'অন্তরের প্রশান্তি ও দুশ্চিন্তা মুক্তির দু’আ',
      transliteration:
        'আল্লাহুম্মা ইন্নি আউযুবিকা মিনাল হাম্মি ওয়াল হাযানি, ওয়াল আজযি ওয়াল কাসালি।',
      meaning:
        'হে আল্লাহ! আমি আপনার কাছে দুশ্চিন্তা ও পেরেশানি থেকে এবং অক্ষমতা ও অলসতা থেকে আশ্রয় প্রার্থনা করছি।',
      arabicText:
        'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ',
      reference: 'সহীহ বুখারী: ৬৩৬৯',
    },
    stats: {
      reactionCount: 64,
      commentCount: 11,
      saveCount: 31,
      shareCount: 14,
    },
  },
];

function FeedPostCard({ post }: { post: SamplePost }) {
  const { locale, theme } = useUi();
  const [hasReacted, setHasReacted] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [showArabic, setShowArabic] = useState(false);

  const reactionCount = post.stats.reactionCount + (hasReacted ? 1 : 0);
  const saveCount = post.stats.saveCount + (hasSaved ? 1 : 0);

  return (
    <View className="w-full bg-white dark:bg-[#242526]">
      {/* 1. Author & Post Meta Header matching FeedItem.tsx */}
      <View className="px-3 pt-2.5 pb-1.5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-row items-center gap-2.5 flex-1">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-500">
              <Text className="text-white font-bold text-sm">
                {post.authorName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 flex-wrap">
                <Text className="font-bold text-[15px] text-[#050505] dark:text-[#e4e6eb]">
                  {post.authorName}
                </Text>
                <AppIcon
                  android="verified"
                  ios="checkmark.seal.fill"
                  size={14}
                  color="#1877f2"
                />
                {post.feeling && (
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                    is feeling{' '}
                    <Text className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
                      {post.feeling.label}
                    </Text>{' '}
                    {post.feeling.emoji}
                  </Text>
                )}
              </View>

              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  @{post.authorUsername}
                </Text>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  •
                </Text>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  {post.createdAt}
                </Text>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  •
                </Text>
                <AppIcon
                  android="public"
                  ios="globe"
                  size={12}
                  color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 2. Main Post Content Body */}
        <View className="mt-3">
          {post.type === 'TEXT' && post.content && (
            <Text className="text-[15px] text-[#050505] dark:text-[#e4e6eb] leading-6">
              {post.content}
            </Text>
          )}

          {post.type === 'DUA' && post.dua && (
            <View className="gap-3">
              {/* Dua Title */}
              <Text className="text-[16px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                🌙 {post.dua.title}
              </Text>

              {/* 1. Fadilah / Virtue */}
              {post.dua.fadilah && (
                <Text className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6">
                  {post.dua.fadilah}
                </Text>
              )}

              {/* 2. Pronunciation */}
              <View className="gap-1">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Pronunciation:
                </Text>
                <Text className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6">
                  {post.dua.transliteration}
                </Text>
              </View>

              {/* 3. Meaning */}
              <View className="gap-1">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Meaning:
                </Text>
                <Text className="text-[14.5px] text-[#050505] dark:text-[#e4e6eb] leading-6">
                  {post.dua.meaning}
                </Text>
              </View>

              {/* 4. Collapsible Arabic Text */}
              <View className="gap-2">
                <Pressable
                  onPress={() => setShowArabic(!showArabic)}
                  className="flex-row items-center gap-1.5 py-1 self-start">
                  <AppIcon
                    android="translate"
                    size={14}
                    color={theme === 'dark' ? '#4a80f5' : '#1565d8'}
                  />
                  <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                    {showArabic
                      ? 'আরবি লুকান'
                      : 'আরবি টেক্সট দেখুন (Arabic Text)'}
                  </Text>
                </Pressable>

                {showArabic && (
                  <View className="py-2 px-3 rounded-xl bg-[#f8f9fa] dark:bg-[#18191a]">
                    <Text className="text-right text-2xl text-[#050505] dark:text-[#e4e6eb] leading-10">
                      {post.dua.arabicText}
                    </Text>
                  </View>
                )}
              </View>

              {/* Reference Badge */}
              {post.dua.reference && (
                <View className="pt-0.5">
                  <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    📖 {post.dua.reference}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* 3. 4-Column Action Bar matching FeedItem.tsx */}
      <View className="flex-row px-2 py-1 border-t border-[#e4e6eb]/70 dark:border-[#393a3b]/70">
        {/* Reaction (Ameen / Like) */}
        <Pressable
          onPress={() => setHasReacted(!hasReacted)}
          className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg ${
            hasReacted ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
          }`}>
          <AppIcon
            android="favorite"
            ios="heart.fill"
            size={16}
            color={
              hasReacted
                ? '#e11d48'
                : theme === 'dark'
                  ? '#b0b3b8'
                  : '#65676b'
            }
          />
          <Text
            className={`text-xs font-semibold ${
              hasReacted
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            {post.type === 'DUA'
              ? locale === 'bn'
                ? 'আমীন'
                : 'Ameen'
              : locale === 'bn'
                ? 'পছন্দ'
                : 'Like'}
          </Text>
          <Text
            className={`text-[11px] font-bold opacity-80 ${
              hasReacted
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            ({reactionCount})
          </Text>
        </Pressable>

        {/* Comment */}
        <Pressable className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg">
          <AppIcon
            android="chat_bubble"
            ios="bubble.left"
            size={16}
            color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
          />
          <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'মন্তব্য' : 'Comment'}
          </Text>
          <Text className="text-[11px] font-bold opacity-80 text-[#65676b] dark:text-[#b0b3b8]">
            ({post.stats.commentCount})
          </Text>
        </Pressable>

        {/* Save */}
        <Pressable
          onPress={() => setHasSaved(!hasSaved)}
          className={`flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg ${
            hasSaved ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
          }`}>
          <AppIcon
            android="bookmark"
            ios="bookmark.fill"
            size={16}
            color={
              hasSaved
                ? '#d97706'
                : theme === 'dark'
                  ? '#b0b3b8'
                  : '#65676b'
            }
          />
          <Text
            className={`text-xs font-semibold ${
              hasSaved
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            {hasSaved
              ? locale === 'bn'
                ? 'সংরক্ষিত'
                : 'Saved'
              : locale === 'bn'
                ? 'সেভ'
                : 'Save'}
          </Text>
          <Text
            className={`text-[11px] font-bold opacity-80 ${
              hasSaved
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            ({saveCount})
          </Text>
        </Pressable>

        {/* Share */}
        <Pressable className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg">
          <AppIcon
            android="share"
            ios="square.and.arrow.up"
            size={16}
            color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
          />
          <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'শেয়ার' : 'Share'}
          </Text>
          <Text className="text-[11px] font-bold opacity-80 text-[#65676b] dark:text-[#b0b3b8]">
            ({post.stats.shareCount})
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { locale, setComposerModalOpen } = useUi();

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerClassName="pb-6">
      <View className="w-full max-w-[720px] mx-auto">
        {/* 1. Post Composer Card matching peacetweet_frontend PostComposer.tsx */}
        <View className="mx-2 mt-2 bg-white dark:bg-[#242526] rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] pt-2.5 pb-1 px-3">
          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-500">
              <Text className="text-white font-bold text-xs">🕊️</Text>
            </View>

            <Pressable
              onPress={() => setComposerModalOpen(true)}
              className="h-9 flex-1 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3.5 justify-center">
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                What&apos;s on your mind?
              </Text>
            </Pressable>
          </View>

          {/* Compact 3-Column Bottom Action Buttons */}
          <View className="flex-row gap-1 pt-1 mt-2 border-t border-[#e4e6eb] dark:border-[#393a3b]">
            <Pressable
              onPress={() => setComposerModalOpen(true)}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
              <AppIcon
                android="image"
                ios="photo"
                size={18}
                color="#10b981"
              />
              <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn' ? 'ছবি / মিডিয়া' : 'Photo/video'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setComposerModalOpen(true)}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
              <AppIcon
                android="menu_book"
                ios="book"
                size={18}
                color="#6366f1"
              />
              <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn' ? 'দোয়া' : 'Dua'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setComposerModalOpen(true)}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
              <AppIcon
                android="sentiment_satisfied"
                ios="face.smiling"
                size={18}
                color="#f59e0b"
              />
              <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn' ? 'অনুভূতি' : 'Feeling'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 2. Feed List Card matching peacetweet_frontend Feed.tsx & FeedList.tsx */}
        <View className="w-full mt-2.5 bg-white dark:bg-[#242526] border-y border-[#e4e6eb] dark:border-[#393a3b] overflow-hidden">
          {SAMPLE_FEED.map((post, index) => (
            <React.Fragment key={post.id}>
              {index > 0 && (
                <View className="h-2 w-full bg-[#f0f2f5] dark:bg-[#18191a] border-y border-[#e4e6eb] dark:border-[#393a3b]" />
              )}
              <FeedPostCard post={post} />
            </React.Fragment>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
