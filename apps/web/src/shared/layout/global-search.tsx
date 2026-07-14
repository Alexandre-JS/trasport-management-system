"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getNavigationItemsForRole } from "@/src/shared/navigation/navigation";
import { useAuth } from "@/src/shared/hooks/use-auth";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { role } = useAuth();

  const results = useMemo(() => {
    const items = getNavigationItemsForRole(role);
    const term = query.trim().toLowerCase();

    if (!term) {
      return items;
    }

    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term),
    );
  }, [query, role]);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div className="relative w-full max-w-sm">
      <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 focus-within:border-slate-400 dark:border-slate-700 dark:bg-slate-950/40">
        <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results[0]) {
              navigate(results[0].href);
            }
          }}
          placeholder="Pesquisar páginas..."
          aria-label="Pesquisa global"
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {results.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.href}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => navigate(item.href)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Icon className="size-4 shrink-0 text-slate-400" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
