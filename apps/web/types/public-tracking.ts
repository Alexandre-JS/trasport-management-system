import type { TripBorderRef, TripEventType, TripStatus } from "@/types/trip";

export type PublicTrackEvent = {
  id: string;
  type: TripEventType;
  occurredAt: string;
  toStatus: TripStatus | null;
  note: string | null;
};

export type LastLocation = {
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export type PublicShipment = {
  currentStatus: TripStatus;
  currentPosition: string | null;
  departureDate: string | null;
  borders: TripBorderRef[];
  arrivalEstimate: string | null;
  lastLocation: LastLocation | null;
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
