"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { navigationItems } from "@/utils/navigation";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useClickOutside(containerRef, () => setOpen(false), open);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return navigationItems;
    }

    return navigationItems.filter(
      (item) =>
        item.label.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term),
    );
  }, [query]);

  function goTo(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:focus-within:border-slate-500">
        <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results[0]) {
              goTo(results[0].href);
            }
          }}
          placeholder="Pesquisar páginas..."
          aria-label="Pesquisa global"
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Sem resultados para “{query}”.
            </p>
          ) : (
            results.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => goTo(item.href)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Icon className="size-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {item.label}
                    </span>
                    <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
