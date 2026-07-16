import { Prisma, TripEventType, TripStatus } from '@prisma/client';

/** One border crossing of a trip's route, in sequence order. */
export type TripBorderEntity = {
  id: string;
  sequence: number;
  arrivedAt: Date | null;
  clearedAt: Date | null;
  border: {
    id: string;
    name: string;
    countryA: string;
    countryB: string;
    lat: Prisma.Decimal | null;
    lng: Prisma.Decimal | null;
  };
};

export type TripEntity = {
  id: string;
  cargoId: string;
  truckId: string | null;
  trailerId: string | null;
  driverId: string | null;
  departureDate: Date | null;
  arrivalEstimate: Date | null;
  arrivalDate: Date | null;
  loadedDate: Date | null;
  dischargeDate: Date | null;
  currentStatus: TripStatus;
  currentPosition: string | null;
  borders: TripBorderEntity[];
  tonnage: Prisma.Decimal | null;
  transporterName: string | null;
  isSubcontracted: boolean;
  dispatchedBy: string | null;
  remarks: string | null;
  horsePlate: string | null;
  trailerPlate: string | null;
  driverName: string | null;
  driverPassport: string | null;
  driverLicense: string | null;
  driverPhone: string | null;
  bookingReference: string | null;
  cargo: {
    id: string;
    clientId: string;
    code: string;
    origin: string;
    destination: string;
  };
  driver: {
    id: string;
    fullName: string;
    licenseNumber: string;
    passportNumber: string | null;
  } | null;
  truck: {
    id: string;
    plateNumber: string;
  } | null;
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
