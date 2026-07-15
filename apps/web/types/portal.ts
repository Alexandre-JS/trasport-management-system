import type { TripBorderRef, TripEventType, TripStatus } from "@/types/trip";

export type PortalEvent = {
  id: string;
  type: TripEventType;
  occurredAt: string;
  fromStatus: TripStatus | null;
  toStatus: TripStatus | null;
  note: string | null;
  createdAt: string;
};

export type PortalShipment = {
  id: string;
  currentStatus: TripStatus;
  currentPosition: string | null;
  borders: TripBorderRef[];
  tonnage: string | null;
  loadedDate: string | null;
  departureDate: string | null;
  arrivalEstimate: string | null;
  arrivalDate: string | null;
  dischargeDate: string | null;
  bookingReference: string | null;
  transporterName: string | null;
  horsePlate: string | null;
  trailerPlate: string | null;
  driverName: string | null;
  cargo: {
    code: string;
    description: string | null;
    origin: string;
    destination: string;
  };
  truck: { plateNumber: string } | null;
  trailer: { plateNumber: string } | null;
  driver: { fullName: string } | null;
  createdAt: string;
};

export type PortalShipmentDetail = PortalShipment & {
  trackingToken: string;
  events: PortalEvent[];
};
