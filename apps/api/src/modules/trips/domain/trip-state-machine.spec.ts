import { BadRequestException } from '@nestjs/common';
import { TripEventType, TripStatus } from '@prisma/client';
import { TripStateMachine } from './trip-state-machine';

describe('TripStateMachine', () => {
  const machine = new TripStateMachine();

  describe('canTransition', () => {
    it('allows a single forward step in the business sequence', () => {
      expect(
        machine.canTransition(
          TripStatus.WAITING_APPOINTMENT,
          TripStatus.APPOINTMENT_DONE,
        ),
      ).toBe(true);
      expect(
        machine.canTransition(TripStatus.ARRIVED, TripStatus.DISCHARGED),
      ).toBe(true);
    });

    it('rejects skipping steps (e.g. LOADED -> DISCHARGED)', () => {
      expect(
        machine.canTransition(TripStatus.LOADED, TripStatus.DISCHARGED),
      ).toBe(false);
      expect(
        machine.canTransition(
          TripStatus.WAITING_APPOINTMENT,
          TripStatus.AT_BORDER,
        ),
      ).toBe(false);
    });

    it('rejects moving backwards', () => {
      expect(
        machine.canTransition(TripStatus.LOADED, TripStatus.APPOINTMENT_DONE),
      ).toBe(false);
    });

    it('allows CANCELLED from any non-terminal state', () => {
      expect(
        machine.canTransition(
          TripStatus.WAITING_APPOINTMENT,
          TripStatus.CANCELLED,
        ),
      ).toBe(true);
      expect(
        machine.canTransition(TripStatus.AT_BORDER, TripStatus.CANCELLED),
      ).toBe(true);
    });

    it('rejects any transition out of a terminal state', () => {
      expect(
        machine.canTransition(TripStatus.DISCHARGED, TripStatus.CANCELLED),
      ).toBe(false);
      expect(
        machine.canTransition(
          TripStatus.CANCELLED,
          TripStatus.WAITING_APPOINTMENT,
        ),
      ).toBe(false);
    });

    it('rejects a no-op transition to the same state', () => {
      expect(machine.canTransition(TripStatus.LOADED, TripStatus.LOADED)).toBe(
        false,
      );
    });
  });

  describe('assertTransition', () => {
    it('throws BadRequestException on an illegal transition', () => {
      expect(() =>
        machine.assertTransition(TripStatus.LOADED, TripStatus.DISCHARGED),
      ).toThrow(BadRequestException);
    });

    it('does not throw on a legal transition', () => {
      expect(() =>
        machine.assertTransition(
          TripStatus.LOADED,
          TripStatus.DISPATCHED_ORIGIN,
        ),
      ).not.toThrow();
    });
  });

  describe('isTerminal / occupiesResources', () => {
    it('treats DISCHARGED and CANCELLED as terminal', () => {
      expect(machine.isTerminal(TripStatus.DISCHARGED)).toBe(true);
      expect(machine.isTerminal(TripStatus.CANCELLED)).toBe(true);
      expect(machine.isTerminal(TripStatus.AT_BORDER)).toBe(false);
    });

    it('occupies resources for every state except the terminal ones', () => {
      expect(
        machine.occupiesResources(TripStatus.WAITING_APPOINTMENT),
      ).toBe(true);
      expect(machine.occupiesResources(TripStatus.DISCHARGED)).toBe(false);
      expect(machine.occupiesResources(TripStatus.CANCELLED)).toBe(false);
    });

    it('derives occupyingStatuses from the machine (all except terminal)', () => {
      const occupying = machine.occupyingStatuses();

      expect(occupying).toHaveLength(7);
      expect(occupying).toContain(TripStatus.WAITING_APPOINTMENT);
      expect(occupying).not.toContain(TripStatus.DISCHARGED);
      expect(occupying).not.toContain(TripStatus.CANCELLED);
    });
  });

  describe('milestone <-> status mapping', () => {
    it('maps a milestone event type to its target status', () => {
      expect(machine.statusForEvent(TripEventType.ARRIVED)).toBe(
        TripStatus.ARRIVED,
      );
      expect(machine.statusForEvent(TripEventType.DISPATCHED_ORIGIN)).toBe(
        TripStatus.DISPATCHED_ORIGIN,
      );
    });

    it('rejects STATUS_CHANGE as a milestone event (no single target status)', () => {
      expect(() =>
        machine.statusForEvent(TripEventType.STATUS_CHANGE),
      ).toThrow(BadRequestException);
    });

    it('maps a milestone status to its specific type, else STATUS_CHANGE', () => {
      expect(machine.eventForStatus(TripStatus.AT_BORDER)).toBe(
        TripEventType.AT_BORDER,
      );
      expect(machine.eventForStatus(TripStatus.LOADED)).toBe(
        TripEventType.STATUS_CHANGE,
      );
      expect(machine.eventForStatus(TripStatus.APPOINTMENT_DONE)).toBe(
        TripEventType.STATUS_CHANGE,
      );
      expect(machine.eventForStatus(TripStatus.CANCELLED)).toBe(
        TripEventType.STATUS_CHANGE,
      );
    });
  });
});
