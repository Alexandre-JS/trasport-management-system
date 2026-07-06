"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getBreadcrumbTrail } from "@/utils/navigation";

export function Breadcrumb() {
  const pathname = usePathname();
  const { section, item } = getBreadcrumbTrail(pathname);
  const showSection = section !== null && section.id !== "geral";

  return (
    <nav
      aria-label="Trilho de navegação"
      className="flex min-w-0 items-center gap-1.5 text-sm"
    >
      <span className="hidden text-slate-500 sm:inline dark:text-slate-400">
        SGRTC
      </span>
      {showSection ? (
        <>
          <ChevronRight
            className="hidden size-3.5 text-slate-300 sm:inline dark:text-slate-600"
            aria-hidden
          />
          <span className="text-slate-500 dark:text-slate-400">
            {section.title}
          </span>
        </>
      ) : null}
      <ChevronRight
        className="size-3.5 text-slate-300 dark:text-slate-600"
        aria-hidden
      />
      <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
        {item.label}
      </span>
    </nav>
  );
}
