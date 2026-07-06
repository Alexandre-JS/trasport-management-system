"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  companyIdentity,
  isActivePath,
  navigationGroups,
} from "@/src/shared/navigation/navigation";
import { cn } from "@/src/shared/utils/cn";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-brand-100 bg-white transition-[width] duration-200 lg:flex dark:border-brand-950 dark:bg-slate-950",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div
        className={cn(
          "flex h-24 items-center border-b border-brand-100 px-4 dark:border-brand-950",
          collapsed ? "justify-center" : "justify-start",
        )}
      >
        <Link
          href="/"
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-brand-100 dark:bg-white",
            collapsed ? "size-14 p-1.5" : "h-16 w-full max-w-52 px-3",
          )}
          aria-label={companyIdentity.name}
        >
          <Image
            src={companyIdentity.logoSrc}
            alt=""
            width={132}
            height={43}
            className={cn(
              "object-contain",
              collapsed ? "size-full" : "h-12 w-full",
            )}
            priority
          />
        </Link>
        {!collapsed ? (
          <span className="sr-only">
            {companyIdentity.shortName} {companyIdentity.name}
          </span>
        ) : null}
      </div>

      <nav
        aria-label="Navegação principal"
        className="flex-1 overflow-y-auto px-3 py-5"
      >
        <div className="flex flex-col gap-5">
          {navigationGroups.map((group) => (
            <div key={group.id} className="flex flex-col gap-1">
              {!collapsed ? (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-10 items-center rounded-md text-sm font-medium transition-colors",
                      collapsed ? "justify-center px-0" : "gap-3 px-3",
                      active
                        ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500 dark:text-white"
                        : "text-slate-600 hover:bg-brand-50 hover:text-brand-800 dark:text-slate-300 dark:hover:bg-brand-950 dark:hover:text-white",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {!collapsed ? (
                      <span className="truncate">{item.label}</span>
                    ) : (
                      <span className="sr-only">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-brand-100 p-3 dark:border-brand-950">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          className="flex h-9 w-full items-center justify-center rounded-md border border-brand-100 text-brand-700 hover:bg-brand-50 dark:border-brand-900 dark:text-brand-200 dark:hover:bg-brand-950"
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden />
          ) : (
            <ChevronLeft className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </aside>
  );
}
