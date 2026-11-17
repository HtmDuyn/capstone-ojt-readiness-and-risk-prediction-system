import API from './api';

export interface AccountNotification {
  id: number;
  title: string;
  content: string | null;
  isRead: boolean;
  sentAt: string | null;
}

export interface AccountNotificationPage {
  items: AccountNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export async function getAccountNotifications(page = 1, signal?: AbortSignal): Promise<AccountNotificationPage> {
  const response = await API.get('/accounts/me/notifications', { params: { page, limit: 20 }, signal });
  return response.data.data;
}

export async function markAccountNotificationRead(id: number): Promise<void> {
  await API.patch(`/accounts/me/notifications/${id}`, { isRead: true });
}
