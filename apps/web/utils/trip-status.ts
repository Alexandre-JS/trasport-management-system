import type { BadgeTone } from "@/components/ui/badge";
import type { TripEventType, TripStatus } from "@/types/trip";

export const tripStatusMeta: Record<
  TripStatus,
  { label: string; tone: BadgeTone }
> = {
  WAITING_APPOINTMENT: { label: "Aguarda marcação", tone: "slate" },
  APPOINTMENT_DONE: { label: "Marcação feita", tone: "violet" },
  LOADED: { label: "Carregada", tone: "blue" },
  DISPATCHED_ORIGIN: { label: "Despachada", tone: "blue" },
  AT_BORDER: { label: "Na fronteira", tone: "amber" },
  BORDER_CLEARED: { label: "Fronteira liberada", tone: "amber" },
  ARRIVED: { label: "Chegou", tone: "green" },
  DISCHARGED: { label: "Descarregada", tone: "green" },
  CANCELLED: { label: "Cancelada", tone: "red" },
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

export const terminalTripStatuses: TripStatus[] = ["DISCHARGED", "CANCELLED"];

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

export const tripStatusOptions: { label: string; value: TripStatus | "all" }[] =
  [
    { label: "Todos os estados", value: "all" },
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
  DISPATCHED_ORIGIN: "Despacho (origem)",
  AT_BORDER: "Chegada à fronteira",
  BORDER_CLEARED: "Fronteira liberada",
  ARRIVED: "Chegada ao destino",
  DISCHARGED: "Descarga",
  STATUS_CHANGE: "Mudança de estado",
};
