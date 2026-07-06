"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/src/shared/utils/cn";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Pesquisar...",
  className,
}: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 focus-within:border-slate-400 dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar pesquisa"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
