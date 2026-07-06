"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useAuth } from "@/providers/auth-provider";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);

  const name = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Utilizador";
  const email = user?.email ?? "";
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Menu do utilizador"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-brand-100 px-2 py-1.5 transition-colors hover:bg-brand-50 dark:border-brand-900 dark:hover:bg-brand-950"
      >
        <span className="grid size-7 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white shadow-sm ring-1 ring-brand-200 dark:bg-brand-500 dark:ring-brand-800">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            {name}
          </span>
        </span>
        <ChevronDown className="size-4 text-slate-400" aria-hidden />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {name}
            </p>
            {email ? (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {email}
              </p>
            ) : null}
          </div>
          <div className="p-1">
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <UserRound className="size-4 text-brand-500" aria-hidden />
              Perfil
            </Link>
            {/* Configurações fica fora do menu até retomarmos este módulo. */}
          </div>
          <div className="border-t border-slate-200 p-1 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void logout();
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <LogOut className="size-4" aria-hidden />
              Terminar sessão
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
