"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export type ActionItem = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  tone?: "default" | "info" | "success" | "warning" | "danger" | "muted";
  separatorBefore?: boolean;
};

type ActionMenuProps = {
  items: ActionItem[];
  label?: string;
};

const toneClasses: Record<NonNullable<ActionItem["tone"]>, string> = {
  default:
    "border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-900",
  info: "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900",
  success:
    "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900",
  warning:
    "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900",
  danger:
    "border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200 dark:hover:bg-rose-900",
  muted:
    "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
};

function inferActionTone(item: ActionItem): NonNullable<ActionItem["tone"]> {
  if (item.tone) {
    return item.tone;
  }

  const label = item.label.toLowerCase();

  if (label.includes("eliminar") || label.includes("cancelar")) {
    return "danger";
  }

  if (
    label.includes("resolver") ||
    label.includes("encerrar") ||
    label.includes("disponível") ||
    label.includes("ativar")
  ) {
    return "success";
  }

  if (label.includes("editar") || label.includes("manutenção")) {
    return "warning";
  }

  if (label.includes("offline") || label.includes("desativar")) {
    return "muted";
  }

  if (label.includes("visualizar") || label.includes("detalhes")) {
    return "info";
  }

  return "default";
}

export function ActionMenu({ items, label = "Ações" }: ActionMenuProps) {
  return (
    <div className="flex items-center justify-end gap-1.5" aria-label={label}>
      {items.map((item) => {
        const Icon = item.icon;
        const tone = inferActionTone(item);

        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onSelect}
            aria-label={item.label}
            title={item.label}
            className={cn(
              "grid size-8 place-items-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
              item.separatorBefore && "ml-1.5",
              toneClasses[tone],
            )}
          >
            {Icon ? <Icon className="size-4" aria-hidden /> : null}
            <span className="sr-only">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
