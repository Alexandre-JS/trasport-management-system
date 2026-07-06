"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/ui/select";

type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export function Pagination({
  page,
  limit,
  total,
  totalPages,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row dark:border-slate-800">
      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span>
          {from}–{to} de {total}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Por página</span>
          <Select
            aria-label="Registos por página"
            value={String(limit)}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            options={pageSizeOptions.map((size) => ({
              label: String(size),
              value: String(size),
            }))}
            className="h-8 w-20"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="grid size-8 place-items-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Página {page} de {safeTotalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotalPages}
          aria-label="Página seguinte"
          className="grid size-8 place-items-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
