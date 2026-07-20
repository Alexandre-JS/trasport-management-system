import type { TripBorderRef, TripEventType, TripStatus } from "@/types/trip";

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
  borders: TripBorderRef[];
  arrivalEstimate: string | null;
  cargo: {
    code: string;
    origin: string;
    destination: string;
  };
  events: PublicTrackEvent[];
};

export type PublicClientShipments = {
  clientName: string;
  shipments: PublicShipment[];
};
