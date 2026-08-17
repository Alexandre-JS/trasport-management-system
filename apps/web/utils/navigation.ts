import {
  AlertTriangle,
  Landmark,
  LayoutDashboard,
  MapPin,
  Package,
  Route,
  Truck,
  Users,
} from "lucide-react";
import type {
  BreadcrumbTrail,
  NavigationItem,
  NavigationSection,
} from "@/types/navigation";

export const navigationSections: NavigationSection[] = [
  {
    id: "geral",
    title: "Geral",
    items: [
      {
        href: "/",
        label: "Dashboard",
        description: "Indicadores operacionais",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "operacoes",
    title: "Operations",
    items: [
      {
        href: "/cargas",
        label: "Shipments",
        description: "Shipment records and status",
        icon: Package,
      },
      {
        href: "/viagens",
        label: "Viagens",
        description: "Planning and execution",
        icon: Route,
      },
    ],
  },
  {
    id: "cadastros",
    title: "Cadastros",
    items: [
      {
        href: "/contas-cliente",
        label: "Accounts and clients",
        description: "Clients, access accounts and drivers",
        icon: Users,
      },
      {
        href: "/frota",
        label: "Frota",
        description: "Horses, trailers e disponibilidade",
        icon: Truck,
      },
      {
        href: "/fronteiras",
        label: "Borders",
        description: "Route border posts",
        icon: Landmark,
      },
    ],
  },
  {
    id: "monitorizacao",
    title: "Monitoring",
    items: [
      {
        href: "/rastreamento",
        label: "Rastreamento",
        description: "GPS for active shipments",
        icon: MapPin,
      },
      {
        href: "/incidentes",
        label: "Incidentes",
        description: "Operational incidents",
        icon: AlertTriangle,
      },
    ],
  },
  // Configurações fica fora do menu principal até retomarmos este módulo.
];

export const navigationItems: NavigationItem[] = navigationSections.flatMap(
  (section) => section.items,
);

export function isItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getBreadcrumbTrail(pathname: string): BreadcrumbTrail {
  for (const section of navigationSections) {
    const item = section.items.find((candidate) =>
      isItemActive(pathname, candidate.href),
    );

    if (item) {
      return { section, item };
    }
  }

  return { section: null, item: navigationItems[0] };
}

export function getNavigationItem(pathname: string): NavigationItem {
  return getBreadcrumbTrail(pathname).item;
}
