"use client";

import { Menu } from "lucide-react";
import { IconButton } from "@/src/shared/components/action-button";
import { Breadcrumb } from "@/src/shared/layout/breadcrumb";
import { GlobalSearch } from "@/src/shared/layout/global-search";
import { ThemeToggle } from "@/src/shared/layout/theme-toggle";
import { UserMenu } from "@/src/shared/layout/user-menu";

type HeaderProps = {
  onOpenMenu: () => void;
};

export function Header({ onOpenMenu }: HeaderProps) {
  return (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="lg:hidden">
            <IconButton
              variant="secondary"
              onClick={onOpenMenu}
              icon={<Menu className="size-4" aria-hidden />}
            >
              Abrir menu
            </IconButton>
          </span>
          <Breadcrumb />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden w-80 md:block">
            <GlobalSearch />
          </div>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
