"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyShipment, listMyShipments } from "@/services/portal-service";

const PORTAL_KEY = "portal";

export function useMyShipments() {
  return useQuery({
    queryKey: [PORTAL_KEY, "trips"],
    queryFn: listMyShipments,
    refetchInterval: 2 * 60_000,
    refetchIntervalInBackground: false,
  });
}

export function useMyShipment(id: string | null) {
  return useQuery({
    queryKey: [PORTAL_KEY, "trips", id ?? ""],
    queryFn: () => getMyShipment(id as string),
    enabled: id !== null,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}
