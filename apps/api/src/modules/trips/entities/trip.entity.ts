import { Border, Prisma, TripEventType, TripStatus } from '@prisma/client';

export type TripEntity = {
  id: string;
  cargoId: string;
  truckId: string;
  trailerId: string | null;
  driverId: string;
  departureDate: Date | null;
  arrivalEstimate: Date | null;
  arrivalDate: Date | null;
  loadedDate: Date | null;
  currentStatus: TripStatus;
  currentPosition: string | null;
  border: Border | null;
  tonnage: Prisma.Decimal | null;
  cargo: {
    id: string;
    code: string;
    origin: string;
    destination: string;
  };
  driver: {
    id: string;
    fullName: string;
    licenseNumber: string;
    passportNumber: string | null;
  };
  truck: {
    id: string;
    plateNumber: string;
  };
  trailer: {
    id: string;
    plateNumber: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TripEventEntity = {
  id: string;
  type: TripEventType;
  occurredAt: Date;
  fromStatus: TripStatus | null;
  toStatus: TripStatus | null;
  note: string | null;
  createdBy: string | null;
  createdAt: Date;
};

/** Trip detail also carries the tracking token and chronological event history. */
export type TripDetailEntity = TripEntity & {
  trackingToken: string;
  events: TripEventEntity[];
};
