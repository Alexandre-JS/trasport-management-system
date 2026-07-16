import type { ReactNode } from "react";
import { EmptyState } from "@/src/shared/components/empty-state";

export type DataTableColumn = {
  id: string;
  header: string;
  align?: "left" | "right" | "center";
};

type DataTableProps = {
  columns: DataTableColumn[];
  children?: ReactNode;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
};

export function DataTable({
  columns,
  children,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: DataTableProps) {
  const alignClasses = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
  };

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-[13px] leading-4 tabular-nums [&_tbody_tr]:odd:bg-white [&_tbody_tr]:even:bg-slate-50/60 [&_tbody_tr]:hover:!bg-brand-50/70 [&_tbody_tr]:dark:odd:bg-slate-900 [&_tbody_tr]:dark:even:bg-slate-900/60 [&_tbody_tr]:dark:hover:!bg-brand-950/30 [&_td]:border-b [&_td]:border-r [&_td]:border-slate-200 [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:align-middle [&_td:last-child]:border-r-0 [&_td]:dark:border-slate-800">
          <thead className="sticky top-0 z-10 bg-slate-100 shadow-[0_1px_0_0_rgb(203_213_225)] dark:bg-slate-800 dark:shadow-[0_1px_0_0_rgb(51_65_85)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`whitespace-nowrap border-r border-slate-200 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-600 last:border-r-0 dark:border-slate-700 dark:text-slate-300 ${alignClasses[column.align ?? "left"]}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {isEmpty ? (
        <div className="px-4 py-6">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        </div>
      ) : null}
    </div>
  );
}
