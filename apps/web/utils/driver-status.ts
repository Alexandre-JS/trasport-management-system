import type { BadgeTone } from "@/components/ui/badge";
import type { DriverStatus } from "@/types/driver";

export const driverStatusMeta: Record<
  DriverStatus,
  { label: string; tone: BadgeTone }
> = {
  AVAILABLE: { label: "Available", tone: "green" },
  ON_TRIP: { label: "On trip", tone: "blue" },
  OFFLINE: { label: "Offline", tone: "slate" },
  INACTIVE: { label: "Inativo", tone: "red" },
};

export const driverStatusOptions = [
  { label: "Todas as disponibilidades", value: "all" },
  { label: "Available", value: "AVAILABLE" },
  { label: "On trip", value: "ON_TRIP" },
  { label: "Offline", value: "OFFLINE" },
  { label: "Inativo", value: "INACTIVE" },
];
