export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: string[];
  driverId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface DriverTripBorder {
  id: string;
  sequence: number;
  arrivedAt: string | null;
  clearedAt: string | null;
  border: {
    id: string;
    name: string;
    countryA: string;
    countryB: string;
  };
}

export interface DriverTrip {
  id: string;
  cargoId: string;
  truckId: string;
  trailerId: string | null;
  driverId: string;
  departureDate: string | null;
  arrivalEstimate: string | null;
  arrivalDate: string | null;
  loadedDate: string | null;
  currentStatus: string;
  currentPosition: string | null;
  borders: DriverTripBorder[];
  cargo: {
    id: string;
    code: string;
    description: string | null;
    origin: string;
    destination: string;
    status: string;
    client: {
      id: string;
      companyName: string;
    };
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
  events?: DriverTripEvent[];
}

export interface DriverTripEvent {
  id: string;
  type: string;
  occurredAt: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: string;
}

export interface DriverTripsResponse {
  data: DriverTrip[];
}

export interface PickupPayload {
  observations?: string;
}

export interface DeliveryPayload {
  receiverName?: string;
  receiverDocument?: string;
  deliveryPhoto?: string;
  signature?: string;
  observations?: string;
}

export interface IncidentPayload {
  type: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  photo?: string;
}

export interface TrackingPointPayload {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  recordedAt?: string;
}
