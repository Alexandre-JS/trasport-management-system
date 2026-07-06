import { ShieldAlert } from "lucide-react";
import { AppLayout } from "@/src/shared/layout/app-layout";

export function UnauthorizedPage() {
  return (
    <AppLayout>
      <div className="rounded-md border border-amber-200 bg-amber-50 px-6 py-12 text-center dark:border-amber-900/60 dark:bg-amber-950/30">
        <ShieldAlert className="mx-auto size-8 text-amber-600 dark:text-amber-300" aria-hidden />
        <h1 className="mt-4 text-lg font-semibold text-amber-950 dark:text-amber-100">
          Acesso não autorizado
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-800 dark:text-amber-200">
          A sua conta não possui permissões suficientes para aceder a esta
          área.
        </p>
      </div>
    </AppLayout>
  );
}
