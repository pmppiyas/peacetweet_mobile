export interface ChatUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  isOnline?: boolean;
}

export interface SearchedChatUser extends ChatUser {
  isFriend?: boolean;
}

export interface ConversationItem {
  id: string;
  participantOneId?: string;
  participantTwoId?: string;
  otherUser?: ChatUser;
  participant?: ChatUser;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  text: string;
  isRead: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  sender?: ChatUser;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  items?: ChatMessage[];
  nextCursor: string | null;
}

export function getOtherUserFromConversation(
  conversation: ConversationItem | null | undefined
): ChatUser | null {
  if (!conversation) return null;
  return conversation.otherUser || conversation.participant || null;
}
