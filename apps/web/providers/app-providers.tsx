"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { ConnectionBanner } from "@/src/shared/components/connection-banner";
import { SessionExpiredDialog } from "@/src/shared/components/session-expired-dialog";
import { AuthProvider } from "@/src/shared/providers/auth-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ToastProvider>
          <AuthProvider>
            {children}
            <ConnectionBanner />
            <SessionExpiredDialog />
          </AuthProvider>
        </ToastProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
