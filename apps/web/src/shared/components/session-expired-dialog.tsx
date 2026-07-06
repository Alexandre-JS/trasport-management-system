"use client";

import { PrimaryButton } from "@/src/shared/components/action-button";
import { useAuth } from "@/src/shared/hooks/use-auth";

export function SessionExpiredDialog() {
  const { sessionExpired, dismissSessionExpired } = useAuth();

  if (!sessionExpired) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">
          Sessão expirada
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          A sua sessão expirou ou não pôde ser renovada. Inicie sessão para
          continuar.
        </p>
        <div className="mt-5 flex justify-end">
          <PrimaryButton onClick={dismissSessionExpired}>
            Ir para login
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
