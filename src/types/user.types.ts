export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export type UserStatus = 'NON_VERIFIED' | 'VERIFIED' | 'PREMIUM';

export type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  userStatus?: UserStatus;
  badge?: string;
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
  hasPassword?: boolean;
  needPasswordUpdate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  location?: string;
  bloodGroup?: BloodGroup;
}

export interface LoginInput {
  identifier: string;
  password: string;
}
