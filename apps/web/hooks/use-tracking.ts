"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { getLastLocation, getTripRoute } from "@/services/tracking-service";
import type { TrackingPoint } from "@/types/tracking";

export function useLastLocations(tripIds: string[]) {
  const results = useQueries({
    queries: tripIds.map((id) => ({
      queryKey: ["tracking-last", id],
      queryFn: () => getLastLocation(id),
      retry: false,
      staleTime: 15_000,
    })),
  });

  const byTripId: Record<string, TrackingPoint | null> = {};
  const isLoading = results.some((result) => result.isLoading);

  tripIds.forEach((id, index) => {
    byTripId[id] = results[index]?.data ?? null;
  });

  return { byTripId, isLoading };
}

export function useTripRoute(tripId: string | null) {
  return useQuery({
    queryKey: ["tracking-route", tripId],
    queryFn: () => getTripRoute(tripId as string),
    enabled: tripId !== null,
  });
}
