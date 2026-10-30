import { FeedItem } from '@/features/feed/types/feed.types';

export type SearchScope = 'ALL' | 'USERS' | 'DUAS' | 'GROUPS' | 'POSTS';

export type SearchEntityType = 'KEYWORD' | 'USER' | 'DUA' | 'GROUP';

export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  entityType?: SearchEntityType | null;
  entityId?: string | null;
  entityName?: string | null;
  entityAvatar?: string | null;
  entitySubtext?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddSearchHistoryInput {
  query: string;
  entityType?: SearchEntityType;
  entityId?: string | null;
  entityName?: string | null;
  entityAvatar?: string | null;
  entitySubtext?: string | null;
}

export interface SearchUserItem {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  userStatus?: string;
  badge?: string;
}

export interface SearchDuaItem {
  id: string;
  title: string;
  meaningBangla?: string;
  transliteration?: string;
  duaBangla?: string;
  arabicText?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface SearchGroupItem {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  _count?: {
    members: number;
  };
}

export type SearchPostItem = FeedItem;

export interface GlobalSearchResult {
  query: string;
  scope: SearchScope;
  users: SearchUserItem[];
  duas: SearchDuaItem[];
  groups: SearchGroupItem[];
  posts: SearchPostItem[];
  total: number;
}
