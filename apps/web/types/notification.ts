import type { PaginationMeta } from "@/types/api";

export type NotificationType = "INFO" | "WARNING" | "SUCCESS" | "ERROR";

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationListMeta = PaginationMeta & {
  unread: number;
};

export type NotificationList = {
  data: Notification[];
  meta: NotificationListMeta;
};

export type UnreadCount = {
  unread: number;
};

export type ListNotificationsParams = {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
};
