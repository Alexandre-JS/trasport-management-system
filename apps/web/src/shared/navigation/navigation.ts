import {
  AlertTriangle,
  Gauge,
  Landmark,
  MapPin,
  Package,
  Route,
  Truck,
  UserCog,
  Users,
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
    id: "dashboard",
    label: "Dashboard",
    items: [
      {
        href: "/",
        label: "Quadro operacional",
        description: "Registo de viagens em grelha",
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
        label: "Transportadores e equipamentos",
        description: "Horses, trailers próprios e externos",
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
      // "Perfil" saiu do menu lateral — continua acessível pelo menu do
      // avatar (canto superior direito).
      {
        href: "/utilizadores",
        label: "Gestão de Usuários",
        description: "Contas de acesso e perfis de permissões",
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

  if (item.href === "/") {
    return [{ label: item.label, href: item.href }];
  }

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
