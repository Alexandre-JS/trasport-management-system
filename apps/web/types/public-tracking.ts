import type { Border, TripEventType, TripStatus } from "@/types/trip";

export type PublicTrackEvent = {
  id: string;
  type: TripEventType;
  occurredAt: string;
  toStatus: TripStatus | null;
  note: string | null;
};

export type PublicShipment = {
  currentStatus: TripStatus;
  currentPosition: string | null;
  border: Border | null;
  arrivalEstimate: string | null;
  cargo: {
    code: string;
    origin: string;
    destination: string;
  };
  events: PublicTrackEvent[];
};
