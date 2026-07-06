import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <AuthGuard>
      <div className="h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <Sidebar />
        <div className="flex h-screen min-h-0 flex-col overflow-hidden lg:pl-72">
          <Header />
          <main className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col gap-5 overflow-y-auto px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
