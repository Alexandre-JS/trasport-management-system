import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type NavigationSection = {
  id: string;
  title: string;
  items: NavigationItem[];
};

export type BreadcrumbTrail = {
  section: NavigationSection | null;
  item: NavigationItem;
};
