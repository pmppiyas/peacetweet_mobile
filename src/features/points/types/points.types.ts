export type PointTaskCategory =
  | 'PROFILE'
  | 'DAILY'
  | 'REFERRAL'
  | 'SOCIAL'
  | 'COMMUNITY';

export type PointTaskFrequency = 'ONE_TIME' | 'DAILY' | 'CAPPED' | 'MILESTONE';

export interface PointLevelInfo {
  level: number;
  nameBn: string;
  nameEn: string;
  minPoints: number;
  badgeName: string;
  color: string;
}

export interface PointTaskItem {
  code: string;
  category: PointTaskCategory;
  titleBn: string;
  titleEn: string;
  descriptionBn?: string | null;
  descriptionEn?: string | null;
  points: number;
  frequency: PointTaskFrequency;
  dailyLimit?: number | null;
  maxLimit?: number | null;
  targetCount: number;
  actionRoute?: string | null;
  icon?: string | null;
  completedCount: number;
  todayCount: number;
  currentCount: number;
  isCompleted: boolean;
  lastCompletedAt?: string | null;
}

export interface PointTransactionItem {
  id: string;
  userId: string;
  entryType?: 'EARN' | 'REDEEM';
  taskCode?: string | null;
  rewardCode?: string | null;
  pointsDelta: number;
  sourceKey: string;
  titleBn?: string | null;
  titleEn?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface ReferralInviteeItem {
  id: string;
  status: 'REGISTERED' | 'QUALIFIED';
  createdAt: string;
  qualifiedAt?: string | null;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    createdAt: string;
  };
}

export interface ProfileCompletionStep {
  key: string;
  done: boolean;
  labelBn: string;
  labelEn: string;
}

export interface PointsDashboard {
  points: number;
  lifetimePoints: number;
  currentStreak: number;
  checkedInToday: boolean;
  level: {
    current: PointLevelInfo;
    next: PointLevelInfo | null;
    pointsToNext: number;
    progressPercent: number;
  };
  levels: PointLevelInfo[];
  referral: {
    code: string;
    totalInvited: number;
    qualifiedCount: number;
    recentInvitees: ReferralInviteeItem[];
  };
  profileCompletion: {
    percentage: number;
    completedSteps: number;
    totalSteps: number;
    steps: ProfileCompletionStep[];
  };
  tasks: PointTaskItem[];
  recentTransactions: PointTransactionItem[];
}

export type RedeemCategory = 'BADGE' | 'COSMETIC' | 'PERK' | 'EXTERNAL_GIFT';

export type RedeemFulfillmentType =
  | 'INSTANT_BADGE'
  | 'INSTANT_COSMETIC'
  | 'INSTANT_PERK'
  | 'EXTERNAL_DELIVERY';

export type RedeemPreviewType =
  | 'BADGE_NEXT_TO_NAME'
  | 'AVATAR_FRAME'
  | 'PROFILE_THEME'
  | 'PERK_CARD'
  | 'GIFT_BOX';

export interface RedeemDeliveryInfo {
  recipientName: string;
  phone: string;
  address: string;
  note?: string;
}

export interface RedeemItem {
  code: string;
  category: RedeemCategory;
  fulfillmentType: RedeemFulfillmentType;
  previewType: RedeemPreviewType;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  badgeTagBn?: string;
  badgeTagEn?: string;
  accentColor: string;
  costPoints: number;
  isRepeatable: boolean;
  requiresEmailVerified: boolean;
  requiresDeliveryInfo: boolean;
  durationDays?: number | null;
  icon: string;
  isActive: boolean;
  comingSoon?: boolean;
  sortOrder: number;
  isRedeemed: boolean;
  isEquipped?: boolean;
  redeemCount: number;
  redeemedAt?: string | null;
  missingEmailVerification: boolean;
  pointsNeeded: number;
  canRedeem: boolean;
}

export interface RedeemRecordItem {
  id: string;
  rewardCode: string;
  category: RedeemCategory;
  fulfillmentType: RedeemFulfillmentType;
  pointsSpent: number;
  status: string;
  deliveryInfo?: RedeemDeliveryInfo | null;
  fulfillmentCode?: string | null;
  expiresAt?: string | null;
  redeemedAt: string;
  titleBn: string;
  titleEn: string;
}

export interface RedeemStoreData {
  points: number;
  lifetimePoints: number;
  emailVerified: boolean;
  userStatus?: string;
  activeAvatarFrame?: string | null;
  activeProfileTheme?: string | null;
  items: RedeemItem[];
  redemptions: RedeemRecordItem[];
}

export interface RedeemResult {
  redeemed: boolean;
  rewardCode: string;
  pointsSpent: number;
  titleBn: string;
  titleEn: string;
  redemption?: RedeemRecordItem;
  user?: any;
}

export interface CheckInResult {
  alreadyCheckedIn: boolean;
  pointsAwarded: number;
  streakBonusAwarded: number;
  currentStreak: number;
  points: number;
  lifetimePoints: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  points: number;
  lifetimePoints: number;
  level: PointLevelInfo;
}
