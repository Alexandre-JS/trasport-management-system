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

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
  void queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
}

/**
 * Mantém a consulta automática desativada enquanto a API de produção agrupa
 * os utilizadores da Vercel no mesmo limite por IP. A contagem volta a ser
 * atualizada pelas invalidações das ações de notificações, sem polling global.
 */
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: [UNREAD_COUNT_KEY],
    queryFn: getUnreadCount,
    enabled: false,
    refetchOnWindowFocus: false,
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
