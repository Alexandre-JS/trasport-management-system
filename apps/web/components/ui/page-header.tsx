import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  showIdentity?: boolean;
};

export function PageHeader({ title, description, actions, showIdentity = false }: PageHeaderProps) {
  if (!showIdentity && !actions) return null;

  return (
    <div className={`flex gap-3 ${showIdentity ? "flex-col sm:flex-row sm:items-start sm:justify-between" : "justify-end"}`}>
      {showIdentity ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-normal text-slate-950 dark:text-white">{title}</h2>
          <p className="max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      ) : null}
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
