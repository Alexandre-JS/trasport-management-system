"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";

export type ColumnOption = {
  id: string;
  label: string;
  visible: boolean;
};

type ColumnsMenuProps = {
  columns: ColumnOption[];
  onToggle: (id: string) => void;
};

export function ColumnsMenu({ columns, onToggle }: ColumnsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        <span className="hidden sm:inline">Colunas</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Colunas visíveis
          </p>
          {columns.map((column) => (
            <button
              key={column.id}
              type="button"
              onClick={() => onToggle(column.id)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {column.label}
              {column.visible ? (
                <Check className="size-4 text-slate-900 dark:text-slate-100" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
