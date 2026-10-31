import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Linking,
  RefreshControl,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { bloodApi } from '@/features/blood/api/blood.api';
import { BloodRequestItem, BloodDonorItem } from '@/features/blood/types/blood.types';
import { queryCache } from '@/lib/cache/queryCache';

// Modular Tab Components
import { BloodRequestsTab } from '@/features/blood/components/BloodRequestsTab';
import { BloodDonorsTab } from '@/features/blood/components/BloodDonorsTab';
import { BloodCreateTab } from '@/features/blood/components/BloodCreateTab';
import { BloodActivityTab } from '@/features/blood/components/BloodActivityTab';
import { BLOOD_GROUPS, toBackendBloodGroup } from '@/features/blood/utils/blood.utils';

export default function BloodScreen() {
  const { locale, theme, setIsUploadingPost, triggerPostSuccess } = useUi();
  const { isAuthenticated, user } = useAuth();
  const { width } = useWindowDimensions();

  const { tab } = useLocalSearchParams<{ tab?: string }>();

  // 4 Main Tabs: Requests, Donors, Create Request, Activity
  const [activeTab, setActiveTab] = useState<'requests' | 'donors' | 'create' | 'activity'>(() => {
    if (tab === 'create' || tab === 'requests' || tab === 'donors' || tab === 'activity') {
      return tab as any;
    }
    return 'requests';
  });

  useEffect(() => {
    if (tab === 'create' || tab === 'requests' || tab === 'donors' || tab === 'activity') {
      setActiveTab(tab as any);
    }
  }, [tab]);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  // Cache-first state initialization to prevent flash/blinking on tab changes
  const [requests, setRequests] = useState<BloodRequestItem[]>(
    () => queryCache.get<BloodRequestItem[]>('blood:requests:ALL') || []
  );
  const [donors, setDonors] = useState<BloodDonorItem[]>(
    () => queryCache.get<BloodDonorItem[]>('blood:donors:ALL') || []
  );

  const loadedTabsRef = useRef<Record<string, boolean>>({
    'blood:requests:ALL': queryCache.has('blood:requests:ALL'),
    'blood:donors:ALL': queryCache.has('blood:donors:ALL'),
    'blood:activity': queryCache.has('blood:activity:requests'),
  });

  const requestsRef = useRef(requests);
  requestsRef.current = requests;
  const scrollViewRef = useRef<any>(null);
  const donorsRef = useRef(donors);
  donorsRef.current = donors;

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination & Infinite Scroll State for Requests
  const [requestsPage, setRequestsPage] = useState(1);
  const requestsPageRef = useRef(1);
  const [hasMoreRequests, setHasMoreRequests] = useState(true);
  const hasMoreRequestsRef = useRef(true);
  const [isLoadingMoreRequests, setIsLoadingMoreRequests] = useState(false);
  const isLoadingMoreRequestsRef = useRef(false);

  // Pagination & Infinite Scroll State for Donors
  const [donorsPage, setDonorsPage] = useState(1);
  const donorsPageRef = useRef(1);
  const [hasMoreDonors, setHasMoreDonors] = useState(true);
  const hasMoreDonorsRef = useRef(true);
  const [isLoadingMoreDonors, setIsLoadingMoreDonors] = useState(false);
  const isLoadingMoreDonorsRef = useRef(false);

  const selectedGroupRef = useRef(selectedGroup);
  selectedGroupRef.current = selectedGroup;

  // Activity Tab State with cache initialization
  const [myRequests, setMyRequests] = useState<BloodRequestItem[]>(
    () => queryCache.get<BloodRequestItem[]>('blood:activity:requests') || []
  );
  const [myAccepted, setMyAccepted] = useState<BloodRequestItem[]>(
    () => queryCache.get<BloodRequestItem[]>('blood:activity:accepted') || []
  );
  const myRequestsRef = useRef(myRequests);
  myRequestsRef.current = myRequests;
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Universal In-App Confirmation Dialog (Works on Web & Mobile)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant: 'danger' | 'warning' | 'primary' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    variant: 'danger',
    onConfirm: () => {},
  });

  // Fetch Requests or Donors with caching (initial 20 items)
  const fetchTabContent = useCallback(
    async (tab: 'requests' | 'donors', group: string, forceLoading = false) => {
      const cacheKey = `blood:${tab}:${group}`;
      const hasExistingData =
        (tab === 'requests' && requestsRef.current.length > 0 && Boolean(loadedTabsRef.current[cacheKey])) ||
        (tab === 'donors' && donorsRef.current.length > 0 && Boolean(loadedTabsRef.current[cacheKey]));

      if (!hasExistingData) {
        setIsLoading(true);
      }

      const backendGroup = toBackendBloodGroup(group);

      try {
        if (tab === 'requests') {
          const res = await bloodApi.getBloodRequests({
            bloodGroup: backendGroup,
            status: 'PENDING',
            page: 1,
            limit: 20,
          });
          const items = res.items || [];
          setRequests(items);
          requestsRef.current = items;
          setRequestsPage(1);
          requestsPageRef.current = 1;
          const more = items.length >= 20;
          setHasMoreRequests(more);
          hasMoreRequestsRef.current = more;
          queryCache.set(cacheKey, items);
          loadedTabsRef.current[cacheKey] = true;
        } else if (tab === 'donors') {
          const res = await bloodApi.getAvailableDonors({
            bloodGroup: backendGroup,
            page: 1,
            limit: 20,
          });
          const items = res.items || [];
          setDonors(items);
          donorsRef.current = items;
          setDonorsPage(1);
          donorsPageRef.current = 1;
          const more = items.length >= 20;
          setHasMoreDonors(more);
          hasMoreDonorsRef.current = more;
          queryCache.set(cacheKey, items);
          loadedTabsRef.current[cacheKey] = true;
        }
      } catch (err) {
        // Fallback gracefully on error
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Infinite Scroll Load More: Blood Requests
  const loadMoreRequests = useCallback(async () => {
    if (isLoadingMoreRequestsRef.current || !hasMoreRequestsRef.current) return;
    isLoadingMoreRequestsRef.current = true;
    setIsLoadingMoreRequests(true);

    const nextPage = requestsPageRef.current + 1;
    const backendGroup = toBackendBloodGroup(selectedGroupRef.current);

    try {
      const res = await bloodApi.getBloodRequests({
        bloodGroup: backendGroup,
        status: 'PENDING',
        page: nextPage,
        limit: 20,
      });

      const newItems = res.items || [];
      if (newItems.length === 0) {
        setHasMoreRequests(false);
        hasMoreRequestsRef.current = false;
      } else {
        setRequests((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const fresh = newItems.filter((r) => !existingIds.has(r.id));
          const merged = [...prev, ...fresh];
          queryCache.set(`blood:requests:${selectedGroupRef.current}`, merged);
          return merged;
        });
        setRequestsPage(nextPage);
        requestsPageRef.current = nextPage;
        const more = newItems.length >= 20;
        setHasMoreRequests(more);
        hasMoreRequestsRef.current = more;
      }
    } catch (err) {
      // Ignore pagination fetch error
    } finally {
      isLoadingMoreRequestsRef.current = false;
      setIsLoadingMoreRequests(false);
    }
  }, []);

  // Infinite Scroll Load More: Blood Donors
  const loadMoreDonors = useCallback(async () => {
    if (isLoadingMoreDonorsRef.current || !hasMoreDonorsRef.current) return;
    isLoadingMoreDonorsRef.current = true;
    setIsLoadingMoreDonors(true);

    const nextPage = donorsPageRef.current + 1;
    const backendGroup = toBackendBloodGroup(selectedGroupRef.current);

    try {
      const res = await bloodApi.getAvailableDonors({
        bloodGroup: backendGroup,
        page: nextPage,
        limit: 20,
      });

      const newItems = res.items || [];
      if (newItems.length === 0) {
        setHasMoreDonors(false);
        hasMoreDonorsRef.current = false;
      } else {
        setDonors((prev) => {
          const existingIds = new Set(prev.map((d) => d.id));
          const fresh = newItems.filter((d) => !existingIds.has(d.id));
          const merged = [...prev, ...fresh];
          queryCache.set(`blood:donors:${selectedGroupRef.current}`, merged);
          return merged;
        });
        setDonorsPage(nextPage);
        donorsPageRef.current = nextPage;
        const more = newItems.length >= 20;
        setHasMoreDonors(more);
        hasMoreDonorsRef.current = more;
      }
    } catch (err) {
      // Ignore pagination fetch error
    } finally {
      isLoadingMoreDonorsRef.current = false;
      setIsLoadingMoreDonors(false);
    }
  }, []);

  // Fetch Activity Tab Data
  const fetchActivity = useCallback(
    async (forceLoading = false) => {
      if (!isAuthenticated || !user?.id) return;
      const hasData =
        loadedTabsRef.current['blood:activity'] || myRequestsRef.current.length > 0;
      if (forceLoading || !hasData) {
        setIsLoadingActivity(true);
      }
      try {
        const [reqRes, accRes] = await Promise.all([
          bloodApi.getBloodRequests({ requesterId: user.id, limit: 50 }),
          bloodApi.getBloodRequests({ donorId: user.id, limit: 50 }),
        ]);
        const reqItems = reqRes.items || [];
        const accItems = accRes.items || [];
        setMyRequests(reqItems);
        setMyAccepted(accItems);
        queryCache.set('blood:activity:requests', reqItems);
        queryCache.set('blood:activity:accepted', accItems);
        loadedTabsRef.current['blood:activity'] = true;
      } catch (err) {
        // Fallback gracefully
      } finally {
        setIsLoadingActivity(false);
      }
    },
    [isAuthenticated, user?.id]
  );

  // Fetch when tab or blood group filter changes
  useEffect(() => {
    if (activeTab === 'create' || activeTab === 'activity') return;
    const cacheKey = `blood:${activeTab}:${selectedGroup}`;
    const hasData = Boolean(loadedTabsRef.current[cacheKey]);
    fetchTabContent(activeTab, selectedGroup, !hasData);
  }, [activeTab, selectedGroup, fetchTabContent]);

  // Fetch activity only once when activity tab becomes active and not yet loaded
  useEffect(() => {
    if (activeTab === 'activity') {
      if (!loadedTabsRef.current['blood:activity']) {
        fetchActivity();
      }
    }
  }, [activeTab, fetchActivity]);

  // Background Pre-sync: Donors then Activity so switching tabs has ZERO loading time
  useEffect(() => {
    const timer = setTimeout(async () => {
      // 1. Pre-fetch Donors (if not already loaded)
      if (!loadedTabsRef.current['blood:donors:ALL']) {
        try {
          const res = await bloodApi.getAvailableDonors({ page: 1, limit: 20 });
          const items = res.items || [];
          setDonors(items);
          donorsRef.current = items;
          queryCache.set('blood:donors:ALL', items);
          loadedTabsRef.current['blood:donors:ALL'] = true;
          const more = items.length >= 20;
          setHasMoreDonors(more);
          hasMoreDonorsRef.current = more;
        } catch (e) {}
      }

      // 2. Pre-fetch Activity (if authenticated and not already loaded)
      if (isAuthenticated && user?.id && !loadedTabsRef.current['blood:activity']) {
        try {
          const [reqRes, accRes] = await Promise.all([
            bloodApi.getBloodRequests({ requesterId: user.id }),
            bloodApi.getBloodRequests({ donorId: user.id }),
          ]);
          const rItems = reqRes.items || [];
          const aItems = accRes.items || [];
          setMyRequests(rItems);
          setMyAccepted(aItems);
          myRequestsRef.current = rItems;
          queryCache.set('blood:activity:requests', rItems);
          queryCache.set('blood:activity:accepted', aItems);
          loadedTabsRef.current['blood:activity'] = true;
        } catch (e) {}
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.id]);

  const handleRefresh = async () => {
    if (activeTab === 'create') return;
    setIsRefreshing(true);
    if (activeTab === 'activity') {
      await fetchActivity(true);
    } else {
      await fetchTabContent(activeTab, selectedGroup, false);
    }
    setIsRefreshing(false);
  };

  const handleCall = (phoneNumber?: string | null) => {
    if (!phoneNumber || !phoneNumber.trim()) {
      Alert.alert(
        locale === 'bn' ? 'বিজ্ঞপ্তি' : 'Notice',
        locale === 'bn' ? 'কোনো যোগাযোগের নম্বর পাওয়া যায়নি।' : 'No contact phone number provided.'
      );
      return;
    }
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert(
        locale === 'bn' ? 'ব্যর্থ' : 'Failed',
        locale === 'bn' ? 'ফোন ডায়াল করা সম্ভব হয়নি।' : 'Could not launch phone dialer.'
      );
    });
  };

  const handleDonorMessage = (targetUser: BloodDonorItem | { id: string; username?: string }) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const uid = targetUser?.id;
    if (!uid) {
      Alert.alert(
        locale === 'bn' ? 'বিজ্ঞপ্তি' : 'Notice',
        locale === 'bn' ? 'ইউজার আইডি পাওয়া যায়নি।' : 'User ID not found.'
      );
      return;
    }
    router.push({
      pathname: '/messages',
      params: { userId: uid, username: targetUser.username || '' },
    } as any);
  };

  const handleAcceptRequest = async (req: BloodRequestItem) => {
    if (!isAuthenticated) {
      setConfirmDialog({
        isOpen: true,
        title: locale === 'bn' ? 'লগইন প্রয়োজন' : 'Login Required',
        subtitle:
          locale === 'bn'
            ? 'রক্তদানের আবেদন গ্রহণ করতে অনুগ্রহ করে আগে লগইন করুন।'
            : 'Please log in to accept this blood donation request.',
        confirmText: locale === 'bn' ? 'লগইন' : 'Login',
        cancelText: locale === 'bn' ? 'বাতিল' : 'Cancel',
        variant: 'primary',
        onConfirm: () => router.push('/login'),
      });
      return;
    }

    if (user?.id && req.requesterId === user.id) {
      const msg =
        locale === 'bn'
          ? 'আপনি নিজের তৈরিকৃত রক্তের আবেদনে নিজেই রক্তদাতা হতে পারবেন না।'
          : 'You cannot donate blood to your own request.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert(locale === 'bn' ? 'বিজ্ঞপ্তি' : 'Notice', msg);
      }
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: locale === 'bn' ? 'রক্তদানের অঙ্গীকার' : 'Pledge to Donate Blood',
      subtitle:
        locale === 'bn'
          ? `${req.patientName}-এর জন্য রক্ত দিতে আপনি কি সম্মত?`
          : `Do you want to pledge blood donation for ${req.patientName}?`,
      description:
        locale === 'bn'
          ? 'অঙ্গীকার করার পর এটি আপনার "কার্যক্রম" ট্যাবে যুক্ত হবে এবং রোগীর পরিবার আপনার সাথে যোগাযোগ করতে পারবে।'
          : 'After pledging, this will appear in your Activity tab and the patient can contact you.',
      confirmText: locale === 'bn' ? 'হ্যাঁ, রক্ত দেব' : 'Yes, Pledge',
      cancelText: locale === 'bn' ? 'বাতিল' : 'Cancel',
      variant: 'success',
      onConfirm: async () => {
        try {
          setAcceptingId(req.id);
          const res = await bloodApi.acceptBloodRequest(req.id);

          // Optimistically update request in Requests list: mark current user as donor
          setRequests((prev) =>
            prev.map((r) => {
              if (r.id === req.id) {
                const newDonation = {
                  id: res?.donation?.id || `temp-${Date.now()}`,
                  donorId: user?.id || '',
                  status: 'ACCEPTED',
                  donor: {
                    id: user?.id || '',
                    name: user?.name || '',
                    username: user?.username || '',
                    avatarUrl: user?.avatarUrl,
                    bloodGroup: user?.bloodGroup,
                  },
                };
                const donations = [...(r.donations || []), newDonation];
                const newStatus =
                  donations.length >= r.units ? 'FULLY_ACCEPTED' : 'PARTIALLY_ACCEPTED';
                return {
                  ...r,
                  donations,
                  status: newStatus as any,
                };
              }
              return r;
            })
          );

          if (res?.request) {
            setMyAccepted((prev) => [res.request, ...prev.filter((item) => item.id !== req.id)]);
          }

          queryCache.invalidate('blood:requests');
          fetchActivity(true);

          const successMsg =
            locale === 'bn'
              ? 'ধন্যবাদ! আপনার রক্তদানের অঙ্গীকার সফলভাবে যুক্ত হয়েছে। "আমার কার্যক্রম" ট্যাবে এটি দেখতে পাবেন।'
              : 'Thank you! You have successfully pledged to donate blood.';
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert(successMsg);
          } else {
            Alert.alert(locale === 'bn' ? 'ধন্যবাদ!' : 'Thank you!', successMsg);
          }
        } catch (err: any) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            (locale === 'bn'
              ? 'আবেদন গ্রহণ করতে সমস্যা হয়েছে।'
              : 'Failed to accept blood request.');
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert(msg);
          } else {
            Alert.alert(locale === 'bn' ? 'বিজ্ঞপ্তি' : 'Notice', msg);
          }
        } finally {
          setAcceptingId(null);
        }
      },
    });
  };

  const handleCompleteMyRequest = (req: BloodRequestItem) => {
    setConfirmDialog({
      isOpen: true,
      title: locale === 'bn' ? 'আবেদন সম্পন্ন করবেন?' : 'Mark as Completed?',
      subtitle:
        locale === 'bn'
          ? 'রোগীর জন্য প্রয়োজনীয় রক্ত পাওয়া গেছে।'
          : 'Required blood has been received for this patient.',
      description:
        locale === 'bn'
          ? 'এটি আবেদনটি সম্পন্ন হিসেবে চিহ্নিত করবে এবং সাধারণ আবেদন ফিড থেকে সরিয়ে দেবে।'
          : 'This will mark the blood request as completed and remove it from active feeds.',
      confirmText: locale === 'bn' ? 'হ্যাঁ, সম্পন্ন' : 'Yes, Complete',
      cancelText: locale === 'bn' ? 'বাতিল' : 'Cancel',
      variant: 'success',
      onConfirm: async () => {
        try {
          setActionLoadingId(req.id);
          await bloodApi.updateRequestStatus(req.id, 'COMPLETED');

          // Optimistically update status in Activity and remove from Requests list
          setMyRequests((prev) => {
            const updated = prev.map((r) =>
              r.id === req.id ? { ...r, status: 'COMPLETED' as any } : r
            );
            queryCache.set('blood:activity:requests', updated);
            return updated;
          });
          setRequests((prev) => {
            const updated = prev.filter((r) => r.id !== req.id);
            queryCache.set(`blood:requests:${selectedGroupRef.current}`, updated);
            return updated;
          });

          queryCache.invalidate('blood:requests');
        } catch (err: any) {
          fetchActivity(true);
          const msg =
            err?.response?.data?.message || err?.message || 'Failed to update request status';
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert(msg);
          } else {
            Alert.alert(locale === 'bn' ? 'ত্রুটি' : 'Error', msg);
          }
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleCancelMyRequest = (req: BloodRequestItem) => {
    setConfirmDialog({
      isOpen: true,
      title: locale === 'bn' ? 'আবেদনটি মুছে ফেলবেন?' : 'Delete Blood Request?',
      subtitle:
        locale === 'bn'
          ? 'এই কাজটি আর বাতিল করা যাবে না।'
          : 'This action cannot be undone.',
      description:
        locale === 'bn'
          ? 'আপনি কি নিশ্চিত যে এই রক্তের আবেদনটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?'
          : 'Are you sure you want to permanently delete this blood request from the database?',
      confirmText: locale === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete',
      cancelText: locale === 'bn' ? 'বাতিল' : 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoadingId(req.id);

          // Optimistically remove from My Requests and Requests lists
          setMyRequests((prev) => {
            const updated = prev.filter((r) => r.id !== req.id);
            queryCache.set('blood:activity:requests', updated);
            return updated;
          });
          setRequests((prev) => {
            const updated = prev.filter((r) => r.id !== req.id);
            queryCache.set(`blood:requests:${selectedGroupRef.current}`, updated);
            return updated;
          });

          // Permanent deletion from database
          await bloodApi.deleteBloodRequest(req.id);
          queryCache.invalidate('blood:requests');
        } catch (err: any) {
          fetchActivity(true);
          fetchTabContent('requests', selectedGroupRef.current, false);
          const msg =
            err?.response?.data?.message || err?.message || 'Failed to delete blood request';
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert(msg);
          } else {
            Alert.alert(locale === 'bn' ? 'ত্রুটি' : 'Error', msg);
          }
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleCancelAcceptedDonation = (req: BloodRequestItem) => {
    setConfirmDialog({
      isOpen: true,
      title: locale === 'bn' ? 'রক্তদান অঙ্গীকার বাতিল করবেন?' : 'Cancel Donation Pledge?',
      subtitle:
        locale === 'bn'
          ? 'এতে রোগীর পরিবার অন্য কোনো রক্তদাতার সন্ধান করতে পারবে।'
          : 'This will allow the requester to find another donor.',
      description:
        locale === 'bn'
          ? 'আপনি কি নিশ্চিতভাবে এই রক্তদানের অঙ্গীকার বাতিল করতে চান?'
          : 'Are you sure you want to cancel your pledge to donate blood?',
      confirmText: locale === 'bn' ? 'হ্যাঁ, বাতিল করুন' : 'Yes, Cancel',
      cancelText: locale === 'bn' ? 'না' : 'No',
      variant: 'warning',
      onConfirm: async () => {
        try {
          setActionLoadingId(req.id);

          // Optimistically remove from Accepted Donations list
          setMyAccepted((prev) => {
            const updated = prev.filter((r) => r.id !== req.id);
            queryCache.set('blood:activity:accepted', updated);
            return updated;
          });

          await bloodApi.cancelDonation(req.id);
          queryCache.invalidate('blood:requests');
          fetchTabContent('requests', selectedGroupRef.current, false);
        } catch (err: any) {
          fetchActivity(true);
          const msg =
            err?.response?.data?.message || err?.message || 'Failed to cancel donation';
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert(msg);
          } else {
            Alert.alert(locale === 'bn' ? 'ত্রুটি' : 'Error', msg);
          }
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleOptimisticSubmit = useCallback(
    async (optimisticItem: BloodRequestItem, payload: any) => {
      // 1. Immediately prepend optimistic item to myRequests so it shows at position 1 (top)
      setMyRequests((prev) => {
        const updated = [optimisticItem, ...prev.filter((r) => r.id !== optimisticItem.id)];
        queryCache.set('blood:activity:requests', updated);
        return updated;
      });

      // Mark activity as loaded so tab switch does not trigger background fetch that clobbers the optimistic post
      loadedTabsRef.current['blood:activity'] = true;

      // 2. Immediately switch tab to Activity and scroll to top
      setActiveTab('activity');
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      // 3. Background API call (user already navigated and sees "Posting..." at top)
      try {
        const created = await bloodApi.createBloodRequest(payload);

        // Replace optimistic item with server created item (status transitions to PENDING)
        setMyRequests((prev) => {
          const updated = prev.map((item) => (item.id === optimisticItem.id ? created : item));
          queryCache.set('blood:activity:requests', updated);
          return updated;
        });

        // Also add to public Requests feed if match
        setRequests((prev) => {
          const updated = [created, ...prev.filter((r) => r.id !== created.id)];
          queryCache.set(`blood:requests:${selectedGroupRef.current}`, updated);
          return updated;
        });
        queryCache.invalidate('blood:requests');

        // Trigger success animation on bottom nav "+ Post" button
        triggerPostSuccess();
      } catch (err: any) {
        setIsUploadingPost(false);
        // Rollback optimistic item if failed
        setMyRequests((prev) => {
          const updated = prev.filter((item) => item.id !== optimisticItem.id);
          queryCache.set('blood:activity:requests', updated);
          return updated;
        });
        Alert.alert(
          locale === 'bn' ? 'পোস্ট ব্যর্থ হয়েছে' : 'Post Failed',
          err?.response?.data?.message ||
            (locale === 'bn' ? 'রক্তের আবেদন প্রকাশ করা যায়নি।' : 'Failed to publish blood request.')
        );
      }
    },
    [locale, setIsUploadingPost, triggerPostSuccess]
  );

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Reset scroll-to-top visibility and scroll back to top when switching tab or blood group filter
  useEffect(() => {
    setShowScrollTop(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeTab, selectedGroup]);

  const handleScrollToTop = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setShowScrollTop(false);
  }, []);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Only toggle floating scroll-to-top button if the list has substantial scrollable content
    // and user has scrolled down significantly (> 650px)
    const isScrollable = contentSize.height > layoutMeasurement.height + 350;
    const isScrolledFar = contentOffset.y > 650;

    if (isScrollable && isScrolledFar) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }

    const paddingToBottom = 180;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isCloseToBottom) {
      if (activeTab === 'requests') {
        loadMoreRequests();
      } else if (activeTab === 'donors') {
        loadMoreDonors();
      }
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#18191a] relative">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 bg-white dark:bg-[#18191a]"
        stickyHeaderIndices={[0]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: activeTab === 'create' ? 12 : 72 }}
        refreshControl={
          activeTab !== 'create' ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme === 'dark' ? '#ffffff' : '#e11d48'}
            />
          ) : undefined
        }>
      {/* Index 0: Sticky Top Bar */}
      <View
        style={{ width: '100%' }}
        className="w-full bg-white dark:bg-[#18191a] z-20 border-b border-[#f0f2f5] dark:border-[#242526] px-3 pt-2 pb-2.5">
        <View
          style={{ width: '100%', maxWidth: 768, marginLeft: 'auto', marginRight: 'auto' }}
          className="w-full max-w-[768px] mx-auto">
          {/* 4 Tab Switcher */}
          <View
            style={{ width: '100%', flexDirection: 'row' }}
            className="w-full flex-row rounded-xl bg-[#f0f2f5] dark:bg-[#242526] p-1">
            {[
              { key: 'requests', bn: 'রক্তের আবেদন', shortBn: 'আবেদন', en: 'Requests', icon: 'water_drop' },
              { key: 'donors', bn: 'রক্তদাতা খুঁজুন', shortBn: 'রক্তদাতা', en: 'Donors', icon: 'groups' },
              { key: 'create', bn: 'পোস্ট', shortBn: 'পোস্ট', en: 'Post', icon: 'add' },
              { key: 'activity', bn: 'আমার কার্যক্রম', shortBn: 'কার্যক্রম', en: 'Activity', icon: 'bookmark' },
            ].map((t) => {
              const isSelected = activeTab === t.key;
              const tabLabel =
                width < 540
                  ? locale === 'bn'
                    ? t.shortBn
                    : t.en
                  : locale === 'bn'
                  ? t.bn
                  : t.en;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setActiveTab(t.key as any)}
                  style={{ flex: 1, minWidth: 0 }}
                  className={`py-2 items-center justify-center flex-row gap-1 rounded-lg ${
                    isSelected
                      ? 'bg-rose-600 shadow-xs'
                      : 'active:bg-white/60 dark:active:bg-[#3a3b3c]'
                  }`}>
                  {t.icon ? (
                    <AppIcon
                      android={t.icon as any}
                      size={13}
                      color={
                        isSelected
                          ? '#ffffff'
                          : theme === 'dark'
                          ? '#b0b3b8'
                          : '#65676b'
                      }
                    />
                  ) : null}
                  <Text
                    numberOfLines={1}
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-[#65676b] dark:text-[#b0b3b8]'
                    }`}>
                    {tabLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Blood Group Chips Carousel (Only on requests or donors tabs) */}
          {(activeTab === 'requests' || activeTab === 'donors') && (
            <View style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', marginTop: 8 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ width: '100%', maxWidth: '100%' }}
                contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                {BLOOD_GROUPS.map((grp) => {
                  const isSelected = selectedGroup === grp;
                  return (
                    <Pressable
                      key={grp}
                      onPress={() => setSelectedGroup(grp)}
                      className={`px-3 py-1 rounded-full border ${
                        isSelected
                          ? 'bg-rose-600 border-rose-600 shadow-xs'
                          : 'bg-[#f0f2f5] dark:bg-[#242526] border-[#ced0d4] dark:border-[#3a3b3c]'
                      }`}>
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected
                            ? 'text-white'
                            : 'text-[#050505] dark:text-[#e4e6eb]'
                        }`}>
                        {grp}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Main Tab Views */}
      <View
        style={{ width: '100%', maxWidth: 768, marginLeft: 'auto', marginRight: 'auto' }}
        className="w-full max-w-[768px] mx-auto px-3">
        {/* TAB 1: Blood Requests List */}
        {activeTab === 'requests' && (
          <BloodRequestsTab
            requests={requests}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            isLoadingMore={isLoadingMoreRequests}
            hasMore={hasMoreRequests}
            selectedGroup={selectedGroup}
            acceptingId={acceptingId}
            onAccept={handleAcceptRequest}
            onScrollToTop={handleScrollToTop}
          />
        )}

        {/* TAB 2: Available Blood Donors */}
        {activeTab === 'donors' && (
          <BloodDonorsTab
            donors={donors}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            isLoadingMore={isLoadingMoreDonors}
            hasMore={hasMoreDonors}
            selectedGroup={selectedGroup}
            onDonorMessage={handleDonorMessage}
            onScrollToTop={handleScrollToTop}
          />
        )}

        {/* TAB 3: Request Blood Form */}
        {activeTab === 'create' && (
          <BloodCreateTab
            onSubmitOptimistic={handleOptimisticSubmit}
            onScrollTo={(y) => {
              scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 60), animated: true });
            }}
          />
        )}

        {/* TAB 4: My Activity */}
        {activeTab === 'activity' && (
          <BloodActivityTab
            myRequests={myRequests}
            myAccepted={myAccepted}
            isLoading={isLoadingActivity}
            isRefreshing={isRefreshing}
            actionLoadingId={actionLoadingId}
            onCompleteMyRequest={handleCompleteMyRequest}
            onCancelMyRequest={handleCancelMyRequest}
            onCancelAcceptedDonation={handleCancelAcceptedDonation}
            onCall={handleCall}
            onDonorMessage={handleDonorMessage}
            onSwitchToCreate={() => setActiveTab('create')}
            onSwitchToRequests={() => setActiveTab('requests')}
            onScrollToTop={handleScrollToTop}
          />
        )}
      </View>
    </ScrollView>



    {/* Universal Confirm Dialog (Works on Web & Mobile) */}
    <ConfirmDialog
      isOpen={confirmDialog.isOpen}
      onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
      onConfirm={confirmDialog.onConfirm}
      title={confirmDialog.title}
      subtitle={confirmDialog.subtitle}
      description={confirmDialog.description}
      confirmText={confirmDialog.confirmText}
      cancelText={confirmDialog.cancelText}
      variant={confirmDialog.variant}
      isLoading={Boolean(actionLoadingId)}
    />
  </View>
  );
}
