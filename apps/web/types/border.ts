import type { SortOrder } from "@/types/api";

export type Border = {
  id: string;
  name: string;
  countryA: string;
  countryB: string;
  /** Decimal serialised as string by the API. */
  lat: string | null;
  lng: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BorderSortBy = "name" | "countryA" | "countryB" | "createdAt";

export type BorderInput = {
  name: string;
  countryA: string;
  countryB: string;
  lat?: number;
  lng?: number;
  isActive?: boolean;
};

export type ListBordersParams = {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  sortBy?: BorderSortBy;
  sortOrder?: SortOrder;
};
