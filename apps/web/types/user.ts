import type { SortOrder } from "@/types/api";

export type User = {
  id: string;
  roleId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  lastLogin: string | null;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type Role = {
  id: string;
  name: string;
  description: string | null;
};

export type CreateUserPayload = {
  roleId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">>;

export type UserSortBy = "createdAt" | "email" | "firstName" | "lastName";

export type ListUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: UserSortBy;
  sortOrder?: SortOrder;
};
