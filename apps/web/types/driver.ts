import type { SortOrder } from "@/types/api";

export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFFLINE" | "INACTIVE";

export type Driver = {
  id: string;
  userId: string | null;
  fullName: string;
  licenseNumber: string;
  passportNumber: string | null;
  phone: string | null;
  email: string | null;
  status: DriverStatus;
  createdAt: string;
  updatedAt: string;
};

export type DriverSortBy =
  | "createdAt"
  | "fullName"
  | "licenseNumber"
  | "email"
  | "status";

export type DriverInput = {
  fullName: string;
  licenseNumber: string;
  passportNumber?: string;
  phone?: string;
  email?: string;
  status?: DriverStatus;
};

export type ListDriversParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: DriverStatus;
  sortBy?: DriverSortBy;
  sortOrder?: SortOrder;
};

export type DriverStatusAction = "available" | "offline" | "deactivate";
