import type { BadgeTone } from "@/components/ui/badge";
import type { DriverStatus } from "@/types/driver";

export const driverStatusMeta: Record<
  DriverStatus,
  { label: string; tone: BadgeTone }
> = {
  AVAILABLE: { label: "Disponível", tone: "green" },
  ON_TRIP: { label: "Em viagem", tone: "blue" },
  OFFLINE: { label: "Offline", tone: "slate" },
  INACTIVE: { label: "Inativo", tone: "red" },
};

export const driverStatusOptions = [
  { label: "Todas as disponibilidades", value: "all" },
  { label: "Disponível", value: "AVAILABLE" },
  { label: "Em viagem", value: "ON_TRIP" },
  { label: "Offline", value: "OFFLINE" },
  { label: "Inativo", value: "INACTIVE" },
];
