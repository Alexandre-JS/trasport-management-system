import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  showIdentity?: boolean;
};

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
  showIdentity = false,
}: PageHeaderProps) {
  const hasActions = Boolean(primaryAction || secondaryActions);
  if (!showIdentity && !hasActions) return null;

  return (
    <div className={`flex gap-3 ${showIdentity ? "flex-col border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between" : "justify-end"}`}>
      {showIdentity ? (
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      ) : null}
      {hasActions ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {secondaryActions}
          {primaryAction}
        </div>
      ) : null}
    </div>
  );
}
