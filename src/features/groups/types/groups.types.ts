export type GroupVisibility = 'PUBLIC' | 'PRIVATE';
export type GroupMembershipStatus = 'OWNER' | 'ADMIN' | 'MEMBER' | 'PENDING' | 'NONE';

export interface GroupMembershipInfo {
  status: GroupMembershipStatus;
  role: string | null;
  requestId: string | null;
}

export interface GroupItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  visibility: GroupVisibility;
  memberCount: number;
  membership?: GroupMembershipInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupsResponse {
  items: GroupItem[];
  nextCursor?: string | null;
}
