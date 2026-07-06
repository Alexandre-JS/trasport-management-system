import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import type { SortOrder } from "@/types/api";
import { cn } from "@/utils/cn";

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
  align?: "left" | "right" | "center";
  headerClassName?: string;
  cellClassName?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  emptyState?: ReactNode;
  hiddenColumns?: Set<string>;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onToggleRow?: (key: string) => void;
  onToggleAll?: (checked: boolean) => void;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (sortKey: string) => void;
  renderActions?: (row: T) => ReactNode;
  footer?: ReactNode;
};

const alignClasses = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyState,
  hiddenColumns,
  selectable = false,
  selectedKeys,
  onToggleRow,
  onToggleAll,
  sortBy,
  sortOrder,
  onSort,
  renderActions,
  footer,
}: DataTableProps<T>) {
  const visibleColumns = columns.filter(
    (column) => !hiddenColumns?.has(column.id),
  );
  const selected = selectedKeys ?? new Set<string>();
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(getRowKey(row)));
  const someSelected = rows.some((row) => selected.has(getRowKey(row)));
  const columnCount =
    visibleColumns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {selectable ? (
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={allSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    onChange={(event) => onToggleAll?.(event.target.checked)}
                    className="size-4 rounded border-slate-300 accent-slate-900 dark:border-slate-600 dark:accent-slate-100"
                  />
                </th>
              ) : null}
              {visibleColumns.map((column) => {
                const activeSortKey = column.sortKey ?? column.id;
                const isActive = column.sortable && sortBy === activeSortKey;

                return (
                  <th
                    key={column.id}
                    scope="col"
                    className={cn(
                      "px-4 py-3 font-semibold text-slate-600 dark:text-slate-300",
                      alignClasses[column.align ?? "left"],
                      column.headerClassName,
                    )}
                  >
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(activeSortKey)}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-900 dark:hover:text-white"
                      >
                        {column.header}
                        {isActive ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden />
                          )
                        ) : (
                          <ArrowUpDown
                            className="size-3.5 text-slate-400"
                            aria-hidden
                          />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {renderActions ? (
                <th
                  scope="col"
                  className="w-40 px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300"
                >
                  Ações
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {Array.from({ length: columnCount }).map((__, cellIndex) => (
                    <td key={`skeleton-cell-${cellIndex}`} className="px-4 py-4">
                      <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-12">
                  {emptyState ?? (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                      Sem registos para apresentar.
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const key = getRowKey(row);
                const isSelected = selected.has(key);

                return (
                  <tr
                    key={key}
                    className={cn(
                      "transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40",
                      isSelected && "bg-slate-50 dark:bg-slate-800/40",
                    )}
                  >
                    {selectable ? (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label="Selecionar registo"
                          checked={isSelected}
                          onChange={() => onToggleRow?.(key)}
                          className="size-4 rounded border-slate-300 accent-slate-900 dark:border-slate-600 dark:accent-slate-100"
                        />
                      </td>
                    ) : null}
                    {visibleColumns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "px-4 py-4 text-slate-700 dark:text-slate-300",
                          alignClasses[column.align ?? "left"],
                          column.cellClassName,
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                    {renderActions ? (
                      <td className="px-4 py-4 text-right">
                        {renderActions(row)}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
