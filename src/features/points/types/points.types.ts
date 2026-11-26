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
  taskCode: string;
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
