import type { SortOrder } from "@/types/api";

export type TripStatus =
  | "WAITING_APPOINTMENT"
  | "APPOINTMENT_DONE"
  | "LOADED"
  | "DISPATCHED_ORIGIN"
  | "AT_BORDER"
  | "BORDER_CLEARED"
  | "ARRIVED"
  | "DISCHARGED"
  | "CONTAINER_RETURN_PENDING"
  | "CONTAINER_RETURNED"
  | "CANCELLED";

/** One border crossing of a trip's route, in sequence order. */
export type TripBorder = {
  id: string;
  sequence: number;
  arrivedAt: string | null;
  clearedAt: string | null;
  border: {
    id: string;
    name: string;
    countryA: string;
    countryB: string;
    /** Decimal serialised as string by the API. */
    lat: string | null;
    lng: string | null;
  };
};

/** Compact crossing projection used by cargo/portal/public tracking. */
export type TripBorderRef = {
  sequence: number;
  arrivedAt: string | null;
  clearedAt: string | null;
  border: {
    id: string;
    name: string;
  };
};

export type TripEventType =
  | "DISPATCHED_ORIGIN"
  | "AT_BORDER"
  | "BORDER_CLEARED"
  | "ARRIVED"
  | "DISCHARGED"
  | "STATUS_CHANGE";

export type TripEvent = {
  id: string;
  type: TripEventType;
  occurredAt: string;
  fromStatus: TripStatus | null;
  toStatus: TripStatus | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type Trip = {
  id: string;
  cargoId: string;
  truckId: string | null;
  trailerId: string | null;
  driverId: string | null;
  departureDate: string | null;
  arrivalEstimate: string | null;
  arrivalDate: string | null;
  loadedDate: string | null;
  dischargeDate: string | null;
  currentStatus: TripStatus;
  currentPosition: string | null;
  borders: TripBorder[];
  /** Decimal serialised as string by the API. */
  tonnage: string | null;
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
  /** Opaque public tracking token — present on the trip detail. */
  trackingToken?: string;
  /** Present on the trip detail (GET /trips/:id), chronological. */
  events?: TripEvent[];
  createdAt: string;
  updatedAt: string;
};

export type TripSortBy =
  | "createdAt"
  | "departureDate"
  | "arrivalEstimate"
  | "arrivalDate"
  | "currentStatus";

export type ListTripsParams = {
  page?: number;
  limit?: number;
  search?: string;
  cargoId?: string;
  truckId?: string;
  trailerId?: string;
  driverId?: string;
  currentStatus?: TripStatus;
  sortBy?: TripSortBy;
  sortOrder?: SortOrder;
};

export type AssignDriverPayload = { driverId: string };
export type AssignTruckPayload = { truckId: string };
export type AssignTrailerPayload = { trailerId: string };
export type AssignCargoPayload = { cargoId: string };
export type CreateTripPayload = {
  cargoId: string;
  truckId?: string;
  trailerId?: string;
  driverId?: string;
  departureDate?: string;
  arrivalEstimate?: string;
  arrivalDate?: string;
  currentStatus?: TripStatus;
  /** Ids of the border posts the route crosses, in order. */
  borderIds?: string[];
  loadedDate?: string;
  dischargeDate?: string;
  currentPosition?: string;
  tonnage?: number;
  transporterName?: string;
  isSubcontracted?: boolean;
  dispatchedBy?: string;
  remarks?: string;
  horsePlate?: string;
  trailerPlate?: string;
  driverName?: string;
  driverPassport?: string;
  driverLicense?: string;
  driverPhone?: string;
  bookingReference?: string;
};
export type UpdateTripPayload = Partial<CreateTripPayload>;
export type UpdateTripStatusPayload = { currentStatus: TripStatus };
export type RecordTripEventPayload = {
  type: TripEventType;
  occurredAt?: string;
  note?: string;
};
