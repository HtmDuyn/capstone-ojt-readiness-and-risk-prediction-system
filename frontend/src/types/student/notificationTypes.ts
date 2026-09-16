export type NotificationCategory = 'all' | 'ojt' | 'ai_risk' | 'academic' | 'deadline';
export type NotificationPriority = 'high' | 'medium' | 'low';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: Exclude<NotificationCategory, 'all'>;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  sender: {
    name: string;
    role: string;
    avatar?: string;
  };
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationFilterState {
  category: NotificationCategory;
  onlyUnread: boolean;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'priority';
}
