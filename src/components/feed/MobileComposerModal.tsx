import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useUi, ComposerMode, ComposerAction } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { LocationSelector, LocationValue } from '@/components/ui/LocationSelector';
import { matchUserLocationToGeo } from '@/constants/bangladeshGeo';
import { uploadsApi } from '@/features/uploads/api/uploads.api';
import { FEELINGS, getFeelingById } from '@/features/feed/constants/feelings';
import {
  imageRatioCache,
  resolveImageAspectRatio,
} from '@/lib/cache/imageRatioCache';
import { formatUserFacingError } from '@/lib/utils/errorUtils';

function ComposerSingleImage({
  uri,
  onRemove,
}: {
  uri: string;
  onRemove: () => void;
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(
    () => imageRatioCache.get(uri) || null
  );

  useEffect(() => {
    if (!uri) return;
    resolveImageAspectRatio(uri, (r) => {
      setAspectRatio(r);
    });
  }, [uri]);

  return (
    <View
      style={{
        width: '100%',
        maxHeight: 520,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#e4e6eb',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="dark:bg-[#2d2e2f]">
      <Image
        source={{ uri }}
        resizeMode="cover"
        onLoad={(e: any) => {
          const src = e?.nativeEvent?.source || e?.target;
          const nw = src?.width || src?.naturalWidth;
          const nh = src?.height || src?.naturalHeight;
          if (nw > 0 && nh > 0) {
            const r = nw / nh;
            imageRatioCache.set(uri, r);
            setAspectRatio(r);
          }
        }}
        style={
          {
            width: '100%',
            aspectRatio: aspectRatio || undefined,
            maxHeight: 520,
            ...(Platform.OS === 'web' && !aspectRatio
              ? { height: 'auto', display: 'block', maxHeight: 520 }
              : {}),
          } as any
        }
      />
      <Pressable
        onPress={onRemove}
        className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/75 items-center justify-center active:scale-90 shadow-md z-10"
        accessibilityLabel="Remove photo">
        <AppIcon android="close" ios="xmark" size={14} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const BLOOD_GROUPS = [
  { label: 'A+', value: 'A_POSITIVE' },
  { label: 'A-', value: 'A_NEGATIVE' },
  { label: 'B+', value: 'B_POSITIVE' },
  { label: 'B-', value: 'B_NEGATIVE' },
  { label: 'AB+', value: 'AB_POSITIVE' },
  { label: 'AB-', value: 'AB_NEGATIVE' },
  { label: 'O+', value: 'O_POSITIVE' },
  { label: 'O-', value: 'O_NEGATIVE' },
];

function mapToBloodGroupValue(bg?: string | null): string {
  if (!bg || bg === 'NONE') return '';
  const normalized = bg.trim().toUpperCase();
  const directMatch = BLOOD_GROUPS.find(
    (g) => g.value === normalized || g.label === normalized
  );
  if (directMatch) return directMatch.value;

  const converted = normalized
    .replace('+', '_POSITIVE')
    .replace('-', '_NEGATIVE');
  const convertedMatch = BLOOD_GROUPS.find((g) => g.value === converted);
  if (convertedMatch) return convertedMatch.value;

  return '';
}

export function MobileComposerModal() {
  const {
    isComposerModalOpen,
    setComposerModalOpen,
    composerInitialMode,
    composerInitialAction,
    composerEditingPost,
    setComposerEditingPost,
    locale,
    theme,
    setIsUploadingPost,
    triggerPostSuccess,
    showToast,
  } = useUi();
  const { user } = useAuth();
  const { createPost, updatePost } = useFeed();

  const isEditing = Boolean(composerEditingPost);
  const isEditingDua =
    isEditing &&
    (composerEditingPost?.type === 'DUA' ||
      Boolean(composerEditingPost?.dua) ||
      Boolean(composerEditingPost?.duaId));

  // Mode & Content
  const [postType, setPostType] = useState<ComposerMode>('TEXT');
  const [content, setContent] = useState('');
  const [contentHeight, setContentHeight] = useState(44);
  const contentInputRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Photos & Media
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaLayout, setMediaLayout] = useState<'COLLAGE' | 'SWIPE'>('COLLAGE');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaContainerWidth, setMediaContainerWidth] = useState(0);
  const [swipeActiveIdx, setSwipeActiveIdx] = useState(0);

  // Dynamic Facebook-like typography: prominent large font for short thoughts, comfortable reading font for longer posts
  const isShortText = content.length < 85 && mediaUrls.length === 0;

  const handleContentChange = (val: string) => {
    setContent(val);
    if (Platform.OS === 'web' && contentInputRef.current) {
      try {
        const node = contentInputRef.current;
        const textarea =
          node?.tagName === 'TEXTAREA' ? node : node?.querySelector?.('textarea') || node;
        if (textarea && textarea.style) {
          textarea.style.height = 'auto';
          const minH = mediaUrls.length > 0 ? 36 : 52;
          const newH = Math.max(minH, textarea.scrollHeight);
          textarea.style.height = `${newH}px`;
          setContentHeight(newH);
        }
      } catch {}
    }
  };

  // Recalculate content height when photos are added or removed
  useEffect(() => {
    if (Platform.OS === 'web' && contentInputRef.current) {
      try {
        const node = contentInputRef.current;
        const textarea =
          node?.tagName === 'TEXTAREA' ? node : node?.querySelector?.('textarea') || node;
        if (textarea && textarea.style) {
          textarea.style.height = 'auto';
          const minH = mediaUrls.length > 0 ? 36 : 52;
          const newH = Math.max(minH, textarea.scrollHeight);
          textarea.style.height = `${newH}px`;
          setContentHeight(newH);
        }
      } catch {}
    }
  }, [mediaUrls.length]);

  // Feelings
  const [feeling, setFeeling] = useState<string | null>(null);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);

  // Dua fields
  const [duaTitle, setDuaTitle] = useState('');
  const [duaArabicText, setDuaArabicText] = useState('');
  const [duaTransliteration, setDuaTransliteration] = useState('');
  const [duaMeaning, setDuaMeaning] = useState('');
  const [duaFadilah, setDuaFadilah] = useState('');

  // Blood request fields
  const [forMyself, setForMyself] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [units, setUnits] = useState('1');
  const [hospitalName, setHospitalName] = useState('');
  const [locationValue, setLocationValue] = useState<LocationValue>(() =>
    matchUserLocationToGeo(user)
  );
  const [contactNumber, setContactNumber] = useState('');
  const [alternateContact, setAlternateContact] = useState('');
  const [neededDate, setNeededDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
  });
  const [problem, setProblem] = useState('');
  const [bloodNote, setBloodNote] = useState('');

  // Sync location initially from user profile if user has a set location
  useEffect(() => {
    if (user) {
      const userGeo = matchUserLocationToGeo(user);
      if (userGeo.location) {
        setLocationValue((prev) => (!prev.location ? userGeo : prev));
      }
    }
  }, [user]);

  // Auto fill name, blood group & location if forMyself is checked
  useEffect(() => {
    if (forMyself && user) {
      if (user.name) {
        setPatientName(user.name);
      }
      if (user.bloodGroup) {
        const bgVal = mapToBloodGroupValue(user.bloodGroup);
        if (bgVal) {
          setBloodGroup(bgVal);
        }
      }
      const userGeo = matchUserLocationToGeo(user);
      if (userGeo.location) {
        setLocationValue(userGeo);
      }
    }
  }, [forMyself, user]);

  const selectedFeeling = getFeelingById(feeling);

  // Handle deep-link initial mode / action or edit post hydration when modal opens
  useEffect(() => {
    if (isComposerModalOpen) {
      setContentHeight(44);
      if (composerEditingPost) {
        const isBlood =
          composerEditingPost.type === 'BLOOD_REQUEST' ||
          Boolean(composerEditingPost.bloodRequest) ||
          Boolean(composerEditingPost.bloodRequestId);

        const isDua =
          composerEditingPost.type === 'DUA' ||
          Boolean(composerEditingPost.dua) ||
          Boolean(composerEditingPost.duaId);

        if (isBlood) {
          setPostType('BLOOD_REQUEST');
          const br = composerEditingPost.bloodRequest;
          if (br) {
            setForMyself(Boolean(br.forMyself));
            setPatientName(br.patientName || '');
            if (br.bloodGroup) {
              setBloodGroup(mapToBloodGroupValue(br.bloodGroup));
            }
            setUnits(String(br.units || 1));
            setHospitalName(br.hospitalName || '');
            setLocationValue({
              country: (br as any).country || 'Bangladesh',
              countryCode: (br as any).countryCode || 'BD',
              state: (br as any).state || '',
              city: (br as any).city || '',
              location: br.location || '',
            });
            setContactNumber(br.contactNumber || '');
            setAlternateContact(br.alternateContact || '');
            if (br.neededDate) {
              setNeededDate(new Date(br.neededDate).toISOString());
            }
            setProblem(br.problem || '');
            setBloodNote((br as any).note || '');
          }
          setContent(composerEditingPost.content || '');
        } else if (isDua) {
          setPostType('DUA');
          const duaObj = composerEditingPost.dua;
          const extractedTitle =
            duaObj?.title ||
            composerEditingPost.content?.replace(/^🌙\s*/, '') ||
            '';
          setDuaTitle(extractedTitle);
          setDuaMeaning(duaObj?.meaningBangla || duaObj?.meaning || '');
          setDuaTransliteration(duaObj?.transliteration || '');
          setDuaArabicText(duaObj?.arabicText || '');
          setDuaFadilah(duaObj?.fadilah || '');
        } else {
          setPostType('TEXT');
          setContent(composerEditingPost.content || '');
          setMediaUrls(composerEditingPost.mediaUrls || []);
          setMediaLayout(composerEditingPost.mediaLayout || 'COLLAGE');
        }
        setFeeling(composerEditingPost.feeling || null);
      } else {
        if (composerInitialMode) {
          setPostType(composerInitialMode);
        }
        if (composerInitialAction === 'photo') {
          setTimeout(() => {
            handlePickImages();
          }, 300);
        } else if (composerInitialAction === 'feeling') {
          setTimeout(() => {
            setShowFeelingPicker(true);
          }, 200);
        }
      }
    }
  }, [
    isComposerModalOpen,
    composerEditingPost,
    composerInitialMode,
    composerInitialAction,
  ]);

  if (!isComposerModalOpen) return null;

  // Validation
  const isPostValid =
    postType === 'TEXT'
      ? content.trim().length > 0 || mediaUrls.length > 0
      : postType === 'DUA'
        ? duaMeaning.trim().length > 0
        : Boolean(
            (forMyself ? user?.name || patientName.trim() : patientName.trim()) &&
              bloodGroup &&
              hospitalName.trim() &&
              (locationValue.location?.trim() || locationValue.districtId) &&
              contactNumber.trim()
          );

  const resetForm = () => {
    setContent('');
    setContentHeight(160);
    setMediaUrls([]);
    setMediaLayout('COLLAGE');
    setFeeling(null);
    setShowFeelingPicker(false);
    setDuaTitle('');
    setDuaArabicText('');
    setDuaTransliteration('');
    setDuaMeaning('');
    setDuaFadilah('');
    setForMyself(false);
    setPatientName('');
    setBloodGroup('');
    setUnits('1');
    setHospitalName('');
    setLocationValue(matchUserLocationToGeo(user));
    setContactNumber('');
    setAlternateContact('');
    const resetD = new Date();
    resetD.setDate(resetD.getDate() + 1);
    resetD.setHours(12, 0, 0, 0);
    setNeededDate(resetD.toISOString());
    setProblem('');
    setBloodNote('');
    setErrorMessage(null);
    setPostType('TEXT');
    setComposerEditingPost(null);
  };

  const handleClose = () => {
    resetForm();
    setComposerModalOpen(false);
  };

  // Image Upload Handler
  const uploadFiles = async (files: (File | Blob)[]) => {
    if (mediaUrls.length + files.length > 10) {
      setErrorMessage(
        locale === 'bn'
          ? 'সর্বোচ্চ ১০টি ছবি যুক্ত করা যাবে।'
          : 'You can attach a maximum of 10 photos.'
      );
      return;
    }

    setIsUploadingMedia(true);
    setErrorMessage(null);

    try {
      const newUrls = await uploadsApi.uploadMultipleImages(files);
      if (newUrls.length > 0) {
        setMediaUrls((prev) => [...prev, ...newUrls]);
      } else {
        setErrorMessage(
          locale === 'bn'
            ? 'ছবি আপলোড করা সম্ভব হয়নি।'
            : 'Failed to upload images.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        formatUserFacingError(
          err,
          locale === 'bn'
            ? 'ছবি আপলোড করতে ব্যর্থ হয়েছে।'
            : 'Failed to upload photos.',
          locale
        )
      );
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handlePickImages = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp,image/gif';
      input.multiple = true;
      input.onchange = async (e: any) => {
        const files = e.target?.files;
        if (!files || files.length === 0) return;
        await uploadFiles(Array.from(files));
      };
      input.click();
    }
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!isPostValid || isSubmitting || isUploadingMedia) return;

    // Capture snapshot of form inputs before immediate close & reset
    const pIsEditing = isEditing;
    const pEditingPost = composerEditingPost;
    const pType = postType;
    const pContent = content.trim();
    const pMediaUrls = [...mediaUrls];
    const pMediaLayout = mediaLayout;
    const pFeeling = feeling;
    const pDuaTitle = duaTitle.trim();
    const pDuaMeaning = duaMeaning.trim();
    const pDuaTransliteration = duaTransliteration.trim();
    const pDuaFadilah = duaFadilah.trim();
    const pDuaArabicText = duaArabicText.trim();
    const pForMyself = forMyself;
    const pPatientName = (pForMyself ? user?.name || patientName : patientName).trim();
    const pBloodGroup = bloodGroup;
    const pUnits = units;
    const pHospitalName = hospitalName.trim();
    const pLocationValue = { ...locationValue };
    const pContactNumber = contactNumber.trim();
    const pAlternateContact = alternateContact.trim();
    const pNeededDate = neededDate;
    const pProblem = problem.trim();
    const pBloodNote = bloodNote.trim();

    // 1. Immediately close composer modal just like frontend
    setIsSubmitting(true);
    setIsUploadingPost(
      true,
      pIsEditing
        ? 'UPDATE'
        : pType === 'BLOOD_REQUEST'
        ? 'BLOOD'
        : 'STANDARD'
    );
    handleClose();

    // 2. Perform upload & post creation in the background
    (async () => {
      try {
        if (pIsEditing && pEditingPost) {
          if (pType === 'DUA') {
            await updatePost(pEditingPost.id, {
              type: 'DUA',
              content: pDuaTitle ? `🌙 ${pDuaTitle}` : undefined,
              feeling: pFeeling || undefined,
              duaData: {
                title: pDuaTitle || undefined,
                meaning: pDuaMeaning,
                transliteration: pDuaTransliteration || undefined,
                fadilah: pDuaFadilah || undefined,
                arabicText: pDuaArabicText || undefined,
              },
            });
          } else if (pType === 'BLOOD_REQUEST') {
            const fullProblem = [
              pProblem,
              pBloodNote ? `Note: ${pBloodNote}` : '',
            ]
              .filter(Boolean)
              .join(' - ');

            await updatePost(pEditingPost.id, {
              type: 'BLOOD_REQUEST',
              content: pContent || (fullProblem ? `🩸 ${fullProblem}` : undefined),
              feeling: pFeeling || undefined,
              bloodRequestData: {
                patientName: pPatientName,
                forMyself: pForMyself,
                bloodGroup: pBloodGroup,
                units: Math.max(1, parseInt(pUnits, 10) || 1),
                hospitalName: pHospitalName,
                country: pLocationValue.country || 'Bangladesh',
                countryCode: pLocationValue.countryCode || 'BD',
                state: pLocationValue.state,
                city: pLocationValue.city,
                location: pLocationValue.location.trim() || pHospitalName,
                contactNumber: pContactNumber,
                alternateContact: pAlternateContact || undefined,
                neededDate: pNeededDate ? new Date(pNeededDate).toISOString() : new Date().toISOString(),
                problem: pProblem || undefined,
                note: pBloodNote || undefined,
              },
            });
          } else {
            await updatePost(pEditingPost.id, {
              type: 'TEXT',
              content: pContent || undefined,
              feeling: pFeeling || undefined,
              mediaUrls: pMediaUrls,
              mediaLayout: pMediaUrls.length > 1 ? pMediaLayout : 'COLLAGE',
            });
          }
        } else if (pType === 'TEXT') {
          await createPost({
            type: 'TEXT',
            content: pContent || undefined,
            mediaUrls: pMediaUrls.length > 0 ? pMediaUrls : undefined,
            mediaLayout: pMediaUrls.length > 1 ? pMediaLayout : 'COLLAGE',
            feeling: pFeeling || undefined,
            visibility: 'PUBLIC',
            status: 'PUBLISHED',
          });
        } else if (pType === 'DUA') {
          await createPost({
            type: 'DUA',
            content: pDuaTitle ? `🌙 ${pDuaTitle}` : undefined,
            feeling: pFeeling || undefined,
            visibility: 'PUBLIC',
            status: 'PUBLISHED',
            duaData: {
              title: pDuaTitle || undefined,
              meaning: pDuaMeaning,
              transliteration: pDuaTransliteration || undefined,
              fadilah: pDuaFadilah || undefined,
              arabicText: pDuaArabicText || undefined,
            },
          });
        } else if (pType === 'BLOOD_REQUEST') {
          const fullProblem = [
            pProblem,
            pBloodNote ? `Note: ${pBloodNote}` : '',
          ]
            .filter(Boolean)
            .join(' - ');

          await createPost({
            type: 'BLOOD_REQUEST',
            content: pContent || (fullProblem ? `🩸 ${fullProblem}` : undefined),
            feeling: pFeeling || undefined,
            visibility: 'PUBLIC',
            status: 'PUBLISHED',
            bloodRequestData: {
              patientName: pPatientName,
              forMyself: pForMyself,
              bloodGroup: pBloodGroup,
              units: Math.max(1, parseInt(pUnits, 10) || 1),
              hospitalName: pHospitalName,
              country: pLocationValue.country || 'Bangladesh',
              countryCode: pLocationValue.countryCode || 'BD',
              state: pLocationValue.state,
              city: pLocationValue.city,
              location: pLocationValue.location.trim() || pHospitalName,
              contactNumber: pContactNumber,
              alternateContact: pAlternateContact || undefined,
              neededDate: pNeededDate ? new Date(pNeededDate).toISOString() : new Date().toISOString(),
              problem: pProblem || undefined,
              note: pBloodNote || undefined,
            },
          });
        }

        // Trigger success animation on bottom nav bar
        triggerPostSuccess();
        showToast({
          message:
            locale === 'bn'
              ? pIsEditing
                ? 'পোস্টটি সফলভাবে আপডেট করা হয়েছে!'
                : 'পোস্টটি সফলভাবে তৈরি হয়েছে!'
              : pIsEditing
              ? 'Post updated successfully!'
              : 'Post created successfully!',
          type: 'success',
        });
      } catch (err: any) {
        setIsUploadingPost(false);
        const msg = formatUserFacingError(
          err,
          locale === 'bn'
            ? pIsEditing
              ? 'পোস্টটি আপডেট করা সম্ভব হয়নি।'
              : 'পোস্টটি প্রকাশ করা সম্ভব হয়নি।'
            : pIsEditing
            ? 'Failed to update post. Please try again.'
            : 'Failed to create post. Please try again.',
          locale
        );
        console.error('Failed to create post in background:', err);
        showToast({
          message: msg,
          type: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  // Circular character progress ring
  const charLimit = 5000;
  const charLength = content.length;
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(charLength / charLimit, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Modal
      visible={isComposerModalOpen}
      animationType="slide"
      onRequestClose={handleClose}>
      <View className="flex-1 bg-white dark:bg-[#18191a]">
        {/* ────────────────── 1. TOP HEADER ────────────────── */}
        <View className="flex-row items-center justify-between px-3.5 h-14 border-b border-[#e4e6eb] dark:border-[#2d2e2f] bg-white dark:bg-[#18191a]">
          <Pressable
            onPress={handleClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#2d2e2f] active:scale-95">
            <AppIcon
              android="close"
              ios="xmark"
              size={20}
              color={theme === 'dark' ? '#e4e6eb' : '#050505'}
            />
          </Pressable>

          <View className="flex-row items-center gap-1.5">
            <AppIcon
              android={isEditing ? 'edit' : 'auto_awesome'}
              ios={isEditing ? 'pencil' : 'sparkles'}
              size={16}
              color={
                isEditing
                  ? postType === 'BLOOD_REQUEST'
                    ? '#e11d48'
                    : postType === 'DUA'
                    ? '#059669'
                    : '#1877f2'
                  : '#1877f2'
              }
            />
            <Text className="font-bold text-sm text-[#050505] dark:text-[#e4e6eb]">
              {isEditing
                ? postType === 'BLOOD_REQUEST'
                  ? locale === 'bn'
                    ? 'রক্তের অনুরোধ সম্পাদনা'
                    : 'Edit Blood Request'
                  : postType === 'DUA'
                  ? locale === 'bn'
                    ? 'পবিত্র দু’আ সম্পাদনা'
                    : 'Edit Dua Post'
                  : locale === 'bn'
                    ? 'পোস্ট সম্পাদনা'
                    : 'Edit Post'
                : locale === 'bn'
                  ? 'নতুন পোস্ট'
                  : 'Create Post'}
            </Text>
          </View>

          <Pressable
            disabled={!isPostValid || isSubmitting || isUploadingMedia}
            onPress={handleSubmit}
            className={`flex-row items-center justify-center gap-1.5 px-4 py-1.5 rounded-full active:scale-95 ${
              isPostValid && !isSubmitting && !isUploadingMedia
                ? postType === 'BLOOD_REQUEST'
                  ? 'bg-rose-600'
                  : postType === 'DUA'
                    ? 'bg-emerald-600'
                    : 'bg-primary-500'
                : 'bg-gray-100 dark:bg-gray-800 opacity-60'
            }`}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <AppIcon
                  android={isEditing ? 'check' : 'send'}
                  ios={isEditing ? 'checkmark' : 'paperplane.fill'}
                  size={14}
                  color={isPostValid ? '#ffffff' : '#9ca3af'}
                />
                <Text
                  className={`text-xs font-bold ${
                    isPostValid
                      ? 'text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                  {isEditing
                    ? locale === 'bn'
                      ? 'আপডেট'
                      : 'Update'
                    : locale === 'bn'
                      ? 'পোস্ট'
                      : 'Post'}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ────────────────── 2. POST TYPE SEGMENTED ROW (Only when creating new post) ────────────────── */}
        {!isEditing && (
          <View className="px-4 py-2.5 border-b border-[#e4e6eb]/60 dark:border-[#2d2e2f] bg-[#fbfbfb] dark:bg-[#1f2022]">
            <View className="flex-row gap-1.5 p-1 rounded-2xl bg-[#f0f2f5] dark:bg-[#2a2b2d]">
            <Pressable
              onPress={() => {
                setPostType('TEXT');
                setErrorMessage(null);
              }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-xl ${
                postType === 'TEXT' ? 'bg-white dark:bg-[#18191a]' : ''
              }`}>
              <AppIcon
                android="edit"
                size={14}
                color={postType === 'TEXT' ? '#1565d8' : '#65676b'}
              />
              <Text
                className={`text-xs font-bold ${
                  postType === 'TEXT'
                    ? 'text-primary-600 dark:text-primary-300'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {locale === 'bn' ? 'ভাবনা / সাধারণ' : 'Reflection'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setPostType('DUA');
                setErrorMessage(null);
              }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-xl ${
                postType === 'DUA' ? 'bg-white dark:bg-[#18191a]' : ''
              }`}>
              <AppIcon
                android="menu_book"
                size={14}
                color={postType === 'DUA' ? '#059669' : '#65676b'}
              />
              <Text
                className={`text-xs font-bold ${
                  postType === 'DUA'
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {locale === 'bn' ? 'পবিত্র দু’আ' : 'Dua'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setPostType('BLOOD_REQUEST');
                setErrorMessage(null);
              }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-xl ${
                postType === 'BLOOD_REQUEST' ? 'bg-white dark:bg-[#18191a]' : ''
              }`}>
              <AppIcon
                android="water_drop"
                size={14}
                color={postType === 'BLOOD_REQUEST' ? '#e11d48' : '#65676b'}
              />
              <Text
                className={`text-xs font-bold ${
                  postType === 'BLOOD_REQUEST'
                    ? 'text-rose-600 dark:text-rose-300'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {locale === 'bn' ? 'রক্তদান' : 'Blood'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

        {/* ────────────────── 3. SCROLLABLE WRITING CANVAS ────────────────── */}
        <ScrollView
          className="flex-1 px-4 py-3.5"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled">
          {/* Error Message */}
          {errorMessage && (
            <View className="mb-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900/50 px-3.5 py-2.5 flex-row items-center gap-2">
              <AppIcon android="info" size={16} color="#e11d48" />
              <Text className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex-1">
                {errorMessage}
              </Text>
            </View>
          )}

          {/* User Identity & Feeling Badge Row */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2.5">
              <UserAvatar
                avatarUrl={user?.avatarUrl || (user as any)?.avatar}
                name={user?.name || 'PeaceTweet User'}
                size="md"
              />
              <View>
                <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {user?.name || 'PeaceTweet User'}
                </Text>
                <View className="flex-row items-center gap-1.5 mt-0.5 flex-wrap">
                  <View className="flex-row items-center gap-1 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-full border border-primary-200/50 dark:border-primary-900/50">
                    <AppIcon android="public" size={11} color="#1054be" />
                    <Text className="text-[11px] font-semibold text-primary-700 dark:text-primary-300">
                      Public
                    </Text>
                  </View>

                  {selectedFeeling && (
                    <View className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-900/60">
                      <Text className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        {selectedFeeling.emoji}{' '}
                        {locale === 'bn'
                          ? selectedFeeling.labelBn
                          : selectedFeeling.label}
                      </Text>
                      <Pressable
                        onPress={() => setFeeling(null)}
                        className="ml-0.5 p-0.5 active:opacity-60">
                        <AppIcon
                          android="close"
                          ios="xmark"
                          size={10}
                          color="#b45309"
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* ────────────── MODE 1: REFLECTION / TEXT ────────────── */}
          {postType === 'TEXT' && (
            <View className="gap-2.5 flex-1">
              <TextInput
                ref={contentInputRef}
                value={content}
                onChangeText={handleContentChange}
                multiline
                scrollEnabled={false}
                onContentSizeChange={(e) => {
                  const h = e.nativeEvent?.contentSize?.height;
                  const minH = mediaUrls.length > 0 ? 36 : 52;
                  if (h && h > 0) {
                    setContentHeight(Math.max(minH, Math.ceil(h)));
                  }
                }}
                placeholder={
                  locale === 'bn'
                    ? 'আপনার ভাবনা, কুরআন-হাদিসের সুন্দর নসিহত বা দোয়া শেয়ার করুন...'
                    : "What's on your mind? Share a reflection, reminder, or story..."
                }
                placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                style={{
                  minHeight: mediaUrls.length > 0 ? 36 : 52,
                  height: Math.max(mediaUrls.length > 0 ? 36 : 52, contentHeight),
                  fontSize: isShortText ? 22 : 16,
                  lineHeight: isShortText ? 30 : 22,
                  width: '100%',
                  outlineStyle: 'none',
                  borderWidth: 0,
                  padding: 0,
                  margin: 0,
                  ...(Platform.OS === 'web'
                    ? {
                        resize: 'none',
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                      }
                    : {}),
                } as any}
                className="w-full text-[#050505] dark:text-[#e4e6eb]"
                textAlignVertical="top"
              />

              {/* Attached Photos Live Feed Preview */}
              {mediaUrls.length > 0 && (
                <View
                  onLayout={(e) =>
                    setMediaContainerWidth(Math.round(e.nativeEvent.layout.width))
                  }
                  className="w-full gap-2 mt-1">
                  {/* Gallery Controls (Only when 2+ photos attached) */}
                  {mediaUrls.length > 1 && (
                    <View className="flex-row items-center justify-between px-0.5 pb-0.5">
                      <View className="flex-row items-center gap-1 rounded-full bg-[#f0f2f5] dark:bg-[#2a2b2d] p-0.5">
                        <Pressable
                          onPress={() => setMediaLayout('COLLAGE')}
                          className={`flex-row items-center gap-1 rounded-full px-2.5 py-0.5 ${
                            mediaLayout === 'COLLAGE'
                              ? 'bg-white dark:bg-[#18191a] shadow-xs'
                              : ''
                          }`}>
                          <AppIcon
                            android="layers"
                            size={11}
                            color={mediaLayout === 'COLLAGE' ? '#1877f2' : '#65676b'}
                          />
                          <Text
                            className={`text-[11px] font-semibold ${
                              mediaLayout === 'COLLAGE'
                                ? 'text-primary-600 dark:text-primary-300'
                                : 'text-[#65676b] dark:text-[#b0b3b8]'
                            }`}>
                            {locale === 'bn' ? 'কোলাজ' : 'Collage'}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setMediaLayout('SWIPE')}
                          className={`flex-row items-center gap-1 rounded-full px-2.5 py-0.5 ${
                            mediaLayout === 'SWIPE'
                              ? 'bg-white dark:bg-[#18191a] shadow-xs'
                              : ''
                          }`}>
                          <AppIcon
                            android="more_horiz"
                            size={11}
                            color={mediaLayout === 'SWIPE' ? '#1877f2' : '#65676b'}
                          />
                          <Text
                            className={`text-[11px] font-semibold ${
                              mediaLayout === 'SWIPE'
                                ? 'text-primary-600 dark:text-primary-300'
                                : 'text-[#65676b] dark:text-[#b0b3b8]'
                            }`}>
                            {locale === 'bn' ? 'স্লাইড' : 'Swipe'}
                          </Text>
                        </Pressable>
                      </View>

                      <Text className="text-[11px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                        {mediaUrls.length}/10
                      </Text>
                    </View>
                  )}

                  {/* ─── LIVE FEED MEDIA PREVIEW ─── */}
                  {/* Case 1: SWIPE Carousel */}
                  {mediaLayout === 'SWIPE' && mediaUrls.length > 1 ? (
                    <View className="w-full rounded-2xl overflow-hidden relative bg-[#e4e6eb] dark:bg-[#2d2e2f]">
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                          const w = mediaContainerWidth > 0 ? mediaContainerWidth : 1;
                          const idx = Math.min(
                            mediaUrls.length - 1,
                            Math.max(0, Math.round(e.nativeEvent.contentOffset.x / w))
                          );
                          setSwipeActiveIdx(idx);
                        }}>
                        {mediaUrls.map((url, idx) => (
                          <View
                            key={`${url}-${idx}`}
                            style={{
                              width: mediaContainerWidth > 0 ? mediaContainerWidth : 320,
                              aspectRatio: 4 / 3,
                            }}
                            className="relative bg-[#e4e6eb] dark:bg-[#2d2e2f]">
                            <Image
                              source={{ uri: url }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                            <Pressable
                              onPress={() => removeMediaUrl(idx)}
                              className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/75 items-center justify-center active:scale-90 shadow-md z-10"
                              accessibilityLabel="Remove photo">
                              <AppIcon
                                android="close"
                                ios="xmark"
                                size={14}
                                color="#ffffff"
                              />
                            </Pressable>
                          </View>
                        ))}
                      </ScrollView>
                      <View className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 z-10 pointer-events-none">
                        <Text className="text-[11px] font-bold text-white">
                          {swipeActiveIdx + 1} / {mediaUrls.length}
                        </Text>
                      </View>
                    </View>
                  ) : mediaUrls.length === 1 ? (
                    /* Case 2: Exactly 1 Image (Natural Aspect Ratio up to 520px, matches feed SingleFeedImage) */
                    <ComposerSingleImage
                      uri={mediaUrls[0]}
                      onRemove={() => removeMediaUrl(0)}
                    />
                  ) : mediaUrls.length === 2 ? (
                    /* Case 3: Exactly 2 Images (Side by Side 1:1, matches feed 2-image layout) */
                    <View className="w-full flex-row gap-1.5 rounded-2xl overflow-hidden">
                      {mediaUrls.map((url, idx) => (
                        <View
                          key={`${url}-${idx}`}
                          style={{ flex: 1, aspectRatio: 1 }}
                          className="relative rounded-xl overflow-hidden bg-[#e4e6eb] dark:bg-[#2d2e2f]">
                          <Image
                            source={{ uri: url }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                          <Pressable
                            onPress={() => removeMediaUrl(idx)}
                            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/75 items-center justify-center active:scale-90 shadow-md z-10"
                            accessibilityLabel="Remove photo">
                            <AppIcon
                              android="close"
                              ios="xmark"
                              size={12}
                              color="#ffffff"
                            />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    /* Case 4: 3+ Images Collage (Hero 16:9 + 3 row thumbnails, matches feed collage) */
                    <View className="w-full gap-1.5 rounded-2xl overflow-hidden">
                      {/* Hero Image */}
                      <View
                        style={{ width: '100%', aspectRatio: 16 / 9 }}
                        className="relative rounded-xl overflow-hidden bg-[#e4e6eb] dark:bg-[#2d2e2f]">
                        <Image
                          source={{ uri: mediaUrls[0] }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                        <Pressable
                          onPress={() => removeMediaUrl(0)}
                          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/75 items-center justify-center active:scale-90 shadow-md z-10"
                          accessibilityLabel="Remove photo">
                          <AppIcon
                            android="close"
                            ios="xmark"
                            size={12}
                            color="#ffffff"
                          />
                        </Pressable>
                      </View>

                      {/* Row of 3 Thumbnails */}
                      <View className="flex-row gap-1.5">
                        {mediaUrls.slice(1, 4).map((url, sliceIdx) => {
                          const realIdx = sliceIdx + 1;
                          const isLast = sliceIdx === 2;
                          const extraCount = mediaUrls.length - 4;

                          return (
                            <View
                              key={`${url}-${realIdx}`}
                              style={{ flex: 1, aspectRatio: 1 }}
                              className="relative rounded-xl overflow-hidden bg-[#e4e6eb] dark:bg-[#2d2e2f]">
                              <Image
                                source={{ uri: url }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                              />

                              {/* Remove Button */}
                              <Pressable
                                onPress={() => removeMediaUrl(realIdx)}
                                className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/75 items-center justify-center active:scale-90 shadow-md z-10"
                                accessibilityLabel="Remove photo">
                                <AppIcon
                                  android="close"
                                  ios="xmark"
                                  size={11}
                                  color="#ffffff"
                                />
                              </Pressable>

                              {/* Overlay for +N photos */}
                              {isLast && extraCount > 0 && (
                                <View className="absolute inset-0 bg-black/55 items-center justify-center pointer-events-none">
                                  <Text className="text-lg font-black text-white">
                                    +{extraCount}
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Thumbnail management strip for when there are more than 4 photos */}
                  {mediaUrls.length > 4 && (
                    <View className="gap-1.5 pt-1">
                      <Text className="text-[11px] font-medium text-[#65676b] dark:text-[#b0b3b8]">
                        {locale === 'bn'
                          ? `সবগুলো ছবি (${mediaUrls.length}টি) — মুছে ফেলতে ✕ চাপুন:`
                          : `All attached photos (${mediaUrls.length}) — tap ✕ to remove:`}
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}>
                        {mediaUrls.map((url, idx) => (
                          <View
                            key={`strip-${url}-${idx}`}
                            className="h-14 w-14 rounded-lg overflow-hidden relative border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                            <Image
                              source={{ uri: url }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                            <Pressable
                              onPress={() => removeMediaUrl(idx)}
                              className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/75 items-center justify-center active:scale-90"
                              accessibilityLabel="Remove photo">
                              <AppIcon
                                android="close"
                                ios="xmark"
                                size={10}
                                color="#ffffff"
                              />
                            </Pressable>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ────────────── MODE 2: DUA ────────────── */}
          {postType === 'DUA' && (
            <View className="gap-3.5">
              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'দু’আর নাম বা বিষয়' : 'Dua Title / Theme'}
                </Text>
                <TextInput
                  value={duaTitle}
                  onChangeText={setDuaTitle}
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: অন্তরের প্রশান্তির দু’আ'
                      : 'e.g. Supplication for Inner Peace'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-sm text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              <View className="gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn'
                      ? 'বাংলা অর্থ / অনুবাদ *'
                      : 'Bangla Meaning (Required) *'}
                  </Text>
                  <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    Required
                  </Text>
                </View>
                <TextInput
                  value={duaMeaning}
                  onChangeText={setDuaMeaning}
                  multiline
                  scrollEnabled={false}
                  placeholder={
                    locale === 'bn'
                      ? 'দু’আটির অর্থ সুন্দরভাবে বাংলায় লিখুন...'
                      : 'Write the translation / meaning...'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  style={{
                    minHeight: 90,
                    outlineStyle: 'none',
                    ...(Platform.OS === 'web'
                      ? { resize: 'none', overflow: 'hidden' }
                      : {}),
                  } as any}
                  className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] p-3 text-sm text-[#050505] dark:text-[#e4e6eb]"
                  textAlignVertical="top"
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn'
                    ? 'বাংলা উচ্চারণ (Transliteration)'
                    : 'Pronunciation in Bengali'}
                </Text>
                <TextInput
                  value={duaTransliteration}
                  onChangeText={setDuaTransliteration}
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: আল্লাহুম্মা ইন্নি আসআলুকাল আফওয়া...'
                      : 'Transliteration in Bengali'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-sm text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn'
                    ? 'আরবি টেক্সট (Arabic Text)'
                    : 'Arabic Text'}
                </Text>
                <TextInput
                  value={duaArabicText}
                  onChangeText={setDuaArabicText}
                  placeholder="اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ"
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-right text-base text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn'
                    ? 'ফজিলত ও হাদিস রেফারেন্স'
                    : 'Virtue & Hadith Reference'}
                </Text>
                <TextInput
                  value={duaFadilah}
                  onChangeText={setDuaFadilah}
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: তিরমিযী, হাদিস নং ৩৪৫৬'
                      : 'e.g. Tirmidhi Hadith #3456'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2.5 text-sm text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>
            </View>
          )}

          {/* ────────────── MODE 3: BLOOD REQUEST ────────────── */}
          {postType === 'BLOOD_REQUEST' && (
            <View className="gap-4">
              {/* Blood Group Chips */}
              <View className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn'
                      ? 'রক্তের গ্রুপ নির্বাচন করুন *'
                      : 'Blood Group *'}
                  </Text>
                  <Text className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                    Emergency
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {BLOOD_GROUPS.map((group) => (
                    <Pressable
                      key={group.value}
                      onPress={() => setBloodGroup(group.value)}
                      className={`w-[23%] py-2.5 rounded-2xl border items-center active:scale-95 ${
                        bloodGroup === group.value
                          ? 'bg-rose-600 border-rose-600'
                          : 'bg-[#f8f9fa] dark:bg-[#242526] border-[#e4e6eb] dark:border-[#393a3b]'
                      }`}>
                      <Text
                        className={`text-xs font-black ${
                          bloodGroup === group.value
                            ? 'text-white'
                            : 'text-[#050505] dark:text-[#e4e6eb]'
                        }`}>
                        {group.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {forMyself && !user?.bloodGroup && (
                  <Text className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                    {locale === 'bn'
                      ? '⚠️ প্রোফাইলে রক্তের গ্রুপ যুক্ত নেই, এখান থেকে বেছে নিন'
                      : '⚠️ Blood group not set in your profile, please select here'}
                  </Text>
                )}
              </View>

              {/* Patient Name with "For myself" button */}
              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'রোগীর নাম *' : 'Patient Name *'}
                </Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={forMyself ? user?.name || patientName : patientName}
                    onChangeText={(val) => {
                      if (forMyself) setForMyself(false);
                      setPatientName(val);
                    }}
                    placeholder={
                      locale === 'bn' ? 'রোগীর পূর্ণ নাম' : 'Patient Full Name'
                    }
                    placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                    className="flex-1 rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                  />
                  <Pressable
                    onPress={() => {
                      setForMyself((prev) => {
                        const next = !prev;
                        if (next && user) {
                          if (user.name) setPatientName(user.name);
                          if (user.bloodGroup) {
                            const bgVal = mapToBloodGroupValue(user.bloodGroup);
                            if (bgVal) setBloodGroup(bgVal);
                          }
                          const userGeo = matchUserLocationToGeo(user);
                          if (userGeo.location) setLocationValue(userGeo);
                        }
                        return next;
                      });
                    }}
                    className={`flex-row items-center justify-center gap-1.5 px-3 py-2 rounded-xl border active:scale-95 ${
                      forMyself
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60'
                        : 'border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b]'
                    }`}>
                    <AppIcon
                      android={forMyself ? 'check_box' : 'check_box_outline_blank'}
                      size={16}
                      color={forMyself ? '#e11d48' : '#65676b'}
                    />
                    <Text
                      className={`text-xs font-bold ${
                        forMyself
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-[#050505] dark:text-[#e4e6eb]'
                      }`}>
                      {locale === 'bn' ? 'নিজের জন্য' : 'For myself'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Units (Bags) */}
              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'কত ব্যাগ রক্ত প্রয়োজন *' : 'Units (Bags) Needed *'}
                </Text>
                <TextInput
                  value={units}
                  onChangeText={(val) => {
                    const cleaned = val.replace(/[^0-9]/g, '');
                    setUnits(cleaned);
                  }}
                  onBlur={() => {
                    if (!units || parseInt(units, 10) < 1) {
                      setUnits('1');
                    }
                  }}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              {/* Hospital Name */}
              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'হাসপাতালের নাম *' : 'Hospital Name *'}
                </Text>
                <TextInput
                  value={hospitalName}
                  onChangeText={setHospitalName}
                  placeholder={
                    locale === 'bn'
                      ? 'উদা: ঢাকা মেডিকেল কলেজ হাসপাতাল'
                      : 'e.g. Dhaka Medical College Hospital'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              {/* Cascading Location Selector (Division, District, Upazila, Area) */}
              <View className="gap-1.5">
                <View className="flex-row items-center gap-1.5">
                  <AppIcon android="pin_drop" size={15} color="#e11d48" />
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn'
                      ? 'রক্তের প্রয়োজনস্থল (লোকেশন) *'
                      : 'Location of Blood Need *'}
                  </Text>
                </View>
                <LocationSelector
                  value={locationValue}
                  onChange={setLocationValue}
                  required={true}
                />
              </View>

              {/* Contact Numbers (Row) */}
              <View className="flex-row gap-2.5">
                <View className="flex-1 gap-1">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn' ? 'মোবাইল নম্বর *' : 'Contact Phone *'}
                  </Text>
                  <TextInput
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    placeholder="017XXXXXXXX"
                    keyboardType="phone-pad"
                    placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                    className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                  />
                </View>

                <View className="flex-1 gap-1">
                  <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'bn' ? 'বিকল্প নম্বর (ঐচ্ছিক)' : 'Alternate Phone'}
                  </Text>
                  <TextInput
                    value={alternateContact}
                    onChangeText={setAlternateContact}
                    placeholder="018XXXXXXXX"
                    keyboardType="phone-pad"
                    placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                    className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                  />
                </View>
              </View>

              {/* Needed Date & Time Picker */}
              <View className="gap-1">
                <DateTimePicker
                  label={
                    locale === 'bn'
                      ? 'কখন রক্তের প্রয়োজন? (তারিখ ও সময়) *'
                      : 'Needed Date & Time *'
                  }
                  value={neededDate}
                  onChange={setNeededDate}
                  required={true}
                />
              </View>

              {/* Problem / Reason */}
              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'রোগের কারণ বা সমস্যা (ঐচ্ছিক)' : 'Medical Reason / Problem (Optional)'}
                </Text>
                <TextInput
                  value={problem}
                  onChangeText={setProblem}
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: ডেলিভারি রোগী, রক্তের হিমোগ্লোবিন কমে গেছে'
                      : 'e.g. Delivery patient, low hemoglobin'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>

              {/* Additional Note */}
              <View className="gap-1">
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {locale === 'bn' ? 'অতিরিক্ত তথ্য (ঐচ্ছিক)' : 'Additional Note (Optional)'}
                </Text>
                <TextInput
                  value={bloodNote}
                  onChangeText={setBloodNote}
                  placeholder={
                    locale === 'bn'
                      ? 'যেমন: রোগীর অবস্থা আশঙ্কাজনক বা দ্রুত যোগাযোগ করুন'
                      : 'e.g. Please call only if you can donate'
                  }
                  placeholderTextColor={theme === 'dark' ? '#6e6e73' : '#8e8e93'}
                  className="w-full rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] dark:bg-[#242526] dark:border-[#393a3b] px-3.5 py-2 text-xs text-[#050505] dark:text-[#e4e6eb]"
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ────────────────── 4. FIXED BOTTOM ACCESSORY TOOLBAR ────────────────── */}
        <View className="h-14 border-t border-[#e4e6eb] dark:border-[#2d2e2f] bg-white dark:bg-[#18191a] px-4 flex-row items-center justify-between select-none">
          {/* Left: Quick Action Buttons */}
          <View className="flex-row items-center gap-2">
            {/* Photo Button (Active in TEXT mode) */}
            {postType === 'TEXT' && (
              <Pressable
                onPress={handlePickImages}
                disabled={isUploadingMedia || mediaUrls.length >= 10}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border active:scale-95 ${
                  mediaUrls.length > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/50'
                }`}>
                {isUploadingMedia ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <AppIcon android="image" ios="photo" size={16} color="#059669" />
                )}
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {isUploadingMedia
                    ? locale === 'bn'
                      ? 'আপলোড হচ্ছে...'
                      : 'Uploading...'
                    : locale === 'bn'
                      ? 'ছবি যুক্ত'
                      : 'Photo'}
                </Text>
                {mediaUrls.length > 0 && (
                  <View className="h-4 w-4 items-center justify-center rounded-full bg-emerald-600">
                    <Text className="text-[10px] font-bold text-white">
                      {mediaUrls.length}
                    </Text>
                  </View>
                )}
              </Pressable>
            )}

            {/* Feeling Button */}
            <Pressable
              onPress={() => setShowFeelingPicker(true)}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border active:scale-95 ${
                selectedFeeling
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800'
                  : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/50'
              }`}>
              <AppIcon
                android="sentiment_satisfied"
                ios="face.smiling"
                size={16}
                color="#d97706"
              />
              <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {selectedFeeling
                  ? locale === 'bn'
                    ? `${selectedFeeling.emoji} ${selectedFeeling.labelBn}`
                    : `${selectedFeeling.emoji} ${selectedFeeling.label}`
                  : locale === 'bn'
                    ? 'অনুভূতি'
                    : 'Feeling'}
              </Text>
            </Pressable>
          </View>

          {/* Right: Counter Ring / Mode Label */}
          <View className="flex-row items-center gap-2">
            {postType === 'TEXT' && (
              <View className="flex-row items-center gap-1.5">
                <Svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Circle
                    cx={12}
                    cy={12}
                    r={radius}
                    stroke={theme === 'dark' ? '#3a3b3c' : '#e4e6eb'}
                    strokeWidth={2.5}
                    fill="transparent"
                  />
                  <Circle
                    cx={12}
                    cy={12}
                    r={radius}
                    stroke={
                      progress > 0.9
                        ? '#ef4444'
                        : progress > 0.7
                          ? '#f59e0b'
                          : '#1877f2'
                    }
                    strokeWidth={2.5}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </Svg>
                <Text className="text-[11px] font-bold text-[#8e8e93] dark:text-[#a0a0a5]">
                  {charLength > 4500
                    ? charLimit - charLength
                    : `${charLength}/${charLimit}`}
                </Text>
              </View>
            )}

            {postType === 'DUA' && (
              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {locale === 'bn' ? '🌙 পবিত্র দু’আ' : '🌙 Authentic Dua'}
              </Text>
            )}

            {postType === 'BLOOD_REQUEST' && (
              <Text className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                {locale === 'bn' ? '🩸 রক্তদানের আবেদন' : '🩸 Blood Request'}
              </Text>
            )}
          </View>
        </View>

        {/* ────────────── FEELINGS CENTERED MODAL DIALOGUE ────────────── */}
        <Modal
          visible={showFeelingPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFeelingPicker(false)}>
          <Pressable
            onPress={() => setShowFeelingPicker(false)}
            className="flex-1 bg-black/60 items-center justify-center p-4">
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-[#e4e6eb] bg-white p-4 shadow-2xl dark:border-[#393a3b] dark:bg-[#242526]">
              {/* Dialog Header */}
              <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-[#e4e6eb] dark:border-[#393a3b]">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
                    <AppIcon
                      android="sentiment_satisfied"
                      ios="face.smiling"
                      size={18}
                      color="#d97706"
                    />
                  </View>
                  <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn'
                      ? 'কেমন অনুভব করছেন?'
                      : 'How are you feeling?'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowFeelingPicker(false)}
                  className="p-1 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <AppIcon
                    android="close"
                    ios="xmark"
                    size={18}
                    color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                  />
                </Pressable>
              </View>

              {/* 12 Feelings Grid */}
              <ScrollView style={{ maxHeight: 300 }}>
                <View className="flex-row flex-wrap gap-2">
                  {FEELINGS.map((item) => {
                    const isSelected = feeling === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setFeeling(item.id);
                          setShowFeelingPicker(false);
                        }}
                        className={`w-[48%] flex-row items-center gap-2 p-2.5 rounded-2xl border active:scale-95 ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:border-amber-700'
                            : 'bg-[#f8f9fa] dark:bg-[#18191a] border-[#e4e6eb]/60 dark:border-[#393a3b]/60'
                        }`}>
                        <Text className="text-lg">{item.emoji}</Text>
                        <Text
                          className={`text-xs font-semibold capitalize ${
                            isSelected
                              ? 'text-amber-900 dark:text-amber-200'
                              : 'text-[#050505] dark:text-[#e4e6eb]'
                          }`}>
                          {locale === 'bn' ? item.labelBn : item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Clear Feeling Option */}
              {feeling && (
                <View className="mt-3 pt-3 border-t border-[#e4e6eb] dark:border-[#393a3b] items-end">
                  <Pressable
                    onPress={() => {
                      setFeeling(null);
                      setShowFeelingPicker(false);
                    }}>
                    <Text className="text-xs font-bold text-rose-600">
                      {locale === 'bn' ? 'অনুভূতি মুছুন' : 'Remove Feeling'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}
