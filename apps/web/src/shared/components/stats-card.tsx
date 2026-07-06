import type { LucideIcon } from "lucide-react";
import { Card } from "@/src/shared/components/card";

type StatsCardProps = {
  label: string;
  value?: string;
  description?: string;
  icon?: LucideIcon;
};

export function StatsCard({
  label,
  value = "-",
  description,
  icon: Icon,
}: StatsCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
        {Icon ? (
          <span className="grid size-10 place-items-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </Card>
  );
}
