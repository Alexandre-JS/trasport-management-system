import { http } from "@/services/http";
import type {
  ListNotificationsParams,
  Notification,
  NotificationList,
  UnreadCount,
} from "@/types/notification";
import { cleanParams } from "@/utils/query-params";

export async function listNotifications(
  params: ListNotificationsParams = {},
): Promise<NotificationList> {
  const { data } = await http.get<NotificationList>("/notifications", {
    params: cleanParams(params),
  });

  return data;
}

export async function getUnreadCount(): Promise<UnreadCount> {
  const { data } = await http.get<UnreadCount>("/notifications/unread-count");

  return data;
}

export async function markNotificationAsRead(
  id: string,
): Promise<Notification> {
  const { data } = await http.patch<Notification>(`/notifications/${id}/read`);

  return data;
}

export async function markAllNotificationsAsRead(): Promise<{
  updated: number;
}> {
  const { data } = await http.patch<{ updated: number }>(
    "/notifications/read-all",
  );

  return data;
}

export async function deleteNotification(id: string): Promise<void> {
  await http.delete(`/notifications/${id}`);
}
