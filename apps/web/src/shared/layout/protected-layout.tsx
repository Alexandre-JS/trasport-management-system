"use client";

import { Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { PrimaryButton } from "@/src/shared/components/action-button";
import { ProtectedRoute } from "@/src/shared/components/protected-route";
import { AppLayout } from "@/src/shared/layout/app-layout";
import { useAuth } from "@/src/shared/hooks/use-auth";

type ProtectedLayoutProps = {
  children: ReactNode;
};

/**
 * Keeps non-staff users out of the operations panel: a CLIENT is sent to
 * their portal, and a DRIVER (whose place is the mobile app) gets a clear
 * explanation instead of an admin UI where every call would be rejected.
 */
function StaffOnly({ children }: { children: ReactNode }) {
  const { role, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const isClient = role === "CLIENT";
  const isDriver = role === "DRIVER";

  useEffect(() => {
    if (!isLoading && isAuthenticated && isClient) {
      router.replace("/portal");
    }
  }, [isLoading, isAuthenticated, isClient, router]);

  if (isClient) {
    return null;
  }

  if (isDriver) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <Smartphone
            className="mx-auto size-10 text-brand-600 dark:text-brand-400"
            aria-hidden
          />
          <h1 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
            Conta de motorista
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Este painel é da equipa de operações. Para veres as tuas viagens e
            registares as entregas, usa a <strong>app do motorista</strong> no
            telemóvel — entra com as mesmas credenciais.
          </p>
          <div className="mt-5 flex justify-center">
            <PrimaryButton
              onClick={() => {
                void logout().then(() => router.replace("/login"));
              }}
            >
              Terminar sessão
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <StaffOnly>
        <AppLayout>{children}</AppLayout>
      </StaffOnly>
    </ProtectedRoute>
  );
}
