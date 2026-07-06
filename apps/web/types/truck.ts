import type { SortOrder } from "@/types/api";

export type TruckStatus = "AVAILABLE" | "ON_TRIP" | "MAINTENANCE" | "INACTIVE";

export type Truck = {
  id: string;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  status: TruckStatus;
  createdAt: string;
  updatedAt: string;
};

export type TruckSortBy =
  | "createdAt"
  | "plateNumber"
  | "brand"
  | "model"
  | "status";

export type TruckInput = {
  plateNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  status?: TruckStatus;
};

export type ListTrucksParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: TruckStatus;
  sortBy?: TruckSortBy;
  sortOrder?: SortOrder;
};

export type TruckStatusAction = "available" | "maintenance" | "deactivate";
