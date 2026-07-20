"use client";

import { useQuery } from "@tanstack/react-query";
import {
  trackClient,
  trackShipment,
} from "@/services/public-tracking-service";

export function usePublicShipment(token: string) {
  return useQuery({
    queryKey: ["public-track", token],
    queryFn: () => trackShipment(token),
    retry: false,
  });
}

export function usePublicClientShipments(token: string) {
  return useQuery({
    queryKey: ["public-track-client", token],
    queryFn: () => trackClient(token),
    retry: false,
  });
}
