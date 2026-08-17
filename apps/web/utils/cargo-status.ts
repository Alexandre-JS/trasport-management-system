import type { BadgeTone } from "@/components/ui/badge";
import type { CargoStatus } from "@/types/cargo";

export const cargoStatusMeta: Record<
  CargoStatus,
  { label: string; tone: BadgeTone }
> = {
  CREATED: { label: "Criada", tone: "slate" },
  WAITING_PICKUP: { label: "Aguarda recolha", tone: "amber" },
  PICKED_UP: { label: "Recolhida", tone: "blue" },
  IN_TRANSIT: { label: "In transit", tone: "blue" },
  NEAR_DESTINATION: { label: "Near destination", tone: "violet" },
  DELIVERED: { label: "Entregue", tone: "green" },
  CANCELLED: { label: "Cancelada", tone: "red" },
  INCIDENT: { label: "Com incidente", tone: "red" },
};

/** Tone for the src/shared StatusBadge (neutral/success/warning/danger/info). */
export const cargoStatusBadgeTone: Record<
  CargoStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  CREATED: "neutral",
  WAITING_PICKUP: "warning",
  PICKED_UP: "info",
  IN_TRANSIT: "info",
  NEAR_DESTINATION: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  INCIDENT: "danger",
};

export const cargoStatusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Criada", value: "CREATED" },
  { label: "Aguarda recolha", value: "WAITING_PICKUP" },
  { label: "Recolhida", value: "PICKED_UP" },
  { label: "In transit", value: "IN_TRANSIT" },
  { label: "Near destination", value: "NEAR_DESTINATION" },
  { label: "Entregue", value: "DELIVERED" },
  { label: "Cancelada", value: "CANCELLED" },
  { label: "Com incidente", value: "INCIDENT" },
];
