"use client";

import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationsCount,
} from "@/hooks/use-notifications";
import type { NotificationType } from "@/types/notification";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/src/shared/utils/cn";

const TYPE_META: Record<
  NotificationType,
  { icon: typeof Info; className: string }
> = {
  INFO: { icon: Info, className: "text-sky-500" },
  SUCCESS: { icon: CheckCircle2, className: "text-emerald-500" },
  WARNING: { icon: AlertTriangle, className: "text-amber-500" },
  ERROR: { icon: XCircle, className: "text-rose-500" },
};

export function Notifications() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);

  const unreadCountQuery = useUnreadNotificationsCount();
  const notificationsQuery = useNotifications({ limit: 20 }, open);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const unread = unreadCountQuery.data?.unread ?? 0;
  const badge = unread > 99 ? "99+" : String(unread);
  const notifications = useMemo(
    () => notificationsQuery.data?.data ?? [],
    [notificationsQuery.data],
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={
          unread > 0 ? `Notificações (${unread} por ler)` : "Notificações"
        }
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Notificações
            </p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-50 dark:text-brand-400"
              >
                <CheckCheck className="size-3.5" aria-hidden />
                Marcar todas como lidas
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificationsQuery.isLoading ? (
              <div className="flex items-center justify-center px-4 py-10 text-slate-400">
                <Loader2 className="size-5 animate-spin" aria-hidden />
              </div>
            ) : notificationsQuery.isError ? (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <XCircle
                  className="size-6 text-rose-300 dark:text-rose-500/70"
                  aria-hidden
                />
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Não foi possível carregar as notificações.
                </p>
                <button
                  type="button"
                  onClick={() => void notificationsQuery.refetch()}
                  className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Tentar novamente
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <BellOff
                  className="size-6 text-slate-300 dark:text-slate-600"
                  aria-hidden
                />
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Sem notificações por agora.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notification) => {
                  const meta = TYPE_META[notification.type] ?? TYPE_META.INFO;
                  const Icon = meta.icon;

                  return (
                    <li
                      key={notification.id}
                      className={cn(
                        "group relative flex gap-3 px-4 py-3 transition-colors",
                        notification.isRead
                          ? "bg-white dark:bg-slate-900"
                          : "bg-brand-50/60 dark:bg-brand-950/30",
                      )}
                    >
                      <Icon
                        className={cn("mt-0.5 size-4 shrink-0", meta.className)}
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() =>
                          !notification.isRead &&
                          markAsRead.mutate(notification.id)
                        }
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {!notification.isRead ? (
                            <span
                              className="size-2 shrink-0 rounded-full bg-brand-500"
                              aria-hidden
                            />
                          ) : null}
                          <span className="truncate">{notification.title}</span>
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          deleteNotification.mutate(notification.id)
                        }
                        aria-label="Remover notificação"
                        className="absolute right-2 top-2 grid size-6 place-items-center rounded text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100 dark:hover:bg-slate-800"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
