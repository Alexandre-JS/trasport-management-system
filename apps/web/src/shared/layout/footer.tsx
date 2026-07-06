import { systemIdentity } from "@/src/shared/navigation/navigation";

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-slate-200 px-4 py-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {systemIdentity.name} v{systemIdentity.version}
        </span>
        <span>{systemIdentity.fullName}</span>
      </div>
    </footer>
  );
}
