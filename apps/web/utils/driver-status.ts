import type { BadgeTone } from "@/components/ui/badge";
import type { DriverStatus } from "@/types/driver";

export const driverStatusMeta: Record<
  DriverStatus,
  { label: string; tone: BadgeTone }
> = {
  AVAILABLE: { label: "Available", tone: "green" },
  ON_TRIP: { label: "On trip", tone: "blue" },
  OFFLINE: { label: "Offline", tone: "slate" },
  INACTIVE: { label: "Inactive", tone: "red" },
};

export const driverStatusOptions = [
  { label: "All availability statuses", value: "all" },
  { label: "Available", value: "AVAILABLE" },
  { label: "On trip", value: "ON_TRIP" },
  { label: "Offline", value: "OFFLINE" },
  { label: "Inactive", value: "INACTIVE" },
];
