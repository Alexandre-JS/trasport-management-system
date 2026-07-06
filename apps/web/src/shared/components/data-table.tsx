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
};

export function DataTable({ columns, children }: DataTableProps) {
  const alignClasses = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
  };

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 ${alignClasses[column.align ?? "left"]}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {!children ? (
        <div className="px-4 py-6">
          <EmptyState />
        </div>
      ) : null}
    </div>
  );
}
