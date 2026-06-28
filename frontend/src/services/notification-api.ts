import apiClient from './api-client';

export interface BackendNotification {
  id: number;
  userId: number;
  paymentRequestId: number | null;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdDate: string;
}

export interface NotificationsResponse {
  notifications: BackendNotification[];
  unreadCount: number;
}

export const fetchNotifications = async (): Promise<NotificationsResponse> => {
  const response = await apiClient.get<NotificationsResponse>('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.patch('/notifications/read-all');
};
