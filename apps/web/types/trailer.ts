import type { SortOrder } from "@/types/api";
import type { TruckStatus } from "@/types/truck";

export type TrailerStatus = TruckStatus;

export type Trailer = {
  id: string;
  truckId: string | null;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  tonnage: string | null;
  status: TrailerStatus;
  truck: {
    id: string;
    plateNumber: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type TrailerSortBy =
  | "createdAt"
  | "plateNumber"
  | "brand"
  | "model"
  | "tonnage"
  | "status";

export type TrailerInput = {
  truckId?: string;
  plateNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  tonnage?: number;
  status?: TrailerStatus;
};

export type ListTrailersParams = {
  page?: number;
  limit?: number;
  search?: string;
  truckId?: string;
  status?: TrailerStatus;
  sortBy?: TrailerSortBy;
  sortOrder?: SortOrder;
};

export type TrailerStatusAction = "available" | "maintenance" | "deactivate";
