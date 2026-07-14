import type { SortOrder } from "@/types/api";
import type { TripBorderRef, TripStatus } from "@/types/trip";

export type CargoStatus =
  | "CREATED"
  | "WAITING_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "NEAR_DESTINATION"
  | "DELIVERED"
  | "CANCELLED"
  | "INCIDENT";

export type Cargo = {
  id: string;
  clientId: string;
  code: string;
  description: string | null;
  type: "CONTAINER" | "GRANEL";
  containerNumber: string | null;
  weightTonnes: number | null;
  volumeM3: number | null;
  origin: string;
  destination: string;
  pickupDate: string | null;
  expectedDelivery: string | null;
  status: CargoStatus;
  observations: string | null;
  client: {
    id: string;
    companyName: string;
  };
  trips?: Array<{
    id: string;
    currentStatus: TripStatus;
    departureDate: string | null;
    arrivalEstimate: string | null;
    arrivalDate: string | null;
    loadedDate: string | null;
    currentPosition: string | null;
    borders: TripBorderRef[];
    driver: {
      id: string;
      fullName: string;
    };
    truck: {
      id: string;
      plateNumber: string;
    };
    trailer: {
      id: string;
      plateNumber: string;
    } | null;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type CargoSortBy =
  | "createdAt"
  | "code"
  | "origin"
  | "destination"
  | "weightTonnes"
  | "status";

export type ListCargoParams = {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  status?: CargoStatus;
  origin?: string;
  destination?: string;
  sortBy?: CargoSortBy;
  sortOrder?: SortOrder;
};

export type CreateCargoPayload = {
  clientId: string;
  origin: string;
  destination: string;
  description?: string;
  type?: "CONTAINER" | "GRANEL";
  containerNumber?: string;
  weightTonnes?: number;
  volumeM3?: number;
  pickupDate?: string;
  expectedDelivery?: string;
  observations?: string;
};

export type UpdateCargoPayload = Partial<CreateCargoPayload>;
