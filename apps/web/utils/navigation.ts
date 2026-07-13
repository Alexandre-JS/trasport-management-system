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
    title: "Operações",
    items: [
      {
        href: "/cargas",
        label: "Cargas",
        description: "Cadastro e estado das cargas",
        icon: Package,
      },
      {
        href: "/viagens",
        label: "Viagens",
        description: "Planeamento e execução",
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
        label: "Contas e clientes",
        description: "Clientes, acessos e motoristas",
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
        label: "Fronteiras",
        description: "Postos fronteiriços das rotas",
        icon: Landmark,
      },
    ],
  },
  {
    id: "monitorizacao",
    title: "Monitorização",
    items: [
      {
        href: "/rastreamento",
        label: "Rastreamento",
        description: "GPS das cargas em curso",
        icon: MapPin,
      },
      {
        href: "/incidentes",
        label: "Incidentes",
        description: "Ocorrências da operação",
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
