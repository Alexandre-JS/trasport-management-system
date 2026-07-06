import {
  AlertTriangle,
  CircleUserRound,
  Gauge,
  MapPin,
  Package,
  Route,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import type {
  BreadcrumbItem,
  NavigationGroup,
  NavigationItem,
} from "@/src/shared/types/navigation";

export const navigationGroups: NavigationGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    items: [
      {
        href: "/",
        label: "Dashboard",
        description: "Visão geral da operação",
        icon: Gauge,
      },
    ],
  },
  {
    id: "operacoes",
    label: "Operações",
    items: [
      {
        href: "/cargas",
        label: "Cargas",
        description: "Pedidos, volumes e estado operacional",
        icon: Package,
      },
      {
        href: "/viagens",
        label: "Viagens",
        description: "Planeamento e acompanhamento",
        icon: Route,
      },
    ],
  },
  {
    id: "cadastros",
    label: "Cadastros",
    items: [
      {
        href: "/contas-cliente",
        label: "Contas e clientes",
        description: "Clientes, acessos ao portal e motoristas",
        icon: Users,
      },
      {
        href: "/frota",
        label: "Frota",
        description: "Camiões, reboques e disponibilidade",
        icon: Truck,
      },
    ],
  },
  {
    id: "monitorizacao",
    label: "Monitorização",
    items: [
      {
        href: "/rastreamento",
        label: "Rastreamento",
        description: "Localização GPS das viagens",
        icon: MapPin,
      },
      {
        href: "/incidentes",
        label: "Incidentes",
        description: "Ocorrências e alertas",
        icon: AlertTriangle,
      },
    ],
  },
  {
    id: "administracao",
    label: "Administração",
    items: [
      // Configurações fica fora do menu principal até retomarmos este módulo.
      {
        href: "/perfil",
        label: "Perfil",
        description: "Conta e preferências pessoais",
        icon: CircleUserRound,
      },
    ],
  },
];

export const navigationItems: NavigationItem[] = navigationGroups.flatMap(
  (group) => group.items,
);

export function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getNavigationItem(pathname: string) {
  return (
    navigationItems.find((item) => isActivePath(pathname, item.href)) ??
    navigationItems[0]
  );
}

export function getNavigationGroup(pathname: string) {
  return (
    navigationGroups.find((group) =>
      group.items.some((item) => isActivePath(pathname, item.href)),
    ) ?? navigationGroups[0]
  );
}

export function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const item = getNavigationItem(pathname);
  const group = getNavigationGroup(pathname);

  if (item.href === "/") {
    return [{ label: item.label, href: item.href }];
  }

  return [
    { label: group.label },
    { label: item.label, href: item.href },
  ];
}

export const companyIdentity = {
  // Empresa/instalação que usa o sistema. Pode mudar por cliente.
  shortName: "LUMAC",
  name: "Transportes & Logística",
  logoSrc: "/lumac-logo.png",
  icon: Warehouse,
};

export const systemIdentity = {
  name: "SGRTC",
  fullName: "Smart Goods Road Transport Control",
  version: "0.1.0",
};
