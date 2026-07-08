"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notifications-service";
import type { ListNotificationsParams } from "@/types/notification";

const NOTIFICATIONS_KEY = "notifications";
const UNREAD_COUNT_KEY = "notifications-unread-count";
const UNREAD_POLL_INTERVAL = 30_000;

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
  void queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
}

/** Polls the unread badge count; safe to mount app-wide behind auth. */
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: [UNREAD_COUNT_KEY],
    queryFn: getUnreadCount,
    refetchInterval: UNREAD_POLL_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

/** Fetches the notifications list; disabled until `enabled` (e.g. panel open). */
export function useNotifications(
  params: ListNotificationsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, params],
    queryFn: () => listNotifications(params),
    enabled,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}
