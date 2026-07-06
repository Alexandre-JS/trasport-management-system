import type { BadgeTone } from "@/components/ui/badge";

export const roleToneMap: Record<string, BadgeTone> = {
  ADMIN: "violet",
  DISPATCHER: "blue",
  DRIVER: "green",
  CLIENT: "slate",
};

export const roleLabelMap: Record<string, string> = {
  ADMIN: "Administrador",
  DISPATCHER: "Operador logístico",
  DRIVER: "Motorista",
  CLIENT: "Cliente",
};

// Referência (espelha o mapa de permissões do backend em core/auth/permissions.ts).
export const roleCatalog = [
  {
    name: "ADMIN",
    description: "Acesso total à administração do sistema.",
    permissions: [
      "users:manage",
      "clients:manage",
      "drivers:manage",
      "trucks:manage",
      "cargo:manage",
      "trips:manage",
      "tracking:manage",
      "delivery:manage",
      "incidents:manage",
      "dashboard:read",
    ],
  },
  {
    name: "DISPATCHER",
    description: "Gestão operacional de cargas, viagens e frota.",
    permissions: [
      "operations:manage",
      "clients:manage",
      "drivers:manage",
      "trucks:manage",
      "cargo:manage",
      "trips:manage",
      "tracking:manage",
      "delivery:manage",
      "incidents:manage",
      "dashboard:read",
    ],
  },
  {
    name: "DRIVER",
    description: "Operação no terreno pela app do motorista.",
    permissions: [
      "driver:operate",
      "tracking:manage",
      "delivery:manage",
      "incidents:manage",
    ],
  },
  {
    name: "CLIENT",
    description: "Consulta das próprias cargas e notificações.",
    permissions: ["cargo:read-own", "notifications:read"],
  },
];
