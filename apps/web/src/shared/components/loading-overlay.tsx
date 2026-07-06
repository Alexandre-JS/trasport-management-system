import { Loader2 } from "lucide-react";

type LoadingOverlayProps = {
  visible: boolean;
  label?: string;
};

export function LoadingOverlay({
  visible,
  label = "A processar...",
}: LoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 grid place-items-center rounded-md bg-white/70 backdrop-blur-sm dark:bg-slate-950/70">
      <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {label}
      </div>
    </div>
  );
}
