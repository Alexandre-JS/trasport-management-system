import type { SortOrder } from "@/types/api";

export type IncidentType =
  | "ACCIDENT"
  | "BREAKDOWN"
  | "TRAFFIC"
  | "ROAD_BLOCKED"
  | "OTHER";

export type Incident = {
  id: string;
  tripId: string;
  type: IncidentType;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  photo: string | null;
  reportedAt: string;
  resolvedAt: string | null;
  trip: {
    id: string;
    cargo: { code: string };
    driver: { fullName: string } | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type IncidentSortBy = "reportedAt" | "type";

export type ListIncidentsParams = {
  page?: number;
  limit?: number;
  tripId?: string;
  type?: IncidentType;
  resolved?: boolean;
  sortBy?: IncidentSortBy;
  sortOrder?: SortOrder;
};
