"use client";

import { useQuery } from "@tanstack/react-query";
import { listActivities } from "@/services/trips-service";

export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: listActivities,
    staleTime: 30_000,
  });
}
