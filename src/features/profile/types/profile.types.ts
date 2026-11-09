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
  role?: UserRole;
  userStatus?: UserStatus;
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
  createdAt: string;
  updatedAt?: string;
  friendship?: FriendshipStatusResponse;
}

export type ProfileTab = 'overview' | 'posts' | 'friends' | 'groups' | 'saved';
