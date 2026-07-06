"use client";

import { Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { IconButton } from "@/src/shared/components/action-button";

export function Notifications() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <IconButton
        variant="secondary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        icon={<Bell className="size-4" aria-hidden />}
      >
        Notificações
      </IconButton>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Notificações
            </p>
          </div>
          <div className="flex flex-col items-center px-4 py-8 text-center">
            <BellOff className="size-6 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              Em desenvolvimento
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              A integração com notificações será ligada numa sprint futura.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
