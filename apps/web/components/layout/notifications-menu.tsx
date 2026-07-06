"use client";

import { Bell, BellOff } from "lucide-react";
import { useRef, useState } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notificações"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Bell className="size-4" aria-hidden />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Notificações
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <BellOff className="size-6 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sem notificações por agora.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              A lista é atualizada em tempo real após o início de sessão.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
