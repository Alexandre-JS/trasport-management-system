export function PageLoader() {
  return (
    <div
      className="animate-pulse space-y-4"
      role="status"
      aria-live="polite"
      aria-label="A carregar conteúdo"
    >
      <span className="sr-only">A carregar conteúdo...</span>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3.5 w-72 max-w-[70vw] rounded bg-slate-100 dark:bg-slate-800/70" />
        </div>
        <div className="h-8 w-28 rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="flex gap-2 overflow-hidden">
        <div className="h-8 w-56 shrink-0 rounded bg-slate-100 dark:bg-slate-800/70" />
        <div className="h-8 w-32 shrink-0 rounded bg-slate-100 dark:bg-slate-800/70" />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-4 gap-px bg-slate-200 dark:bg-slate-700">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`header-${index}`} className="h-8 bg-slate-100 dark:bg-slate-800" />
          ))}
          {Array.from({ length: 24 }).map((_, index) => (
            <div key={`cell-${index}`} className="h-9 bg-white p-2 dark:bg-slate-900">
              <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
