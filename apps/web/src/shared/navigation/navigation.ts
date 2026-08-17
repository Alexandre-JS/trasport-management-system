import {
  ClipboardList,
  AlertTriangle,
  MapPin,
  Signpost,
  Table2,
  UserCog,
  Warehouse,
} from "lucide-react";
import type {
  BreadcrumbItem,
  NavigationGroup,
  NavigationItem,
} from "@/src/shared/types/navigation";
import { APP_VERSION } from "@/version";

export const navigationGroups: NavigationGroup[] = [
  {
    id: "operacao",
    label: "Operations",
    items: [
      {
        href: "/",
        label: "Quadro operacional",
        description: "Registo de viagens em grelha",
        icon: Table2,
      },
      {
        href: "/viagens",
        label: "Atividades",
        description: "Client and route sheets with shipment tracking",
        icon: ClipboardList,
      },
    ],
  },
  {
    id: "acompanhamento",
    label: "Acompanhamento",
    items: [
      {
        href: "/rastreamento",
        label: "Rastreamento",
        description: "Trip GPS locations",
        icon: MapPin,
      },
      {
        href: "/incidentes",
        label: "Incidentes",
        description: "Operational incidents and alerts",
        icon: AlertTriangle,
      },
    ],
  },
  {
    id: "dados-apoio",
    label: "Dados de apoio",
    items: [
      {
        href: "/fronteiras",
        label: "Borders",
        description: "Route border posts",
        icon: Signpost,
      },
    ],
  },
  {
    id: "administracao",
    label: "Administration",
    items: [
      // Configurações fica fora do menu principal até retomarmos este módulo.
      // "Perfil" saiu do menu lateral — continua acessível pelo menu do
      // avatar (canto superior direito).
      {
        href: "/utilizadores",
        label: "User management",
        description: "Access accounts and permission profiles",
        icon: UserCog,
        roles: ["ADMIN"],
      },
    ],
  },
];

export const navigationItems: NavigationItem[] = navigationGroups.flatMap(
  (group) => group.items,
);

/** Grupos visíveis para um perfil (itens sem `roles` aparecem a todos). */
export function getNavigationGroupsForRole(
  role: string | null,
): NavigationGroup[] {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || (role !== null && item.roles.includes(role)),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function getNavigationItemsForRole(
  role: string | null,
): NavigationItem[] {
  return getNavigationGroupsForRole(role).flatMap((group) => group.items);
}

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

  return [{ label: group.label }, { label: item.label, href: item.href }];
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
  version: APP_VERSION,
};
