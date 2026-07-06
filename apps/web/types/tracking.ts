export type TrackingPoint = {
  id: string;
  tripId: string;
  latitude: string;
  longitude: string;
  speed: string | null;
  heading: string | null;
  accuracy: string | null;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type TripRoutePoint = {
  latitude: string;
  longitude: string;
  speed: string | null;
  heading: string | null;
  recordedAt: string;
};

export type TripRoute = {
  tripId: string;
  count: number;
  points: TripRoutePoint[];
};
