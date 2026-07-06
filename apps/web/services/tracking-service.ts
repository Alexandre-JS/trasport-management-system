import { http } from "@/services/http";
import type { TrackingPoint, TripRoute } from "@/types/tracking";

export async function getLastLocation(
  tripId: string,
): Promise<TrackingPoint> {
  const { data } = await http.get<TrackingPoint>(
    `/tracking/trips/${tripId}/last`,
  );

  return data;
}

export async function getTripRoute(tripId: string): Promise<TripRoute> {
  const { data } = await http.get<TripRoute>(
    `/tracking/trips/${tripId}/route`,
  );

  return data;
}
