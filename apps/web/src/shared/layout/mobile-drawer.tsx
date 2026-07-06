"use client";

import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  companyIdentity,
  isActivePath,
  navigationGroups,
} from "@/src/shared/navigation/navigation";
import { cn } from "@/src/shared/utils/cn";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 left-0 flex w-80 max-w-[86vw] flex-col border-r border-brand-100 bg-white dark:border-brand-950 dark:bg-slate-950">
        <div className="flex h-24 items-center justify-between border-b border-brand-100 px-4 dark:border-brand-950">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-16 w-48 max-w-[62vw] shrink-0 place-items-center overflow-hidden rounded-md bg-white px-3 shadow-sm ring-1 ring-brand-100">
              <Image
                src={companyIdentity.logoSrc}
                alt=""
                width={132}
                height={43}
                className="h-12 w-full object-contain"
                priority
              />
            </span>
            <span className="sr-only">
              {companyIdentity.shortName} {companyIdentity.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="grid size-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="flex flex-col gap-5">
            {navigationGroups.map((group) => (
              <div key={group.id} className="flex flex-col gap-1">
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500 dark:text-white"
                          : "text-slate-600 hover:bg-brand-50 hover:text-brand-800 dark:text-slate-300 dark:hover:bg-brand-950 dark:hover:text-white",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </div>
  );
}
