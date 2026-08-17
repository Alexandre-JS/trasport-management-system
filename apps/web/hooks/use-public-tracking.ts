"use client";

import { useQuery } from "@tanstack/react-query";
import { trackPublic } from "@/services/public-tracking-service";

export function usePublicTracking(token: string) {
  return useQuery({
    queryKey: ["public-track", token],
    queryFn: () => trackPublic(token),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}
