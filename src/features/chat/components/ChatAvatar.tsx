import React from 'react';
import { UserAvatar, AvatarSize } from '@/components/ui/UserAvatar';

export interface ChatAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: AvatarSize;
  isOnline?: boolean;
  showOnlineBadge?: boolean;
  className?: string;
}

export function ChatAvatar(props: ChatAvatarProps) {
  return <UserAvatar {...props} />;
}
