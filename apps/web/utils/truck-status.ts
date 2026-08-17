import type { BadgeTone } from "@/components/ui/badge";
import type { TruckStatus } from "@/types/truck";

export const truckStatusMeta: Record<
  TruckStatus,
  { label: string; tone: BadgeTone }
> = {
  AVAILABLE: { label: "Available", tone: "green" },
  ON_TRIP: { label: "On trip", tone: "blue" },
  MAINTENANCE: { label: "Maintenance", tone: "amber" },
  INACTIVE: { label: "Inativo", tone: "red" },
};

export const truckStatusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Available", value: "AVAILABLE" },
  { label: "On trip", value: "ON_TRIP" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Inativo", value: "INACTIVE" },
];
