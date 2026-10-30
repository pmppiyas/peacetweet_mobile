export type PostType =
  | 'TEXT'
  | 'DUA'
  | 'BLOOD_REQUEST'
  | 'QUESTION'
  | 'ANNOUNCEMENT';
export type PostVisibility = 'PUBLIC' | 'FOLLOWERS' | 'GROUP';
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'HIDDEN';

export interface FeedAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

export interface DuaReferenceItem {
  id: string;
  reference: string;
  note?: string | null;
  verified?: boolean;
  source?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface FeedDua {
  id: string;
  title?: string;
  fadilah?: string | null;
  transliteration?: string | null;
  meaning?: string;
  meaningBangla?: string;
  arabicText?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  references?: DuaReferenceItem[];
  audios?: any[];
  audioUrl?: string | null;
}

export interface BloodRequestItem {
  id: string;
  requesterId: string;
  forMyself?: boolean;
  patientName: string;
  patientAge?: number | null;
  problem?: string | null;
  bloodGroup: string;
  units: number;
  unitsFulfilled?: number;
  hospitalName: string;
  location: string;
  contactNumber: string;
  alternateContact?: string | null;
  neededDate: string;
  status?: string;
}

export interface FeedStats {
  reactionCount: number;
  commentCount: number;
  saveCount?: number;
  shareCount?: number;
}

export interface FeedViewerState {
  hasReacted: boolean;
  hasSaved: boolean;
  timeSlot?: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | null;
}

export interface FeedItem {
  id: string;
  type: PostType;
  content: string | null;
  mediaUrls?: string[];
  mediaLayout?: 'COLLAGE' | 'SWIPE';
  feeling?: string | null;
  createdAt: string;
  visibility?: PostVisibility;
  status?: PostStatus;
  author: FeedAuthor;
  dua: FeedDua | null;
  bloodRequestId?: string | null;
  bloodRequest?: BloodRequestItem | null;
  stats: FeedStats;
  viewer: FeedViewerState;
  originalPostId?: string | null;
  originalPost?: FeedItem | null;
  isUnavailable?: boolean;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
}

export interface FeedFilters {
  cursor?: string;
  limit?: number;
  type?: PostType;
  authorId?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author: FeedAuthor;
}

export interface CreatePostInput {
  type: PostType;
  content?: string;
  mediaUrls?: string[];
  mediaLayout?: 'COLLAGE' | 'SWIPE';
  feeling?: string;
  duaId?: string;
  duaData?: {
    title?: string;
    transliteration?: string;
    meaning: string;
    fadilah?: string;
    arabicText?: string;
  };
  bloodRequestId?: string;
  bloodRequestData?: {
    patientName: string;
    patientAge?: number;
    problem?: string;
    bloodGroup: string;
    units?: number;
    hospitalName: string;
    location: string;
    contactNumber: string;
    alternateContact?: string;
    neededDate: string;
    forMyself?: boolean;
  };
  visibility?: PostVisibility;
  status?: PostStatus;
}
