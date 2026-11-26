import { BloodGroup, UserBadge, UserRole, UserStatus } from '@/types/user.types';

export type FriendshipStatus =
  | 'NONE'
  | 'SELF'
  | 'PENDING_SENT'
  | 'PENDING_RECEIVED'
  | 'FRIENDS';

export interface FriendshipStatusResponse {
  status: FriendshipStatus;
  requestId?: string | null;
}

export interface UserProfileResponse {
  id: string;
  name: string;
  username: string;
  email?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  role?: UserRole;
  userStatus?: UserStatus;
  activeAvatarFrame?: string | null;
  activeProfileTheme?: string | null;
  badge?: string;
  badges?: UserBadge[];
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  country?: string | null;
  countryCode?: string | null;
  state?: string | null;
  city?: string | null;
  location?: string | null;
  bloodGroup?: BloodGroup | null;
  isDonor?: boolean;
  donationCount?: number;
  points?: number;
  lifetimePoints?: number;
  referralCode?: string | null;
  currentStreak?: number;
  createdAt: string;
  updatedAt?: string;
  friendship?: FriendshipStatusResponse;
}

export type ProfileTab = 'overview' | 'posts' | 'friends' | 'groups' | 'saved';
