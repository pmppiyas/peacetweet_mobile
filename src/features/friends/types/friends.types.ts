export interface FriendUser {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  location?: string | null;
  bio?: string | null;
  mutualFriendsCount?: number;
}

export interface FriendItem {
  id: string;
  friendId: string;
  friendSince?: string;
  user: FriendUser;
}

export interface FriendRequestItem {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  sender?: FriendUser;
  receiver?: FriendUser;
}

export interface FriendshipStatusResponse {
  status: 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';
  requestId?: string | null;
}

export interface PaginatedFriendsResponse {
  items: FriendItem[];
  nextCursor?: string | null;
  total?: number;
}

export interface PaginatedFriendRequestsResponse {
  items: FriendRequestItem[];
  nextCursor?: string | null;
  total?: number;
}

export interface FriendActionResponse {
  success: boolean;
  message?: string;
}
