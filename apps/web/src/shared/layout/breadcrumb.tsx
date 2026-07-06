"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBreadcrumbItems } from "@/src/shared/navigation/navigation";

export function Breadcrumb() {
  const pathname = usePathname();
  const items = getBreadcrumbItems(pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 text-sm"
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 ? (
              <ChevronRight
                className="size-3.5 shrink-0 text-slate-300 dark:text-slate-600"
                aria-hidden
              />
            ) : null}
            {item.href && !last ? (
              <Link
                href={item.href}
                className="truncate text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  last
                    ? "truncate font-semibold text-slate-900 dark:text-slate-100"
                    : "truncate text-slate-500 dark:text-slate-400"
                }
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
