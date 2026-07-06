import type { SortOrder } from "@/types/api";

export type Client = {
  id: string;
  companyName: string;
  contactName: string | null;
  nuit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClientSortBy =
  | "createdAt"
  | "companyName"
  | "contactName"
  | "email";

export type ClientInput = {
  companyName: string;
  contactName?: string;
  nuit?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  isActive?: boolean;
};

export type ListClientsParams = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  province?: string;
  country?: string;
  isActive?: boolean;
  sortBy?: ClientSortBy;
  sortOrder?: SortOrder;
};
