import type { BadgeTone } from "@/components/ui/badge";

export const roleToneMap: Record<string, BadgeTone> = {
  ADMIN: "violet",
  DISPATCHER: "blue",
  DRIVER: "green",
  CLIENT: "slate",
};

export const roleLabelMap: Record<string, string> = {
  ADMIN: "Administrator",
  DISPATCHER: "Dispatcher",
  DRIVER: "Driver",
  CLIENT: "Client",
};

// Referência (espelha o mapa de permissões do backend em core/auth/permissions.ts).
export const roleCatalog = [
  {
    name: "ADMIN",
    description: "Full access to system administration.",
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
    description: "Operational management of cargo, trips, and fleet.",
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
    description: "Field operations through the driver app.",
    permissions: [
      "driver:operate",
      "tracking:manage",
      "delivery:manage",
      "incidents:manage",
    ],
  },
  {
    name: "CLIENT",
    description: "View own cargo and notifications.",
    permissions: ["cargo:read-own", "notifications:read"],
  },
];
