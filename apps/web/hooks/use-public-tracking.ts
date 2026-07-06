"use client";

import { useQuery } from "@tanstack/react-query";
import { trackShipment } from "@/services/public-tracking-service";

export function usePublicShipment(token: string) {
  return useQuery({
    queryKey: ["public-track", token],
    queryFn: () => trackShipment(token),
    retry: false,
  });
}
