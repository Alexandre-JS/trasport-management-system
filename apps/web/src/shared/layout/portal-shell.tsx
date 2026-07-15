"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { ProtectedRoute } from "@/src/shared/components/protected-route";
import { useAuth } from "@/src/shared/hooks/use-auth";

export function PortalShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header data-print-hide className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <Image
                src="/lumac-logo.png"
                alt="LUMAC Transportes & Logística"
                width={876}
                height={284}
                priority
                className="h-8 w-auto"
              />
              <span className="hidden text-sm font-medium text-slate-500 dark:text-slate-400 sm:inline">
                Portal do Cliente
              </span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">
                  {user.firstName} {user.lastName}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Terminar sessão</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
