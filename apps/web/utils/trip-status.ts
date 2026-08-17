import type { BadgeTone } from "@/components/ui/badge";
import type { TripEventType, TripStatus } from "@/types/trip";

export const tripStatusMeta: Record<
  TripStatus,
  { label: string; tone: BadgeTone }
> = {
  WAITING_APPOINTMENT: { label: "Awaiting appointment", tone: "slate" },
  APPOINTMENT_DONE: { label: "Appointment completed", tone: "violet" },
  LOADED: { label: "Loaded", tone: "blue" },
  DISPATCHED_ORIGIN: { label: "Dispatched", tone: "blue" },
  AT_BORDER: { label: "At border", tone: "amber" },
  BORDER_CLEARED: { label: "Border cleared", tone: "amber" },
  ARRIVED: { label: "Arrived", tone: "green" },
  DISCHARGED: { label: "Discharged", tone: "green" },
  CONTAINER_RETURN_PENDING: { label: "Container return pending", tone: "amber" },
  CONTAINER_RETURNED: { label: "Container returned", tone: "green" },
  CANCELLED: { label: "Cancelled", tone: "red" },
};

/**
 * Business lifecycle order. Advancing exactly one step is legal (mirrors the
 * backend TripStateMachine); CANCELLED is reachable from any non-terminal state.
 */
export const tripStatusSequence: TripStatus[] = [
  "WAITING_APPOINTMENT",
  "APPOINTMENT_DONE",
  "LOADED",
  "DISPATCHED_ORIGIN",
  "AT_BORDER",
  "BORDER_CLEARED",
  "ARRIVED",
  "DISCHARGED",
];

export const terminalTripStatuses: TripStatus[] = [
  "DISCHARGED",
  "CONTAINER_RETURNED",
  "CANCELLED",
];

export function isTerminalTripStatus(status: TripStatus): boolean {
  return terminalTripStatuses.includes(status);
}

/** The next legal status in the sequence, or null if terminal / at the end. */
export function nextTripStatus(status: TripStatus): TripStatus | null {
  if (isTerminalTripStatus(status)) {
    return null;
  }
  const index = tripStatusSequence.indexOf(status);
  return index >= 0 && index < tripStatusSequence.length - 1
    ? tripStatusSequence[index + 1]
    : null;
}

/** Skip the border cycle when this route has no crossing left to process. */
export function nextTripStatusForRoute(
  status: TripStatus,
  borders: BorderCrossing[],
): TripStatus | null {
  if (
    (status === "DISPATCHED_ORIGIN" || status === "BORDER_CLEARED") &&
    !borders.some((crossing) => !crossing.clearedAt)
  ) {
    return "ARRIVED";
  }

  return nextTripStatus(status);
}

export const tripStatusOptions: { label: string; value: TripStatus | "all" }[] =
  [
    { label: "All statuses", value: "all" },
    ...tripStatusSequence.map((status) => ({
      label: tripStatusMeta[status].label,
      value: status,
    })),
    { label: tripStatusMeta.CANCELLED.label, value: "CANCELLED" as const },
  ];

/** Tone for the src/shared StatusBadge (neutral/success/warning/danger/info). */
export const tripStatusBadgeTone: Record<
  TripStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  WAITING_APPOINTMENT: "neutral",
  APPOINTMENT_DONE: "neutral",
  LOADED: "info",
  DISPATCHED_ORIGIN: "info",
  AT_BORDER: "warning",
  BORDER_CLEARED: "warning",
  ARRIVED: "success",
  DISCHARGED: "success",
  CONTAINER_RETURN_PENDING: "warning",
  CONTAINER_RETURNED: "success",
  CANCELLED: "danger",
};

type BorderCrossing = {
  arrivedAt: string | null;
  clearedAt: string | null;
  border: { name: string };
};

/** "Machipanda › Chirundu" — the route's crossings in order, or null if none. */
export function borderNames(borders: BorderCrossing[]): string | null {
  if (borders.length === 0) {
    return null;
  }
  return borders.map((crossing) => crossing.border.name).join(" › ");
}

/** The crossing the trip still has to clear (first uncleared), if any. */
export function activeBorder<T extends BorderCrossing>(
  borders: T[],
): T | null {
  return borders.find((crossing) => !crossing.clearedAt) ?? null;
}

export const tripEventTypeLabel: Record<TripEventType, string> = {
  DISPATCHED_ORIGIN: "Dispatched from origin",
  AT_BORDER: "Arrived at border",
  BORDER_CLEARED: "Border cleared",
  ARRIVED: "Arrived at destination",
  DISCHARGED: "Discharged",
  STATUS_CHANGE: "Status changed",
};
