import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  Keyboard,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useUi, ComposerMode } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { LocationValue } from '@/components/ui/LocationSelector';
import { matchUserLocationToGeo } from '@/constants/bangladeshGeo';
import { uploadsApi } from '@/features/uploads/api/uploads.api';
import { getFeelingById } from '@/features/feed/constants/feelings';
import { formatUserFacingError } from '@/lib/utils/errorUtils';
import {
  PostBackgroundOption,
  getPostBackgroundById,
} from '@/features/feed/constants/postBackgrounds';
import {
  MobileTextComposer,
  MobileDuaComposer,
  MobileBloodComposer,
  ComposerHeader,
  ComposerBottomBar,
  ComposerFeelingsModal,
  ComposerBackgroundSheetModal,
  mapToBloodGroupValue,
} from './composer';

export function MobileComposerModal() {
  const insets = useSafeAreaInsets();
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

  // Keyboard visibility & height tracker for Android & iOS
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch {}
      setIsKeyboardVisible(true);
      setKeyboardHeight(e?.endCoordinates?.height || 0);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch {}
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isEditing = Boolean(composerEditingPost);

  // Mode & Content
  const [postType, setPostType] = useState<ComposerMode>(
    () => composerInitialMode || 'TEXT'
  );

  // Synchronously sync initial mode on modal open before any UI is rendered to prevent flashing
  const [prevModalOpen, setPrevModalOpen] = useState(false);
  if (isComposerModalOpen && !prevModalOpen) {
    setPrevModalOpen(true);
    const targetMode = composerEditingPost
      ? (composerEditingPost.type === 'BLOOD_REQUEST' ||
         Boolean(composerEditingPost.bloodRequest) ||
         Boolean(composerEditingPost.bloodRequestId))
        ? 'BLOOD_REQUEST'
        : (composerEditingPost.type === 'DUA' ||
           Boolean(composerEditingPost.dua) ||
           Boolean(composerEditingPost.duaId))
        ? 'DUA'
        : 'TEXT'
      : composerInitialMode || 'TEXT';

    if (postType !== targetMode) {
      setPostType(targetMode);
    }
  } else if (!isComposerModalOpen && prevModalOpen) {
    setPrevModalOpen(false);
  }

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

  // Styled Post Background (Facebook-like)
  const [selectedBackground, setSelectedBackground] = useState<PostBackgroundOption | null>(null);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showBackgroundSheet, setShowBackgroundSheet] = useState(false);

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
          const isStyledBg = selectedBackground && selectedBackground.type !== 'none';
          const minH = isStyledBg ? 44 : mediaUrls.length > 0 ? 36 : 52;
          const newH = Math.max(minH, textarea.scrollHeight);
          textarea.style.height = `${newH}px`;
          setContentHeight(newH);
        }
      } catch {}
    }
  };

  // Recalculate content height when photos are added or removed or background changes
  useEffect(() => {
    if (Platform.OS === 'web' && contentInputRef.current) {
      try {
        const node = contentInputRef.current;
        const textarea =
          node?.tagName === 'TEXTAREA' ? node : node?.querySelector?.('textarea') || node;
        if (textarea && textarea.style) {
          textarea.style.height = 'auto';
          const isStyledBg = selectedBackground && selectedBackground.type !== 'none';
          const minH = isStyledBg ? 44 : mediaUrls.length > 0 ? 36 : 52;
          const newH = Math.max(minH, textarea.scrollHeight);
          textarea.style.height = `${newH}px`;
          setContentHeight(newH);
        }
      } catch {}
    }
  }, [mediaUrls.length, selectedBackground, content]);

  // Auto-focus input when a background is selected
  useEffect(() => {
    if (selectedBackground && selectedBackground.type !== 'none') {
      setTimeout(() => {
        contentInputRef.current?.focus();
      }, 50);
    }
  }, [selectedBackground]);

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
          setMediaLayout(composerEditingPost.mediaLayout === 'SWIPE' ? 'SWIPE' : 'COLLAGE');
          const existingBg = getPostBackgroundById(composerEditingPost.mediaLayout);
          if (existingBg) {
            setSelectedBackground(existingBg);
            setShowBackgroundPicker(true);
          } else {
            setSelectedBackground(null);
            setShowBackgroundPicker(false);
          }
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
    setSelectedBackground(null);
    setShowBackgroundPicker(false);
    setShowBackgroundSheet(false);
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
    Keyboard.dismiss();
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
    setSelectedBackground(null);
    setShowBackgroundPicker(false);
    setShowBackgroundSheet(false);
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
    const pSelectedBackground = selectedBackground;
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
              mediaLayout:
                pMediaUrls.length > 1
                  ? pMediaLayout
                  : pSelectedBackground && pSelectedBackground.type !== 'none'
                    ? `BG:${pSelectedBackground.id}`
                    : 'COLLAGE',
            });
          }
        } else if (pType === 'TEXT') {
          await createPost({
            type: 'TEXT',
            content: pContent || undefined,
            mediaUrls: pMediaUrls.length > 0 ? pMediaUrls : undefined,
            mediaLayout:
              pMediaUrls.length > 1
                ? pMediaLayout
                : pSelectedBackground && pSelectedBackground.type !== 'none'
                  ? `BG:${pSelectedBackground.id}`
                  : 'COLLAGE',
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

  return (
    <Modal
      visible={isComposerModalOpen}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={handleClose}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View
        style={{
          flex: 1,
          backgroundColor: theme === 'dark' ? '#18191a' : '#ffffff',
          paddingTop: insets.top,
          paddingBottom: 0,
        }}
        className="flex-1 bg-white dark:bg-[#18191a]">
        {/* ────────────────── 1. TOP HEADER & MODE SELECTOR ────────────────── */}
        <ComposerHeader
          isEditing={isEditing}
          postType={postType}
          onChangePostType={(type) => {
            setPostType(type);
            setErrorMessage(null);
          }}
          isPostValid={isPostValid}
          isSubmitting={isSubmitting}
          isUploadingMedia={isUploadingMedia}
          onClose={handleClose}
          onSubmit={handleSubmit}
          theme={theme}
          locale={locale}
        />

        {/* ────────────────── 2. SCROLLABLE WRITING CANVAS ────────────────── */}
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
            <MobileTextComposer
              content={content}
              onChangeContent={handleContentChange}
              contentHeight={contentHeight}
              onContentSizeChangeHeight={(h) =>
                setContentHeight(
                  Math.max(
                    selectedBackground && selectedBackground.type !== 'none'
                      ? 44
                      : mediaUrls.length > 0
                      ? 36
                      : 52,
                    Math.ceil(h)
                  )
                )
              }
              contentInputRef={contentInputRef}
              isShortText={isShortText}
              theme={theme}
              locale={locale}
              selectedBackground={selectedBackground}
              onClearBackground={() => {
                setSelectedBackground(null);
                setShowBackgroundPicker(false);
              }}
              onOpenBackgroundSheet={() => {
                Keyboard.dismiss();
                setShowBackgroundSheet(true);
              }}
              mediaUrls={mediaUrls}
              mediaLayout={mediaLayout}
              onChangeMediaLayout={setMediaLayout}
              onRemoveMediaUrl={removeMediaUrl}
              mediaContainerWidth={mediaContainerWidth}
              setMediaContainerWidth={setMediaContainerWidth}
              swipeActiveIdx={swipeActiveIdx}
              setSwipeActiveIdx={setSwipeActiveIdx}
            />
          )}

          {/* ────────────── MODE 2: DUA ────────────── */}
          {postType === 'DUA' && (
            <MobileDuaComposer
              duaTitle={duaTitle}
              onChangeDuaTitle={setDuaTitle}
              duaMeaning={duaMeaning}
              onChangeDuaMeaning={setDuaMeaning}
              duaTransliteration={duaTransliteration}
              onChangeDuaTransliteration={setDuaTransliteration}
              duaArabicText={duaArabicText}
              onChangeDuaArabicText={setDuaArabicText}
              duaFadilah={duaFadilah}
              onChangeDuaFadilah={setDuaFadilah}
              theme={theme}
              locale={locale}
            />
          )}

          {/* ────────────── MODE 3: BLOOD REQUEST ────────────── */}
          {postType === 'BLOOD_REQUEST' && (
            <MobileBloodComposer
              bloodGroup={bloodGroup}
              onChangeBloodGroup={setBloodGroup}
              forMyself={forMyself}
              onToggleForMyself={() => setForMyself((prev) => !prev)}
              patientName={patientName}
              onChangePatientName={setPatientName}
              units={units}
              onChangeUnits={setUnits}
              hospitalName={hospitalName}
              onChangeHospitalName={setHospitalName}
              locationValue={locationValue}
              onChangeLocationValue={setLocationValue}
              contactNumber={contactNumber}
              onChangeContactNumber={setContactNumber}
              alternateContact={alternateContact}
              onChangeAlternateContact={setAlternateContact}
              neededDate={neededDate}
              onChangeNeededDate={setNeededDate}
              problem={problem}
              onChangeProblem={setProblem}
              bloodNote={bloodNote}
              onChangeBloodNote={setBloodNote}
              user={user}
              theme={theme}
              locale={locale}
            />
          )}
        </ScrollView>

        {/* ────────────────── 3. BOTTOM DOCK (KEYBOARD AWARE + STYLE PICKER + TOOLBAR + ENDPOINT BAR) ────────────────── */}
        <ComposerBottomBar
          postType={postType}
          mediaUrls={mediaUrls}
          selectedBackground={selectedBackground}
          onSelectBackground={setSelectedBackground}
          showBackgroundPicker={showBackgroundPicker}
          onToggleBackgroundPicker={() => setShowBackgroundPicker((prev) => !prev)}
          onOpenBackgroundSheet={() => {
            Keyboard.dismiss();
            setShowBackgroundSheet(true);
          }}
          onPickImages={handlePickImages}
          isUploadingMedia={isUploadingMedia}
          selectedFeeling={selectedFeeling}
          onOpenFeelingPicker={() => setShowFeelingPicker(true)}
          contentLength={content.length}
          keyboardHeight={keyboardHeight}
          isKeyboardVisible={isKeyboardVisible}
          insetsBottom={insets.bottom}
          theme={theme}
          locale={locale}
          onFocusInput={() => contentInputRef.current?.focus()}
        />

        {/* ────────────────── 4. FEELINGS CENTERED MODAL DIALOGUE ────────────────── */}
        <ComposerFeelingsModal
          visible={showFeelingPicker}
          onClose={() => setShowFeelingPicker(false)}
          selectedFeelingId={feeling}
          onSelectFeeling={setFeeling}
          theme={theme}
          locale={locale}
        />

        {/* ────────────────── 5. BACKGROUND STYLE BOTTOM SHEET SLICE ────────────────── */}
        <ComposerBackgroundSheetModal
          visible={showBackgroundSheet}
          onClose={() => setShowBackgroundSheet(false)}
          selectedBackground={selectedBackground}
          onSelectBackground={(bg) => {
            setSelectedBackground(bg);
            if (!bg) {
              setShowBackgroundPicker(false);
            }
          }}
          theme={theme}
          locale={locale}
        />
      </View>
    </Modal>
  );
}
