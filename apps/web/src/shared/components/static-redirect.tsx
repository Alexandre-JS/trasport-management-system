"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export function StaticRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Redirecting…
      </div>
    </main>
  );
}
