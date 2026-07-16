"use client";

import { useQuery } from "@tanstack/react-query";
import { listResourcesInUse } from "@/services/trips-service";

export function useResourcesInUse() {
  return useQuery({
    queryKey: ["resources-in-use"],
    queryFn: listResourcesInUse,
    staleTime: 15_000,
  });
}
