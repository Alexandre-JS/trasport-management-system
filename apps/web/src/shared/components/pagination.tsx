import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination() {
  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:flex-row">
      <span>0-0 de 0</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled
          aria-label="Página anterior"
          className="grid size-8 place-items-center rounded-md border border-slate-200 opacity-50 dark:border-slate-700"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span>Página 1 de 1</span>
        <button
          type="button"
          disabled
          aria-label="Página seguinte"
          className="grid size-8 place-items-center rounded-md border border-slate-200 opacity-50 dark:border-slate-700"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
