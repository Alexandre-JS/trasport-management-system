import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="grid min-h-64 place-items-center">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        A carregar...
      </div>
    </div>
  );
}
