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
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-[13px] leading-4 tabular-nums">
          <thead className="sticky top-0 z-10 bg-slate-100 shadow-[0_1px_0_0_rgb(203_213_225)] dark:bg-slate-800 dark:shadow-[0_1px_0_0_rgb(51_65_85)]">
            <tr>
              {selectable ? (
                <th scope="col" className="w-9 border-r border-slate-200 px-2 py-2 dark:border-slate-700">
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
                      "whitespace-nowrap border-r border-slate-200 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-600 last:border-r-0 dark:border-slate-700 dark:text-slate-300",
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
                  className="w-24 whitespace-nowrap px-2.5 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-600 dark:text-slate-300"
                >
                  Ações
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 7 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {Array.from({ length: columnCount }).map((__, cellIndex) => (
                    <td key={`skeleton-cell-${cellIndex}`} className="border-b border-r border-slate-200 px-2.5 py-2 last:border-r-0 dark:border-slate-800">
                      <div className="h-3.5 w-full max-w-[140px] animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
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
                      "odd:bg-white even:bg-slate-50/60 hover:!bg-brand-50/70 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 dark:hover:!bg-brand-950/30",
                      isSelected && "!bg-brand-50 dark:!bg-brand-950/40",
                    )}
                  >
                    {selectable ? (
                      <td className="border-b border-r border-slate-200 px-2 py-1.5 dark:border-slate-800">
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
                          "border-b border-r border-slate-200 px-2.5 py-1.5 align-middle text-slate-700 last:border-r-0 dark:border-slate-800 dark:text-slate-300",
                          alignClasses[column.align ?? "left"],
                          column.cellClassName,
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                    {renderActions ? (
                      <td className="border-b border-slate-200 px-2 py-1.5 text-right dark:border-slate-800">
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
