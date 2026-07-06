import type { BadgeTone } from "@/components/ui/badge";
import type { TruckStatus } from "@/types/truck";

export const truckStatusMeta: Record<
  TruckStatus,
  { label: string; tone: BadgeTone }
> = {
  AVAILABLE: { label: "Disponível", tone: "green" },
  ON_TRIP: { label: "Em viagem", tone: "blue" },
  MAINTENANCE: { label: "Manutenção", tone: "amber" },
  INACTIVE: { label: "Inativo", tone: "red" },
};

export const truckStatusOptions = [
  { label: "Todos os estados", value: "all" },
  { label: "Disponível", value: "AVAILABLE" },
  { label: "Em viagem", value: "ON_TRIP" },
  { label: "Manutenção", value: "MAINTENANCE" },
  { label: "Inativo", value: "INACTIVE" },
];
