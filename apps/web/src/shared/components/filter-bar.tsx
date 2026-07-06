import type { ReactNode } from "react";
import { Card } from "@/src/shared/components/card";

type FilterBarProps = {
  children?: ReactNode;
};

export function FilterBar({ children }: FilterBarProps) {
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      {children ?? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Filtros serão configurados nas próximas sprints.
        </p>
      )}
    </Card>
  );
}
