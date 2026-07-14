import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Perfis que veem este item; omitido = todos os perfis do painel. */
  roles?: string[];
};

export type NavigationGroup = {
  id: string;
  label: string;
  items: NavigationItem[];
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};
