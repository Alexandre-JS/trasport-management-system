import { BadRequestException, Injectable } from '@nestjs/common';
import { TripStatus, TripEventType } from '@prisma/client';

/**
 * Single source of truth for the meaning and legal transitions of a Trip's
 * lifecycle. No other place in the codebase should hardcode lists of statuses —
 * derive from the methods here (notably `occupyingStatuses()`).
 *
 * Business sequence (order matters — advancing exactly one step is legal):
 *   WAITING_APPOINTMENT -> APPOINTMENT_DONE -> LOADED -> DISPATCHED_ORIGIN
 *   -> AT_BORDER -> BORDER_CLEARED -> ARRIVED -> DISCHARGED
 * CANCELLED is terminal and reachable from any non-terminal state.
 *
 * A route may cross several borders (or none), so two extra edges exist:
 *   BORDER_CLEARED -> AT_BORDER      (next border post of the route)
 *   DISPATCHED_ORIGIN -> ARRIVED     (route with no border crossing)
 * Whether the trip actually has pending/no borders is contextual and is
 * enforced by the repository at transition time, not here.
 */
const SEQUENCE: readonly TripStatus[] = [
  TripStatus.WAITING_APPOINTMENT,
  TripStatus.APPOINTMENT_DONE,
  TripStatus.LOADED,
  TripStatus.DISPATCHED_ORIGIN,
  TripStatus.AT_BORDER,
  TripStatus.BORDER_CLEARED,
  TripStatus.ARRIVED,
  TripStatus.DISCHARGED,
];

const TERMINAL_STATUSES: readonly TripStatus[] = [
  TripStatus.DISCHARGED,
  TripStatus.CONTAINER_RETURNED,
  TripStatus.CANCELLED,
];

const RESOURCE_HOLDING_STATUSES: readonly TripStatus[] = [
  TripStatus.WAITING_APPOINTMENT,
  TripStatus.APPOINTMENT_DONE,
  TripStatus.LOADED,
  TripStatus.DISPATCHED_ORIGIN,
  TripStatus.AT_BORDER,
  TripStatus.BORDER_CLEARED,
  TripStatus.ARRIVED,
];

/** Multi-border cycle and no-border shortcut (see header comment). */
const EXTRA_TRANSITIONS: ReadonlyArray<readonly [TripStatus, TripStatus]> = [
  [TripStatus.BORDER_CLEARED, TripStatus.AT_BORDER],
  [TripStatus.DISPATCHED_ORIGIN, TripStatus.ARRIVED],
];

/**
 * Geographic milestone event <-> target status. Identity-named but mapped
 * explicitly for safety. STATUS_CHANGE (the generic administrative type) is
 * intentionally absent — it has no single target status.
 */
const STATUS_BY_EVENT: Readonly<Partial<Record<TripEventType, TripStatus>>> = {
  [TripEventType.DISPATCHED_ORIGIN]: TripStatus.DISPATCHED_ORIGIN,
  [TripEventType.AT_BORDER]: TripStatus.AT_BORDER,
  [TripEventType.BORDER_CLEARED]: TripStatus.BORDER_CLEARED,
  [TripEventType.ARRIVED]: TripStatus.ARRIVED,
  [TripEventType.DISCHARGED]: TripStatus.DISCHARGED,
};

const EVENT_BY_STATUS: Readonly<Partial<Record<TripStatus, TripEventType>>> = {
  [TripStatus.DISPATCHED_ORIGIN]: TripEventType.DISPATCHED_ORIGIN,
  [TripStatus.AT_BORDER]: TripEventType.AT_BORDER,
  [TripStatus.BORDER_CLEARED]: TripEventType.BORDER_CLEARED,
  [TripStatus.ARRIVED]: TripEventType.ARRIVED,
  [TripStatus.DISCHARGED]: TripEventType.DISCHARGED,
};

@Injectable()
export class TripStateMachine {
  isTerminal(status: TripStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
  }

  /**
   * Só os estados de trânsito seguram o camião/motorista. A descarga
   * (DISCHARGED) e tudo o que venha depois — incluindo a devolução do
   * container vazio — já não bloqueiam a frota: o camião fica livre para
   * outra viagem enquanto a devolução do container é tratada como tarefa
   * de acompanhamento.
   */
  occupiesResources(status: TripStatus): boolean {
    return RESOURCE_HOLDING_STATUSES.includes(status);
  }

  /**
   * Every status whose trips still hold resources — derived from
   * `occupiesResources()`, never hardcoded. Anti-double-booking queries must
   * use this so a newly added status is handled by the machine alone.
   */
  occupyingStatuses(): TripStatus[] {
    return Object.values(TripStatus).filter((status) =>
      this.occupiesResources(status),
    );
  }

  canTransition(from: TripStatus, to: TripStatus): boolean {
    if (from === to) {
      return false;
    }
    // No transition leaves a terminal state.
    if (this.isTerminal(from)) {
      return false;
    }
    // Cancellation is reachable from any non-terminal state.
    if (to === TripStatus.CANCELLED) {
      return true;
    }
    if (EXTRA_TRANSITIONS.some(([f, t]) => f === from && t === to)) {
      return true;
    }
    const fromIndex = SEQUENCE.indexOf(from);
    const toIndex = SEQUENCE.indexOf(to);
    if (fromIndex === -1 || toIndex === -1) {
      return false;
    }
    // Only a single forward step in the business sequence is legal.
    return toIndex === fromIndex + 1;
  }

  assertTransition(from: TripStatus, to: TripStatus): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(
        `Illegal trip status transition: ${from} -> ${to}`,
      );
    }
  }

  /**
   * Target status a geographic milestone event drives the trip into.
   * STATUS_CHANGE is not a milestone (no single target) — reject it.
   */
  statusForEvent(type: TripEventType): TripStatus {
    const status = STATUS_BY_EVENT[type];
    if (!status) {
      throw new BadRequestException(
        `${type} is not a milestone event type; use PATCH status instead`,
      );
    }
    return status;
  }

  /**
   * Event type that audits a transition into `status`: the specific geographic
   * milestone for the 5 marcos, or the generic STATUS_CHANGE for administrative
   * transitions. Every transition is auditable — the detail lives in from/to.
   */
  eventForStatus(status: TripStatus): TripEventType {
    return EVENT_BY_STATUS[status] ?? TripEventType.STATUS_CHANGE;
  }
}
